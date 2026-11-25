-- Adds coordinates to registration and buyer reads without replacing existing points.
begin;
alter table public.lockbox_points add column location_is_approximate boolean not null default false;
alter table public.lockbox_points add constraint lockbox_points_coordinates_pair_check check (
  (latitude is null and longitude is null) or
  (latitude is not null and longitude is not null and latitude between -90 and 90 and longitude between -180 and 180)
);
-- User requested a provisional location for this existing point. Preserve its identity and address.
-- The UI labels the marker as provisional rather than presenting it as a verified entrance.
update public.lockbox_points
set latitude=-16.5100000,longitude=-68.1290000,location_is_approximate=true
where id='f88b9e4e-5e90-4d01-aae1-ad61c4cb9e74' and latitude is null and longitude is null;

CREATE OR REPLACE FUNCTION private.create_registration_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  account_role text := coalesce(metadata->>'role','comprador');
  account_username text := lower(btrim(coalesce(metadata->>'username','user_'||left(replace(new.id::text,'-',''),24))));
  account_name text := btrim(coalesce(metadata->>'full_name','Cuenta LockBox'));
  account_phone text := nullif(btrim(metadata->>'phone'),'');
  shop text := nullif(btrim(metadata->>'store_name'),'');
  point_name text := btrim(metadata->>'point_name');
  point_address text := btrim(metadata->>'point_address');
  point_capacity integer;
  point_city text := nullif(btrim(metadata->>'point_city'),'');
  point_latitude numeric;
  point_longitude numeric;
  initial_plan uuid;
begin
  if account_role not in ('comprador','vendedor','operador_punto') then
    raise exception 'Rol de registro no permitido' using errcode='22023';
  end if;
  if char_length(account_name) not between 2 and 80
    or account_username !~ '^[a-z0-9._]{3,30}$'
    or account_username ~ '^[.]|[.]$|[.][.]|__'
    or (account_phone is not null and account_phone !~ '^[+][1-9][0-9]{7,14}$')
    or (account_role='vendedor' and coalesce(char_length(shop),0) not between 2 and 80) then
    raise exception 'Datos de registro inválidos' using errcode='22023';
  end if;
  if account_role='operador_punto' then
    if coalesce(char_length(point_name),0) not between 2 and 80
      or coalesce(char_length(point_address),0) not between 10 and 240
      or account_phone is null
      or jsonb_typeof(metadata->'point_capacity') is distinct from 'number' then
      raise exception 'Revisa nombre, dirección, celular y capacidad del punto' using errcode='22023';
    end if;
    if (metadata->>'point_capacity')::numeric not between 1 and 500
      or (metadata->>'point_capacity')::numeric <> trunc((metadata->>'point_capacity')::numeric) then
      raise exception 'La capacidad debe ser un entero entre 1 y 500' using errcode='22023';
    end if;
    point_capacity := (metadata->>'point_capacity')::integer;
    if point_city is not null and char_length(point_city) not between 2 and 80 then
      raise exception 'Ciudad inválida' using errcode='22023';
    end if;
    -- Old clients may omit both coordinates. A partial or malformed pair is never accepted.
    if metadata->>'point_latitude' is not null or metadata->>'point_longitude' is not null then
      if jsonb_typeof(metadata->'point_latitude') is distinct from 'number'
        or jsonb_typeof(metadata->'point_longitude') is distinct from 'number' then
        raise exception 'Latitud y longitud deben ser números' using errcode='22023';
      end if;
      point_latitude := (metadata->>'point_latitude')::numeric;
      point_longitude := (metadata->>'point_longitude')::numeric;
      if point_latitude not between -90 and 90 or point_longitude not between -180 and 180 then
        raise exception 'Coordenadas fuera de rango' using errcode='22023';
      end if;
    end if;
  end if;
  insert into public.profiles(id,username,role,full_name,phone,store_name,is_verified,is_active)
  values(new.id,account_username,account_role::public.user_role,account_name,account_phone,
    case when account_role='vendedor' then shop else null end,false,true);
  if account_role='vendedor' then
    select id into initial_plan from public.plans where code='emprende' and is_active limit 1;
    if initial_plan is null then raise exception 'Plan inicial no disponible' using errcode='22023'; end if;
    insert into public.subscriptions(seller_id,plan_id) values(new.id,initial_plan);
  elsif account_role='comprador' then
    insert into public.carts(user_id) values(new.id);
  else
    insert into public.lockbox_points(manager_id,name,address,city,phone,capacity,is_active,latitude,longitude)
    values(new.id,point_name,point_address,point_city,account_phone,point_capacity,true,point_latitude,point_longitude);
  end if;
  return new;
end;
$function$;

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
    'lockBoxPoints',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'address',p.address,'city',coalesce(p.city,''),'phone',coalesce(p.phone,''),'capacity',p.capacity,'latitude',p.latitude,'longitude',p.longitude,'locationIsApproximate',p.location_is_approximate) order by p.name) from public.lockbox_points p where p.is_active),'[]'::jsonb),
    'orders',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',o.id,'orderNumber','LB-'||upper(left(o.id::text,8)),
      'items',coalesce((select jsonb_agg(jsonb_build_object('product',p.data||jsonb_build_object('title',i.product_title,'categoryName',coalesce(nullif(i.category_name,''),p.data->>'categoryName'),'priceCents',round(i.unit_price*100)::bigint),'size',i.size,'quantity',i.quantity) order by i.id) from public.order_items i join private.buyer_products p on p.id=i.product_id where i.order_id=o.id),'[]'::jsonb),
      'subtotalCents',round(o.subtotal*100)::bigint,'totalCents',round(o.total_amount*100)::bigint,
      'lockBoxPoint',jsonb_build_object('id',lp.id,'name',lp.name,'address',lp.address,'city',coalesce(lp.city,''),'phone',coalesce(lp.phone,''),'capacity',lp.capacity,'latitude',lp.latitude,'longitude',lp.longitude,'locationIsApproximate',lp.location_is_approximate),
      'paymentMethod',coalesce(o.payment_method,'bcp'),'isTest',o.is_test,'status',o.status,
      'qrCode',coalesce(o.qr_code,''),'qrExpiresAt',coalesce(o.qr_expires_at,o.created_at),
      'createdAt',o.created_at,'paidAt',o.paid_at,'dispatchedAt',o.dispatched_at,'deliveredAt',o.delivered_at,'cancelledAt',o.cancelled_at,
      'review',(select jsonb_build_object('rating',r.rating,'comment',coalesce(r.comment,''),'createdAt',r.created_at) from public.reviews r where r.order_id=o.id and r.author_id=actor order by r.created_at desc limit 1),
      'dispute',(select jsonb_build_object('reason',d.reason,'description',coalesce(d.description,''),'status',case when d.status in ('open','in_review') then 'open' else 'resolved' end,'createdAt',d.created_at) from public.disputes d where d.order_id=o.id and d.opened_by=actor order by d.created_at desc limit 1)
    )) order by o.created_at desc) from public.orders o join public.lockbox_points lp on lp.id=o.lockbox_id where o.buyer_id=actor),'[]'::jsonb),
    'searchQuery','','selectedCategory',null,'activeLiveSession',false
  ) into result;
  return result;
end $function$;

revoke all on function private.create_registration_profile() from public,anon,authenticated;
revoke all on function private.buyer_state() from public,anon;
notify pgrst,'reload schema';
commit;
