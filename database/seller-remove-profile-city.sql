-- Removes the registration/profile city. Delivery point cities are preserved.
-- Update both RPCs first, in the same transaction as the column removal.
begin;
set local lock_timeout = '5s';

do $migration$
declare definition text; revised text;
begin
  definition := pg_get_functiondef('public.seller_state()'::regprocedure);
  revised := replace(definition, $fragment$'city',coalesce(p.city,'La Paz'),$fragment$, '');
  if revised like '%p.city%' then
    raise exception 'seller_state city reference differs from the expected definition';
  end if;
  if revised <> definition then execute revised; end if;

  definition := pg_get_functiondef('private.seller_action(jsonb,uuid)'::regprocedure);
  revised := replace(definition,
    $fragment$or coalesce(length(btrim(item->>'city')),0) not between 1 and 60 $fragment$, '');
  revised := replace(revised, $fragment$city=btrim(item->>'city'),$fragment$, '');
  if revised like '%item->>''city''%' then
    raise exception 'seller_action city reference differs from the expected definition';
  end if;
  if revised <> definition then execute revised; end if;
end $migration$;

-- RESTRICT is intentional: do not silently delete dependent objects.
alter table public.profiles drop column if exists city restrict;
notify pgrst, 'reload schema';
commit;
