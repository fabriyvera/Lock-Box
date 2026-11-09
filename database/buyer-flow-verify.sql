-- Integration assertions using existing QA profiles; all changes are rolled back.
begin;
do $$
declare buyer uuid; seller uuid; operator uuid; point uuid; product uuid:=gen_random_uuid();
begin
  select id into strict buyer from public.profiles where username='revision_comprador_0811';
  select id into strict seller from public.profiles where username='revision_vendedor_0811';
  select id into strict operator from public.profiles where username='revision_punto_0811';
  select id into strict point from public.lockbox_points where manager_id=operator and name='Punto Demo Revisión';
  insert into public.products(id,seller_id,category_id,title,price,stock,is_active,seller_status)
    values(product,seller,(select id from public.categories where is_active order by id limit 1),'QA SQL rollback checkout',25.50,10,true,'published');
  perform set_config('request.jwt.claim.sub',buyer::text,true);
  perform set_config('qa.buyer',buyer::text,true);
  perform set_config('qa.seller',seller::text,true);
  perform set_config('qa.operator',operator::text,true);
  perform set_config('qa.point',point::text,true);
  perform set_config('qa.product',product::text,true);
end $$;
set local role authenticated;
do $$
declare product uuid:=current_setting('qa.product')::uuid; point uuid:=current_setting('qa.point')::uuid;
  request uuid:=gen_random_uuid(); checkout_id uuid:=gen_random_uuid(); result jsonb; state jsonb; ord uuid; code text;
begin
  perform public.buyer_action(jsonb_build_object('type','clearCart'),gen_random_uuid());
  result:=public.buyer_action(jsonb_build_object('type','addToCart','productId',product,'quantity',1),request);
  perform public.buyer_action(jsonb_build_object('type','addToCart','productId',product,'quantity',1),request);
  state:=public.buyer_state();
  if (state->'cart'->0->>'quantity')::int<>1 then raise exception 'Idempotencia del carrito falló'; end if;
  perform public.buyer_action(jsonb_build_object('type','setCartQuantity','productId',product,'quantity',2),gen_random_uuid());
  result:=public.buyer_action(jsonb_build_object('type','checkout','pointId',point,'paymentMethod','bcp'),checkout_id);
  if result is distinct from public.buyer_action(jsonb_build_object('type','checkout','pointId',point,'paymentMethod','bcp'),checkout_id) then raise exception 'Checkout duplicado'; end if;
  ord:=(result->'orderIds'->>0)::uuid;
  state:=public.buyer_state();
  select value->>'qrCode' into code from jsonb_array_elements(state->'orders') where value->>'id'=ord::text;
  if not exists(select 1 from jsonb_array_elements(state->'orders') where value->>'id'=ord::text and value->>'status'='paid' and (value->>'subtotalCents')::int=5100 and (value->>'isTest')::boolean) then raise exception 'Compra no persistida con precio del servidor'; end if;
  if jsonb_array_length(state->'cart')<>0 then raise exception 'El carrito no quedó vacío'; end if;
  perform set_config('qa.order',ord::text,true);
  perform set_config('qa.code',code,true);
  perform set_config('request.jwt.claim.sub',current_setting('qa.seller'),true);
  state:=public.seller_state();
  if not exists(select 1 from jsonb_array_elements(state->'orders') where value->>'id'=ord::text and value->>'status'='paid') then raise exception 'Vendedor no recibió el pedido'; end if;
  if not exists(select 1 from jsonb_array_elements(state->'products') where value->>'id'=product::text and (value->>'stock')::int=8) then raise exception 'Stock descontado incorrecto'; end if;
  perform public.seller_action(jsonb_build_object('type','dispatchOrder','id',ord,'at',now()),gen_random_uuid());
  perform set_config('request.jwt.claim.sub',current_setting('qa.operator'),true);
  state:=public.collection_point_action('{"type":"state"}'::jsonb);
  if not exists(select 1 from jsonb_array_elements(state->'orders') where value->>'id'=ord::text and value->>'status'='dispatched') then raise exception 'Punto no recibió el despacho'; end if;
  perform public.collection_point_action(jsonb_build_object('type','scan','qrCode',code));
  perform public.collection_point_action(jsonb_build_object('type','transition','qrCode',code,'orderId',ord,'status','in_lockbox'));
  perform public.collection_point_action(jsonb_build_object('type','transition','qrCode',code,'orderId',ord,'status','ready'));
  perform set_config('request.jwt.claim.sub',current_setting('qa.buyer'),true);
  state:=public.buyer_state();
  if not exists(select 1 from jsonb_array_elements(state->'orders') where value->>'id'=ord::text and value->>'status'='ready') then raise exception 'Comprador no ve listo para retiro'; end if;
  perform set_config('request.jwt.claim.sub',current_setting('qa.operator'),true);
  perform public.collection_point_action(jsonb_build_object('type','transition','qrCode',code,'orderId',ord,'status','delivered'));
  perform set_config('request.jwt.claim.sub',current_setting('qa.buyer'),true);
  perform public.buyer_action(jsonb_build_object('type','reviewOrder','orderId',ord,'rating',5,'comment','QA verificación transaccional'),gen_random_uuid());
  state:=public.buyer_state();
  if not exists(select 1 from jsonb_array_elements(state->'orders') where value->>'id'=ord::text and value->>'status'='delivered' and (value->'review'->>'rating')::int=5) then raise exception 'Entrega/reseña no visible al comprador'; end if;
  perform public.buyer_action(jsonb_build_object('type','addToCart','productId',product,'quantity',1),gen_random_uuid());
  result:=public.buyer_action(jsonb_build_object('type','checkout','pointId',point,'paymentMethod','yape'),gen_random_uuid());
  perform public.buyer_action(jsonb_build_object('type','cancelOrder','orderId',result->'orderIds'->>0),gen_random_uuid());
  perform public.buyer_action(jsonb_build_object('type','openDispute','orderId',ord,'reason','QA de reclamo','description','Prueba revertida al finalizar'),gen_random_uuid());
  state:=public.buyer_state();
  if not exists(select 1 from jsonb_array_elements(state->'orders') where value->>'id'=ord::text and value->>'status'='disputed' and value->'dispute'->>'status'='open') then raise exception 'Reclamo no persistió'; end if;
end $$;
reset role;
do $$
begin
  if (select stock from public.products where id=current_setting('qa.product')::uuid)<>8 then raise exception 'Cancelación no restituyó stock'; end if;
  if exists(select 1 from public.transactions where order_id=current_setting('qa.order')::uuid) then raise exception 'La prueba creó una operación financiera'; end if;
end $$;
rollback;
select 'PASS: carrito, idempotencia, compra, stock, vendedor, despacho, punto, recepción, listo, entrega, reseña, cancelación y reclamo; cambios revertidos' as verification;
