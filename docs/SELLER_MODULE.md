> Documento histórico de la primera demo en `vendedores`. En `backend-sellers`, la persistencia local y el login simulado se reemplazaron por Supabase y Express. La configuración y el alcance actuales están en [BACKEND_SELLERS.md](BACKEND_SELLERS.md).

# Módulo del vendedor — MVP académico

Rama: `vendedores`. Ruta: `/vendedor`.

## Alcance implementado

Esta entrega implementa la experiencia del vendedor como **simulación local**, coherente con el alcance académico descrito en los documentos del proyecto. No se conecta a Supabase, TikTok, IA ni pasarelas de pago. No crea sesiones reales ni convierte el login ficticio del repositorio en autenticación válida.

Los datos se guardan en `localStorage` bajo `lockbox.seller.demo.v1`, separados del dashboard del comprador. Cada navegador tiene su propia tienda de ejemplo; no hay sincronización entre compradores y vendedores. La ruta pública solo contiene datos de demostración. Reiniciar la demo requiere confirmación y restaura los datos iniciales.

| Caso                  | Funcionalidad                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| C1                    | Crear, listar, buscar, editar y archivar productos; filtros por categoría y estado; SKU único y precio en centavos.                             |
| C2                    | Publicar o pausar productos. Publicación requiere stock; los productos nuevos empiezan como borradores.                                         |
| C3                    | Iniciar y finalizar un live simulado con productos publicados; una sola transmisión activa; catálogo copiable para TikTok e historial de lives. |
| C10                   | Cambiar entre Emprende y Pro con confirmación, sin cobros reales.                                                                               |
| Vistas de integración | Pedidos e historial, despacho de pedidos pagados, exportación CSV, resumen de ventas, saldo y solicitudes de liquidación simuladas.             |
| Perfil de tienda      | Editar nombre, usuario público y descripción de la tienda de demo.                                                                      |

Las vistas de pedidos y saldo ofrecen continuidad en la demostración. No reemplazan los módulos de escrow, QR, IA o analytics asignados a otros integrantes.

## Reglas del negocio

- Las tarifas de demo son **6% Emprende / 2% Pro**, dentro de los rangos del documento maestro. El precio mensual de Pro queda por definir; la interfaz lo indica expresamente.
- Los pedidos conservan el precio, comisión y plazo de liquidación de su venta. Cambiar el plan o editar/archivar un producto no recalcula pedidos históricos.
- Solo un pedido `paid` puede pasar a `dispatched` desde el panel del vendedor. Repetir el despacho se rechaza y no duplica el historial.
- El vendedor no puede registrar la recepción en el Punto LockBox, confirmar el QR, marcar un pago como liberado ni retirar dinero retenido.
- El saldo en garantía es el neto de los pedidos pagados aún no liberados. Una entrega confirmada sin liberación continúa retenida.
- Emprende tiene 48 horas desde `releasedAt`; Pro tiene disponibilidad inmediata tras la liberación. La solicitud de liquidación reserva el saldo disponible y queda pendiente, sin transferencia simulada automática.
- Un producto usado en un live activo no se puede editar, pausar o archivar hasta finalizarlo.
- No se crean nuevas compras desde el vendedor; los pedidos iniciales son fixtures de demostración. Por eso el cambio de plan no genera nuevas ventas automáticamente.
- Datos monetarios en centavos enteros, fechas ISO y presentación en `America/La_Paz`.
- El archivado conserva los pedidos históricos. Stock cero o negativo no se puede publicar; stock fraccionario se rechaza.

## Arquitectura

`src/lib/seller/model.ts` define los tipos del módulo; `domain.ts` contiene las reglas puras; `seed.ts` genera fixtures relativos al inicio de la demo; `codec.ts` valida el almacenamiento; `store.ts` adapta el estado al navegador mediante `useSyncExternalStore`.

Las pantallas viven en `src/components/seller/`, con CSS Module para mantener la estética sin alterar las páginas del comprador. `/vendedor` usa una página servidor que monta el panel cliente. La portada conserva su simulación de registro y envía al rol vendedor a esta nueva ruta.

El middleware omite Supabase exclusivamente para `/vendedor` y sus subrutas. **Ese bypass debe eliminarse cuando la ruta muestre datos reales**. El resto de rutas conserva el comportamiento del repositorio. El panel no debe usarse con información personal o financiera real.

La persistencia valida snapshots antes de usarlos y muestra un aviso si están dañados o el almacenamiento está bloqueado. Las acciones leen de nuevo el almacenamiento antes de escribir para conservar cambios secuenciales de otras pestañas. `localStorage` no ofrece transacciones para escrituras simultáneas; la demo no es un sistema multiusuario.

## Contrato propuesto para integrar el backend

