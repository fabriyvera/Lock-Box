# Pruebas del flujo de pedidos y operaciones disponibles

Fecha: 9–10 de noviembre de 2026. Entorno: Vercel y Supabase de LockBox.

## Alcance y estado

Se prueba la aplicación desplegada en https://lock-box-d9wa.vercel.app, con API en https://lockbox-backend.vercel.app y perfiles ficticios de comprador, vendedor y punto de recojo. Inicio de sesión y registro quedan fuera del alcance; el acceso a las cuentas solamente prepara las pruebas.

El flujo principal se completó desde una compra en la interfaz hasta la entrega registrada en el punto. Se verificó su persistencia directamente en Supabase. Las pruebas pendientes de interfaz se detallan al final; una verificación SQL no sustituye una prueba de navegador.

Todos los pedidos de esta campaña tienen `is_test=true`. El pago, el live y la liquidación son simulados; no se realizaron cobros, transferencias, transmisiones ni entregas físicas.

## Problemas encontrados y correcciones

1. El comprador trabajaba con datos de demostración en almacenamiento local, por lo que sus compras no llegaban a vendedor y punto. Se implementaron `buyer_state`, `buyer_action` y `/api/buyer`, y se conectaron catálogo, carrito, checkout, pedidos, cancelaciones, reseñas y reclamos a Supabase.
2. El checkout ahora usa precios, existencias, comisión y plazo de liquidación calculados en el servidor. Se reserva capacidad por pedido y se bloquean los registros afectados durante la transacción. Las solicitudes tienen identificador idempotente por comprador; un reintento no duplica la compra ni la cancelación.
3. La cancelación de un pedido pagado de prueba restituye stock una sola vez. El comprador no puede marcar por sí mismo un pedido como entregado.
4. El QR anterior era una ilustración de demostración. Se genera un QR real con `qrcode.react` a partir del código de retiro del pedido, sin enviar dicho código a un generador externo. Los pedidos terminales o sin código no muestran el botón de QR.
5. Una lectura inicial del comprador agotó el tiempo de espera. Se añadió un reintento limitado a una vez para lecturas ante fallos de red, timeout y respuestas 5xx, con mensajes comprensibles. Las escrituras no se repiten automáticamente.
6. El motivo inicial de un reclamo se veía distinto al que se enviaba: se mostraba «Producto no coincide con el live» pero se guardaba «Producto con fallas o incompleto». Se corrigió el valor inicial para que corresponda a una opción real del selector.
7. Los pedidos en disputa aún no entregados conservan su reserva de capacidad. No deben liberar espacio por cambiar a estado `disputed`.
8. Los productos sin imagen muestran un recurso local de respaldo. Se bloquean controles de cantidad y borrado del carrito mientras se procesa una operación.

## Recorrido comprobado del pedido principal

Pedido: `73011feb-ebca-4384-abab-f310ac0bc459` / `LB-73011FEB`.

Producto: «QA Flujo LockBox 20261109», SKU `QA-FLUJO-20261109`. Vendedor: «Tienda Demo Revisión». Retiro: «Punto Demo Revisión».

| Paso | Resultado persistido | Hora de Bolivia |
| --- | --- | --- |
| Compra desde el catálogo, una unidad | `paid`; Bs 26,50; pago BCP simulado | 09/11 10:25 |
| Vendedor abre el pedido y despacha | `dispatched` | 09/11 10:35 |
| Punto consulta el código y confirma recepción | `in_lockbox` | 10/11 14:42 |
| Punto prepara el paquete | `ready` | 10/11 14:47 |
| Punto confirma entrega al comprador | `delivered` | 10/11 14:47 |

La entrega tiene un solo evento de historial. El punto pasó de 1 pedido almacenado y 1 listo para retiro a 0 almacenados, 0 listos y 1 entregado hoy. Consultar nuevamente su código muestra «El pedido ya fue procesado o no está disponible para el punto». Un código desconocido muestra «Código no encontrado en tus puntos».

El precio final es Bs 26,50 y la comisión conservada del plan Pro vigente al comprar es Bs 0,53, con plazo de liquidación de 0 horas. Esta comprobación no implica que se haya procesado dinero.

## Matriz de operaciones de interfaz

«No disponible» significa que la aplicación no ofrece esa acción; no se afirma que exista un CRUD completo por cada tabla.

| Área | Operaciones comprobadas | Resultado |
| --- | --- | --- |
| Productos del vendedor | Crear borrador; listar; editar precio y stock; publicar; pausar; volver a publicar | Correcto; stock editado a 15 y precio a Bs 26,50 |
| Productos en un live | Intentar editar, pausar o archivar durante el live | Controles bloqueados y explicación visible |
| Live simulado | Crear con producto publicado; consultar catálogo activo | Correcto; cierre e historial pendientes de la sesión de vendedor |
| Perfil comercial | Editar y leer biografía de prueba | Correcto |
| Plan | Cambiar Emprende a Pro y leer condiciones | Correcto; restauración pendiente |
| Saldo y liquidación | Leer saldo; solicitar liquidación simulada; leer reserva e impedir segunda solicitud sin saldo | Correcto; Bs 24,91 pendientes, sin transferencia |
| Catálogo comprador | Leer productos reales y filtrar el catálogo del live | Correcto |
| Carrito | Agregar; leer; cambiar cantidad; quitar y vaciar; persistencia remota | Correcto |
| Compra de prueba | Crear pedido con punto y método; leerlo en los tres perfiles; vaciar carrito | Correcto |
| Cancelación | Cancelar antes del despacho y leer estado final | Correcto; stock restituido |
| Código y estados del punto | Consulta; recepción; listo para retiro; entrega; historial; código reutilizado e inexistente | Correcto |
| Reseña | Crear y leer | SQL transaccional correcto; interfaz pendiente |
| Reclamo | Crear y leer; impedir duplicado | Persistió; se detectó y corrigió el motivo inicial; repetición de interfaz pendiente |
| Archivo de producto | Archivo lógico y conservación del historial de pedidos | Pendiente |

