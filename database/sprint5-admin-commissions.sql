-- Sprint 5. Additive RPCs keep the production v4 API compatible until deployment.
-- All amounts are BOB. No bank charge, escrow or transfer is performed.
alter table public.orders
  add column service_policy_version smallint,
  add column service_fee_amount numeric(12,2) not null default 0,
  add column point_commission_amount numeric(12,2) not null default 0,
  add column variable_cost_amount numeric(12,2) not null default 0,
  add column deposit_amount numeric(12,2),
  add column balance_amount numeric(12,2),
  add constraint sprint5_amounts_check check (
    service_policy_version is null or (
      service_policy_version=1 and service_fee_amount=8 and point_commission_amount=4
      and variable_cost_amount=1.50 and commission_amount=0
      and deposit_amount is not null and balance_amount is not null
      and deposit_amount=round(subtotal/2,2)+service_fee_amount
      and balance_amount=subtotal-round(subtotal/2,2)
      and total_amount=subtotal+service_fee_amount
      and deposit_amount+balance_amount=total_amount
    )
  );

create table private.service_accruals (
  order_id uuid primary key references public.orders(id),
  point_id uuid not null references public.lockbox_points(id),
  fee numeric(12,2) not null check(fee>=0),
  point_commission numeric(12,2) not null check(point_commission>=0),
  variable_cost numeric(12,2) not null check(variable_cost>=0),
  contribution numeric(12,2) generated always as (fee-point_commission-variable_cost) stored,
  is_test boolean not null,
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  check(point_commission+variable_cost<=fee)
);
create index service_accruals_point_date_idx on private.service_accruals(point_id,completed_at);
create index service_accruals_date_idx on private.service_accruals(completed_at);
alter table private.service_accruals enable row level security;
create policy service_accruals_deny_clients on private.service_accruals for all to authenticated using(false) with check(false);
revoke all on private.service_accruals from public,anon,authenticated;

create table private.admin_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  entity text not null check(entity in ('profile','point')),
  target_id uuid not null,
  active boolean not null,
  created_at timestamptz not null default now()
);
create index admin_events_actor_idx on private.admin_events(actor_id);
alter table private.admin_events enable row level security;
create policy admin_events_deny_clients on private.admin_events for all to authenticated using(false) with check(false);
revoke all on private.admin_events from public,anon,authenticated;

create function private.service_quote(p_subtotal numeric) returns jsonb
language plpgsql immutable security invoker set search_path='' as $$
begin
  if p_subtotal is null or p_subtotal<=0 or p_subtotal<>round(p_subtotal,2) then
    raise exception 'Subtotal no válido' using errcode='22023';
  end if;
  return jsonb_build_object('fee',8,'pointCommission',4,'variableCost',1.50,
    'deposit',round(p_subtotal/2,2)+8,'balance',p_subtotal-round(p_subtotal/2,2),
    'total',p_subtotal+8,'contribution',2.50);
end $$;
revoke all on function private.service_quote(numeric) from public,anon,authenticated;

create function private.accrue_completed_service() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.service_policy_version=1 and new.status in ('delivered','released')
      and new.delivered_at is not null and new.balance_paid_at is not null then
    insert into private.service_accruals(order_id,point_id,fee,point_commission,variable_cost,is_test,completed_at)
    values(new.id,new.lockbox_id,new.service_fee_amount,new.point_commission_amount,new.variable_cost_amount,new.is_test,new.delivered_at)
    on conflict(order_id) do nothing;
  end if;
  return new;
end $$;
revoke all on function private.accrue_completed_service() from public,anon,authenticated;
create trigger accrue_service_after_delivery after insert or update of status on public.orders
for each row execute function private.accrue_completed_service();

