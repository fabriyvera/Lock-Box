-- Preserve access to the point used by an owned historical order.
alter policy seller_points_read on public.lockbox_points using (is_active or exists (select 1 from public.orders o where o.lockbox_id=lockbox_points.id and o.seller_id=(select auth.uid())));
