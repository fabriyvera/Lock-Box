-- Transactional integration checks: no test accounts/points remain afterwards.
begin;
do $test$
declare
  operator uuid := gen_random_uuid(); other_operator uuid := gen_random_uuid();
  buyer uuid := gen_random_uuid(); seller uuid := gen_random_uuid();
  metadata jsonb; invalid jsonb; before_users bigint; own_point uuid; phones text[];
begin
  select array_agg(phone) into phones from (
    select '+591'||n::text as phone from generate_series(79000000,79000100) n
    where not exists(select from public.profiles p where p.phone='+591'||n::text)
    order by n limit 4
  ) available;
  if array_length(phones,1)<>4 then raise exception 'No hay teléfonos QA disponibles'; end if;
  metadata := jsonb_build_object('role','operador_punto','username','qa_'||left(replace(operator::text,'-',''),18),
    'full_name','Responsable QA','phone',phones[1],'point_name','Punto QA','point_address','Av. Pruebas 123, La Paz','point_capacity',40,
    'manager_id',other_operator,'is_verified',true);
  insert into auth.users(id,raw_user_meta_data) values(operator,metadata);
  select id into own_point from public.lockbox_points where manager_id=operator;
  if own_point is null or (select count(*) from public.lockbox_points where manager_id=operator)<>1 then
    raise exception 'El alta debe crear exactamente un punto propio';
  end if;
  if not exists(select from public.profiles where id=operator and role='operador_punto' and is_active and not is_verified and store_name is null)
    or not exists(select from public.lockbox_points where id=own_point and name='Punto QA' and address='Av. Pruebas 123, La Paz' and capacity=40 and city is null and phone=phones[1] and is_active)
    or exists(select from public.carts where user_id=operator)
    or exists(select from public.subscriptions where seller_id=operator) then
    raise exception 'Perfil, datos del punto o recursos del rol incorrectos';
  end if;
  insert into auth.users(id,raw_user_meta_data) values(other_operator,metadata||jsonb_build_object('username','qa_'||left(replace(other_operator::text,'-',''),18),'phone',phones[2]));
  insert into auth.users(id,raw_user_meta_data) values(buyer,jsonb_build_object('role','comprador','username','qa_'||left(replace(buyer::text,'-',''),18),'full_name','Comprador QA','phone',phones[3]));
  insert into auth.users(id,raw_user_meta_data) values(seller,jsonb_build_object('role','vendedor','username','qa_'||left(replace(seller::text,'-',''),18),'full_name','Vendedor QA','store_name','Tienda QA','phone',phones[4]));
  if not exists(select from public.carts where user_id=buyer) or not exists(select from public.subscriptions where seller_id=seller) then raise exception 'Regresión de compradores/vendedores'; end if;
  select count(*) into before_users from auth.users;
  for invalid in select value from jsonb_array_elements('[{"role":"admin"},{"point_capacity":0},{"point_capacity":2.5},{"point_capacity":"40"},{"point_name":"X"},{"point_address":"corto"},{"point_capacity":501}]'::jsonb) loop
    begin
      insert into auth.users(id,raw_user_meta_data) values(gen_random_uuid(),metadata||jsonb_build_object('username','qa_'||left(replace(gen_random_uuid()::text,'-',''),18))||invalid);
      raise exception 'Alta inválida aceptada: %',invalid;
    exception when invalid_parameter_value then null;
    end;
  end loop;
  if (select count(*) from auth.users)<>before_users then raise exception 'Cuenta huérfana después de fallo'; end if;
  update auth.users set raw_user_meta_data=metadata||'{"role":"admin","point_name":"Punto falsificado"}'::jsonb where id=operator;
  if not exists(select from public.profiles where id=operator and role='operador_punto') or not exists(select from public.lockbox_points where id=own_point and name='Punto QA') then raise exception 'Metadatos editables alteraron permisos/punto'; end if;
  perform set_config('lockbox.qa.operator',operator::text,true);
  perform set_config('lockbox.qa.buyer',buyer::text,true);
  perform set_config('lockbox.qa.point',own_point::text,true);
  perform set_config('request.jwt.claim.sub',operator::text,true);
end $test$;
set local role authenticated;
do $test$
declare state jsonb; affected bigint;
begin
  state := public.collection_point_action('{"type":"state"}'::jsonb);
  if jsonb_array_length(state->'points')<>1 or state->'points'->0->>'id'<>current_setting('lockbox.qa.point') or jsonb_array_length(state->'orders')<>0 then
    raise exception 'El operador accedió a puntos/pedidos ajenos';
  end if;
  begin
    update public.profiles set role='admin' where id=current_setting('lockbox.qa.operator')::uuid;
    raise exception 'Elevación pública de rol permitida';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.lockbox_points set manager_id=current_setting('lockbox.qa.operator')::uuid;
    get diagnostics affected = row_count;
  exception when insufficient_privilege then affected := 0;
  end;
  if affected<>0 then raise exception 'Reasignación pública de puntos permitida'; end if;
  begin
    perform public.seller_state();
    raise exception 'Operador accedió al módulo vendedor';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub',current_setting('lockbox.qa.buyer'),true);
  begin
    perform public.collection_point_action('{"type":"state"}'::jsonb);
    raise exception 'Comprador sin asignación accedió al punto';
  exception when insufficient_privilege then null;
  end;
end $test$;
rollback;
