-- Restablece el aislamiento de pedidos existente; conserva sus políticas.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
-- El carrito creado en el alta solo puede ser consultado por su comprador.
create policy buyer_cart_read on public.carts for select to authenticated
using (user_id=(select auth.uid()));
grant select on public.carts to authenticated;
