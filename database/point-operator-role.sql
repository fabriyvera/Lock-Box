-- Apply and commit this enum extension before point-operator-registration.sql.
alter type public.user_role add value if not exists 'operador_punto';
