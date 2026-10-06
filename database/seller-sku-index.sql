-- Prevent concurrent sellers from creating case variants of the same SKU.
create unique index products_seller_sku_ci_idx on public.products(lower(sku)) where sku is not null and btrim(sku)<>'';
