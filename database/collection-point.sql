-- API del responsable del punto. No cambia perfiles, pedidos ni permisos de escritura directa.
create or replace function private.collection_point_action(action jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare
  actor uuid := auth.uid(); actor_role public.user_role; kind text := action->>'type';
  current_order public.orders%rowtype; target public.order_status; code text := action->>'qrCode';
  result jsonb; point_ids uuid[];
begin
  select role into actor_role from public.profiles where id=actor and is_active for share;
  if actor is null or actor_role is null then
    raise exception 'Se requiere una sesión activa' using errcode='42501';
  end if;
  select array_agg(p.id) into point_ids from (
    select id from public.lockbox_points
    where is_active and (manager_id=actor or actor_role='admin') for share
  ) p;
  if point_ids is null then
    raise exception 'No tienes puntos de recojo asignados' using errcode='42501';
  end if;

  if kind='state' then
    select jsonb_build_object(
      'points',coalesce((select jsonb_agg(jsonb_build_object(
        'id',p.id,'name',p.name,'address',p.address,'capacity',p.capacity,
        'occupied',(select count(*) from public.orders o where o.lockbox_id=p.id and o.status in ('in_lockbox','ready')),
        'pending',(select count(*) from public.orders o where o.lockbox_id=p.id and o.status='ready'),
        'deliveredToday',(select count(*) from public.orders o where o.lockbox_id=p.id and o.delivered_at >= (date_trunc('day',now() at time zone 'America/La_Paz') at time zone 'America/La_Paz'))
      ) order by p.name) from public.lockbox_points p where p.id=any(point_ids)),'[]'::jsonb),
      'orders',coalesce((select jsonb_agg(x.record order by x.updated_at desc) from (
        select o.updated_at,jsonb_build_object('id',o.id,'pointId',o.lockbox_id,'status',o.status,
          'buyerLabel',o.buyer_label,'productTitle',coalesce((select string_agg(i.product_title,' + ' order by i.id) from public.order_items i where i.order_id=o.id),'Pedido'),
          'updatedAt',o.updated_at) as record
        from public.orders o where o.lockbox_id=any(point_ids) and o.status in ('dispatched','in_lockbox','ready')
        order by o.updated_at desc limit 200
      ) x),'[]'::jsonb),
      'activity',coalesce((select jsonb_agg(x.record order by x.created_at desc) from (
        select h.created_at,jsonb_build_object('id',h.id,'orderId',h.order_id,'pointId',o.lockbox_id,'status',h.status,'at',h.created_at) as record
        from public.order_status_history h join public.orders o on o.id=h.order_id
        where o.lockbox_id=any(point_ids) order by h.created_at desc limit 25
      ) x),'[]'::jsonb)
    ) into result;
    return result;
  end if;

  if kind not in ('scan','transition') or kind is null or code is null or length(code) not between 6 and 160 then
    raise exception 'Acción o código no válido' using errcode='22023';
  end if;
  -- Lock the point before the order: all operators share this lock, including
  -- assignment changes. Recheck ownership under lock instead of trusting the UI.
  perform 1 from public.lockbox_points p join public.orders o on o.lockbox_id=p.id
  where o.qr_code=code and p.is_active and (p.manager_id=actor or actor_role='admin')
  for share of p;
  select o.* into current_order from public.orders o join public.lockbox_points p on p.id=o.lockbox_id
  where o.qr_code=code and p.is_active and (p.manager_id=actor or actor_role='admin') for update of o;
  if not found then
    raise exception 'Código no encontrado en tus puntos' using errcode='P0002';
  end if;
  if current_order.qr_expires_at is null or current_order.qr_expires_at <= now() then
    raise exception 'El código QR ha vencido' using errcode='22023';
  end if;
  if current_order.status not in ('dispatched','in_lockbox','ready') then
    raise exception 'El pedido ya fue procesado o no está disponible para el punto' using errcode='P0001';
  end if;
  if kind='transition' then
    if action->>'status' not in ('in_lockbox','ready','delivered') or action->>'status' is null then
      raise exception 'Estado no permitido' using errcode='22023';
    end if;
    target := (action->>'status')::public.order_status;
    if (action->>'orderId')::uuid is distinct from current_order.id then
      raise exception 'El código no corresponde al pedido' using errcode='22023';
    end if;
    if not ((current_order.status='dispatched' and target='in_lockbox')
      or (current_order.status='in_lockbox' and target='ready')
      or (current_order.status='ready' and target='delivered')) then
      raise exception 'El estado del pedido cambió. Vuelve a consultarlo' using errcode='P0001';
    end if;
    update public.orders set status=target, updated_at=now(),
      delivered_at=case when target='delivered' then now() else delivered_at end
      where id=current_order.id;
    insert into public.order_status_history(order_id,status,changed_by,comment)
      values(current_order.id,target,actor,'Confirmado por responsable del punto');
    -- Delivery records no escrow release and no physical locker command.
    current_order.status := target;
  end if;
  return jsonb_build_object('id',current_order.id,'pointId',current_order.lockbox_id,
    'status',current_order.status,'buyerLabel',current_order.buyer_label,
    'productTitle',coalesce((select string_agg(product_title,' + ' order by id) from public.order_items where order_id=current_order.id),'Pedido'));
end $$;
revoke all on function private.collection_point_action(jsonb) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.collection_point_action(jsonb) to authenticated;

create or replace function public.collection_point_action(action jsonb) returns jsonb
language sql security invoker set search_path = '' as $$
  select private.collection_point_action(action);
$$;
revoke all on function public.collection_point_action(jsonb) from public,anon;
grant execute on function public.collection_point_action(jsonb) to authenticated;
notify pgrst, 'reload schema';
