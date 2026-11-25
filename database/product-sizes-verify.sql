-- Run inside a transaction; all fixtures are rolled back. No existing user data is changed.
begin;
do $test$
#variable_conflict use_variable
declare
 seller uuid:=gen_random_uuid(); buyer uuid:=gen_random_uuid(); other_seller uuid:=gen_random_uuid();
 product_id uuid:=gen_random_uuid(); simple_id uuid:=gen_random_uuid(); point_id uuid:=gen_random_uuid();
 request_id uuid:=gen_random_uuid(); result jsonb; state jsonb; item jsonb; order_id uuid; saved jsonb;
begin
 insert into auth.users(id,raw_user_meta_data) values
 (seller,jsonb_build_object('role','vendedor','store_name','QA tallas')),
 (other_seller,jsonb_build_object('role','vendedor','store_name','QA ajeno')),
 (buyer,jsonb_build_object('role','comprador'));
 insert into public.lockbox_points(id,name,address,capacity) values(point_id,'QA tallas','Punto temporal de prueba',50);
 perform set_config('request.jwt.claim.sub',seller::text,true);
 item:=jsonb_build_object('id',product_id,'title','Camisa QA','description','','category','Camisas','priceCents',10000,'stock',5,'sku','','imageUrl','','tags','[]'::jsonb,'status','draft','createdAt',now(),
   'variants',jsonb_build_array(jsonb_build_object('size','M','stock',2),jsonb_build_object('size','L','stock',3)));
 perform public.seller_action(jsonb_build_object('type','saveProduct','product',item),gen_random_uuid());
 perform public.seller_action(jsonb_build_object('type','setProductStatus','id',product_id,'status','published'),gen_random_uuid());
 state:=public.seller_state();
 if not exists(select 1 from jsonb_array_elements(state->'products') p where p->>'id'=product_id::text and p->'variants'=item->'variants' and p->>'category'='Camisas') then raise exception 'Seller round trip failed'; end if;
 -- DB must reject malformed variants even when bypassing the HTTP validator.
 begin
   perform public.seller_action(jsonb_build_object('type','saveProduct','product',jsonb_set(item,'{variants}','[{"size":"M","stock":2},{"size":"M","stock":3}]')),gen_random_uuid());
   raise exception 'Duplicate size accepted';
 exception when invalid_parameter_value then null; end;
 begin
   perform public.seller_action(jsonb_build_object('type','saveProduct','product',jsonb_set(item,'{stock}','4')),gen_random_uuid());
   raise exception 'Inconsistent total accepted';
 exception when invalid_parameter_value then null; end;
 perform set_config('request.jwt.claim.sub',other_seller::text,true);
 begin
   perform public.seller_action(jsonb_build_object('type','saveProduct','product',item),gen_random_uuid());
   raise exception 'Foreign seller edited variants';
 exception when insufficient_privilege then null; end;
 perform set_config('request.jwt.claim.sub',buyer::text,true);
 state:=public.buyer_state_v5();
 if not exists(select 1 from jsonb_array_elements(state->'catalog') p where p->>'id'=product_id::text and jsonb_array_length(p->'variants')=2 and p->>'categoryName'='Camisas') then raise exception 'Buyer catalog round trip failed'; end if;
 begin
   perform public.buyer_action_v5(jsonb_build_object('type','addToCart','productId',product_id,'quantity',1),gen_random_uuid());
   raise exception 'Missing size accepted';
 exception when invalid_parameter_value then null; end;
 begin
   perform public.buyer_action_v5(jsonb_build_object('type','addToCart','productId',product_id,'size','XL','quantity',1),gen_random_uuid());
   raise exception 'Unknown size accepted';
 exception when invalid_parameter_value then null; end;
 begin
   perform public.buyer_action_v5(jsonb_build_object('type','addToCart','productId',product_id,'size','M','quantity',3),gen_random_uuid());
   raise exception 'Overselling accepted' using errcode='XX000';
 exception when raise_exception then null; end;
 perform public.buyer_action_v5(jsonb_build_object('type','addToCart','productId',product_id,'size','M','quantity',2),request_id);
 perform public.buyer_action_v5(jsonb_build_object('type','addToCart','productId',product_id,'size','M','quantity',2),request_id);
 perform public.buyer_action_v5(jsonb_build_object('type','addToCart','productId',product_id,'size','L','quantity',1),gen_random_uuid());
 state:=public.buyer_state_v5();
 if jsonb_array_length(state->'cart')<>2 then raise exception 'Sizes merged in cart'; end if;
 perform public.buyer_action_v5(jsonb_build_object('type','removeFromCart','productId',product_id,'size','L'),gen_random_uuid());
 state:=public.buyer_state_v5();
 if jsonb_array_length(state->'cart')<>1 or state->'cart'->0->>'size'<>'M' then raise exception 'Remove affected another size'; end if;
 perform public.buyer_action_v5(jsonb_build_object('type','addToCart','productId',product_id,'size','L','quantity',1),gen_random_uuid());
 request_id:=gen_random_uuid();
 result:=public.buyer_action_v5(jsonb_build_object('type','checkout','pointId',point_id,'paymentMethod','bcp'),request_id);
 if public.buyer_action_v5(jsonb_build_object('type','checkout','pointId',point_id,'paymentMethod','bcp'),request_id)<>result then raise exception 'Checkout not idempotent'; end if;
 order_id:=(result->'orderIds'->>0)::uuid;
 if (select stock from public.products where id=product_id)<>2 or (select variants from public.products where id=product_id)<>'[{"size":"M","stock":0},{"size":"L","stock":2}]'::jsonb then raise exception 'Wrong size stock deducted'; end if;
 if (select count(*) from public.order_items oi where oi.order_id=order_id and oi.product_id=product_id)<>2 then raise exception 'Missing items'; end if;
 state:=public.buyer_state_v5();
 if not exists(select 1 from jsonb_array_elements(state->'orders') o, jsonb_array_elements(o->'items') i where o->>'id'=order_id::text and i->>'size'='M' and (i->>'quantity')::int=2) then raise exception 'Order snapshot missing size'; end if;
 perform set_config('request.jwt.claim.sub',seller::text,true);
 state:=public.seller_state();
 if not exists(select 1 from jsonb_array_elements(state->'orders') o where o->>'id'=order_id::text and o->>'productTitle' like '%Talla M%' and o->>'productTitle' like '%Talla L%') then raise exception 'Seller order missing sizes'; end if;
 begin
   saved:=jsonb_set(jsonb_set(item,'{variants}','[{"size":"L","stock":2}]'),'{stock}','2');
   perform public.seller_action(jsonb_build_object('type','saveProduct','product',saved),gen_random_uuid());
   raise exception 'Pending size removed' using errcode='XX000';
 exception when raise_exception then null; end;
 perform set_config('request.jwt.claim.sub',buyer::text,true);
 request_id:=gen_random_uuid();
 perform public.buyer_action_v5(jsonb_build_object('type','cancelOrder','orderId',order_id),request_id);
 perform public.buyer_action_v5(jsonb_build_object('type','cancelOrder','orderId',order_id),request_id);
 if (select stock from public.products where id=product_id)<>5 or (select variants from public.products where id=product_id)<>item->'variants' then raise exception 'Cancel restored wrong stock'; end if;
 -- Reclassifying a product does not rewrite an existing order's category.
 perform set_config('request.jwt.claim.sub',seller::text,true);
 perform public.seller_action(jsonb_build_object('type','saveProduct','product',jsonb_set(item,'{category}','"Moda"')),gen_random_uuid());
 perform set_config('request.jwt.claim.sub',buyer::text,true);
 state:=public.buyer_state_v5();
 if not exists(select 1 from jsonb_array_elements(state->'orders') o, jsonb_array_elements(o->'items') i where o->>'id'=order_id::text and i->'product'->>'categoryName'='Camisas') then raise exception 'Order category changed'; end if;
 -- Legacy products without sizes still support cart and checkout.
 perform set_config('request.jwt.claim.sub',seller::text,true);
 item:=jsonb_set(jsonb_set(item-'variants','{id}',to_jsonb(simple_id)),'{stock}','4');
 perform public.seller_action(jsonb_build_object('type','saveProduct','product',item),gen_random_uuid());
 perform public.seller_action(jsonb_build_object('type','setProductStatus','id',simple_id,'status','published'),gen_random_uuid());
 perform set_config('request.jwt.claim.sub',buyer::text,true);
 perform public.buyer_action_v5(jsonb_build_object('type','addToCart','productId',simple_id,'quantity',1),gen_random_uuid());
 perform public.buyer_action_v5(jsonb_build_object('type','checkout','pointId',point_id,'paymentMethod','bcp'),gen_random_uuid());
 if (select stock from public.products where id=simple_id)<>3 then raise exception 'Legacy stock failed'; end if;
end $test$;
rollback;
