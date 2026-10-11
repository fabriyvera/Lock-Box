-- Ejecutar con un usuario administrativo de SQL. Todo se revierte al finalizar.
begin;
do $check$
declare buyer uuid:=gen_random_uuid(); seller uuid:=gen_random_uuid();
begin
  insert into auth.users(id,raw_user_meta_data) values(buyer,jsonb_build_object('role','comprador','username','qa_'||left(replace(buyer::text,'-',''),18),'full_name','Comprador QA'));
  insert into auth.users(id,raw_user_meta_data) values(seller,jsonb_build_object('role','vendedor','username','qa_'||left(replace(seller::text,'-',''),18),'full_name','Vendedor QA','store_name','Tienda QA'));
  if not exists(select from public.carts where user_id=buyer) then raise exception 'Carrito faltante'; end if;
  if not exists(select from public.subscriptions s join public.plans p on p.id=s.plan_id where seller_id=seller and p.code='emprende') then raise exception 'Plan faltante'; end if;
  update auth.users set raw_user_meta_data=raw_user_meta_data||'{"role":"admin","is_verified":true}'::jsonb where id=buyer;
  if not exists(select from public.profiles where id=buyer and role='comprador' and not is_verified) then raise exception 'Elevación de permisos'; end if;
  begin
    insert into auth.users(id,raw_user_meta_data) values(gen_random_uuid(),'{"role":"admin","username":"qa_admin","full_name":"Admin QA"}'::jsonb);
    raise exception 'Admin aceptado';
  exception when invalid_parameter_value then null;
  end;
  begin
    insert into auth.users(id,raw_user_meta_data) select gen_random_uuid(),jsonb_build_object('role','comprador','username',username,'full_name','Duplicado QA') from public.profiles where id=buyer;
    raise exception 'Duplicado aceptado';
  exception when unique_violation then null;
  end;
  perform set_config('lockbox.qa.buyer',buyer::text,true);
  perform set_config('lockbox.qa.seller',seller::text,true);
  perform set_config('request.jwt.claim.sub',buyer::text,true);
end $check$;
set local role authenticated;
do $check$
begin
  if (select count(*) from public.profiles)<>1 or (select count(*) from public.carts)<>1 then raise exception 'RLS de comprador incorrecto'; end if;
  if exists(select from public.orders) then raise exception 'Comprador leyó pedidos ajenos'; end if;
  begin
    update public.profiles set role='admin';
    raise exception 'Escritura pública de perfiles permitida';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.seller_state();
    raise exception 'Comprador accedió al vendedor';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub',current_setting('lockbox.qa.seller'),true);
  if (select count(*) from public.profiles)<>1 or exists(select from public.carts) then raise exception 'RLS de vendedor incorrecto'; end if;
  if public.seller_state()->'profile'->>'storeName' is distinct from 'Tienda QA' then raise exception 'Estado incorrecto'; end if;
  perform public.seller_action(jsonb_build_object('type','saveProfile','profile',jsonb_build_object('storeName','Tienda actualizada','handle','qa_'||left(replace(current_setting('lockbox.qa.seller'),'-',''),18),'bio','')),gen_random_uuid());
  if not exists(select from public.profiles where full_name='Vendedor QA' and store_name='Tienda actualizada') then raise exception 'Nombre personal sobrescrito'; end if;
end $check$;
select 'PASS: alta, carrito, plan, duplicados, roles, RLS y edición de tienda' as result;
rollback;
