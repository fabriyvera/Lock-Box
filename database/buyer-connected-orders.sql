-- Connected, explicitly simulated checkout. No payment provider or money movement.
alter table public.orders add column is_test boolean not null default false;
alter table public.orders add column payment_method text check (payment_method in ('yape','bcp'));
create table private.buyer_action_receipts (
  buyer_id uuid not null references public.profiles(id),
  request_id uuid not null,
  action jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key(buyer_id,request_id)
);
alter table private.buyer_action_receipts enable row level security;
create policy buyer_receipts_deny on private.buyer_action_receipts for all to authenticated using(false) with check(false);
revoke all on private.buyer_action_receipts from public,anon,authenticated;
-- Buyer access is confined to the checked RPCs; direct table writes stay disabled.
revoke insert,update,delete on public.carts,public.cart_items,public.reviews,public.disputes from public,anon,authenticated;
create policy buyer_cart_items_deny on public.cart_items for all to authenticated using(false) with check(false);
create policy buyer_reviews_deny on public.reviews for all to authenticated using(false) with check(false);
create policy buyer_disputes_deny on public.disputes for all to authenticated using(false) with check(false);
create index buyer_cart_product_idx on public.cart_items(product_id);
create index buyer_review_author_idx on public.reviews(author_id);
create index buyer_dispute_author_idx on public.disputes(opened_by);
create index buyer_dispute_resolver_idx on public.disputes(resolved_by);

create view private.buyer_products as
select p.id,p.seller_id,p.is_active,p.seller_status,p.stock,s.is_active as seller_active,s.role as seller_role,
  jsonb_build_object('id',p.id,'sellerId',p.seller_id,'sellerName',coalesce(s.store_name,s.username),
    'categoryId',coalesce(c.id::text,'otros'),'categoryName',coalesce(c.name,'Otros'),
    'title',p.title,'description',coalesce(p.description,''),'priceCents',round(p.price*100)::bigint,
    'stock',p.stock,'sku',coalesce(p.sku,''),'imageUrl',coalesce((select url from public.product_images where product_id=p.id order by position,id limit 1),''),
    'isLiveFeatured',exists(select 1 from public.live_session_products sp join public.live_sessions l on l.id=sp.session_id where sp.product_id=p.id and l.status='live')) as data
from public.products p join public.profiles s on s.id=p.seller_id
left join public.categories c on c.id=p.category_id;
revoke all on private.buyer_products from public,anon,authenticated;

create function private.buyer_state() returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result jsonb;
begin
  if not exists(select 1 from public.profiles where id=actor and role='comprador' and is_active) then
    raise exception 'Se requiere un comprador activo' using errcode='42501';
  end if;
  select jsonb_build_object(
    'catalog',coalesce((select jsonb_agg(p.data order by p.id) from private.buyer_products p where p.is_active and p.seller_status='published' and p.seller_active and p.seller_role='vendedor'),'[]'::jsonb),
    'cart',coalesce((select jsonb_agg(jsonb_build_object('product',p.data,'quantity',i.quantity) order by i.added_at,i.id) from public.carts c join public.cart_items i on i.cart_id=c.id join private.buyer_products p on p.id=i.product_id where c.user_id=actor),'[]'::jsonb),
    'lockBoxPoints',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'address',p.address,'city',coalesce(p.city,''),'phone',coalesce(p.phone,''),'capacity',p.capacity) order by p.name) from public.lockbox_points p where p.is_active),'[]'::jsonb),
    'orders',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',o.id,'orderNumber','LB-'||upper(left(o.id::text,8)),
      'items',coalesce((select jsonb_agg(jsonb_build_object('product',p.data||jsonb_build_object('title',i.product_title,'priceCents',round(i.unit_price*100)::bigint),'quantity',i.quantity) order by i.id) from public.order_items i join private.buyer_products p on p.id=i.product_id where i.order_id=o.id),'[]'::jsonb),
      'subtotalCents',round(o.subtotal*100)::bigint,'totalCents',round(o.total_amount*100)::bigint,
      'lockBoxPoint',jsonb_build_object('id',lp.id,'name',lp.name,'address',lp.address,'city',coalesce(lp.city,''),'phone',coalesce(lp.phone,''),'capacity',lp.capacity),
      'paymentMethod',coalesce(o.payment_method,'bcp'),'isTest',o.is_test,'status',o.status,
      'qrCode',coalesce(o.qr_code,''),'qrExpiresAt',coalesce(o.qr_expires_at,o.created_at),
      'createdAt',o.created_at,'paidAt',o.paid_at,'dispatchedAt',o.dispatched_at,'deliveredAt',o.delivered_at,'cancelledAt',o.cancelled_at,
      'review',(select jsonb_build_object('rating',r.rating,'comment',coalesce(r.comment,''),'createdAt',r.created_at) from public.reviews r where r.order_id=o.id and r.author_id=actor order by r.created_at desc limit 1),
      'dispute',(select jsonb_build_object('reason',d.reason,'description',coalesce(d.description,''),'status',case when d.status in ('open','in_review') then 'open' else 'resolved' end,'createdAt',d.created_at) from public.disputes d where d.order_id=o.id and d.opened_by=actor order by d.created_at desc limit 1)
    )) order by o.created_at desc) from public.orders o join public.lockbox_points lp on lp.id=o.lockbox_id where o.buyer_id=actor),'[]'::jsonb),
    'searchQuery','','selectedCategory',null,'activeLiveSession',false
  ) into result;
  return result;