create function private.buyer_action_v5(action jsonb,request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; previous private.buyer_action_receipts%rowtype; item record; quote jsonb;
begin
  -- Original RPC authorizes, locks the buyer/cart/products, validates stock and saves an idempotency receipt.
  if action->>'type'='checkout' then
    perform 1 from public.profiles where id=auth.uid() and role='comprador' and is_active for update;
    if not found then raise exception 'Se requiere un comprador activo' using errcode='42501'; end if;
    select * into previous from private.buyer_action_receipts r where r.buyer_id=auth.uid() and r.request_id=buyer_action_v5.request_id;
    if found and exists(select 1 from public.orders o where o.id in (select value::uuid from jsonb_array_elements_text(previous.result->'orderIds')) and o.service_policy_version is null) then
      raise exception 'La solicitud pertenece a la política anterior; usa otra solicitud' using errcode='22023';
    end if;
  end if;
  result:=private.buyer_action(action,request_id);
  if action->>'type'='checkout' then
    for item in select o.* from public.orders o where o.buyer_id=auth.uid()
      and o.id in (select value::uuid from jsonb_array_elements_text(result->'orderIds'))
      and o.service_policy_version is null for update loop
      quote:=private.service_quote(item.subtotal);
      update public.orders set service_policy_version=1,service_fee_amount=8,point_commission_amount=4,
        variable_cost_amount=1.50,commission_amount=0,total_amount=(quote->>'total')::numeric,
        deposit_amount=(quote->>'deposit')::numeric,balance_amount=(quote->>'balance')::numeric
      where id=item.id;
    end loop;
  end if;
  return result;
end $$;
revoke all on function private.buyer_action_v5(jsonb,uuid) from public,anon;
grant execute on function private.buyer_action_v5(jsonb,uuid) to authenticated;
create function public.buyer_action_v5(action jsonb,request_id uuid) returns jsonb
language sql security invoker set search_path='' as $$ select private.buyer_action_v5(action,request_id); $$;
revoke all on function public.buyer_action_v5(jsonb,uuid) from public,anon;
grant execute on function public.buyer_action_v5(jsonb,uuid) to authenticated;

create function private.buyer_state_v5() returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  result:=private.buyer_state();
  return result || jsonb_build_object('serviceFeeCentsPerOrder',800,'orders',coalesce((
    select jsonb_agg(e.value || jsonb_build_object(
      'serviceFeeCents',round(o.service_fee_amount*100)::bigint,
      'depositCents',round(coalesce(o.deposit_amount,round(o.total_amount/2,2))*100)::bigint,
      'balanceCents',round(coalesce(o.balance_amount,o.total_amount-round(o.total_amount/2,2))*100)::bigint)
      order by o.created_at desc)
    from jsonb_array_elements(result->'orders') e join public.orders o on o.id=(e.value->>'id')::uuid
    where o.buyer_id=auth.uid()),'[]'::jsonb));
end $$;
revoke all on function private.buyer_state_v5() from public,anon;
grant execute on function private.buyer_state_v5() to authenticated;
create function public.buyer_state_v5() returns jsonb language sql security invoker set search_path='' as $$ select private.buyer_state_v5(); $$;
revoke all on function public.buyer_state_v5() from public,anon;
grant execute on function public.buyer_state_v5() to authenticated;

create function private.point_action_v5(action jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; ord public.orders%rowtype;
begin
  -- New API requires an explicit manual balance declaration; it still does not verify a bank payment.
  if action->>'type'='transition' and action->>'status'='delivered'
      and action->'balanceConfirmed' is distinct from 'true'::jsonb then
    raise exception 'Confirma la verificación manual del saldo antes de entregar' using errcode='22023';
  end if;
  result:=private.collection_point_action(action-'balanceConfirmed');
  if action->>'type'='state' then
    result:=result || jsonb_build_object('orders',coalesce((
      select jsonb_agg(e.value || jsonb_build_object('serviceFeeAmount',o.service_fee_amount,
        'depositAmount',coalesce(o.deposit_amount,round(o.total_amount/2,2)),
        'balanceAmount',coalesce(o.balance_amount,o.total_amount-round(o.total_amount/2,2))) order by o.updated_at desc)
      from jsonb_array_elements(result->'orders') e join public.orders o on o.id=(e.value->>'id')::uuid),'[]'::jsonb));
    return result;
  end if;
  select * into ord from public.orders where id=(result->>'id')::uuid;
  if action->>'type'='transition' and action->>'status'='delivered' and ord.service_policy_version=1 then
    update public.order_status_history set comment='Entrega y saldo de mercadería (Bs '||to_char(ord.balance_amount,'FM999999990.00')||') confirmados manualmente por el punto. Sin validación bancaria.'
    where order_id=ord.id and status='delivered' and changed_by=auth.uid() and created_at=now();
  end if;
  return result || jsonb_build_object('serviceFeeAmount',ord.service_fee_amount,
    'depositAmount',coalesce(ord.deposit_amount,round(ord.total_amount/2,2)),
    'balanceAmount',coalesce(ord.balance_amount,ord.total_amount-round(ord.total_amount/2,2)));
end $$;
revoke all on function private.point_action_v5(jsonb) from public,anon;
grant execute on function private.point_action_v5(jsonb) to authenticated;
create function public.point_action_v5(action jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.point_action_v5(action); $$;
revoke all on function public.point_action_v5(jsonb) from public,anon;
grant execute on function public.point_action_v5(jsonb) to authenticated;

create function private.require_admin() returns uuid
language plpgsql stable security definer set search_path='' as $$
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='admin' and is_active) then
    raise exception 'Se requiere un administrador activo' using errcode='42501';
  end if;
  return auth.uid();
end $$;
revoke all on function private.require_admin() from public,anon,authenticated;

create function private.admin_state(p_start date,p_end date,p_include_tests boolean) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb; since timestamptz; until_at timestamptz;
begin
  perform private.require_admin();
  if p_start is null or p_end is null or p_include_tests is null or p_end<p_start or p_end-p_start>365 then
    raise exception 'Selecciona un periodo de hasta 366 días' using errcode='22023';
  end if;
  since:=p_start::timestamp at time zone 'America/La_Paz';
  until_at:=(p_end+1)::timestamp at time zone 'America/La_Paz';
  with earned as (
    select a.* from private.service_accruals a join public.orders o on o.id=a.order_id
    where a.completed_at>=since and a.completed_at<until_at and (p_include_tests or not a.is_test)
      and o.status<>'refunded'
  )
  select jsonb_build_object(
    'policy',jsonb_build_object('version',1,'feeCents',800,'pointCommissionCents',400,'variableCostCents',150,'payer','comprador'),
    'summary',(select jsonb_build_object('completedOrders',count(*),'serviceRevenueCents',coalesce(sum(fee)*100,0),
      'pointCommissionCents',coalesce(sum(point_commission)*100,0),'variableCostCents',coalesce(sum(variable_cost)*100,0),
      'contributionCents',coalesce(sum(contribution)*100,0),'testOrders',count(*) filter(where is_test)) from earned),
    'pointReport',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'active',p.is_active,
      'completedOrders',(select count(*) from earned a where a.point_id=p.id),
      'commissionCents',(select coalesce(sum(point_commission)*100,0) from earned a where a.point_id=p.id)) order by p.name) from public.lockbox_points p),'[]'::jsonb),
    'monthlyReport',coalesce((select jsonb_agg(r.data order by r.month) from (
      select to_char(completed_at at time zone 'America/La_Paz','YYYY-MM') as month,
      jsonb_build_object('month',to_char(completed_at at time zone 'America/La_Paz','YYYY-MM'),'completedOrders',count(*),
      'serviceRevenueCents',sum(fee)*100,'pointCommissionCents',sum(point_commission)*100,'variableCostCents',sum(variable_cost)*100,'contributionCents',sum(contribution)*100) data
      from earned group by 1) r),'[]'::jsonb),
    'orders',coalesce((select jsonb_agg(r.data order by r.created_at desc) from (
      select o.created_at,jsonb_build_object('id',o.id,'status',o.status,'isTest',o.is_test,
        'buyer',coalesce(b.full_name,b.username),'seller',coalesce(s.store_name,s.username),'point',p.name,
        'merchandiseCents',o.subtotal*100,'totalCents',o.total_amount*100,'serviceFeeCents',o.service_fee_amount*100,
        'policyVersion',o.service_policy_version,'createdAt',o.created_at) data
      from public.orders o join public.profiles b on b.id=o.buyer_id join public.profiles s on s.id=o.seller_id join public.lockbox_points p on p.id=o.lockbox_id
      where o.created_at>=since and o.created_at<until_at and (p_include_tests or not o.is_test)
      order by o.created_at desc limit 200) r),'[]'::jsonb),
    'profiles',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',coalesce(full_name,username),'username',username,'role',role,'active',is_active) order by created_at desc) from public.profiles),'[]'::jsonb),
    'audit',coalesce((select jsonb_agg(r.data order by r.created_at desc) from (
      select created_at,jsonb_build_object('id',id,'actorId',actor_id,'entity',entity,'targetId',target_id,'active',active,'at',created_at) data
      from private.admin_events order by created_at desc limit 50) r),'[]'::jsonb)
  ) into result;
  return result;
