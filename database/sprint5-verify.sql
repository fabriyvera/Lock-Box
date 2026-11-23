-- Run after sprint5-admin-commissions.sql inside BEGIN ... ROLLBACK.
-- Uses only the clearly identified demo actors; all test mutations are rolled back.
do $$
declare buyer uuid:='59b8dcc0-008e-40c3-ac24-a14913243d4d';
  seller uuid:='cd730c24-d593-417b-bc6e-9a7f932a2c93';
  operator_id uuid:='dfcccd4c-57a4-4468-a5e3-34c38f281f13';
  point uuid:='c5c04b69-edee-4786-a005-26bc58510c99';
  product_id uuid; result jsonb; repeated jsonb; request_id uuid:=gen_random_uuid();
  v_order_id uuid; qr text; original_orders integer; quote jsonb;
  baseline_revenue numeric; baseline_real integer;
  temporary_point uuid:=gen_random_uuid();
begin
  quote:=private.service_quote(200);
  if quote->>'deposit'<>'108.00' or (quote->>'balance')::numeric<>100 or (quote->>'total')::numeric<>208 then
    raise exception 'Incorrect quote: %',quote;
  end if;
  quote:=private.service_quote(0.01);
  if (quote->>'deposit')::numeric<>8.01 or (quote->>'balance')::numeric<>0 then raise exception 'Odd-cent rounding failed'; end if;
  if has_function_privilege('anon','public.admin_state(date,date,boolean)','execute') then raise exception 'Anonymous admin RPC access'; end if;
  if has_table_privilege('authenticated','private.service_accruals','insert') then raise exception 'Client ledger write access'; end if;
  select coalesce(sum(a.fee)*100,0),count(*) filter(where not a.is_test) into baseline_revenue,baseline_real
    from private.service_accruals a join public.orders o on o.id=a.order_id where o.status<>'refunded'
      and (a.completed_at at time zone 'America/La_Paz')::date=(now() at time zone 'America/La_Paz')::date;
  select count(*) into original_orders from public.orders where buyer_id=buyer and service_policy_version is null;
  select id into strict product_id from public.products where seller_id=seller and sku='DEMO50-LAMPARA';
  perform set_config('request.jwt.claim.sub',buyer::text,true);
  begin perform public.admin_state(current_date,current_date,true); raise exception 'Buyer accessed admin';
  exception when insufficient_privilege then null; end;
  perform public.buyer_action_v5('{"type":"clearCart"}',gen_random_uuid());
  perform public.buyer_action_v5(jsonb_build_object('type','addToCart','productId',product_id,'quantity',1),gen_random_uuid());
  result:=public.buyer_action_v5(jsonb_build_object('type','checkout','pointId',point,'paymentMethod','bcp'),request_id);
  repeated:=public.buyer_action_v5(jsonb_build_object('type','checkout','pointId',point,'paymentMethod','bcp'),request_id);
  if result is distinct from repeated then raise exception 'Checkout idempotency failed'; end if;
  v_order_id:=(result->'orderIds'->>0)::uuid;
  if not exists(select 1 from public.orders o where o.id=v_order_id and subtotal=60 and total_amount=68 and deposit_amount=38 and balance_amount=30 and commission_amount=0 and service_policy_version=1) then raise exception 'Checkout amounts failed'; end if;
  if exists(select 1 from private.service_accruals a where a.order_id=v_order_id) then raise exception 'Commission accrued too early'; end if;
  if (select count(*) from public.orders where buyer_id=buyer and service_policy_version is null)<>original_orders then raise exception 'Historical orders changed'; end if;
  select qr_code into qr from public.orders where id=v_order_id;
  perform set_config('request.jwt.claim.sub',seller::text,true);
  perform public.seller_action(jsonb_build_object('type','dispatchOrder','id',v_order_id,'at',now()),gen_random_uuid());
  perform set_config('request.jwt.claim.sub',operator_id::text,true);
  perform public.point_action_v5(jsonb_build_object('type','transition','orderId',v_order_id,'status','in_lockbox'));
  perform public.point_action_v5(jsonb_build_object('type','transition','orderId',v_order_id,'status','ready'));
  result:=public.point_action_v5(jsonb_build_object('type','scan','qrCode',qr));
  if (result->>'depositAmount')::numeric<>38 or (result->>'balanceAmount')::numeric<>30 then raise exception 'Point split failed'; end if;
  begin perform public.point_action_v5(jsonb_build_object('type','transition','orderId',v_order_id,'qrCode',qr,'status','delivered')); raise exception 'Missing balance declaration accepted';
  exception when invalid_parameter_value then null; end;
  perform public.point_action_v5(jsonb_build_object('type','transition','orderId',v_order_id,'qrCode',qr,'status','delivered','balanceConfirmed',true));
  begin perform public.point_action_v5(jsonb_build_object('type','transition','orderId',v_order_id,'qrCode',qr,'status','delivered','balanceConfirmed',true)); raise exception 'Duplicate delivery accepted';
  exception when raise_exception then
    if sqlerrm='Duplicate delivery accepted' then raise; end if;
  end;
  if (select count(*) from private.service_accruals a where a.order_id=v_order_id)<>1 then raise exception 'Ledger duplication'; end if;
  if not exists(select 1 from private.service_accruals a where a.order_id=v_order_id and fee=8 and point_commission=4 and variable_cost=1.50 and contribution=2.50 and is_test) then raise exception 'Accrual amounts failed'; end if;
  perform set_config('request.jwt.claim.sub',buyer::text,true);
  perform public.buyer_release_payment(v_order_id);
  if (select count(*) from private.service_accruals a where a.order_id=v_order_id)<>1 then raise exception 'Release duplicated ledger'; end if;
  -- Temporary admin role exists only inside this rolled-back transaction.
  update public.profiles set role='admin' where id=buyer;
  result:=public.admin_state((now() at time zone 'America/La_Paz')::date,(now() at time zone 'America/La_Paz')::date,true);
  if (result->'summary'->>'serviceRevenueCents')::numeric<>baseline_revenue+800 then raise exception 'Admin revenue report failed'; end if;
  result:=public.admin_state((now() at time zone 'America/La_Paz')::date,(now() at time zone 'America/La_Paz')::date,false);
  if (result->'summary'->>'completedOrders')::int<>baseline_real then raise exception 'Demo data leaked into real report'; end if;
  begin perform public.admin_set_active('point',point,false); raise exception 'Point with pending orders disabled';
  exception when raise_exception then
    if sqlerrm='Point with pending orders disabled' then raise; end if;
  end;
  begin perform public.admin_set_active('profile',buyer,false); raise exception 'Admin disabled itself';
  exception when insufficient_privilege then null; end;
  insert into public.lockbox_points(id,manager_id,name,address,capacity,is_active)
    values(temporary_point,operator_id,'Punto temporal QA sprint 5','Direccion ficticia, solo transaccion de prueba',10,true);
  perform public.admin_set_active('point',temporary_point,false);
  perform public.admin_set_active('point',temporary_point,false);
  perform public.admin_set_active('point',temporary_point,true);
  if (select count(*) from private.admin_events where target_id=temporary_point)<>2 then raise exception 'Admin audit idempotency failed'; end if;
end $$;
select 'Sprint 5: quotes, checkout idempotency, historical preservation, access controls, QR split, manual declaration, delivery accrual, duplicate prevention and reports passed' as verification;

