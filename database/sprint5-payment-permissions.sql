-- Only an authenticated owner may request manual release (ownership is checked inside the RPC).
revoke execute on function public.buyer_release_payment(uuid) from public,anon;
grant execute on function public.buyer_release_payment(uuid) to authenticated;
-- No UI invokes this batch operation. Keep it for a trusted scheduler/service, not public clients.
revoke execute on function public.auto_release_delivered_orders() from public,anon,authenticated;
grant execute on function public.auto_release_delivered_orders() to service_role;
