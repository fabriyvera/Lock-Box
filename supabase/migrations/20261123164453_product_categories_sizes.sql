-- Product categories and per-size inventory. Existing products remain without sizes.
begin;
alter table public.categories drop constraint categories_seller_label_check;
alter table public.categories add constraint categories_seller_label_check check(seller_label in
 ('Moda','Calzado','Camisas','Pantalones','Ropa infantil','Deportes','Tecnología','Hogar','Belleza','Accesorios','Otros'));
insert into public.categories(name,slug,seller_label,is_active)
values ('Calzado','calzado','Calzado',true),('Camisas','camisas','Camisas',true),
 ('Pantalones','pantalones','Pantalones',true),('Ropa infantil','ropa-infantil','Ropa infantil',true),
 ('Deportes','deportes','Deportes',true)
on conflict (slug) do nothing;
alter table public.products add column variants jsonb not null default '[]'::jsonb;
alter table public.cart_items add column size text not null default '';
alter table public.order_items add column size text not null default '';
alter table public.order_items add column category_name text not null default '';
alter table public.cart_items drop constraint cart_items_cart_id_product_id_key;
alter table public.cart_items add constraint cart_items_product_size_key unique(cart_id,product_id,size);
alter table public.cart_items add constraint cart_items_size_check check(size='' or size ~ '^[A-Z0-9][A-Z0-9 ./-]{0,19}$');
alter table public.order_items add constraint order_items_size_check check(size='' or size ~ '^[A-Z0-9][A-Z0-9 ./-]{0,19}$');

create function private.valid_product_variants(variants jsonb, stock integer) returns boolean
language plpgsql immutable set search_path='' as $fn$
declare v jsonb; total bigint:=0; seen text[]:='{}'; label text;
begin
 if jsonb_typeof(variants) is distinct from 'array' or jsonb_array_length(variants)>40 then return false; end if;
 if jsonb_array_length(variants)=0 then return true; end if;
 for v in select value from jsonb_array_elements(variants) loop
   if jsonb_typeof(v) is distinct from 'object' then return false; end if;
   label:=v->>'size';
   if jsonb_typeof(v->'size') is distinct from 'string' or label !~ '^[A-Z0-9][A-Z0-9 ./-]{0,19}$' or label=any(seen)
      or jsonb_typeof(v->'stock') is distinct from 'number' or (v->>'stock')::numeric not between 0 and 99999
      or (v->>'stock')::numeric <> trunc((v->>'stock')::numeric)
      or (select count(*) from jsonb_object_keys(v))<>2 then return false; end if;
   total:=total+(v->>'stock')::integer; seen:=array_append(seen,label);
 end loop;
 return total=stock and total<=99999;
end $fn$;
revoke all on function private.valid_product_variants(jsonb,integer) from public,anon,authenticated;
alter table public.products add constraint products_variants_check check(private.valid_product_variants(variants,stock));

