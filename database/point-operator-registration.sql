-- Self-registration creates a NEW point owned by the new profile atomically.
-- Existing points, assignments and profiles are preserved.
-- A complete address is collected; city is optional, without fabricating a value.
alter table public.lockbox_points alter column city drop not null;

create or replace function private.create_registration_profile()
returns trigger language plpgsql security definer set search_path='' as $registration$
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
    insert into public.lockbox_points(manager_id,name,address,city,phone,capacity,is_active)
    values(new.id,point_name,point_address,null,account_phone,point_capacity,true);
  end if;
  return new;
end;
$registration$;
revoke all on function private.create_registration_profile() from public,anon,authenticated;

-- Indexed ownership lookup for point dashboards, including empty new points.
create index if not exists lockbox_points_active_manager_idx
  on public.lockbox_points(manager_id) where is_active;
