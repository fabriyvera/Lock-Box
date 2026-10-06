-- Incremental schema on the existing LockBox database. Applied with Supabase MCP.
alter table public.categories add column seller_label text not null default 'Otros';
alter table public.categories add constraint categories_seller_label_check check (seller_label in ('Moda','TecnologÃ­a','Hogar','Belleza','Accesorios','Otros'));
update public.categories set seller_label = case
  when name like 'Moda%' then 'Moda' when name like 'Tecnolog%' then 'TecnologÃ­a'
  when name like 'Hogar%' then 'Hogar' when name like 'Belleza%' then 'Belleza'
  when name like 'Joyer%' then 'Accesorios' else 'Otros' end;
alter table public.products add column seller_status text;
update public.products set seller_status = case when is_active then 'published' else 'paused' end;
alter table public.products alter column seller_status set not null;
alter table public.products alter column seller_status set default 'draft';
alter table public.products add constraint products_seller_status_check check (seller_status in ('draft','published','paused','archived'));
alter table public.orders add column settlement_delay_hours integer not null default 48 check (settlement_delay_hours in (0,48));
alter table public.orders add column buyer_label text not null default 'Comprador';
alter table public.orders add column test_reference text unique;
alter table public.order_items add column product_title text not null default 'Producto';
alter table public.plans add column settlement_delay_hours integer not null default 48 check (settlement_delay_hours in (0,48));
alter table public.plans add column is_test_plan boolean not null default false;
create table public.live_session_products (
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  product_id uuid not null references public.products(id),
  primary key (session_id, product_id)
);
create index live_session_products_product_idx on public.live_session_products(product_id);
create unique index seller_one_live_idx on public.live_sessions(seller_id) where status='live';
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create table private.seller_action_receipts (
  seller_id uuid not null references public.profiles(id),
  request_id uuid not null,
  action jsonb not null,
  created_at timestamptz not null default now(),
  primary key (seller_id,request_id)
);
alter table private.seller_action_receipts enable row level security;
revoke all on private.seller_action_receipts from public,anon,authenticated;

-- No direct writes: even a caller bypassing Express cannot change roles or escrow.
revoke insert,update,delete,truncate,references,trigger on
  public.profiles,public.products,public.product_images,public.tags,public.product_tags,
  public.live_sessions,public.live_session_products,public.orders,public.order_items,
  public.order_status_history,public.plans,public.subscriptions,public.payouts
from public,anon,authenticated;
grant select on public.profiles,public.categories,public.products,public.product_images,
  public.tags,public.product_tags,public.live_sessions,public.live_session_products,
  public.order_items,public.order_status_history,public.lockbox_points,
  public.plans,public.subscriptions,public.payouts to authenticated;
revoke select on public.orders from public,anon,authenticated;
grant select (id,seller_id,lockbox_id,status,subtotal,commission_amount,total_amount,created_at,released_at,settlement_delay_hours,buyer_label,test_reference) on public.orders to authenticated;
grant select on public.categories,public.plans to anon;
alter table public.live_session_products enable row level security;
create policy seller_profile_read on public.profiles for select to authenticated using (id=(select auth.uid()));
create policy seller_categories_read on public.categories for select to anon,authenticated using (is_active);
create policy seller_products_read on public.products for select to authenticated using (seller_id=(select auth.uid()));
create policy seller_images_read on public.product_images for select to authenticated using (exists (select 1 from public.products p where p.id=product_images.product_id and p.seller_id=(select auth.uid())));
create policy seller_tags_read on public.tags for select to authenticated using (true);
create policy seller_product_tags_read on public.product_tags for select to authenticated using (exists (select 1 from public.products p where p.id=product_tags.product_id and p.seller_id=(select auth.uid())));
create policy seller_lives_read on public.live_sessions for select to authenticated using (seller_id=(select auth.uid()));
create policy seller_live_products_read on public.live_session_products for select to authenticated using (exists (select 1 from public.live_sessions s where s.id=live_session_products.session_id and s.seller_id=(select auth.uid())));
create policy seller_orders_read on public.orders for select to authenticated using (seller_id=(select auth.uid()));
create policy seller_items_read on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id=order_items.order_id and o.seller_id=(select auth.uid())));
create policy seller_history_read on public.order_status_history for select to authenticated using (exists (select 1 from public.orders o where o.id=order_status_history.order_id and o.seller_id=(select auth.uid())));
create policy seller_points_read on public.lockbox_points for select to authenticated using (is_active or exists (select 1 from public.orders o where o.lockbox_id=lockbox_points.id and o.seller_id=(select auth.uid())));
create policy seller_plans_read on public.plans for select to anon,authenticated using (is_active);
create policy seller_subscriptions_read on public.subscriptions for select to authenticated using (seller_id=(select auth.uid()));
create policy seller_payouts_read on public.payouts for select to authenticated using (seller_id=(select auth.uid()));