CREATE OR REPLACE FUNCTION private.seller_action(action jsonb, request_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_variable
declare
  actor uuid := auth.uid(); kind text := action->>'type'; item jsonb;
  v_product_id uuid; category_id uuid; live_id uuid; plan_id uuid; tag_id uuid;
  product public.products%rowtype; target_status text; label text; available numeric; v_variants jsonb;
begin
  if actor is null or request_id is null then raise exception 'AutenticaciÃ³n requerida' using errcode='42501'; end if;
  perform 1 from public.profiles where id=actor and role='vendedor' and is_active for update;
  if not found then raise exception 'Se requiere un vendedor activo' using errcode='42501'; end if;
  if exists (select 1 from private.seller_action_receipts r where r.seller_id=actor and r.request_id=seller_action.request_id) then
    if not exists (select 1 from private.seller_action_receipts r where r.seller_id=actor and r.request_id=seller_action.request_id and r.action=seller_action.action) then
      raise exception 'La solicitud ya fue utilizada' using errcode='22023';
    end if;
    return;
  end if;
  if kind in ('saveProduct','setProductStatus') then
    item := case when kind='saveProduct' then action->'product' else action end;
    v_product_id := (item->>'id')::uuid;
    select * into product from public.products where id=v_product_id for update;
    if found and (product.seller_id<>actor or product.seller_status='archived') then
      raise exception 'Producto no disponible' using errcode='42501';
    end if;
    if exists (select 1 from public.live_session_products sp join public.live_sessions s on s.id=sp.session_id where sp.product_id=v_product_id and s.status='live') then
      raise exception 'Finaliza el live antes de modificar este producto' using errcode='22023';
    end if;
    target_status := item->>'status';
    if target_status is null or target_status not in ('draft','published','paused','archived') then raise exception 'Estado no vÃ¡lido' using errcode='22023'; end if;
    if kind='setProductStatus' then
      if product.id is null then raise exception 'Producto no encontrado' using errcode='22023'; end if;
      if target_status='published' and product.stock<=0 then raise exception 'Agrega stock antes de publicar' using errcode='22023'; end if;
      update public.products set seller_status=target_status,is_active=(target_status='published'),updated_at=now() where id=v_product_id;
    else
      if product.id is null and target_status<>'draft' then raise exception 'El producto nuevo debe ser borrador' using errcode='22023'; end if;
      if coalesce(length(btrim(item->>'title')),0) not between 1 and 100 or coalesce(length(item->>'description'),0)>2000
        or coalesce(length(item->>'sku'),0)>40 or coalesce(length(item->>'imageUrl'),0)>1500
        or coalesce((item->>'priceCents')::numeric,0) not between 1 and 999999999
        or (item->>'priceCents')::numeric <> trunc((item->>'priceCents')::numeric)
        or coalesce((item->>'stock')::numeric,-1) not between 0 and 99999
        or (item->>'stock')::numeric <> trunc((item->>'stock')::numeric)
        or jsonb_typeof(item->'tags') is distinct from 'array' or jsonb_array_length(item->'tags')>8 then
        raise exception 'Revisa los datos del producto' using errcode='22023';
      end if;
      v_variants:=case when item ? 'variants' then item->'variants' else coalesce(product.variants,'[]'::jsonb) end;
      if not private.valid_product_variants(v_variants,(item->>'stock')::integer) then
        raise exception 'Revisa las tallas, los duplicados y el stock total' using errcode='22023';
      end if;
      -- Pending cancellable orders must retain a destination for inventory restoration.
      if exists(select 1 from public.order_items oi join public.orders o on o.id=oi.order_id
        where oi.product_id=v_product_id and o.status='paid' and o.is_test and
         ((oi.size='' and jsonb_array_length(v_variants)>0) or
          (oi.size<>'' and not exists(select 1 from jsonb_array_elements(v_variants) v where v->>'size'=oi.size)))) then
        raise exception 'Conserva las tallas de los pedidos pendientes de despacho; puedes dejarlas con stock cero' using errcode='P0001';
      end if;
      if target_status='published' and (item->>'stock')::integer<=0 then raise exception 'Agrega stock antes de publicar' using errcode='22023'; end if;
      if coalesce(item->>'imageUrl','')<>'' and (item->>'imageUrl') !~ '^https://[^[:space:]]+$' then raise exception 'Imagen HTTPS requerida' using errcode='22023'; end if;
      if coalesce(item->>'sku','')<>'' and exists (select 1 from public.products p where p.id<>v_product_id and lower(p.sku)=lower(item->>'sku')) then raise exception 'SKU ya utilizado' using errcode='22023'; end if;
      select id into category_id from public.categories where is_active and seller_label=item->>'category' order by id limit 1;
      if category_id is null then raise exception 'CategorÃ­a no vÃ¡lida' using errcode='22023'; end if;
      insert into public.products(id,seller_id,category_id,title,description,price,stock,sku,seller_status,is_active,variants)
      values(v_product_id,actor,category_id,btrim(item->>'title'),item->>'description',(item->>'priceCents')::numeric/100,(item->>'stock')::integer,nullif(btrim(item->>'sku'),''),target_status,target_status='published',v_variants)
      on conflict(id) do update set category_id=excluded.category_id,title=excluded.title,description=excluded.description,price=excluded.price,stock=excluded.stock,variants=excluded.variants,sku=excluded.sku,seller_status=excluded.seller_status,is_active=excluded.is_active,updated_at=now();
      delete from public.product_images where product_images.product_id=v_product_id;
      if coalesce(item->>'imageUrl','')<>'' then insert into public.product_images(product_id,url,alt_text) values(v_product_id,item->>'imageUrl',item->>'title'); end if;
      delete from public.product_tags where product_tags.product_id=v_product_id;
      for label in select jsonb_array_elements_text(item->'tags') loop
        if length(btrim(label)) not between 1 and 30 then raise exception 'Etiqueta no vÃ¡lida' using errcode='22023'; end if;
        insert into public.tags(name,slug) values(btrim(label),'seller-'||md5(btrim(label))) on conflict(name) do update set name=excluded.name returning id into tag_id;
        insert into public.product_tags(product_id,tag_id,source) values(v_product_id,tag_id,'manual') on conflict do nothing;
      end loop;
    end if;
  elsif kind='startLive' then
    if exists (select 1 from public.live_sessions where seller_id=actor and status='live') then raise exception 'Ya tienes un live en curso' using errcode='22023'; end if;
    if coalesce(length(btrim(action->>'title')),0) not between 1 and 100 or jsonb_typeof(action->'productIds') is distinct from 'array' or jsonb_array_length(action->'productIds') not between 1 and 50 then raise exception 'Live no vÃ¡lido' using errcode='22023'; end if;
    for v_product_id in select distinct value::uuid from jsonb_array_elements_text(action->'productIds') loop
      if not exists (select 1 from public.products where id=v_product_id and seller_id=actor and seller_status='published' and stock>0) then raise exception 'Selecciona productos publicados con stock' using errcode='22023'; end if;
    end loop;
    live_id := (action->>'id')::uuid;
    insert into public.live_sessions(id,seller_id,title,status,started_at) values(live_id,actor,btrim(action->>'title'),'live',now());
    insert into public.live_session_products(session_id,product_id) select live_id,value::uuid from jsonb_array_elements_text(action->'productIds') on conflict do nothing;
  elsif kind='endLive' then
    update public.live_sessions set status='ended',ended_at=now() where seller_id=actor and status='live';
    if not found then raise exception 'No hay live en curso' using errcode='22023'; end if;
  elsif kind='dispatchOrder' then
    update public.orders set status='dispatched',dispatched_at=now(),updated_at=now() where id=(action->>'id')::uuid and seller_id=actor and status='paid';
    if not found then raise exception 'Solo puedes despachar pedidos propios con pago confirmado' using errcode='22023'; end if;
    insert into public.order_status_history(order_id,status,changed_by,comment) values((action->>'id')::uuid,'dispatched',actor,'Despachado por el vendedor');
  elsif kind='changePlan' then
    select id into plan_id from public.plans where code=action->>'plan' and code in ('emprende','pro') and is_active and is_test_plan;
    if plan_id is null then raise exception 'Plan de prueba no disponible' using errcode='22023'; end if;
    update public.subscriptions set status='cancelled',cancelled_at=now() where seller_id=actor and status='active';
    insert into public.subscriptions(seller_id,plan_id) values(actor,plan_id);
  elsif kind='saveProfile' then
    item := action->'profile';
    if coalesce(length(btrim(item->>'storeName')),0) not between 1 and 80 or coalesce(item->>'handle','') !~ '^[a-z0-9._]{3,30}$' or item->>'handle' ~ '^\.|\.$|\.\.|__'
      or coalesce(length(item->>'bio'),0)>500 then raise exception 'Revisa los datos de la tienda' using errcode='22023'; end if;
    update public.profiles set store_name=btrim(item->>'storeName'),username=item->>'handle',bio=item->>'bio',updated_at=now() where id=actor;
  elsif kind='requestPayout' then
    select coalesce(sum(subtotal-commission_amount),0) into available from public.orders where seller_id=actor and status='released' and released_at+settlement_delay_hours*interval '1 hour'<=now();
    available := available - coalesce((select sum(amount) from public.payouts where seller_id=actor and status in ('pending','completed')),0);
    if available<=0 then raise exception 'No tienes saldo disponible' using errcode='22023'; end if;
    insert into public.payouts(id,seller_id,amount,method,account_info,status) values((action->>'id')::uuid,actor,available,'transferencia','Prueba acadÃ©mica: sin datos bancarios ni transferencia','pending');
  else raise exception 'AcciÃ³n no permitida' using errcode='22023';
  end if;
  insert into private.seller_action_receipts(seller_id,request_id,action) values(actor,request_id,action);
end $function$

;
CREATE OR REPLACE FUNCTION public.seller_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare actor uuid := auth.uid(); result jsonb;
begin
  if not exists (select 1 from public.profiles where id=actor and role='vendedor' and is_active) then
    raise exception 'Se requiere un vendedor activo' using errcode='42501';
  end if;
  select jsonb_build_object(
    'version',1,
    'profile',jsonb_build_object('storeName',coalesce(p.store_name,p.full_name,p.username),'handle',p.username,'bio',coalesce(p.bio,'')),
    'plan',coalesce((select pl.code from public.subscriptions s join public.plans pl on pl.id=s.plan_id where s.seller_id=actor and s.status='active' and (s.expires_at is null or s.expires_at>now())),'emprende'),
    'planSettings',(select coalesce(jsonb_object_agg(code,jsonb_build_object('name',name,'commissionPercent',commission_rate*100,'settlementHours',settlement_delay_hours)),'{}') from public.plans where is_active and code in ('emprende','pro')),
    'products',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'description',coalesce(x.description,''),'category',coalesce(c.seller_label,'Otros'),'priceCents',round(x.price*100)::bigint,'stock',x.stock,'variants',x.variants,'sku',coalesce(x.sku,''),'imageUrl',coalesce((select url from public.product_images where product_id=x.id order by position,id limit 1),''),'tags',coalesce((select jsonb_agg(t.name order by t.name) from public.product_tags pt join public.tags t on t.id=pt.tag_id where pt.product_id=x.id),'[]'),'status',x.seller_status,'createdAt',x.created_at) order by x.created_at desc) from public.products x left join public.categories c on c.id=x.category_id where x.seller_id=actor),'[]'),
    'orders',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'buyer',o.buyer_label,'productTitle',coalesce((select string_agg(i.product_title||case when i.size<>'' then ' · Talla '||i.size else '' end||' ×'||i.quantity,' + ' order by i.id) from public.order_items i where i.order_id=o.id),'Pedido'),'quantity',coalesce((select sum(quantity) from public.order_items where order_id=o.id),1),'subtotalCents',round(o.subtotal*100)::bigint,'commissionCents',round(o.commission_amount*100)::bigint,'settlementDelayHours',o.settlement_delay_hours,'status',o.status,'point',coalesce(lp.name,'Punto LockBox'),'address',coalesce(lp.address,''),'createdAt',o.created_at,'releasedAt',o.released_at,'history',coalesce((select jsonb_agg(jsonb_build_object('status',h.status,'at',h.created_at) order by h.created_at) from public.order_status_history h where h.order_id=o.id),'[]')) order by o.created_at desc) from public.orders o left join public.lockbox_points lp on lp.id=o.lockbox_id where o.seller_id=actor),'[]'),
    'sessions',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'startedAt',s.started_at,'endedAt',s.ended_at,'productIds',coalesce((select jsonb_agg(product_id) from public.live_session_products where session_id=s.id),'[]')) order by s.created_at desc) from public.live_sessions s where s.seller_id=actor and s.status in ('live','ended')),'[]'),
    'payouts',coalesce((select jsonb_agg(jsonb_build_object('id',id,'amountCents',round(amount*100)::bigint,'createdAt',requested_at,'status',status) order by requested_at desc) from public.payouts where seller_id=actor and status in ('pending','completed')),'[]')
  ) into result from public.profiles p where p.id=actor;
  return result;
