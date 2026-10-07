-- Idempotent academic fixtures. Natural keys resolve every generated UUID.
-- Existing product prices, stocks, images and the seller identity are preserved.
begin;
do $$
declare seller uuid; buyer uuid; point uuid; product uuid; plan uuid; order_id uuid;
  entry record; current_status public.order_status; chain public.order_status[];
  released timestamptz; created timestamptz; commission numeric;
begin
  select id into seller from public.profiles where username='lockbox_store' and role='vendedor' and is_active;
  if seller is null then raise exception 'Vendedor lockbox_store no encontrado'; end if;
  select id into buyer from auth.users where email='buyer.seller-tests@example.invalid' and raw_app_meta_data->>'test_fixture'='seller-module-v1';
  if buyer is null then
    insert into auth.users(id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
    values(gen_random_uuid(),'00000000-0000-0000-0000-000000000000','authenticated','authenticated','buyer.seller-tests@example.invalid','',
      '{"test_fixture":"seller-module-v1"}','{}',now(),now()) returning id into buyer;
    insert into public.profiles(id,username,role,full_name,is_active,bio)
    values(buyer,'seller_test_buyer','comprador','Comprador de prueba',false,'TEST:seller-module-v1; referencia de pedidos, sin acceso de login');
  end if;
  -- Complete existing catalog relationships only when they are missing.
  update public.products p set category_id=c.id from public.categories c
  where p.seller_id=seller and p.category_id is null and c.seller_label = case
    when p.sku like 'TECH-%' then 'Tecnología' when p.sku like 'MODA-%' then 'Moda'
    when p.sku like 'BEL-%' then 'Belleza' when p.sku like 'HOG-%' then 'Hogar' else 'Otros' end;
  insert into public.categories(name,slug,description,seller_label)
  select 'Otros','otros','Productos de otras categorías','Otros'
  where not exists (select 1 from public.categories where seller_label='Otros' and is_active);
  insert into public.plans(code,name,description,monthly_price,commission_rate,features,settlement_delay_hours,is_test_plan)
  values ('emprende','Emprende','Plan académico de prueba; comisión demo',0,0.06,'["Catálogo","Lives simulados","Liquidación a 48 horas"]',48,true),
         ('pro','Pro','Plan académico de prueba; precio mensual real pendiente',0,0.02,'["Comisión reducida","Liquidación inmediata","Sin cobro real en pruebas"]',0,true)
  on conflict(code) do nothing;
  select id into plan from public.plans where code='emprende';
  insert into public.subscriptions(seller_id,plan_id)
  select seller,plan where not exists (select 1 from public.subscriptions where seller_id=seller and status='active');
  insert into public.tags(name,slug) values ('Prueba vendedor','prueba-vendedor'),('Streaming','streaming'),('Urbano','urbano') on conflict(name) do nothing;
  insert into public.products(seller_id,category_id,title,description,price,stock,sku,seller_status,is_active)
  select seller,c.id,v.title,'TEST:seller-module-v1; producto de prueba',v.price,v.stock,v.sku,v.status,false
  from (values ('LB-TEST-DRAFT','Borrador de prueba sin stock',40.00,0,'draft'),
               ('LB-TEST-PAUSED','Producto de prueba pausado',55.00,4,'paused'),
               ('LB-TEST-ARCHIVED','Producto de prueba archivado',75.00,2,'archived')) as v(sku,title,price,stock,status)
  join public.categories c on c.seller_label='Otros' where not exists (select 1 from public.products p where p.sku=v.sku);
  insert into public.product_tags(product_id,tag_id,source)
  select p.id,t.id,'manual' from public.products p join public.tags t on
    t.name=case when p.sku like 'TECH-%' then 'Streaming' when p.sku like 'MODA-%' then 'Urbano' else 'Prueba vendedor' end
  where p.seller_id=seller on conflict do nothing;
  select id into product from public.products where sku='TECH-ARO-01' and seller_id=seller;
  select id into point from public.lockbox_points where name='Almacén Central Pura Pura' and is_active;
  if product is null or point is null then raise exception 'Falta producto/punto para las pruebas'; end if;
  insert into public.live_sessions(seller_id,title,description,status,started_at,ended_at)
  select seller,'TEST:seller-module-v1:live-finalizado','Transmisión simulada de prueba','ended',now()-interval '3 days',now()-interval '3 days'+interval '1 hour'
  where not exists (select 1 from public.live_sessions where seller_id=seller and title='TEST:seller-module-v1:live-finalizado');
  insert into public.live_session_products(session_id,product_id)
  select s.id,product from public.live_sessions s where s.seller_id=seller and s.title='TEST:seller-module-v1:live-finalizado' on conflict do nothing;
  for entry in select * from (values
    ('pending','pending',null::integer,48,0.06::numeric),('paid','paid',null,48,0.06),
    ('dispatched','dispatched',null,48,0.06),('in-lockbox','in_lockbox',null,48,0.06),
    ('ready','ready',null,48,0.06),('delivered','delivered',null,48,0.06),
    ('released-available','released',72,48,0.06),('released-settling','released',2,48,0.06),
    ('released-pro','released',1,0,0.02),('cancelled','cancelled',null,48,0.06),
    ('refunded','refunded',null,48,0.06),('disputed','disputed',null,48,0.06)
  ) as fixtures(code,status,release_hours,delay_hours,rate) loop
    if exists (select 1 from public.orders where test_reference='seller-module-v1:'||entry.code) then continue; end if;
    created := now()-interval '6 days';
    released := case when entry.release_hours is not null then now()-entry.release_hours*interval '1 hour' else null end;
    commission := round(130*entry.rate,2);
    insert into public.orders(buyer_id,seller_id,lockbox_id,status,subtotal,commission_amount,total_amount,created_at,paid_at,dispatched_at,delivered_at,released_at,cancelled_at,notes,settlement_delay_hours,buyer_label,test_reference)
    values(buyer,seller,point,entry.status::public.order_status,130,commission,130,created,
      case when entry.status not in ('pending','cancelled') then created+interval '1 hour' end,
      case when entry.status not in ('pending','paid','cancelled','refunded') then created+interval '2 hours' end,
      case when entry.status in ('delivered','released') then created+interval '5 hours' end,
      released,case when entry.status='cancelled' then created+interval '1 hour' end,
      'TEST:seller-module-v1; sin pago real',entry.delay_hours,'Comprador de prueba','seller-module-v1:'||entry.code) returning id into order_id;
    insert into public.order_items(order_id,product_id,quantity,unit_price,subtotal,product_title)
    select order_id,product,1,130,130,title from public.products where id=product;
    chain := case entry.status
      when 'pending' then array['pending']::public.order_status[]
      when 'cancelled' then array['pending','cancelled']::public.order_status[]
      when 'paid' then array['pending','paid']::public.order_status[]
      when 'dispatched' then array['pending','paid','dispatched']::public.order_status[]
      when 'in_lockbox' then array['pending','paid','dispatched','in_lockbox']::public.order_status[]
      when 'ready' then array['pending','paid','dispatched','in_lockbox','ready']::public.order_status[]
      when 'delivered' then array['pending','paid','dispatched','in_lockbox','ready','delivered']::public.order_status[]
      when 'released' then array['pending','paid','dispatched','in_lockbox','ready','delivered','released']::public.order_status[]
      when 'refunded' then array['pending','paid','refunded']::public.order_status[]
      else array['pending','paid','dispatched','disputed']::public.order_status[] end;
    foreach current_status in array chain loop
      insert into public.order_status_history(order_id,status,changed_by,comment,created_at)
      values(order_id,current_status,case when current_status='pending' then buyer else seller end,'TEST:seller-module-v1',
        case current_status when 'pending' then created when 'paid' then created+interval '1 hour'
          when 'dispatched' then created+interval '2 hours' when 'in_lockbox' then created+interval '3 hours'
          when 'ready' then created+interval '4 hours' when 'delivered' then created+interval '5 hours'
          when 'released' then released when 'refunded' then created+interval '2 hours'
          when 'cancelled' then created+interval '1 hour' else created+interval '3 hours' end);
    end loop;
    if entry.status not in ('pending','cancelled') then
      insert into public.transactions(order_id,user_id,type,status,amount,payment_method,external_id,metadata,completed_at)
      values(order_id,buyer,'escrow_retain','completed',130,'test','seller-module-v1:retain:'||entry.code,'{"test_fixture":"seller-module-v1","real_payment":false}',created+interval '1 hour');
    end if;
    if entry.status='released' then
      insert into public.transactions(order_id,user_id,type,status,amount,payment_method,external_id,metadata,completed_at)
      values(order_id,seller,'escrow_release','completed',130-commission,'test','seller-module-v1:release:'||entry.code,'{"test_fixture":"seller-module-v1","real_payment":false}',released),
            (order_id,seller,'commission','completed',commission,'test','seller-module-v1:commission:'||entry.code,'{"test_fixture":"seller-module-v1","real_payment":false}',released);
    elsif entry.status='refunded' then
      insert into public.transactions(order_id,user_id,type,status,amount,payment_method,external_id,metadata,completed_at)
      values(order_id,buyer,'refund','completed',130,'test','seller-module-v1:refund:'||entry.code,'{"test_fixture":"seller-module-v1","real_payment":false}',created+interval '2 hours');
    elsif entry.status='disputed' then
      insert into public.disputes(order_id,opened_by,reason,description)
      values(order_id,buyer,'Prueba de disputa','TEST:seller-module-v1; el vendedor no libera este saldo');
    end if;
  end loop;
end $$;
commit;
select jsonb_build_object('products',(select count(*) from public.products),'orders',(select count(*) from public.orders where test_reference like 'seller-module-v1:%'),'histories',(select count(*) from public.order_status_history where comment='TEST:seller-module-v1'),'transactions',(select count(*) from public.transactions where metadata->>'test_fixture'='seller-module-v1'),'plans',(select count(*) from public.plans),'subscriptions',(select count(*) from public.subscriptions),'lives',(select count(*) from public.live_sessions),'disputes',(select count(*) from public.disputes)) as inserted_state;
