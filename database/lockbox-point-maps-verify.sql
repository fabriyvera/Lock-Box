-- All fixtures and mutations are rolled back. Run after the maps migration.
begin;
do $test$
declare
  operator_id uuid:=gen_random_uuid(); buyer_id uuid:=gen_random_uuid();
  point_id uuid; snapshot jsonb; metadata jsonb;
begin
  metadata:=jsonb_build_object('role','operador_punto','point_name','QA mapa temporal',
    'point_address','Dirección temporal de prueba','phone','+59171234567','point_capacity',30,
    'point_city','La Paz','point_latitude',-16.51,'point_longitude',-68.12);
  insert into auth.users(id,raw_user_meta_data) values(operator_id,metadata);
  select id into strict point_id from public.lockbox_points where manager_id=operator_id;
  if not exists(select 1 from public.lockbox_points where id=point_id and latitude=-16.51 and longitude=-68.12 and city='La Paz' and not location_is_approximate) then
    raise exception 'Registration did not persist coordinates';
  end if;
  insert into auth.users(id,raw_user_meta_data) values(buyer_id,'{"role":"comprador"}');
  perform set_config('request.jwt.claim.sub',buyer_id::text,true);
  snapshot:=public.buyer_state_v5();
  if not exists(select 1 from jsonb_array_elements(snapshot->'lockBoxPoints') p where p->>'id'=point_id::text and (p->>'latitude')::numeric=-16.51 and (p->>'longitude')::numeric=-68.12) then
    raise exception 'Buyer state omitted coordinates';
  end if;
  update public.lockbox_points set is_active=false where id=point_id;
  snapshot:=public.buyer_state_v5();
  if exists(select 1 from jsonb_array_elements(snapshot->'lockBoxPoints') p where p->>'id'=point_id::text) then raise exception 'Inactive point exposed'; end if;
  begin
    insert into auth.users(id,raw_user_meta_data) values(gen_random_uuid(),jsonb_set(metadata,'{point_latitude}','91'));
    raise exception 'Out-of-range registration accepted';
  exception when invalid_parameter_value then null; end;
  begin
    insert into auth.users(id,raw_user_meta_data) values(gen_random_uuid(),metadata-'point_longitude');
    raise exception 'Partial coordinates accepted';
  exception when invalid_parameter_value then null; end;
  begin
    update public.lockbox_points set latitude=null where id=point_id;
    raise exception 'Database accepted a partial coordinate pair';
  exception when check_violation then null; end;
  -- Legacy records with neither coordinate remain valid and visible in the list.
  update public.profiles set phone=null where id=operator_id;
  insert into auth.users(id,raw_user_meta_data) values(gen_random_uuid(),metadata-'point_latitude'-'point_longitude');
end;
$test$;
rollback;