Estos endpoints son **contratos para la siguiente integración**, no rutas de servidor implementadas en esta entrega. Sustituir el adaptador local por un adaptador HTTP, validando el JWT real de Supabase y el rol `vendedor`. El backend determina `seller_id` desde la sesión; nunca desde un ID suministrado por el cliente.

| Operación             | Endpoint propuesto                        | Restricción                                                                                |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| Cargar tienda         | `GET /api/seller/workspace`               | Solo datos del vendedor autenticado.                                                       |
| Crear producto        | `POST /api/seller/products`               | Zod; precio y stock válidos; SKU único.                                                    |
| Editar producto       | `PATCH /api/seller/products/:id`          | Propiedad del producto; no editar durante live.                                            |
| Publicar/pausar       | `PATCH /api/seller/products/:id/status`   | Stock para publicar; archivar con `is_active=false`.                                       |
| Iniciar live          | `POST /api/seller/live-sessions`          | Productos propios publicados, con stock; una sesión activa.                                |
| Finalizar live        | `PATCH /api/seller/live-sessions/:id/end` | Sesión propia activa.                                                                      |
| Despachar pedido      | `POST /api/seller/orders/:id/dispatch`    | Actualización atómica condicionada a `status='paid'`.                                      |
| Solicitar liquidación | `POST /api/seller/payouts`                | Cálculo servidor, saldo bloqueado y clave de idempotencia.                                 |
| Cambiar plan          | `POST /api/seller/subscriptions`          | Tarifas servidor; activar solo tras confirmación del proveedor si se cobran suscripciones. |

Los modelos tipados actuales definen la forma de las acciones y vistas. Para persistencia real, mapear `priceCents` a `products.price`, `category` a `categories.id`, imágenes a `product_images` y etiquetas a `tags/product_tags`, usando el esquema de `docs/db_structure.md`. El estado `draft/published/paused/archived` requiere un campo de publicación o una convención explícita: `is_active` por sí solo no distingue todos los estados. Los campos de liquidación son snapshots por pedido, no el plan actual del vendedor.

RLS debe verificar propiedad en productos y lives. Los cambios de escrow y QR se ejecutan solo desde los módulos del sistema/Punto LockBox. La transición y el historial de pedido deben ser una transacción, y los cambios de plan y liquidaciones deben conservar la idempotencia.

## Ejecutar y verificar

Usar Node.js **22 o superior**, requerido por la versión actual de Supabase del repositorio.

```sh
cd front-end
npm ci
npm run dev
# abrir http://localhost:3000/vendedor
npm run test:seller
npx tsc --noEmit
npx eslint src/components/seller src/lib/seller src/app/vendedor src/middleware.ts scripts/test-seller.mjs
npm run build
```

`/vendedor` no requiere variables de entorno. La portada y las otras rutas conservan su dependencia existente de Supabase. No se deben inventar credenciales para ellas.

## Recorrido de demostración

1. Abrir `/vendedor`; comprobar que resumen, pedidos y saldo están marcados como demo.
2. Crear un producto como borrador, publicarlo con stock y buscarlo por SKU.
3. Seleccionarlo en Live & ventas, iniciar el live, recargar y comprobar que continúa activo.
4. Finalizar el live; volver al catálogo y editar, pausar o archivar el producto.
5. Consultar un pedido pagado y marcar despacho. Verificar que el pago sigue en garantía y que no puede volver a despacharse.
6. En Mi saldo, solicitar una liquidación y comprobar que el disponible queda reservado. Recargar y comprobar la solicitud.
7. Cambiar el plan a Pro. Los pedidos anteriores conservan comisión y plazo.
8. Reiniciar la demo con confirmación para repetir el recorrido.

## Validación de esta entrega

- 14 pruebas del dominio: precios, stock, SKU, archivado, restricciones del live, despacho, comisiones históricas, liquidación y validación de datos guardados.
- TypeScript y ESLint pasan para el módulo y sus puntos de integración.
- Compilación de producción completa verificada con `next build --webpack`. En el entorno de Codex para Windows, Turbopack no pudo iniciar su proceso Node por permisos del sandbox; no se cambió el comando de build predeterminado del proyecto.
- Navegador Chrome: creación/edición/publicación, bloqueo del catálogo durante el live, persistencia tras recargar, despacho, descarga CSV, reserva de liquidación, cambio de plan y confirmación al reiniciar. Sin errores JavaScript.
- Revisión visual en escritorio (1440 px) y móvil (390 px), con las siete pantallas sin desbordamiento horizontal.
- Se retiró únicamente la prop `onBack` sin uso de la página del comprador: Next.js rechazaba esa firma en la compilación. Su comportamiento no cambia.

Pendiente para la fase de backend: adaptar los contratos HTTP propuestos, implementar JWT/RLS, integrar catálogo con el comprador y conectar escrow/QR a los módulos del equipo.
