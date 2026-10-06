-- Supplemental hardening after seller-schema.sql.
alter function public.generate_slug() set search_path=pg_catalog;
revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
create policy seller_receipts_deny on private.seller_action_receipts for all to authenticated using(false) with check(false);
create index seller_history_actor_idx on public.order_status_history(changed_by);
create index seller_subscription_plan_idx on public.subscriptions(plan_id);
notify pgrst,'reload schema';
