-- Alta atómica de perfiles desde Supabase Auth. No modifica cuentas existentes.
alter table public.profiles add column if not exists store_name text;
alter table public.profiles add constraint profiles_store_name_length check (store_name is null or char_length(store_name) between 2 and 80);
update public.profiles set store_name=full_name where role='vendedor' and store_name is null and char_length(full_name) between 2 and 80;

create or replace function private.create_registration_profile()
returns trigger language plpgsql security definer set search_path='' as $registration$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  account_role text := coalesce(metadata->>'role','comprador');
  account_username text := lower(btrim(coalesce(metadata->>'username','user_'||left(replace(new.id::text,'-',''),24))));
  account_name text := btrim(coalesce(metadata->>'full_name','Cuenta LockBox'));
  account_phone text := nullif(btrim(metadata->>'phone'),'');
  shop text := nullif(btrim(metadata->>'store_name'),'');
  initial_plan uuid;
begin
  if account_role not in ('comprador','vendedor') then
    raise exception 'Rol de registro no permitido' using errcode='22023';
  end if;
  if char_length(account_name) not between 2 and 80
    or account_username !~ '^[a-z0-9._]{3,30}$'
    or account_username ~ '^\.|\.$|\.\.|__'
    or (account_phone is not null and account_phone !~ '^\+[1-9][0-9]{7,14}$')
    or (account_role='vendedor' and coalesce(char_length(shop),0) not between 2 and 80) then
    raise exception 'Datos de registro inválidos' using errcode='22023';
  end if;
  insert into public.profiles(id,username,role,full_name,phone,store_name,is_verified,is_active)
  values(new.id,account_username,account_role::public.user_role,account_name,account_phone,
    case when account_role='vendedor' then shop else null end,false,true);
  if account_role='vendedor' then
    select id into initial_plan from public.plans where code='emprende' and is_active limit 1;
    if initial_plan is null then raise exception 'Plan inicial no disponible' using errcode='22023'; end if;
    insert into public.subscriptions(seller_id,plan_id) values(new.id,initial_plan);
  else
    insert into public.carts(user_id) values(new.id);
  end if;
  return new;
end;
$registration$;
revoke all on function private.create_registration_profile() from public,anon,authenticated;
create trigger lockbox_registration_profile after insert on auth.users
for each row execute function private.create_registration_profile();

-- La autorización continúa basada en profiles.role, nunca en metadatos editables.
-- Editar la tienda debe conservar el nombre personal del titular.
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
    'products',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'description',coalesce(x.description,''),'category',coalesce(c.seller_label,'Otros'),'priceCents',round(x.price*100)::bigint,'stock',x.stock,'sku',coalesce(x.sku,''),'imageUrl',coalesce((select url from public.product_images where product_id=x.id order by position,id limit 1),''),'tags',coalesce((select jsonb_agg(t.name order by t.name) from public.product_tags pt join public.tags t on t.id=pt.tag_id where pt.product_id=x.id),'[]'),'status',x.seller_status,'createdAt',x.created_at) order by x.created_at desc) from public.products x left join public.categories c on c.id=x.category_id where x.seller_id=actor),'[]'),
    'orders',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'buyer',o.buyer_label,'productTitle',coalesce((select string_agg(i.product_title,' + ' order by i.id) from public.order_items i where i.order_id=o.id),'Pedido'),'quantity',coalesce((select sum(quantity) from public.order_items where order_id=o.id),1),'subtotalCents',round(o.subtotal*100)::bigint,'commissionCents',round(o.commission_amount*100)::bigint,'settlementDelayHours',o.settlement_delay_hours,'status',o.status,'point',coalesce(lp.name,'Punto LockBox'),'address',coalesce(lp.address,''),'createdAt',o.created_at,'releasedAt',o.released_at,'history',coalesce((select jsonb_agg(jsonb_build_object('status',h.status,'at',h.created_at) order by h.created_at) from public.order_status_history h where h.order_id=o.id),'[]')) order by o.created_at desc) from public.orders o left join public.lockbox_points lp on lp.id=o.lockbox_id where o.seller_id=actor),'[]'),
    'sessions',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'startedAt',s.started_at,'endedAt',s.ended_at,'productIds',coalesce((select jsonb_agg(product_id) from public.live_session_products where session_id=s.id),'[]')) order by s.created_at desc) from public.live_sessions s where s.seller_id=actor and s.status in ('live','ended')),'[]'),
    'payouts',coalesce((select jsonb_agg(jsonb_build_object('id',id,'amountCents',round(amount*100)::bigint,'createdAt',requested_at,'status',status) order by requested_at desc) from public.payouts where seller_id=actor and status in ('pending','completed')),'[]')
  ) into result from public.profiles p where p.id=actor;
  return result;
end $function$
;

