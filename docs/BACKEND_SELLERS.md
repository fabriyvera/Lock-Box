# Integración del vendedor: Supabase y Express

Fecha: 5 de octubre de 2026, America/La_Paz. Migraciones registradas el 6 de octubre en UTC.
Rama: `backend-sellers`, creada desde `main` en `10a0450469b53ed6030fa93afd0f159ded235732`.

## Resultado y alcance

El vendedor inicia sesión mediante Supabase Auth, consulta su tienda a través del backend Express y guarda catálogo, lives, despacho, perfil, plan y solicitudes de liquidación en PostgreSQL. Se conserva la estética oscura y verde del frontend. La persistencia local del módulo inicial fue sustituida por HTTP autenticado.

Entorno académico: los lives no transmiten vídeo, no se conecta TikTok y no se procesan pagos ni transferencias reales. Cambiar de plan solo activa planes de prueba; el precio mensual real de Pro sigue por definir. Los datos añadidos están identificados como TEST. El módulo comprador, escrow/QR, IA, cobros de suscripción y aprobación bancaria de liquidaciones pertenecen a etapas posteriores.

## Proyecto y revisión inicial

- Organización: **Lock_Box** (`oufdmrztexazdgafhqwo`).
- Proyecto: **LockBox's Project** (`anprldvvagovpyyenrif`).
- URL: `https://anprldvvagovpyyenrif.supabase.co`.
- Repositorio: [fabriyvera/Lock-Box](https://github.com/fabriyvera/Lock-Box).

Se revisaron las 19 tablas públicas existentes, sus relaciones, enums, índices, datos y permisos. Había un vendedor activo (`lockbox_store`) con cuenta Auth confirmada, seis productos publicados con precios/stock positivos e imágenes, cinco categorías activas y diez puntos LockBox activos. Los seis productos no tenían categoría asignada. Pedidos, items, historiales, lives, planes, suscripciones, liquidaciones, disputas y transacciones estaban vacíos. RLS estaba habilitado, pero sin políticas: un cliente autenticado no podía consultar las filas necesarias.

El catálogo y los puntos existentes sirven para pruebas. Se preservaron la identidad y contraseña del vendedor, los seis precios, stock e imágenes originales, y los diez puntos. Se completaron categorías y etiquetas; no se sustituyó el catálogo por la demo del navegador.

La revisión de `main` también encontró el login que devolvía un token ficticio y el vendedor almacenado en localStorage. Se reemplazaron ambos en esta rama. `main` no se modificó.

## Datos añadidos y corregidos

| Tabla                                     | Cambio                                                                                                                                                                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.users` / `profiles`                 | Comprador ficticio `seller_test_buyer`, inactivo, correo `buyer.seller-tests@example.invalid`, sin contraseña, confirmación ni identidad de login. Sirve únicamente de referencia FK; no se enviaron correos. La cuenta vendedor existente se conserva. |
| `categories`                              | Categoría Otros y etiqueta `seller_label` para mapear las categorías originales a la interfaz. Se preservan nombres/slugs existentes.                                                                                                                   |
| `products`                                | Categorías para los seis productos existentes. Tres productos TEST: `LB-TEST-DRAFT` (stock 0), `LB-TEST-PAUSED`, `LB-TEST-ARCHIVED`. Total del vendedor: nueve.                                                                                         |
| `tags` / `product_tags`                   | Tres etiquetas de prueba y relaciones del catálogo con etiquetas.                                                                                                                                                                                       |
| `plans`                                   | Emprende: comisión 6%, plazo 48 h. Pro: comisión 2%, plazo 0 h. `is_test_plan=true`; `monthly_price=0` exclusivamente para pruebas, no como tarifa comercial aprobada.                                                                                  |
| `subscriptions`                           | Una suscripción activa Emprende para el vendedor original.                                                                                                                                                                                              |
| `live_sessions` / `live_session_products` | Un live terminado de prueba ligado al aro de luz existente. No queda un live activo que bloquee nuevas pruebas.                                                                                                                                         |
| `orders` / `order_items`                  | Doce pedidos, cada uno con un item de Bs. 130, cantidades/precios y título histórico. `test_reference` único `seller-module-v1:<caso>`.                                                                                                                 |
| `order_status_history`                    | 51 eventos de prueba, con fechas coherentes con pago/despacho/entrega/liberación. Se corrigieron los timestamps únicamente de estos fixtures.                                                                                                           |
| `transactions`                            | 17 movimientos TEST de retención, liberación, comisión y reembolso; metadata `real_payment=false`. No hubo pagos externos.                                                                                                                              |
| `disputes`                                | Una disputa asociada al pedido de prueba disputado.                                                                                                                                                                                                     |
| `payouts`                                 | Sin solicitudes iniciales para el vendedor original: el saldo disponible permite probar la primera solicitud.                                                                                                                                           |
| `private.seller_action_receipts`          | Tabla interna de idempotencia, sin permisos de lectura/escritura para clientes. Los checks SQL de prueba revierten sus recibos.                                                                                                                         |

Los pedidos cubren `pending`, `paid`, `dispatched`, `in_lockbox`, `ready`, `delivered`, `cancelled`, `refunded`, `disputed` y tres variantes `released`: Emprende disponible, Emprende esperando 48 h y Pro inmediato.

Saldo inicial verificado (variará con el tiempo y las operaciones):

| Concepto                             |    Bs. |
| ------------------------------------ | -----: |
| Disponible                           | 249,60 |
| En plazo de liquidación              | 122,20 |
| En garantía                          | 733,20 |
| Comisiones de las ventas liberadas   |  18,20 |
| Solicitudes de liquidación iniciales |   0,00 |

Disponible = 122,20 de Emprende liberado hace 72 h + 127,40 de Pro liberado hace 1 h. El pedido Emprende liberado hace 2 h conserva su espera. Cambiar el plan no recalcula ninguna venta histórica.

## Esquema, permisos y reglas

Se añadieron `products.seller_status`, `categories.seller_label`, `orders.settlement_delay_hours`, `orders.buyer_label`, `orders.test_reference`, `order_items.product_title`, `plans.settlement_delay_hours`, `plans.is_test_plan` y `live_session_products`. Se mantienen los enums originales.

- `seller_state()` devuelve un snapshot de la tienda y ejecuta como el usuario autenticado, con RLS.
- `public.seller_action(jsonb, uuid)` llama al implementador privado. La función privada ejecuta con privilegios limitados por checks explícitos: `auth.uid()`, perfil activo con rol vendedor, propiedad y acción permitida. Su `search_path` está vacío. No toma decisiones de rol desde `user_metadata`.
- Los permisos directos de escritura de perfiles, catálogo, pedidos, planes, suscripciones y payouts se revocan para anon/authenticated. El vendedor no puede elevar su rol ni modificar escrow por REST.
- RLS restringe las filas por vendedor y por relación con sus productos, lives o pedidos. Categorías/planes activos son consultables; los puntos históricos de pedidos propios siguen visibles aunque el punto se desactive.
- El QR, expiración del QR, `buyer_id` y notas de pedidos no están disponibles por consulta directa: se revocó SELECT de tabla y se concedió únicamente SELECT de columnas necesarias. El snapshot tampoco incluye esos campos ni contactos del comprador.
- Una fila de perfil se bloquea durante cada mutación. Esto serializa solicitudes del mismo vendedor, evita dos lives y protege el cálculo/reserva de liquidaciones concurrentes.
- Un recibo por `(seller_id, request_id)` permite reintentos del mismo JSON sin repetir efectos. Reutilizar ese ID con contenido distinto se rechaza. Si una validación falla, toda la operación se revierte.
- Productos nuevos son borradores. Publicar requiere stock; stock fraccionario/precio inválido se rechazan. Editar/pausar/archivar un producto usado en un live activo se bloquea. Un índice único de `lower(sku)` evita colisiones concurrentes, incluso con productos archivados; SKU vacío se guarda como NULL.
- Solo `paid → dispatched` es una operación de vendedor; transición e historial se guardan juntos. No se permite confirmar recepción, QR, entrega o liberar el pago desde este módulo.
- La liquidación usa importes y hora del servidor: ventas liberadas cuyo plazo histórico venció menos payouts pendientes/completados. Crea un payout pendiente con método transferencia y sin datos bancarios; no envía dinero.
- El cambio de plan acepta únicamente los planes de prueba activos. Para planes comerciales hará falta una integración de cobro y confirmación de pago.
- Se fijó el `search_path` de `generate_slug`, se retiró EXECUTE público de `rls_auto_enable` y se añadieron índices para historial/plan/live-products/SKU. Se mantiene RLS en todas las tablas expuestas.

## Registro de migraciones

Aplicadas mediante el plugin Supabase; las versiones son UTC:

| Versión        | Nombre                             | Referencia SQL final                |
| -------------- | ---------------------------------- | ----------------------------------- |
| 20261006030521 | seller_module_api                  | `database/seller-schema.sql`        |
| 20261006031405 | seller_module_hardening            | `database/seller-hardening.sql`     |
| 20261006031827 | seller_module_action_variables     | `database/seller-action-fix.sql`    |
| 20261006032623 | seller_module_point_policy         | `database/seller-point-policy.sql`  |
| 20261006033129 | seller_module_sku_uniqueness       | `database/seller-sku-index.sql`     |
| 20261006034154 | seller_module_order_column_privacy | `database/seller-order-privacy.sql` |
| 20261007161246 | remove_profile_city               | `database/seller-remove-profile-city.sql` |

El 7 de octubre de 2026 se eliminó `public.profiles.city` del registro y del contrato de perfil del vendedor. Para otro entorno, aplica `seller-remove-profile-city.sql` después de los parches anteriores y antes del seed. Las ciudades de `lockbox_points` siguen disponibles para la logística. Detalles y comprobaciones: [REGISTRO_SIN_CIUDAD.md](REGISTRO_SIN_CIUDAD.md).

`seller-schema.sql` incorpora las correcciones finales de variables, políticas y privacidad para reproducir la integración sobre el esquema original de LockBox. No es un dump completo ni un registro byte por byte de las versiones intermedias. Los parches restantes documentan el endurecimiento aplicado; `seller-action-fix.sql` conserva el cuerpo final de la función. No se deben volver a ejecutar estos DDL sobre el proyecto ya migrado.

Para otro entorno con el esquema original: revisar permisos existentes, aplicar schema → hardening → action-fix → point-policy → sku-index → order-privacy → remove-profile-city, y luego `seller-seed.sql`. El seed resuelve UUID por claves naturales; no depende de IDs generados en este proyecto. Se puede repetir sin duplicar fixtures ni sobrescribir sus operaciones posteriores. Requiere el vendedor `lockbox_store`, los productos y punto originales; si cambias su username, ajusta la referencia antes de repetirlo. Las fechas de fixtures no se reinician al repetir el seed.

`seller-verify.sql` prueba la base real en una transacción y termina con ROLLBACK. No usar sobre un catálogo de producción: presupone los fixtures iniciales y sus conteos/saldos. La aplicación no tiene botón de reset ni genera ventas artificiales al cargar.

## Backend y frontend

Express expone `/api/health`, `/api/auth/login`, `/api/seller/state` y `/api/seller/actions`. El login verifica Turnstile y `signInWithPassword`; retorna access/refresh tokens reales. Cada consulta/acción valida el token con `auth.getUser()` y vuelve a verificar rol/actividad en `profiles`. El cliente Supabase se crea por solicitud, usando clave pública y JWT del vendedor. No se introdujo una clave service_role. Los tipos de `back-end/src/types/database.ts` se generaron desde el esquema real después de migrarlo; el cliente/RPC del backend los utiliza.

El cuerpo de acciones es `{ action, requestId }`, con Zod estricto. No se aceptan owner, rol o montos de payout enviados por el frontend. La API devuelve un recibo de mutación, y el frontend hace un GET separado para refrescar datos. Las fechas proporcionadas por la interfaz no gobiernan decisiones de saldo ni fechas efectivas de escritura.

`useSellerStore` obtiene la sesión del navegador, envía Bearer, valida el snapshot y actualiza las pantallas tras confirmar la escritura. No guarda la tienda en localStorage. Los reintentos conservan el payload/UUID mientras la escritura sea incierta. Durante el guardado se deshabilitan acciones repetidas. Hay mensajes de sesión/configuración y botón Actualizar datos. No hay sincronización Realtime; se consulta al cargar, después de escribir y al actualizar manualmente.

Se actualizó login para persistir la sesión con `auth.setSession()` y dirigir vendedores a `/vendedor`, con reset de captcha ante errores. Se migró `middleware.ts` a `proxy.ts` y se admiten claves publishable o legacy anon en ambos servicios. La portada y `/vendedor` son shells públicos sin datos privados; toda lectura/escritura del vendedor se valida en Express y RLS.

## Ejecutar desde tu copia del repositorio

```sh
git fetch origin
git switch --track origin/backend-sellers
cd back-end
npm ci
cp .env.example .env
```

Si ya tienes una rama local del mismo nombre, usa `git switch backend-sellers` y actualízala sin descartar cambios propios. Los `.env` no se versionan; conserva los tuyos y completa las variables que falten.

Backend:

```dotenv
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://anprldvvagovpyyenrif.supabase.co
SUPABASE_PUBLISHABLE_KEY=<clave publishable de Settings / API Keys>
TURNSTILE_SECRET_KEY=<secret de Turnstile>
```

Frontend (`front-end/.env.local`):

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://anprldvvagovpyyenrif.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<la misma clave pública>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<sitekey Turnstile>
```

Los nombres alternativos `SUPABASE_ANON_KEY` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` siguen funcionando. No dejes URL/claves vacías ni uses service_role en el navegador. Reinicia ambos servidores tras cambiar variables.

Para desarrollo local, las claves oficiales de prueba de [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) son sitekey `1x00000000000000000000AA` y secret `1x0000000000000000000000000000000AA`. Se usaron solo en la configuración local ignorada. En despliegues públicos usa claves reales; no están seleccionadas automáticamente en el código.

Abre dos terminales, ejecuta `npm run dev` en back-end y front-end y entra por `http://localhost:3000/login` con el correo/contraseña de tu vendedor existente. Su perfil debe estar activo y tener rol vendedor. El comprador ficticio sirve de FK y no puede iniciar sesión. En esta entrega se verificó con una cuenta QA temporal, sin cambiar la contraseña de tu cuenta.

## Evidencia de pruebas

- 15 pruebas de dominio/snapshots + 1 prueba de configuración del frontend, y 6 grupos de pruebas HTTP del backend con múltiples escenarios de tokens/roles/inputs/errores.
- TypeScript de frontend y backend; ESLint de los archivos modificados de vendedor/Supabase/login/proxy; compilación de producción con Next `--webpack` y backend `tsc`.
- SQL real con rol `authenticated`: RLS, producto ajeno, elevación de rol/direct writes, stock, CRUD, idempotencia, live único, bloqueo durante live, despacho/historial, cambio de plan histórico, reservas de liquidación y privacidad de columnas. Todas las mutaciones de estas comprobaciones se revirtieron.
- Seed repetido y conteos/relaciones/saldos comprobados. Los 51 historiales y 17 movimientos TEST no se duplicaron.
- Express + Supabase reales: login con captcha de prueba, JWT válido, snapshot propio, producto ajeno 403, lectura directa de QR/buyer_id 403, RPC anónima 401 y API sin sesión 401. Reintento de despacho no duplica historial; no se puede liquidar dos veces ni anticipar el reloj del servidor.
- Navegador: login → vendedor, creación de producto con Bs. 45,50 y stock 5, publicación, inicio/cierre de live y reserva pendiente de Bs. 94. Se verificó luego cada escritura consultando el backend real. El snapshot del vendedor original también pasó el decoder del frontend, con nueve productos, doce pedidos y los saldos iniciales correctos. Perfil/plan se modificaron por HTTP real y se reflejaron al actualizar.
- La cuenta QA y sus productos/pedidos/lives/payouts/suscripciones/recibos se eliminaron al finalizar. Los fixtures del vendedor original quedan listos para tus pruebas. No se enviaron correos ni se procesó dinero.

El lint global del repositorio conserva errores previos en `app/dashboard/page.tsx` (componentes definidos durante render) y `app/page.tsx` (comillas sin escape), además de avisos de imágenes/fuentes. No afectan la compilación verificada; no se modificaron esas pantallas fuera del alcance vendedor.

## Avisos del proyecto y próximos módulos

Se consultaron los asesores de seguridad/rendimiento de Supabase. Quedan avisos ajenos a esta integración:

- Protección de contraseñas filtradas deshabilitada en Auth: [configuración y explicación](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- RLS sin políticas en `carts`, `cart_items`, `disputes`, `notifications`, `reviews`, `transactions`: esos módulos siguen denegados a clientes; no se habilitó lectura global para eliminar el aviso. [Detalle del linter](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- Cuatro FK sin índice en carrito/disputas/reviews: [detalle](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys). Los FK nuevos del vendedor tienen cobertura.
- Índices aún sin uso en un proyecto con pocos datos: se preservaron para futuras consultas. [Detalle](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

Para nuevas compras, el módulo comprador deberá crear pedidos/items con título, precio, comisión y plazo histórico correctos, y reservar stock de manera transaccional. Escrow/QR debe completar sus propias transiciones con autorización de comprador/punto/sistema. La comisión de un pedido no se toma del plan actual al liquidarlo. Un proveedor de pagos deberá confirmar cobros de planes y completar payouts; ninguna acción del vendedor puede saltarse esas confirmaciones.