No existe en estas vistas edición/borrado de reseñas, resolución administrativa de reclamos, eliminación de pedidos, edición arbitraria de estados, ni aprobación/borrado de liquidaciones. Tampoco hay un CRUD administrativo de puntos o usuarios en las vistas probadas. No se manipularon esas tablas para aparentar acciones de interfaz inexistentes.

## Datos de prueba y trazabilidad

| Registro | Identificador | Uso |
| --- | --- | --- |
| Producto UI | `0c4c7308-7758-415f-af63-19a16be84375` | Compra, inventario y catálogo |
| Pedido principal UI | `73011feb-ebca-4384-abab-f310ac0bc459` | Entrega completa |
| Pedido cancelado UI | `46d5268a-38ee-438d-831e-4f1a0283ddc1` | Cancelación antes del despacho |
| Pedido fixture de saldo | `92b5eb56-16f8-42c6-82d0-c403506569ac` | Precondición de saldo liberado; no proviene de una compra |
| Liquidación simulada UI | `645f30fa-eb75-4a92-94e7-6e7106ea7ef0` | Bs 24,91, `pending` |
| Pedido fixture de reclamo | `d1c6b719-b6f4-40ac-8a73-31aafe068883` | Reclamo ficticio y detección del motivo inicial incorrecto |
| Pedido fixture para repetir reclamo | `8e4426ee-f2fb-4b03-9673-df5046182e5c` | Repetición tras desplegar la corrección |

Los fixtures son precondiciones explícitas creadas por SQL con actores de prueba existentes, sin descontar stock ni representar ventas. No deben contarse como demanda o ingresos reales. El pedido de saldo sigue liberado porque sustenta la solicitud simulada pendiente. Se conservan registros e historial para revisión; no se borran físicamente.

El producto terminó con stock 14 después de comprar una unidad y realizar una segunda compra que luego se canceló. La consulta de `transactions` para los pedidos anteriores devuelve cero registros. No se incluyen contraseñas, sesiones ni códigos de retiro en este documento.

## Verificación técnica

- Backend: 26 pruebas aprobadas, incluyendo autorización de comprador, validación estricta de acciones, identificadores idempotentes y respuestas de error.
- Transporte del comprador: 3 pruebas aprobadas; lectura con un reintento, escrituras sin repetición automática y mensajes de timeout.
- Regresiones existentes: 15 pruebas de vendedor, 2 de punto y 7 del modelo local antiguo de comprador. Estas últimas no demuestran la integración remota nueva.
- Integración remota: `database/buyer-flow-verify.sql` aprobado. Ejecuta carrito, idempotencia, checkout, inventario, vendedor, despacho, recepción, listo, entrega, reseña, cancelación y reclamo con roles autenticados dentro de una transacción que termina con `ROLLBACK`.
- Compilación de producción del frontend y comprobación TypeScript del backend aprobadas. ESLint de los componentes y módulos de comprador modificados aprobado.
- Funciones con comprobación de usuario, rol activo y propiedad; escrituras directas revocadas; envoltorios públicos invocadores y funciones privadas con `search_path` fijo. No se expone una clave de servicio al navegador.

Migraciones remotas aplicadas: `buyer_connected_test_checkout`, `buyer_action_qualified_columns` y `buyer_reserve_disputed_test_orders`. El archivo `database/buyer-connected-orders.sql` consolida su estado final para revisión.

Los asesores de Supabase conservaron avisos previos: dos tablas con RLS sin políticas (`transactions`, `notifications`), protección de contraseñas filtradas y 24 índices sin uso registrado. Los avisos no prueban fallos del flujo probado. Referencias: [RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), [índices sin uso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index). La configuración de autenticación queda fuera de esta tarea.

## Código y despliegue

- `21dd36c`: integración de base de datos y API de comprador.
- `2437977`: comprador conectado y QR real; [PR #3](https://github.com/fabriyvera/Lock-Box/pull/3), fusionado en `main` como `17ae073`.
- `17853c0`: lecturas ante fallos transitorios, motivo de reclamo y reserva de capacidad; [PR #4](https://github.com/fabriyvera/Lock-Box/pull/4), fusionado en `main` como `f044b2f`.
- Las correcciones están en `backend-sellers` y `main`. Los despliegues de frontend `dpl_8D2ButmhjJxwtcDP41PwtoxEwAUL` y backend `dpl_HU9fnUT9qorUBBBwJkErhh84ao8P` alcanzaron `READY` para `f044b2f`.

Usar el dominio canónico de producción; los enlaces inmutables de despliegues antiguos conservan el código de esos despliegues.

## Pendientes de esta ejecución

Cloudflare pidió verificación manual al preparar el acceso de comprador. Se solicitó al usuario completarla en el navegador; no se omite ni se desactiva la protección. Después deben verificarse la reseña de interfaz, la repetición del motivo de reclamo, el cierre de live, el archivo del producto y la restauración del plan Emprende.

No se verificó apertura física de casilleros, lectura por cámara, pago bancario real, transferencia real, streaming de video ni resolución administrativa de reclamos, porque estas integraciones no están implementadas en las vistas actuales.