-- Reads execute under the caller's JWT and RLS. No buyer contact details or QR tokens.
create function public.seller_state() returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare actor uuid := auth.uid(); result jsonb;
begin
  if not exists (select 1 from public.profiles where id=actor and role='vendedor' and is_active) then
    raise exception 'Se requiere un vendedor activo' using errcode='42501';
  end if;
  select jsonb_build_object(
    'version',1,
    'profile',jsonb_build_object('storeName',coalesce(p.full_name,p.username),'handle',p.username,'city',coalesce(p.city,'La Paz'),'bio',coalesce(p.bio,'')),
    'plan',coalesce((select pl.code from public.subscriptions s join public.plans pl on pl.id=s.plan_id where s.seller_id=actor and s.status='active' and (s.expires_at is null or s.expires_at>now())),'emprende'),
    'planSettings',(select coalesce(jsonb_object_agg(code,jsonb_build_object('name',name,'commissionPercent',commission_rate*100,'settlementHours',settlement_delay_hours)),'{}') from public.plans where is_active and code in ('emprende','pro')),
    'products',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'description',coalesce(x.description,''),'category',coalesce(c.seller_label,'Otros'),'priceCents',round(x.price*100)::bigint,'stock',x.stock,'sku',coalesce(x.sku,''),'imageUrl',coalesce((select url from public.product_images where product_id=x.id order by position,id limit 1),''),'tags',coalesce((select jsonb_agg(t.name order by t.name) from public.product_tags pt join public.tags t on t.id=pt.tag_id where pt.product_id=x.id),'[]'),'status',x.seller_status,'createdAt',x.created_at) order by x.created_at desc) from public.products x left join public.categories c on c.id=x.category_id where x.seller_id=actor),'[]'),
    'orders',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'buyer',o.buyer_label,'productTitle',coalesce((select string_agg(i.product_title,' + ' order by i.id) from public.order_items i where i.order_id=o.id),'Pedido'),'quantity',coalesce((select sum(quantity) from public.order_items where order_id=o.id),1),'subtotalCents',round(o.subtotal*100)::bigint,'commissionCents',round(o.commission_amount*100)::bigint,'settlementDelayHours',o.settlement_delay_hours,'status',o.status,'point',coalesce(lp.name,'Punto LockBox'),'address',coalesce(lp.address,''),'createdAt',o.created_at,'releasedAt',o.released_at,'history',coalesce((select jsonb_agg(jsonb_build_object('status',h.status,'at',h.created_at) order by h.created_at) from public.order_status_history h where h.order_id=o.id),'[]')) order by o.created_at desc) from public.orders o left join public.lockbox_points lp on lp.id=o.lockbox_id where o.seller_id=actor),'[]'),
    'sessions',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'startedAt',s.started_at,'endedAt',s.ended_at,'productIds',coalesce((select jsonb_agg(product_id) from public.live_session_products where session_id=s.id),'[]')) order by s.created_at desc) from public.live_sessions s where s.seller_id=actor and s.status in ('live','ended')),'[]'),
    'payouts',coalesce((select jsonb_agg(jsonb_build_object('id',id,'amountCents',round(amount*100)::bigint,'createdAt',requested_at,'status',status) order by requested_at desc) from public.payouts where seller_id=actor and status in ('pending','completed')),'[]')
  ) into result from public.profiles p where p.id=actor;
  return result;
