# Integración de collection-point en main

Fecha: 12 de octubre de 2026.

**Ampliación vigente:** la vista principal está en `/punto-recojo`; `/admin` redirige allí para conservar los enlaces anteriores. `/register` permite crear una cuenta `operador_punto` y su nuevo punto asociado. Los responsables ya asignados conservan acceso y rol. Ver [REGISTRO_PUNTOS_LOCKBOX.md](REGISTRO_PUNTOS_LOCKBOX.md).

Se integra `collection-point` (`b1758be`) sobre `main` (`904e595`) mediante un commit de merge que conserva ambos historiales. El aporte de la vista del compañero se mantiene en `/admin`, adaptado a los componentes, estilos, autenticación y base de datos actuales.

## Interfaz y acceso

- `/admin` es un Server Component protegido; `PointDashboard` contiene la interacción del cliente.
- La vista usa exclusivamente los tokens de color de `globals.css` y los iconos de `lucide-react`. CSS Modules organiza el diseño responsive, con una columna en móvil y controles de al menos 44 px.
- Se conservan el encabezado, estadísticas, consulta de QR, listado de pedidos y actividad reciente del diseño original. Los datos simulados y la liberación ficticia de B1 se sustituyen por consultas reales.
- El selector presenta únicamente puntos activos cuyo `manager_id` coincide con el usuario autenticado. Un perfil `admin` activo puede administrar todos los puntos activos. La asignación de un punto permite que su responsable también conserve su rol de vendedor.
- Las cuentas sin asignación ven un mensaje claro. El módulo vendedor tiene el enlace «Administrar punto». Los roles `admin` y `despachador` acceden a `/admin` tras el login; los compradores y vendedores conservan sus rutas actuales.
- Los contadores muestran pedidos presentes, listos para retiro y entregados en el día de Bolivia. La capacidad proviene del punto; no se inventa un número de casillero físico. Se muestran hasta 200 pedidos activos y los 25 movimientos más recientes.
- La actualización ocurre al abrir la vista, pulsar Actualizar y después de confirmar un cambio. No se anuncia una conexión Realtime inexistente.

## Flujo de consulta y confirmación

1. El responsable ingresa el código manualmente o con un lector que escriba en el campo.
2. «Consultar pedido» resuelve el QR al ID real y muestra el pedido, comprador y estado.
3. Una acción separada confirma la transición siguiente: `dispatched → in_lockbox → ready → delivered`.
4. La base de datos verifica nuevamente responsable, punto activo, QR, vencimiento, ID y estado antes de actualizar. La transacción bloquea el pedido y registra el historial con el actor.
5. La entrega guarda `delivered_at`. No altera `released_at`, transacciones, comisiones ni saldo. Una repetición o salto de estado se rechaza y requiere consultar nuevamente.

## API

Todas estas rutas usan `Authorization: Bearer <access_token>` y `Cache-Control: no-store`. Express verifica el token con Supabase Auth y el perfil activo. El cliente Supabase de cada petición transporta ese mismo JWT.

| Método | Ruta                                    | Resultado                                                               |
| ------ | --------------------------------------- | ----------------------------------------------------------------------- |
| GET    | `/api/collection-point/state`           | Puntos autorizados, pedidos y actividad                                 |
| GET    | `/api/collection-point/scan/:qrCode`    | Pedido asociado a un QR vigente del punto                               |
| PATCH  | `/api/collection-point/:orderId/status` | Confirma la siguiente transición; acepta únicamente `qrCode` y `status` |

Ejemplo de cuerpo válido para confirmar una entrega: `{ "qrCode": "LBX-codigo-del-pedido", "status": "delivered" }`.

Se conservan los alias `/orders/state`, `/orders/scan/:qrCode` y `/orders/:orderId/status`. Respuestas: 401 para sesión ausente/inválida, 403 para falta de autorización, 404 para QR no encontrado en los puntos propios, 400 para datos o QR vencido y 409 para estado incompatible o ya procesado.

