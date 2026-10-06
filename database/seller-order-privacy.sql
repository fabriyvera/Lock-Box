-- QR tokens and buyer IDs are not readable even through direct Data API calls.
revoke select on public.orders from public,anon,authenticated;
grant select (id,seller_id,lockbox_id,status,subtotal,commission_amount,total_amount,created_at,released_at,settlement_delay_hours,buyer_label,test_reference) on public.orders to authenticated;
