-- Ejecutar como postgres en pruebas. La transacción revierte TODOS los datos de prueba.
begin;
do $$
#variable_conflict use_variable
declare
  actor uuid; outsider uuid; other_manager uuid; buyer uuid; point uuid; order_id uuid := gen_random_uuid();
  qr text := 'LBX-VERIFY-' || gen_random_uuid()::text; result jsonb; history_count integer;
begin
  select lp.manager_id,lp.id into actor,point from public.lockbox_points lp join public.profiles p on p.id=lp.manager_id
    where lp.is_active and p.is_active order by lp.id limit 1;
  select id into outsider from public.profiles p where p.is_active and p.role <> 'admin'
    and not exists(select 1 from public.lockbox_points lp where lp.manager_id=p.id and lp.is_active) limit 1;
  select id into buyer from public.profiles where role='comprador' and is_active limit 1;
  select manager_id into other_manager from public.lockbox_points where is_active and manager_id<>actor limit 1;
  assert actor is not null and outsider is not null and buyer is not null, 'Faltan perfiles para verificar';
  insert into public.orders(id,buyer_id,seller_id,lockbox_id,status,subtotal,total_amount,qr_code,qr_expires_at)
    values(order_id,buyer,actor,point,'dispatched',100,100,qr,now()+interval '1 hour');
  perform set_config('request.jwt.claim.sub',actor::text,true);
  execute 'set local role authenticated';
  result := public.collection_point_action('{"type":"state"}'::jsonb);
  assert result->'points' @> jsonb_build_array(jsonb_build_object('id',point)), 'No muestra el punto asignado';
  result := public.collection_point_action(jsonb_build_object('type','scan','qrCode',qr));
  assert result->>'id'=order_id::text, 'No resolvió QR a pedido';
  begin
    perform public.collection_point_action(jsonb_build_object('type','transition','qrCode',qr,'orderId',gen_random_uuid(),'status','in_lockbox'));
    raise exception 'Permitió un ID distinto al QR';
  exception when sqlstate '22023' then null;
  end;
  if other_manager is not null then
    perform set_config('request.jwt.claim.sub',other_manager::text,true);
    begin
      perform public.collection_point_action(jsonb_build_object('type','scan','qrCode',qr));
      raise exception 'Permitió consultar el punto de otro responsable';
    exception when sqlstate 'P0002' then null;
    end;
    perform set_config('request.jwt.claim.sub',actor::text,true);
  end if;
  begin
    perform public.collection_point_action(jsonb_build_object('type','transition','qrCode',qr,'orderId',order_id,'status','delivered'));
    raise exception 'Permitió saltar estados';
  exception when sqlstate 'P0001' then
    if sqlerrm='Permitió saltar estados' then raise; end if;
  end;
  perform public.collection_point_action(jsonb_build_object('type','transition','qrCode',qr,'orderId',order_id,'status','in_lockbox'));
  perform public.collection_point_action(jsonb_build_object('type','transition','qrCode',qr,'orderId',order_id,'status','ready'));
  perform public.collection_point_action(jsonb_build_object('type','transition','qrCode',qr,'orderId',order_id,'status','delivered'));
  begin
    perform public.collection_point_action(jsonb_build_object('type','transition','qrCode',qr,'orderId',order_id,'status','delivered'));
    raise exception 'Permitió entrega duplicada';
  exception when sqlstate 'P0001' then
    if sqlerrm='Permitió entrega duplicada' then raise; end if;
  end;
  perform set_config('request.jwt.claim.sub',outsider::text,true);
  begin
    perform public.collection_point_action('{"type":"state"}'::jsonb);
    raise exception 'Permitió un perfil sin asignación';
  exception when insufficient_privilege then null;
  end;
  execute 'set local role anon';
  begin
    perform public.collection_point_action('{"type":"state"}'::jsonb);
    raise exception 'Permitió acceso anónimo';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
  select count(*) into history_count from public.order_status_history where order_status_history.order_id=order_id;
  assert history_count=3, 'El historial duplicó o perdió una transición';
  assert (select delivered_at is not null and released_at is null and status='delivered' from public.orders where id=order_id), 'Entrega o escrow incorrecto';
  assert not exists(select 1 from public.transactions where transactions.order_id=order_id), 'Cambió dinero';
  update public.orders set status='ready',qr_expires_at=now()-interval '1 minute' where id=order_id;
  perform set_config('request.jwt.claim.sub',actor::text,true);
  execute 'set local role authenticated';
  begin
    perform public.collection_point_action(jsonb_build_object('type','scan','qrCode',qr));
    raise exception 'Aceptó un QR vencido';
  exception when sqlstate '22023' then null;
  end;
  execute 'reset role';
end $$;
rollback;
