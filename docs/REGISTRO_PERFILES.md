# Registro real de compradores y vendedores

**Modo vigente de desarrollo:** acceso con correo y contraseña sin confirmar el correo. Ver [ACCESO_DIRECTO_Y_CAPTCHA.md](ACCESO_DIRECTO_Y_CAPTCHA.md) para la configuración actual y el CAPTCHA que se activa después de completar los formularios. La compatibilidad con confirmación descrita abajo se conserva para una futura reactivación.

## Base de datos y API

Proyecto: **LockBox's Project** (`anprldvvagovpyyenrif`). El 11 de octubre de 2026 se aplicó `registration_profiles_and_store_identity` (versión `20261011215727`), conservando las 15 cuentas existentes.

- `database/registration-profiles.sql`: un trigger privado de `auth.users` crea `profiles` en la misma transacción. Compradores reciben un carrito; vendedores reciben una suscripción activa al plan Emprende. Un fallo revierte toda el alta.
- Se aceptan `comprador`, `vendedor` y, desde la ampliación del 12 de octubre de 2026, `operador_punto`. El nuevo rol crea su propio punto y no otorga administración global. Los metadatos de usuario no pueden otorgar administración ni verificación; cambiarlos después no modifica el rol almacenado. Se mantienen las restricciones únicas de usuario y celular. Ver [REGISTRO_PUNTOS_LOCKBOX.md](REGISTRO_PUNTOS_LOCKBOX.md).
- `profiles.store_name` conserva el nombre comercial separado de `full_name`. Los vendedores anteriores conservan el nombre de su tienda. `seller_state` lee ese campo y `seller_action` lo guarda sin sobrescribir el nombre personal.
- El trigger usa `SECURITY DEFINER` con `search_path` vacío porque Auth debe provisionar datos sin conceder escritura pública a las tablas. Su ejecución se revoca a `public`, `anon` y `authenticated`; está en el esquema privado. Las lecturas siguen sujetas a RLS.
- `POST /api/auth/register`: valida correo, contraseña de 8–128 caracteres, nombre, usuario, celular de 8 dígitos sin código de país, rol y tienda; rechaza campos extra y verifica Turnstile antes de llamar a Auth. El backend convierte `71234567` a `+59171234567` antes de crear el perfil. Devuelve `202` cuando hace falta confirmar el correo, o `201` con una sesión real cuando Auth permite acceso inmediato. No identifica públicamente correos ya registrados.
- `GET /api/auth/me`: verifica el token con Auth y devuelve exclusivamente el perfil activo del titular. El rol proviene de la base de datos.
- Los tipos TypeScript se regeneraron desde el proyecto real. No se añadió ninguna clave administrativa.

`database/registration-rls.sql` corresponde a `restore_order_rls_and_buyer_cart_read` (versión `20261011220313`). Reactiva RLS en `orders` y `order_items`: el asesor detectó que estaba deshabilitado pese a conservar políticas de vendedores. Añade lectura del carrito propio para compradores. No concede escritura directa de pedidos, perfiles o carritos.

## Formularios y acceso

La portada y `/register` reutilizan `RegistrationForm`; ambos envían los mismos campos al backend. Se normalizan usuario y teléfono, se comparan contraseñas y se impide el doble envío. El selector de rol funciona con teclado y los campos tienen etiquetas asociadas, autocompletado y mensajes accesibles. Se eliminaron las alertas de éxito simuladas y el registro de contraseñas en consola.

`/auth/callback` procesa la confirmación, elimina los tokens de la URL, guarda la sesión real y consulta `/api/auth/me`. El login usa ese mismo acceso. `/dashboard` y `/vendedor` verifican sesión y perfil activo en el servidor; redirigen según el rol persistido. El panel comprador muestra el nombre real del titular y cierra la sesión de Supabase al salir. El comercio del comprador continúa siendo una demostración, sin pagos reales ni pedidos persistidos.

## Pruebas

Las pruebas HTTP del backend cubren ambos roles, confirmación, sesiones inmediatas, rechazo de roles privilegiados/campos extra, CAPTCHA, límites de Auth y lectura del perfil con token verificado. Las pruebas previas de vendedor se conservan.

Verificación inicial: **12 pruebas de backend y 16 de frontend aprobadas**, TypeScript sin errores y build de Next.js de producción aprobado con `--webpack`. En esa verificación Auth tenía confirmación activada (`mailer_autoconfirm=false`). Posteriormente se solicitó acceso directo para desarrollo; su configuración actual se documenta en [ACCESO_DIRECTO_Y_CAPTCHA.md](ACCESO_DIRECTO_Y_CAPTCHA.md).

En la base real se ejecutó `database/registration-checks.sql` con `ROLLBACK`: alta de comprador/carrito, vendedor/plan, rechazo de usuarios duplicados y `admin`, modificación de metadatos sin elevación de permisos, lectura de estado y edición de tienda sin sobrescribir el nombre personal. Se verificó RLS usando `SET LOCAL ROLE authenticated`: solo perfil/carrito propios, sin lectura de pedidos ajenos, sin escritura directa de perfiles y sin acceso de compradores al módulo vendedor. Las 15 cuentas iniciales se conservaron. No se conservaron cuentas de prueba ni se enviaron correos.

## Configuración para ejecutar el flujo completo

1. Completar las variables públicas de Supabase en `front-end/.env.local` y las del mismo proyecto en `back-end/.env`, usando sus ejemplos. Nunca colocar una clave secret/service-role en el frontend.
2. Configurar el par de claves Turnstile para los dominios utilizados. La aplicación muestra un aviso si faltan; no omite CAPTCHA. Los archivos locales inspeccionados tienen claves oficiales de prueba: usar claves reales para producción. Ver [pruebas de Turnstile](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).
3. Configurar `FRONTEND_URL` con el origen real del frontend y `NEXT_PUBLIC_API_URL` con la URL pública del backend. En producción no usar `localhost`.
4. En Supabase Auth → URL Configuration, agregar `<FRONTEND_URL>/auth/callback` a las URL de redirección permitidas y configurar Site URL. La confirmación enviada por el backend utiliza flujo implícito; la página callback guarda la sesión en cookies, limpia la URL y consulta el perfil verificado. También admite enlaces PKCE generados por otros clientes.
5. Configurar SMTP/plantillas de confirmación en Auth para correos reales. El formulario no redirige a un panel sin confirmación cuando Auth la requiere. El envío y recepción de correos requieren una prueba con una dirección controlada por el equipo.

Referencias: [registro y confirmación](https://supabase.com/docs/guides/auth/passwords), [URL de redirección](https://supabase.com/docs/guides/auth/redirect-urls), [datos de usuario y triggers](https://supabase.com/docs/guides/auth/managing-user-data).

## Observaciones de seguridad preexistentes

Además de RLS deshabilitado en pedidos (corregido), el asesor detectó tablas con RLS pero sin políticas (`cart_items`, `disputes`, `notifications`, `reviews`, `transactions`) y protección de contraseñas filtradas deshabilitada. No se abrieron esas tablas para completar el registro. Ver [políticas faltantes](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) y [protección de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Tras las migraciones no quedaron errores de RLS en el asesor de seguridad. El asesor de rendimiento mantiene 4 avisos de claves foráneas sin índice y 9 de índices sin uso; no se eliminaron índices por una muestra tan temprana de actividad. Ver [índices de claves foráneas](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).