end $function$

;
CREATE OR REPLACE FUNCTION private.buyer_action(action jsonb, request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_variable
declare
  actor uuid:=auth.uid(); kind text:=action->>'type'; v_cart_id uuid; v_product_id uuid;
  quantity integer; existing_qty integer; product public.products%rowtype; ord public.orders%rowtype;
  receipt private.buyer_action_receipts%rowtype; point public.lockbox_points%rowtype;
  seller uuid; v_order_id uuid; ids jsonb:='[]'::jsonb; result jsonb:='{"success":true}'::jsonb;
  subtotal numeric; commission numeric; delay_hours integer; item record; needed integer; label text; v_size text; available_stock integer;
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
    v_size:=coalesce(action->>'size','');
    if v_size<>'' and v_size !~ '^[A-Z0-9][A-Z0-9 ./-]{0,19}$' then raise exception 'Talla no válida' using errcode='22023'; end if;
    if kind='removeFromCart' or (kind='setCartQuantity' and action->>'quantity'='0') then
      delete from public.cart_items i where i.cart_id=v_cart_id and i.product_id=v_product_id and i.size=v_size;
    else
      if (action->>'quantity')::numeric<>trunc((action->>'quantity')::numeric) then raise exception 'Cantidad no válida' using errcode='22023'; end if;
      quantity:=(action->>'quantity')::integer;
      select p.* into product from public.products p join public.profiles s on s.id=p.seller_id and s.role='vendedor' and s.is_active where p.id=v_product_id and p.is_active and p.seller_status='published' for share of p;
      if not found or quantity is null or quantity not between 1 and 99999 then raise exception 'Producto o cantidad no disponible' using errcode='22023'; end if;
      select i.quantity into existing_qty from public.cart_items i where i.cart_id=v_cart_id and i.product_id=v_product_id and i.size=v_size;
      if kind='addToCart' then quantity:=quantity+coalesce(existing_qty,0); end if;
      if jsonb_array_length(product.variants)>0 then
        select (v->>'stock')::integer into available_stock from jsonb_array_elements(product.variants) v where v->>'size'=v_size;
        if available_stock is null then raise exception 'Selecciona una talla disponible' using errcode='22023'; end if;
      else
        if v_size<>'' then raise exception 'Este producto no tiene esa talla' using errcode='22023'; end if;
        available_stock:=product.stock;
      end if;
      if quantity>available_stock then raise exception 'No hay suficientes unidades disponibles' using errcode='P0001'; end if;
      if existing_qty is null and (select count(*) from public.cart_items i where i.cart_id=v_cart_id)>=50 then raise exception 'El carrito admite hasta 50 productos distintos' using errcode='22023'; end if;
      insert into public.cart_items(cart_id,product_id,quantity,size) values(v_cart_id,v_product_id,quantity,v_size)
        on conflict on constraint cart_items_product_size_key do update set quantity=excluded.quantity;
    end if;
  elsif kind='clearCart' then
    delete from public.cart_items i where i.cart_id=v_cart_id;
  elsif kind='checkout' then
    if action->>'paymentMethod' is null or action->>'paymentMethod' not in ('yape','bcp') then raise exception 'Método de prueba no válido' using errcode='22023'; end if;
    select * into point from public.lockbox_points where id=(action->>'pointId')::uuid and is_active for update;
    if not found then raise exception 'Punto no disponible' using errcode='22023'; end if;
    select count(distinct p.seller_id) into needed from public.cart_items i join public.products p on p.id=i.product_id where i.cart_id=v_cart_id;
    if needed=0 then raise exception 'El carrito está vacío' using errcode='22023'; end if;
    if (select count(*) from public.orders o where o.lockbox_id=point.id and (o.status in ('paid','dispatched','in_lockbox','ready') or (o.status='disputed' and o.delivered_at is null)))+needed>point.capacity then raise exception 'El punto no tiene capacidad disponible' using errcode='P0001'; end if;
    -- Same product lock order for every checkout; all prices/owners come from PostgreSQL.
    perform 1 from public.profiles s where s.id in (select p.seller_id from public.cart_items i join public.products p on p.id=i.product_id where i.cart_id=v_cart_id) order by s.id for share;
    perform 1 from public.products p join public.cart_items i on i.product_id=p.id where i.cart_id=v_cart_id order by p.id for update of p;
    if exists(select 1 from public.cart_items i join public.products p on p.id=i.product_id join public.profiles s on s.id=p.seller_id where i.cart_id=v_cart_id and (not p.is_active or p.seller_status<>'published' or p.stock<i.quantity or not s.is_active or s.role<>'vendedor')) then raise exception 'El stock o la publicación cambió. Revisa tu carrito' using errcode='P0001'; end if;
    if exists(select 1 from public.cart_items i join public.products p on p.id=i.product_id where i.cart_id=v_cart_id and
      case when jsonb_array_length(p.variants)>0 then
        coalesce((select (v->>'stock')::integer from jsonb_array_elements(p.variants) v where v->>'size'=i.size),-1)<i.quantity
      else i.size<>'' end) then raise exception 'La talla o su stock cambió. Revisa tu carrito' using errcode='P0001'; end if;
    if exists(select 1 from public.cart_items i join public.products p on p.id=i.product_id where i.cart_id=v_cart_id group by p.id,p.stock having sum(i.quantity)>p.stock) then
      raise exception 'El stock cambió. Revisa tu carrito' using errcode='P0001'; end if;
    select coalesce(full_name,username) into label from public.profiles where id=actor;
    for seller in select distinct p.seller_id from public.cart_items i join public.products p on p.id=i.product_id where i.cart_id=v_cart_id order by p.seller_id loop
      select sum(p.price*i.quantity) into subtotal from public.cart_items i join public.products p on p.id=i.product_id where i.cart_id=v_cart_id and p.seller_id=seller;
      commission:=0.06; delay_hours:=48;
      select pl.commission_rate,pl.settlement_delay_hours into commission,delay_hours from public.plans pl where pl.code=coalesce((select plan.code from public.subscriptions s join public.plans plan on plan.id=s.plan_id where s.seller_id=seller and s.status='active' and (s.expires_at is null or s.expires_at>now()) limit 1),'emprende') and pl.is_active;
      if commission is null then raise exception 'No se pudo consultar el plan del vendedor' using errcode='P0001'; end if;
      v_order_id:=gen_random_uuid();
      insert into public.orders(id,buyer_id,seller_id,lockbox_id,status,subtotal,commission_amount,total_amount,qr_code,qr_expires_at,paid_at,settlement_delay_hours,buyer_label,is_test,payment_method,test_reference,notes)
        values(v_order_id,actor,seller,point.id,'paid',subtotal,round(subtotal*commission,2),subtotal,'LBX-TEST-'||replace(gen_random_uuid()::text,'-',''),now()+interval '7 days',now(),delay_hours,label,true,action->>'paymentMethod','checkout-'||v_order_id::text,'Compra de prueba conectada. Sin cobro ni movimiento de dinero.');
      for item in select p.id,p.title,p.price,i.quantity,i.size,coalesce((select c.name from public.categories c where c.id=p.category_id),'Otros') as category_name from public.cart_items i join public.products p on p.id=i.product_id where i.cart_id=v_cart_id and p.seller_id=seller order by p.id loop
        insert into public.order_items(order_id,product_id,quantity,unit_price,subtotal,product_title,size,category_name) values(v_order_id,item.id,item.quantity,item.price,item.price*item.quantity,item.title,item.size,item.category_name);
        update public.products set stock=stock-item.quantity,
          variants=case when item.size='' then variants else
            (select jsonb_agg(case when v->>'size'=item.size then jsonb_set(v,'{stock}',to_jsonb((v->>'stock')::integer-item.quantity)) else v end order by pos)
             from jsonb_array_elements(variants) with ordinality as sizes(v,pos)) end,
          updated_at=now() where id=item.id;
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
      for item in select i.product_id,i.quantity,i.size from public.order_items i where i.order_id=ord.id order by i.product_id loop
        update public.products set stock=stock+item.quantity,
          variants=case when item.size='' then variants else
            (select jsonb_agg(case when v->>'size'=item.size then jsonb_set(v,'{stock}',to_jsonb((v->>'stock')::integer+item.quantity)) else v end order by pos)
             from jsonb_array_elements(variants) with ordinality as sizes(v,pos)) end,
          updated_at=now() where id=item.product_id;
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
end $function$

;
create or replace view private.buyer_products as
select p.id,p.seller_id,p.is_active,p.seller_status,p.stock,s.is_active as seller_active,s.role as seller_role,
  jsonb_build_object('id',p.id,'sellerId',p.seller_id,'sellerName',coalesce(s.store_name,s.username),
    'categoryId',coalesce(c.id::text,'otros'),'categoryName',coalesce(c.name,'Otros'),
    'title',p.title,'description',coalesce(p.description,''),'priceCents',round(p.price*100)::bigint,
    'stock',p.stock,'variants',p.variants,'sku',coalesce(p.sku,''),
    'imageUrl',coalesce((select url from public.product_images where product_id=p.id order by position,id limit 1),''),
    'isLiveFeatured',exists(select 1 from public.live_session_products sp join public.live_sessions l on l.id=sp.session_id where sp.product_id=p.id and l.status='live')) as data
from public.products p join public.profiles s on s.id=p.seller_id
left join public.categories c on c.id=p.category_id;
revoke all on private.buyer_products from public,anon,authenticated;

CREATE OR REPLACE FUNCTION private.buyer_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid:=auth.uid(); result jsonb;
begin
  if not exists(select 1 from public.profiles where id=actor and role='comprador' and is_active) then
    raise exception 'Se requiere un comprador activo' using errcode='42501';
  end if;
  select jsonb_build_object(
    'catalog',coalesce((select jsonb_agg(p.data order by p.id) from private.buyer_products p where p.is_active and p.seller_status='published' and p.seller_active and p.seller_role='vendedor'),'[]'::jsonb),
    'cart',coalesce((select jsonb_agg(jsonb_build_object('product',p.data,'size',i.size,'quantity',i.quantity) order by i.added_at,i.id) from public.carts c join public.cart_items i on i.cart_id=c.id join private.buyer_products p on p.id=i.product_id where c.user_id=actor),'[]'::jsonb),
    'lockBoxPoints',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'address',p.address,'city',coalesce(p.city,''),'phone',coalesce(p.phone,''),'capacity',p.capacity) order by p.name) from public.lockbox_points p where p.is_active),'[]'::jsonb),
    'orders',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',o.id,'orderNumber','LB-'||upper(left(o.id::text,8)),
      'items',coalesce((select jsonb_agg(jsonb_build_object('product',p.data||jsonb_build_object('title',i.product_title,'categoryName',coalesce(nullif(i.category_name,''),p.data->>'categoryName'),'priceCents',round(i.unit_price*100)::bigint),'size',i.size,'quantity',i.quantity) order by i.id) from public.order_items i join private.buyer_products p on p.id=i.product_id where i.order_id=o.id),'[]'::jsonb),
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
end $function$

;

-- Existing grants/RLS remain unchanged. Helpers and privileged RPC implementations stay private.
revoke all on function private.seller_action(jsonb,uuid), private.buyer_action(jsonb,uuid), private.buyer_state() from public,anon;
notify pgrst,'reload schema';
commit;