end $$;
revoke all on function private.buyer_state() from public,anon;
grant execute on function private.buyer_state() to authenticated;
create function public.buyer_state() returns jsonb
language sql security invoker set search_path='' as $$ select private.buyer_state(); $$;
revoke all on function public.buyer_state() from public,anon;
grant execute on function public.buyer_state() to authenticated;

create function private.buyer_action(action jsonb, request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare
  actor uuid:=auth.uid(); kind text:=action->>'type'; v_cart_id uuid; v_product_id uuid;
  quantity integer; existing_qty integer; product public.products%rowtype; ord public.orders%rowtype;
  receipt private.buyer_action_receipts%rowtype; point public.lockbox_points%rowtype;
  seller uuid; v_order_id uuid; ids jsonb:='[]'::jsonb; result jsonb:='{"success":true}'::jsonb;
  subtotal numeric; commission numeric; delay_hours integer; item record; needed integer; label text;
begin
  perform 1 from public.profiles where id=actor and role='comprador' and is_active for update;
  if not found or request_id is null then raise exception 'Se requiere un comprador activo' using errcode='42501'; end if;
  select * into receipt from private.buyer_action_receipts r where r.buyer_id=actor and r.request_id=buyer_action.request_id;
  if found then
    if receipt.action is distinct from action then raise exception 'La solicitud ya fue utilizada' using errcode='22023'; end if;
    return receipt.result;
  end if;
  insert into public.carts(user_id) values(actor) on conflict(user_id) do nothing;
  select id into v_cart_id from public.carts where user_id=actor;
  if kind in ('addToCart','setCartQuantity','removeFromCart') then
    v_product_id:=(action->>'productId')::uuid;
    if kind='removeFromCart' or (kind='setCartQuantity' and action->>'quantity'='0') then
      delete from public.cart_items i where i.cart_id=v_cart_id and i.product_id=v_product_id;
    else
      if (action->>'quantity')::numeric<>trunc((action->>'quantity')::numeric) then raise exception 'Cantidad no válida' using errcode='22023'; end if;
      quantity:=(action->>'quantity')::integer;
      select p.* into product from public.products p join public.profiles s on s.id=p.seller_id and s.role='vendedor' and s.is_active where p.id=v_product_id and p.is_active and p.seller_status='published' for share of p;
      if not found or quantity is null or quantity not between 1 and 99999 then raise exception 'Producto o cantidad no disponible' using errcode='22023'; end if;
      select i.quantity into existing_qty from public.cart_items i where i.cart_id=v_cart_id and i.product_id=v_product_id;
      if kind='addToCart' then quantity:=quantity+coalesce(existing_qty,0); end if;
      if quantity>product.stock then raise exception 'No hay suficientes unidades disponibles' using errcode='P0001'; end if;
      if existing_qty is null and (select count(*) from public.cart_items i where i.cart_id=v_cart_id)>=50 then raise exception 'El carrito admite hasta 50 productos distintos' using errcode='22023'; end if;
      insert into public.cart_items(cart_id,product_id,quantity) values(v_cart_id,v_product_id,quantity)
        on conflict on constraint cart_items_cart_id_product_id_key do update set quantity=excluded.quantity;
    end if;
  elsif kind='clearCart' then
    delete from public.cart_items i where i.cart_id=v_cart_id;
  elsif kind='checkout' then
    if action->>'paymentMethod' is null or action->>'paymentMethod' not in ('yape','bcp') then raise exception 'Método de prueba no válido' using errcode='22023'; end if;
    select * into point from public.lockbox_points where id=(action->>'pointId')::uuid and is_active for update;
    if not found then raise exception 'Punto no disponible' using errcode='22023'; end if;
    select count(distinct p.seller_id) into needed from public.cart_items i join public.products p on p.id=i.product_id where i.cart_id=v_cart_id;
    if needed=0 then raise exception 'El carrito está vacío' using errcode='22023'; end if;
    if (select count(*) from public.orders o where o.lockbox_id=point.id and o.status in ('paid','dispatched','in_lockbox','ready'))+needed>point.capacity then raise exception 'El punto no tiene capacidad disponible' using errcode='P0001'; end if;
    -- Same product lock order for every checkout; all prices/owners come from PostgreSQL.
    perform 1 from public.profiles s where s.id in (select p.seller_id from public.cart_items i join public.products p on p.id=i.product_id where i.cart_id=v_cart_id) order by s.id for share;
    perform 1 from public.products p join public.cart_items i on i.product_id=p.id where i.cart_id=v_cart_id order by p.id for update of p;
    if exists(select 1 from public.cart_items i join public.products p on p.id=i.product_id join public.profiles s on s.id=p.seller_id where i.cart_id=v_cart_id and (not p.is_active or p.seller_status<>'published' or p.stock<i.quantity or not s.is_active or s.role<>'vendedor')) then raise exception 'El stock o la publicación cambió. Revisa tu carrito' using errcode='P0001'; end if;
    select coalesce(full_name,username) into label from public.profiles where id=actor;
    for seller in select distinct p.seller_id from public.cart_items i join public.products p on p.id=i.product_id where i.cart_id=v_cart_id order by p.seller_id loop
      select sum(p.price*i.quantity) into subtotal from public.cart_items i join public.products p on p.id=i.product_id where i.cart_id=v_cart_id and p.seller_id=seller;
      commission:=0.06; delay_hours:=48;
      select pl.commission_rate,pl.settlement_delay_hours into commission,delay_hours from public.plans pl where pl.code=coalesce((select plan.code from public.subscriptions s join public.plans plan on plan.id=s.plan_id where s.seller_id=seller and s.status='active' and (s.expires_at is null or s.expires_at>now()) limit 1),'emprende') and pl.is_active;
      if commission is null then raise exception 'No se pudo consultar el plan del vendedor' using errcode='P0001'; end if;
      v_order_id:=gen_random_uuid();
      insert into public.orders(id,buyer_id,seller_id,lockbox_id,status,subtotal,commission_amount,total_amount,qr_code,qr_expires_at,paid_at,settlement_delay_hours,buyer_label,is_test,payment_method,test_reference,notes)
        values(v_order_id,actor,seller,point.id,'paid',subtotal,round(subtotal*commission,2),subtotal,'LBX-TEST-'||replace(gen_random_uuid()::text,'-',''),now()+interval '7 days',now(),delay_hours,label,true,action->>'paymentMethod','checkout-'||v_order_id::text,'Compra de prueba conectada. Sin cobro ni movimiento de dinero.');
      for item in select p.id,p.title,p.price,i.quantity from public.cart_items i join public.products p on p.id=i.product_id where i.cart_id=v_cart_id and p.seller_id=seller order by p.id loop
        insert into public.order_items(order_id,product_id,quantity,unit_price,subtotal,product_title) values(v_order_id,item.id,item.quantity,item.price,item.price*item.quantity,item.title);
        update public.products set stock=stock-item.quantity,updated_at=now() where id=item.id;
      end loop;
      insert into public.order_status_history(order_id,status,changed_by,comment) values(v_order_id,'paid',actor,'Compra de prueba conectada, sin pago real');
      ids:=ids||jsonb_build_array(v_order_id);
    end loop;
    delete from public.cart_items i where i.cart_id=v_cart_id;
    result:=jsonb_build_object('success',true,'orderIds',ids);
  elsif kind in ('cancelOrder','reviewOrder','openDispute') then
    select * into ord from public.orders where id=(action->>'orderId')::uuid and buyer_id=actor for update;
    if not found then raise exception 'Pedido no encontrado' using errcode='P0002'; end if;
    if kind='cancelOrder' then
      if ord.status<>'paid' or not ord.is_test then raise exception 'Solo se puede cancelar una compra de prueba antes del despacho' using errcode='P0001'; end if;
      for item in select i.product_id,i.quantity from public.order_items i where i.order_id=ord.id order by i.product_id loop
        update public.products set stock=stock+item.quantity,updated_at=now() where id=item.product_id;
      end loop;
      update public.orders set status='cancelled',cancelled_at=now(),updated_at=now() where id=ord.id;
      insert into public.order_status_history(order_id,status,changed_by,comment) values(ord.id,'cancelled',actor,'Cancelación de prueba; stock restituido, sin reembolso real');
    elsif kind='reviewOrder' then
      if ord.status not in ('delivered','released') or exists(select 1 from public.reviews where order_id=ord.id and author_id=actor) then raise exception 'Este pedido no admite otra calificación' using errcode='P0001'; end if;
      if (action->>'rating')::numeric<>trunc((action->>'rating')::numeric) or (action->>'rating')::integer not between 1 and 5 or coalesce(length(btrim(action->>'comment')),0) not between 1 and 1000 then raise exception 'Calificación no válida' using errcode='22023'; end if;
      insert into public.reviews(order_id,author_id,target_id,rating,comment) values(ord.id,actor,ord.seller_id,(action->>'rating')::integer,btrim(action->>'comment'));
    else
      if ord.status not in ('dispatched','in_lockbox','ready','delivered') or exists(select 1 from public.disputes where order_id=ord.id and opened_by=actor) then raise exception 'Este pedido no admite otro reclamo' using errcode='P0001'; end if;
      if coalesce(length(btrim(action->>'reason')),0) not between 1 and 160 or coalesce(length(btrim(action->>'description')),0) not between 1 and 2000 then raise exception 'Reclamo no válido' using errcode='22023'; end if;
      insert into public.disputes(order_id,opened_by,reason,description) values(ord.id,actor,btrim(action->>'reason'),btrim(action->>'description'));
      update public.orders set status='disputed',updated_at=now() where id=ord.id;
      insert into public.order_status_history(order_id,status,changed_by,comment) values(ord.id,'disputed',actor,'Reclamo registrado por el comprador');
    end if;
  else
    raise exception 'Acción no válida' using errcode='22023';
  end if;
  insert into private.buyer_action_receipts(buyer_id,request_id,action,result) values(actor,request_id,action,result);
  return result;
end $$;
revoke all on function private.buyer_action(jsonb,uuid) from public,anon;
grant execute on function private.buyer_action(jsonb,uuid) to authenticated;
create function public.buyer_action(action jsonb,request_id uuid) returns jsonb
language sql security invoker set search_path='' as $$ select private.buyer_action(action,request_id); $$;
revoke all on function public.buyer_action(jsonb,uuid) from public,anon;
grant execute on function public.buyer_action(jsonb,uuid) to authenticated;
notify pgrst,'reload schema';
