# Integración de buyers en main

Fecha: 12 de octubre de 2026.

Se integra `buyers` (`4d403aa`) con `main` (`3fe13b9`) mediante un commit de merge, conservando los dos historiales.

## Módulo del comprador

El nuevo módulo reúne catálogo y filtros de Live, carrito, checkout de prueba, pedidos, cancelaciones, reseñas y disputas. Sustituye el antiguo componente del comprador en `/dashboard` y también se presenta en `/comprador`. Ambas rutas exigen una sesión y perfil comprador activo mediante `requireProfile`; el login mantiene `/dashboard` como destino compatible.

Este aporte es un **MVP de demostración local**: persiste catálogo, carrito y pedidos en `localStorage`, con la clave `lockbox.buyer.demo.v1`. No consulta ni modifica las tablas de Supabase; solo la sesión y el perfil de acceso usan Auth y la base de datos existente. No activa pagos, reembolsos, retiros ni disputas reales. La interfaz y el checkout lo indican expresamente y los códigos creados usan el prefijo `LBX-DEMO-`; no permiten retirar pedidos desde el módulo del punto.

## Resolución de conflictos y adaptación

- El conflicto `add/add` de `BuyerDashboard.tsx` se resuelve integrando el componente de `buyers`, con el nombre del perfil y exports compatibles con ambas rutas.
- Se conservan `proxy.ts` y la integración actual de Supabase. La rama antigua reintroducía `middleware.ts`; esos archivos no se incorporan porque Next.js 16 ya usa el proxy y no admite las dos convenciones simultáneamente.
- Los colores de los seis componentes usan los tokens existentes de `globals.css`. Se reemplazan emojis y cruces de cierre por Lucide, manteniendo la paleta centralizada y sus variantes de transparencia.
- Catálogo y pedidos se pueden navegar también en móvil. Se agrega cierre de sesión, encabezado flexible, controles de 44 px, nombres accesibles y controles legibles según el estilo global.
- Los modales reutilizan el diálogo nativo del proyecto; el carrito usa un diálogo lateral nativo. Incluyen Escape, foco y retorno al control de origen.
- Las imágenes usan `next/image` con dimensiones explícitas y `unoptimized`, conservando las URLs externas de demostración sin necesitar reglas nuevas de optimización remota.
- Se usan fechas de seed deterministas y formato explícito de Bolivia para evitar diferencias entre la renderización del servidor y la del navegador.
- El carrito rechaza cantidades fraccionarias/negativas y respeta el stock del catálogo. La cancelación restaura inventario una sola vez; una entrega simulada no puede revivir pedidos cancelados.
- Cada pedido de prueba tiene un UUID y un código distinto. Se validan reseñas/disputas y la estructura anidada de los snapshots para recuperar datos dañados sin romper el renderizado.

No se cambian el registro, el celular de 8 dígitos, CAPTCHA, vendedor, administración del punto, esquema de base de datos ni dependencias del proyecto.

## Verificación local

49 pruebas aprobadas: backend (18), comprador (7), vendedor (15), formularios de acceso (6), flujo del punto (2) y configuración (1). Las siete pruebas nuevas cubren seed determinista, cantidades/stock, checkout local, códigos distintos, cancelación, reseñas/disputas y snapshots dañados.

TypeScript del frontend y ESLint de los archivos del comprador sin errores. `next build --webpack` aprobado: `/comprador`, `/dashboard`, `/admin` y `/vendedor` se compilan como rutas dinámicas protegidas.

## Verificación en Vercel

El proyecto de la URL previamente compartida es `lock-box-d9wa` (`prj_RST8Gf9wBhZhVzxlNwwAMbwr8uKB`), conectado a `fabriyvera/Lock-Box`. Su alias de producción es [lock-box-d9wa.vercel.app](https://lock-box-d9wa.vercel.app).

El merge publicado es `cbdd8ad804213abbdbb3456227fda1e0fcfdd61b`. Su primer despliegue falló al prerenderizar `/comprador`: en el proyecto frontend solo se habían agregado variables del backend (`SUPABASE_*` y `TURNSTILE_SECRET_KEY`).

Se agregaron en el entorno **Production** de `lock-box-d9wa` los nombres que realmente consume Next.js: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. La URL raíz y la clave publicable corresponden al mismo proyecto Supabase existente; la site key es la usada por el frontend local. No se expuso `service_role` ni el secreto de Cloudflare.

El redeploy del mismo commit, `dpl_AVpKJXqfgejxZyF7EAM3gYrVYGgk`, terminó en **READY**, target **production**, sin errores al asignar aliases. URL exacta: [lock-box-d9wa-h7p38btnb-fabriyveras-projects.vercel.app](https://lock-box-d9wa-h7p38btnb-fabriyveras-projects.vercel.app). La compilación duró aproximadamente 54 segundos.

Se comprobó en el navegador que el alias de producción carga la portada, `/comprador` redirige a `/login` sin sesión y `/register` muestra el formulario, celular de 8 dígitos y CAPTCHA pendiente hasta completar los datos. No aparecieron errores de consola en estas comprobaciones.

El conector permite consultar metadatos, pero devolvió 403 al acceder a los logs y al bypass de protección del equipo `fabriyveras-projects`. Se pudo leer el fallo de compilación desde el panel web con la sesión existente y corregir la configuración. No se desactivó Deployment Protection. `READY` no implica que se hayan probado pagos o recorridos de una cuenta real.

Existe además un proyecto distinto llamado `lock-box` (`prj_X1m39iADjusqDqthwpgD7TqiJaOB`) con errores anteriores al merge. No se cambió su configuración ni se lo confundió con el frontend de `lock-box-d9wa`.

## Backend pendiente de hosting

El usuario confirmó que el backend todavía no tiene hosting. Por ello no se configuró una URL ficticia ni `localhost` como `NEXT_PUBLIC_API_URL` de producción. La página está publicada, pero el login, registro y módulos que llaman a Express necesitan que la API se publique y luego se configure esa variable. El comprador integrado continúa siendo una demo local.

Una opción para el siguiente paso es un proyecto separado de Vercel con raíz `back-end`, framework Express y variables privadas del backend, como describe la [documentación oficial de Express en Vercel](https://vercel.com/docs/frameworks/backend/express). Después debe configurarse `FRONTEND_URL` con el alias real del frontend y `NEXT_PUBLIC_API_URL` con la URL HTTPS de la API, verificar `/api/health` y probar una sesión completa.
