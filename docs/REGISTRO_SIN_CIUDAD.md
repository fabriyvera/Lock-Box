# Registro y perfil sin ciudad

Fecha: 7 de octubre de 2026. Rama: `backend-sellers`.

Se eliminó el campo Ciudad de los formularios de registro de la portada y de `/register`, tanto para compradores como para vendedores. Se conservaron los colores, estilos y campos restantes; el celular ocupa el ancho disponible en `/register`.

## Base de datos

En el proyecto Supabase LockBox's Project (`anprldvvagovpyyenrif`, organización Lock_Box) se aplicó la migración `20261007161246 remove_profile_city`:

- `public.seller_state()` devuelve el perfil con `storeName`, `handle` y `bio`.
- `private.seller_action(jsonb, uuid)` valida y guarda el perfil sin exigir ni escribir ciudad.
- Se eliminó `public.profiles.city`, incluyendo los valores de esa columna en los dos perfiles existentes.
- `public.lockbox_points.city` permanece: identifica la ubicación de los puntos de entrega.

El SQL reproducible está en [seller-remove-profile-city.sql](../database/seller-remove-profile-city.sql). Reemplaza las referencias concretas de las funciones antes de eliminar la columna, dentro de una transacción. Usa DROP COLUMN RESTRICT para evitar eliminar objetos dependientes y solicita a PostgREST recargar el esquema. Se preservaron la autenticación, autorización del vendedor, idempotencia, RLS y permisos de ejecución de las funciones.

Los scripts canónicos `seller-schema.sql`, `seller-action-fix.sql` y `seller-seed.sql`, los tipos de base de datos y la estructura documentada se actualizaron para reproducir el esquema actual. En un entorno anterior, aplica el parche de eliminación después de las migraciones del vendedor y antes del seed. En el proyecto conectado ya está aplicado.

## Aplicación

Se quitó ciudad del estado y de la lista de campos de ambos registros, del editor Mi tienda, de su vista previa, de la cabecera del panel y de los tipos, validadores y fixtures del vendedor. La API acepta `saveProfile` sin ciudad y rechaza el campo antiguo mediante su esquema estricto.

Actualiza frontend y backend a esta revisión de `backend-sellers` y reinicia ambos. La revisión anterior del frontend exige ciudad al leer el snapshot y no es compatible con el nuevo contrato.

Los formularios de registro conservan el comportamiento previo: aún son prototipos de interfaz, sin un endpoint de creación de cuenta conectado. Este cambio elimina el campo; no incorpora un flujo nuevo de registro.

## Comprobaciones

- Base real: columna de perfil ausente, columna de punto de entrega presente, dos perfiles y diez puntos conservados.
- RPC con rol `authenticated`: lectura y guardado del perfil sin ciudad; snapshot con nueve productos y doce pedidos. La escritura de prueba terminó con ROLLBACK.
- Quince pruebas de dominio/snapshot del frontend; el perfil sin ciudad se valida y puede editarse.
- Siete grupos de pruebas del backend, incluida aceptación de perfil sin ciudad y rechazo del campo retirado. El entorno inicialmente bloqueó conexiones locales con EACCES; se concedió acceso de red y las pruebas pasaron.
- TypeScript de frontend y backend y ESLint de los componentes/validadores revisados.
- Compilación de producción de Next.js con `--webpack`: correcta. El primer intento encontró una restricción EPERM al crear la carpeta de salida de `/register`; se preparó esa carpeta y el segundo intento terminó correctamente.
- El navegador de comprobación no pudo conectar al servidor local de producción (timeout). La comprobación de diseño queda limitada a la revisión de los componentes y del HTML generado; no se presenta una prueba visual como completada.

Los asesores de Supabase conservan los avisos previos: [RLS sin políticas en otros módulos](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) y [protección de contraseñas filtradas deshabilitada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No aparecieron avisos nuevos asociados a las funciones modificadas.