end $$;
revoke all on function private.admin_state(date,date,boolean) from public,anon;
grant execute on function private.admin_state(date,date,boolean) to authenticated;
create function public.admin_state(p_start date,p_end date,p_include_tests boolean default false) returns jsonb
language sql security invoker set search_path='' as $$ select private.admin_state(p_start,p_end,p_include_tests); $$;
revoke all on function public.admin_state(date,date,boolean) from public,anon;
grant execute on function public.admin_state(date,date,boolean) to authenticated;

create function private.admin_set_active(p_entity text,p_id uuid,p_active boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_admin(); target public.profiles%rowtype;
begin
  if p_active is null or p_id is null then raise exception 'Datos no válidos' using errcode='22023'; end if;
  if p_entity='profile' then
    select * into target from public.profiles where id=p_id for update;
    if not found then raise exception 'Perfil no encontrado' using errcode='P0002'; end if;
    if target.role='admin' or p_id=actor then raise exception 'No se puede modificar un administrador desde este módulo' using errcode='42501'; end if;
    if not p_active and exists(select 1 from public.orders o where
      (o.buyer_id=p_id or o.seller_id=p_id or o.lockbox_id in (select id from public.lockbox_points where manager_id=p_id))
      and (o.status in ('paid','dispatched','in_lockbox','ready') or (o.status='disputed' and o.delivered_at is null))) then
      raise exception 'El perfil tiene pedidos pendientes; completa su atención antes de desactivarlo' using errcode='P0001';
    end if;
    update public.profiles set is_active=p_active where id=p_id and is_active is distinct from p_active;
  elsif p_entity='point' then
    perform 1 from public.lockbox_points where id=p_id for update;
    if not found then raise exception 'Punto no encontrado' using errcode='P0002'; end if;
    if not p_active and exists(select 1 from public.orders where lockbox_id=p_id and (status in ('paid','dispatched','in_lockbox','ready') or (status='disputed' and delivered_at is null))) then
      raise exception 'El punto tiene pedidos pendientes; completa su atención antes de desactivarlo' using errcode='P0001';
    end if;
    update public.lockbox_points set is_active=p_active where id=p_id and is_active is distinct from p_active;
  else raise exception 'Entidad no válida' using errcode='22023';
  end if;
  if found then insert into private.admin_events(actor_id,entity,target_id,active) values(actor,p_entity,p_id,p_active); end if;
  return jsonb_build_object('success',true);
end $$;
revoke all on function private.admin_set_active(text,uuid,boolean) from public,anon;
grant execute on function private.admin_set_active(text,uuid,boolean) to authenticated;
create function public.admin_set_active(p_entity text,p_id uuid,p_active boolean) returns jsonb
language sql security invoker set search_path='' as $$ select private.admin_set_active(p_entity,p_id,p_active); $$;
revoke all on function public.admin_set_active(text,uuid,boolean) from public,anon;
grant execute on function public.admin_set_active(text,uuid,boolean) to authenticated;