El router se construye con las dependencias de `createApp`, permitiendo probarlo sin cargar secretos ni usar una conexión global.

## Base de datos

Aplicado en LockBox's Project con `integrate_collection_point_api` y `collection_point_assignment_lock`. La segunda asegura que una reasignación no cambie el acceso durante una consulta. El SQL final reproducible está en `database/collection-point.sql`.

- `public.collection_point_action(action jsonb)` es una función `SECURITY INVOKER` que delega a una función privada.
- `private.collection_point_action(action jsonb)` concentra las lecturas y transiciones autorizadas. Usa `auth.uid()`, el rol persistido y `lockbox_points.manager_id`; no confía en `user_metadata` ni IDs del comprador enviados por el navegador.
- La función privada usa privilegios acotados al flujo, con `search_path` vacío, comprobaciones de actor/asignación y bloqueos de fila. Solo `authenticated` puede ejecutarla; `PUBLIC` y `anon` no tienen permisos.
- Se conserva la restricción de escritura directa y lectura de QR de `orders`. No se amplían permisos de las tablas ni se agrega `service_role` al backend.
- Se regeneraron los tipos del backend desde Supabase. No se modificaron perfiles, asignaciones, contraseñas ni pedidos existentes.

## Resolución del merge y alcance pendiente

La rama partía de una versión anterior al registro funcional y responsive. Se resolvieron los conflictos de `app.ts` y `/dashboard`, conservando el registro, login, CAPTCHA, celular de 8 dígitos y la página protegida del comprador de `main`.

El checkout del primer commit de `collection-point` era un prototipo: usaba identidades fijas, aceptaba precios del cliente y escribía pedido/detalle en llamadas separadas. Se mantiene expresamente deshabilitado con HTTP 501 en `POST /orders/checkout` (también bajo el prefijo de la API). El comprador conserva su interfaz de demostración existente; esta integración no activa pagos reales ni crea órdenes de compra desde esa interfaz.

También se descartan el helper sin autenticación que utilizaba `service_role`, las claves públicas concretas de los ejemplos `.env` y la URL incorrecta terminada en `/rest/v1/`. Los ejemplos y dependencias de `main` se conservan; `uuid` no es necesario para el flujo del punto.

La cámara, los números de casillero físico y el hardware de apertura requieren una integración posterior. La vista registra recepción y entrega de pedidos; no envía órdenes a cerraduras.

## Verificación

- 18 pruebas de backend aprobadas: registro/login/vendedor y seis pruebas nuevas de API del punto.
- 24 pruebas de frontend aprobadas: vendedor (15), registro (6), configuración (1) y flujo/rutas del punto (2).
- TypeScript del frontend y ESLint de los archivos modificados sin errores.
- `next build --webpack` aprobado: incluye `/admin` como ruta dinámica protegida. El primer intento tuvo `EPERM` en directorios generados de Windows; al preparar esos directorios, la compilación completa terminó correctamente.
- `database/collection-point-verify.sql` ejecutado con éxito en Supabase: consulta real, aislamiento entre responsables, ID distinto del QR, salto de estado, entrega duplicada, perfil sin asignación, acceso anónimo y QR vencido. Confirma tres entradas de historial, entrega sin liberación de dinero y revierte todos los datos temporales con `ROLLBACK`.
- La comprobación visual en el navegador local quedó pendiente: el servidor anunció Ready, pero el entorno no permitió conectar al puerto 3101. No se afirma una prueba completa de login y entrega desde el navegador.

Los asesores de Supabase no reportaron problemas nuevos en las funciones añadidas. Mantienen avisos existentes sobre [tablas con RLS y sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) y [protección de contraseñas filtradas desactivada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Esos ajustes quedan fuera del merge.

Para probar manualmente: iniciar frontend/backend con las variables actuales, entrar con una cuenta asignada en `manager_id`, abrir `/admin`, consultar un QR vigente de un pedido del punto y confirmar su siguiente estado. Verificar el historial antes de probar la siguiente transición.
