-- DEPLOYMENT GATE: run only after BOTH frontend and backend run Sprint 5.
-- This closes the legacy RPC entry points, so direct clients cannot avoid the fee
-- or omit the delivery declaration by choosing the v4 public RPC.
create or replace function public.buyer_action(action jsonb,request_id uuid) returns jsonb
language sql security invoker set search_path='' as $$ select private.buyer_action_v5(action,request_id); $$;
create or replace function public.buyer_state() returns jsonb
language sql security invoker set search_path='' as $$ select private.buyer_state_v5(); $$;
create or replace function public.collection_point_action(action jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select private.point_action_v5(action); $$;
revoke all on function public.buyer_action(jsonb,uuid),public.buyer_state(),public.collection_point_action(jsonb) from public,anon;
grant execute on function public.buyer_action(jsonb,uuid),public.buyer_state(),public.collection_point_action(jsonb) to authenticated;
