# LockBox — Esquema de Base de Datos

> **Motor:** PostgreSQL (Supabase)
> **Normalización:** 3FN
> **Última actualización:** 2026

---

## Índice

- [Tipos ENUM](#-tipos-enum)
- [Tablas](#-tablas)
  - [1. profiles](#1-profiles)
  - [2. categories](#2-categories)
  - [3. products](#3-products)
  - [4. product_images](#4-product_images)
  - [5. tags](#5-tags)
  - [6. product_tags](#6-product_tags)
  - [7. live_sessions](#7-live_sessions)
  - [8. carts](#8-carts)
  - [9. cart_items](#9-cart_items)
  - [10. lockbox_points](#10-lockbox_points)
  - [11. orders](#11-orders)
  - [12. order_items](#12-order_items)
  - [13. order_status_history](#13-order_status_history)
  - [14. transactions](#14-transactions)
  - [15. payouts](#15-payouts)
  - [16. reviews](#16-reviews)
  - [17. disputes](#17-disputes)
  - [18. notifications](#18-notifications)
  - [19. plans](#19-plans)
  - [20. subscriptions](#20-subscriptions)
  - [21. reserved_usernames](#21-reserved_usernames)
- [Diagrama de relaciones](#-diagrama-de-relaciones)
- [Convenciones](#-convenciones)

---

## Tipos ENUM

| Nombre | Valores | Uso |
|--------|---------|-----|
| `user_role` | `comprador`, `vendedor`, `despachador`, `admin` | Rol del usuario |
| `order_status` | `pending`, `paid`, `dispatched`, `in_lockbox`, `ready`, `delivered`, `released`, `cancelled`, `refunded`, `disputed` | Estado del pedido |
| `transaction_type` | `escrow_retain`, `escrow_release`, `refund`, `payout`, `commission` | Tipo de transacción |
| `transaction_status` | `pending`, `completed`, `failed`, `reversed` | Estado de la transacción |
| `dispute_status` | `open`, `in_review`, `resolved`, `rejected` | Estado de la disputa |
| `live_status` | `scheduled`, `live`, `ended`, `cancelled` | Estado de una transmisión |
| `subscription_status` | `active`, `cancelled`, `expired`, `pending` | Estado de suscripción |
| `notification_type` | `order_update`, `payment`, `delivery`, `dispute`, `system`, `promotion` | Tipo de notificación |

---

## Tablas

### 1. `profiles`

Datos públicos del usuario. Vinculada a `auth.users` de Supabase.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, FK → `auth.users(id)` ON DELETE CASCADE | ID del usuario |
| `username` | `citext` | NOT NULL, UNIQUE, formato `^[a-z0-9._]{3,30}$` | Handle público (@fabricio_vera) |
| `role` | `user_role` | NOT NULL, default `comprador` | Rol del usuario |
| `full_name` | `text` | | Nombre completo |
| `bio` | `text` | | Biografía corta |
| `phone` | `text` | UNIQUE | Teléfono de contacto |
| `avatar_url` | `text` | | URL del avatar |
| `city` | `text` | | Ciudad |
| `is_verified` | `boolean` | NOT NULL, default `false` | Verificación KYC |
| `is_active` | `boolean` | NOT NULL, default `true` | Soft delete |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Fecha de creación |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Última actualización |

**Índices:**
- `idx_profiles_username` (username)
- `idx_profiles_role` (role)

**Validaciones de username:**
- No puede empezar ni terminar con `.`
- No puede tener `..` ni `__`

---

### 2. `categories`

Categorías del catálogo.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID de categoría |
| `name` | `text` | NOT NULL, UNIQUE | Nombre visible |
| `slug` | `text` | NOT NULL, UNIQUE | Versión para URL |
| `description` | `text` | | Descripción |
| `icon` | `text` | | Icono o emoji |
| `is_active` | `boolean` | NOT NULL, default `true` | Disponible |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Fecha de creación |

**Índices:**
- `idx_categories_slug` (slug)

---

### 3. `products`

Catálogo de productos publicados por vendedores.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID del producto |
| `seller_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE | Vendedor |
| `category_id` | `uuid` | FK → `categories(id)` ON DELETE SET NULL | Categoría |
| `title` | `text` | NOT NULL | Título |
| `description` | `text` | | Descripción |
| `price` | `numeric(10,2)` | NOT NULL, CHECK ≥ 0 | Precio |
| `stock` | `integer` | NOT NULL, default 0, CHECK ≥ 0 | Stock |
| `sku` | `text` | UNIQUE | Código interno |
| `is_active` | `boolean` | NOT NULL, default `true` | Visible |
| `is_featured` | `boolean` | NOT NULL, default `false` | Destacado |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Actualización |

**Índices:**
- `idx_products_seller` (seller_id)
- `idx_products_category` (category_id)
- `idx_products_active` (is_active)

---

### 4. `product_images`

Imágenes de cada producto (1:N).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID de imagen |
| `product_id` | `uuid` | FK → `products(id)` ON DELETE CASCADE | Producto |
| `url` | `text` | NOT NULL | URL en Storage |
| `alt_text` | `text` | | Texto alternativo |
| `position` | `integer` | NOT NULL, default 0 | Orden de visualización |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |

**Índices:**
- `idx_product_images_product` (product_id, position)

---

### 5. `tags`

Etiquetas para productos (generadas manual o por IA).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID de etiqueta |
| `name` | `text` | NOT NULL, UNIQUE | Nombre visible |
| `slug` | `text` | NOT NULL, UNIQUE | Versión URL |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |

---

### 6. `product_tags`

Relación N:M entre productos y etiquetas.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `product_id` | `uuid` | **PK compuesta**, FK → `products(id)` ON DELETE CASCADE | Producto |
| `tag_id` | `uuid` | **PK compuesta**, FK → `tags(id)` ON DELETE CASCADE | Etiqueta |
| `source` | `text` | NOT NULL, default `manual`, CHECK IN (`manual`, `ai`) | Origen |
| `confidence` | `numeric(3,2)` | | Confianza de la IA (0.00–1.00) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |

**Índices:**
- `idx_product_tags_product` (product_id)
- `idx_product_tags_tag` (tag_id)

---

### 7. `live_sessions`

Transmisiones en vivo (simuladas en el MVP).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID de sesión |
| `seller_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE | Vendedor |
| `title` | `text` | NOT NULL | Título del live |
| `description` | `text` | | Descripción |
| `scheduled_at` | `timestamptz` | | Programada para |
| `started_at` | `timestamptz` | | Inicio real |
| `ended_at` | `timestamptz` | | Fin |
| `status` | `live_status` | NOT NULL, default `scheduled` | Estado |
| `viewer_count` | `integer` | NOT NULL, default 0 | Espectadores |
| `cover_url` | `text` | | Portada |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |

**Índices:**
- `idx_live_sessions_seller` (seller_id)
- `idx_live_sessions_status` (status, scheduled_at)

---

### 8. `carts`

Carrito de compras por usuario (1:1).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID del carrito |
| `user_id` | `uuid` | NOT NULL, UNIQUE, FK → `profiles(id)` ON DELETE CASCADE | Usuario |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Actualización |

---

### 9. `cart_items`

Ítems dentro del carrito.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID del ítem |
| `cart_id` | `uuid` | FK → `carts(id)` ON DELETE CASCADE | Carrito |
| `product_id` | `uuid` | FK → `products(id)` ON DELETE CASCADE | Producto |
| `quantity` | `integer` | NOT NULL, CHECK > 0 | Cantidad |
| `added_at` | `timestamptz` | NOT NULL, default `now()` | Añadido |

**Restricciones:**
- UNIQUE (cart_id, product_id)

**Índices:**
- `idx_cart_items_cart` (cart_id)

---

### 10. `lockbox_points`

Puntos de entrega (tiendas aliadas).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID del punto |
| `manager_id` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | Despachador |
| `name` | `text` | NOT NULL | Nombre de la tienda |
| `address` | `text` | NOT NULL | Dirección |
| `city` | `text` | NOT NULL | Ciudad |
| `latitude` | `numeric(10,8)` | | Latitud |
| `longitude` | `numeric(11,8)` | | Longitud |
| `phone` | `text` | | Teléfono |
| `capacity` | `integer` | NOT NULL, default 50 | Capacidad |
| `is_active` | `boolean` | NOT NULL, default `true` | Operativo |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |

**Índices:**
- `idx_lockbox_points_city` (city)
- `idx_lockbox_points_manager` (manager_id)

---

### 11. `orders`

Pedidos. Entidad central del flujo escrow.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID del pedido |
| `buyer_id` | `uuid` | FK → `profiles(id)` ON DELETE RESTRICT | Comprador |
| `seller_id` | `uuid` | FK → `profiles(id)` ON DELETE RESTRICT | Vendedor |
| `lockbox_id` | `uuid` | FK → `lockbox_points(id)` ON DELETE RESTRICT | Punto de entrega |
| `status` | `order_status` | NOT NULL, default `pending` | Estado |
| `subtotal` | `numeric(10,2)` | NOT NULL, CHECK ≥ 0 | Subtotal |
| `commission_amount` | `numeric(10,2)` | NOT NULL, default 0, CHECK ≥ 0 | Comisión |
| `total_amount` | `numeric(10,2)` | NOT NULL, CHECK ≥ 0 | Total |
| `qr_code` | `text` | UNIQUE | Token QR |
| `qr_expires_at` | `timestamptz` | | Expiración del QR |
| `paid_at` | `timestamptz` | | Pago confirmado |
| `dispatched_at` | `timestamptz` | | Despachado |
| `delivered_at` | `timestamptz` | | Entregado |
| `released_at` | `timestamptz` | | Pago liberado |
| `cancelled_at` | `timestamptz` | | Cancelado |
| `notes` | `text` | | Notas |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Actualización |

**Índices:**
- `idx_orders_buyer` (buyer_id, created_at DESC)
- `idx_orders_seller` (seller_id, created_at DESC)
- `idx_orders_lockbox` (lockbox_id, status)
- `idx_orders_status` (status)
- `idx_orders_qr` (qr_code) WHERE qr_code IS NOT NULL

---

### 12. `order_items`

Detalle de productos por pedido.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID del ítem |
| `order_id` | `uuid` | FK → `orders(id)` ON DELETE CASCADE | Pedido |
| `product_id` | `uuid` | FK → `products(id)` ON DELETE RESTRICT | Producto |
| `quantity` | `integer` | NOT NULL, CHECK > 0 | Cantidad |
| `unit_price` | `numeric(10,2)` | NOT NULL, CHECK ≥ 0 | Precio histórico |
| `subtotal` | `numeric(10,2)` | NOT NULL, CHECK ≥ 0 | Subtotal |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |

**Índices:**
- `idx_order_items_order` (order_id)
- `idx_order_items_product` (product_id)

---

### 13. `order_status_history`

Historial de cambios de estado (trazabilidad).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID del evento |
| `order_id` | `uuid` | FK → `orders(id)` ON DELETE CASCADE | Pedido |
| `status` | `order_status` | NOT NULL | Estado nuevo |
| `changed_by` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | Autor del cambio |
| `comment` | `text` | | Comentario |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |

**Índices:**
- `idx_order_status_history_order` (order_id, created_at DESC)

---

### 14. `transactions`

Movimientos financieros (escrow, liberaciones, reembolsos).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID de transacción |
| `order_id` | `uuid` | FK → `orders(id)` ON DELETE CASCADE | Pedido |
| `user_id` | `uuid` | FK → `profiles(id)` ON DELETE RESTRICT | Usuario afectado |
| `type` | `transaction_type` | NOT NULL | Tipo |
| `status` | `transaction_status` | NOT NULL, default `pending` | Estado |
| `amount` | `numeric(10,2)` | NOT NULL, CHECK ≥ 0 | Monto |
| `payment_method` | `text` | | Método |
| `external_id` | `text` | | ID en pasarela |
| `metadata` | `jsonb` | default `'{}'::jsonb` | Datos extra |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |
| `completed_at` | `timestamptz` | | Completado |

**Índices:**
- `idx_transactions_order` (order_id)
- `idx_transactions_user` (user_id, created_at DESC)
- `idx_transactions_status` (status)

---

### 15. `payouts`

Solicitudes de retiro del vendedor.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID del retiro |
| `seller_id` | `uuid` | FK → `profiles(id)` ON DELETE RESTRICT | Vendedor |
| `amount` | `numeric(10,2)` | NOT NULL, CHECK > 0 | Monto |
| `method` | `text` | NOT NULL, CHECK IN (`yape`,`bcp`,`transferencia`) | Método |
| `account_info` | `text` | | Datos de cuenta |
| `status` | `transaction_status` | NOT NULL, default `pending` | Estado |
| `requested_at` | `timestamptz` | NOT NULL, default `now()` | Solicitud |
| `processed_at` | `timestamptz` | | Procesado |

**Índices:**
- `idx_payouts_seller` (seller_id, requested_at DESC)

---

### 16. `reviews`

Reseñas y calificaciones.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID de reseña |
| `order_id` | `uuid` | FK → `orders(id)` ON DELETE CASCADE | Pedido |
| `author_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE | Autor |
| `target_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE | Calificado |
| `product_id` | `uuid` | FK → `products(id)` ON DELETE SET NULL | Producto |
| `rating` | `integer` | NOT NULL, CHECK entre 1 y 5 | Calificación |
| `comment` | `text` | | Comentario |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |

**Restricciones:**
- UNIQUE (order_id, author_id, product_id)

**Índices:**
- `idx_reviews_target` (target_id, created_at DESC)
- `idx_reviews_product` (product_id)

---

### 17. `disputes`

Disputas abiertas por compradores.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID de disputa |
| `order_id` | `uuid` | FK → `orders(id)` ON DELETE CASCADE | Pedido |
| `opened_by` | `uuid` | FK → `profiles(id)` ON DELETE RESTRICT | Apertura |
| `resolved_by` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | Resolución |
| `reason` | `text` | NOT NULL | Motivo |
| `description` | `text` | | Descripción |
| `status` | `dispute_status` | NOT NULL, default `open` | Estado |
| `resolution` | `text` | | Resolución |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |
| `resolved_at` | `timestamptz` | | Resuelto |

**Índices:**
- `idx_disputes_order` (order_id)
- `idx_disputes_status` (status)

---

### 18. `notifications`

Notificaciones para usuarios.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID |
| `user_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE | Destinatario |
| `type` | `notification_type` | NOT NULL | Tipo |
| `title` | `text` | NOT NULL | Título |
| `body` | `text` | | Cuerpo |
| `reference_id` | `uuid` | | Referencia (order_id, etc.) |
| `is_read` | `boolean` | NOT NULL, default `false` | Leída |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |

**Índices:**
- `idx_notifications_user` (user_id, is_read, created_at DESC)

---

### 19. `plans`

Planes de suscripción (Emprende, Pro).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID del plan |
| `code` | `text` | NOT NULL, UNIQUE | Código interno |
| `name` | `text` | NOT NULL | Nombre visible |
| `description` | `text` | | Descripción |
| `monthly_price` | `numeric(10,2)` | NOT NULL, default 0, CHECK ≥ 0 | Precio mensual |
| `commission_rate` | `numeric(5,4)` | NOT NULL, CHECK entre 0 y 1 | Comisión |
| `features` | `jsonb` | default `'[]'::jsonb` | Features |
| `is_active` | `boolean` | NOT NULL, default `true` | Disponible |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |

---

### 20. `subscriptions`

Suscripciones activas de cada vendedor.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` | ID |
| `seller_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE | Vendedor |
| `plan_id` | `uuid` | FK → `plans(id)` ON DELETE RESTRICT | Plan |
| `status` | `subscription_status` | NOT NULL, default `active` | Estado |
| `started_at` | `timestamptz` | NOT NULL, default `now()` | Inicio |
| `expires_at` | `timestamptz` | | Expiración |
| `cancelled_at` | `timestamptz` | | Cancelación |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creación |

**Índices:**
- `idx_subscriptions_seller` (seller_id, status)
- `uniq_active_subscription` UNIQUE (seller_id) WHERE status = `active`

---

### 21. `reserved_usernames`

Usernames reservados por el sistema.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `username` | `citext` | **PK** | Username reservado |
| `reason` | `text` | | Motivo |

**Valores iniciales sugeridos:**
`admin`, `lockbox`, `soporte`, `help`, `root`, `api`, `login`, `register`

---

## Diagrama de relaciones

```
auth.users
   │
   ▼
profiles ◄──────┬──── products ────┬──── product_images
   ▲            │       │          │
   │            │       │          └──── product_tags ──── tags
   │            │       │
   │            │       └──── order_items
   │            │              ▲
   │            │              │
   │            │           orders ────┬──── order_status_history
   │            │              │       ├──── transactions
   │            │              │       ├──── disputes
   │            │              │       └──── reviews
   │            │              │
   │            │              └──── lockbox_points ◄── manager (profiles)
   │            │
   │            ├──── live_sessions
   │            ├──── carts ──── cart_items ──── products
   │            ├──── payouts
   │            ├──── notifications
   │            └──── subscriptions ──── plans
```

---

## 📏 Convenciones

| Convención | Descripción |
|------------|-------------|
| **PK** | `uuid` con `gen_random_uuid()` (excepto `profiles` que usa el `id` de `auth.users`) |
| **Fechas** | `timestamptz` con `default now()` |
| **Soft delete** | `is_active boolean default true` |
| **Snake_case** | Todos los nombres de columnas en `snake_case` |
| **Plural** | Nombres de tabla en plural |
| **Timestamps** | `created_at` y `updated_at` en todas las tablas mutables |
| **Índices** | Prefijo `idx_` + tabla + columnas |
| **FK ON DELETE** | `CASCADE` para dependencias débiles, `RESTRICT` para críticas |

---

## Notas de normalización

- **1FN**: Sin atributos multivaluados (arrays se modelan como tablas separadas).
- **2FN**: Atributos dependen completamente de la PK.
- **3FN**: Sin dependencias transitivas. Ejemplo: `order_items` guarda `unit_price` histórico para no depender del `products.price` actual.
- **Integridad referencial**: FKs garantizan consistencia entre entidades.

---

## Orden de creación

1. Extensiones: `citext`, `pgcrypto`
2. Tipos ENUM
3. Tablas base: `profiles`, `categories`, `plans`, `tags`, `lockbox_points`
4. Tablas dependientes: `products`, `live_sessions`, `carts`, `subscriptions`
5. Tablas de detalle: `product_images`, `product_tags`, `cart_items`
6. Tablas de pedido: `orders`, `order_items`, `order_status_history`
7. Tablas financieras: `transactions`, `payouts`
8. Tablas auxiliares: `reviews`, `disputes`, `notifications`, `reserved_usernames`

---

**Generado para el proyecto LockBox · Ingeniería de Sistemas · 8vo Semestre · 2026**