end $$;
revoke all on function public.seller_state() from public,anon;
grant execute on function public.seller_state() to authenticated;

-- Privileged mutations are confined to a non-exposed schema. Every call checks
-- auth.uid(), the trusted profiles role and ownership. Profile lock serializes
-- balance/live/plan decisions; request receipts prevent duplicate retry writes.
create function private.seller_action(action jsonb, request_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare
  actor uuid := auth.uid(); kind text := action->>'type'; item jsonb;
  v_product_id uuid; category_id uuid; live_id uuid; plan_id uuid; tag_id uuid;
  product public.products%rowtype; target_status text; label text; available numeric;
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
      if target_status='published' and (item->>'stock')::integer<=0 then raise exception 'Agrega stock antes de publicar' using errcode='22023'; end if;
      if coalesce(item->>'imageUrl','')<>'' and (item->>'imageUrl') !~ '^https://[^[:space:]]+$' then raise exception 'Imagen HTTPS requerida' using errcode='22023'; end if;
      if coalesce(item->>'sku','')<>'' and exists (select 1 from public.products p where p.id<>v_product_id and lower(p.sku)=lower(item->>'sku')) then raise exception 'SKU ya utilizado' using errcode='22023'; end if;
      select id into category_id from public.categories where is_active and seller_label=item->>'category' order by id limit 1;
      if category_id is null then raise exception 'CategorÃ­a no vÃ¡lida' using errcode='22023'; end if;
      insert into public.products(id,seller_id,category_id,title,description,price,stock,sku,seller_status,is_active)
      values(v_product_id,actor,category_id,btrim(item->>'title'),item->>'description',(item->>'priceCents')::numeric/100,(item->>'stock')::integer,nullif(btrim(item->>'sku'),''),target_status,target_status='published')
      on conflict(id) do update set category_id=excluded.category_id,title=excluded.title,description=excluded.description,price=excluded.price,stock=excluded.stock,sku=excluded.sku,seller_status=excluded.seller_status,is_active=excluded.is_active,updated_at=now();
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
      or coalesce(length(btrim(item->>'city')),0) not between 1 and 60 or coalesce(length(item->>'bio'),0)>500 then raise exception 'Revisa los datos de la tienda' using errcode='22023'; end if;
    update public.profiles set full_name=btrim(item->>'storeName'),username=item->>'handle',city=btrim(item->>'city'),bio=item->>'bio',updated_at=now() where id=actor;
  elsif kind='requestPayout' then
    select coalesce(sum(subtotal-commission_amount),0) into available from public.orders where seller_id=actor and status='released' and released_at+settlement_delay_hours*interval '1 hour'<=now();
    available := available - coalesce((select sum(amount) from public.payouts where seller_id=actor and status in ('pending','completed')),0);
    if available<=0 then raise exception 'No tienes saldo disponible' using errcode='22023'; end if;
    insert into public.payouts(id,seller_id,amount,method,account_info,status) values((action->>'id')::uuid,actor,available,'transferencia','Prueba acadÃ©mica: sin datos bancarios ni transferencia','pending');
  else raise exception 'AcciÃ³n no permitida' using errcode='22023';
  end if;
  insert into private.seller_action_receipts(seller_id,request_id,action) values(actor,request_id,action);
end $$;
revoke all on function private.seller_action(jsonb,uuid) from public,anon;
grant execute on function private.seller_action(jsonb,uuid) to authenticated;
create function public.seller_action(action jsonb,request_id uuid) returns void
language sql security invoker set search_path = '' as $$ select private.seller_action(action,request_id); $$;
revoke all on function public.seller_action(jsonb,uuid) from public,anon;
grant execute on function public.seller_action(jsonb,uuid) to authenticated;
notify pgrst,'reload schema';
