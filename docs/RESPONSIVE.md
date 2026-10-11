# Adaptación responsive de LockBox

## Cambios

- **Portada (`/`)**: se sustituyeron alturas rígidas de `100vh` y recorte vertical por altura mínima y contenido natural. Las cuadrículas usan columnas `minmax(0, 1fr)`, con puntos de adaptación en 1100, 900 y 600 px. El menú móvil abre/cierra con un botón accesible, informa `aria-expanded` y se cierra al seleccionar una sección. Se respetan las preferencias de movimiento reducido. Los títulos, tarjetas y pie de página admiten ajuste de texto y filas.
- **Registro (`/` y `/register`)**: formulario compartido con ancho flexible, campos de 16 px para evitar zoom involuntario en móviles, etiquetas, autocompletado, avisos accesibles, bloqueo del doble envío y CAPTCHA compacto. La tarjeta y el selector de roles se apilan en pantallas pequeñas.
- **Login**: padding adaptable, campos legibles, enlaces que pueden envolver y CAPTCHA compacto para no desbordar la tarjeta. Se muestra un aviso cuando falta su configuración.
- **Comprador (`/dashboard`)**: el componente se separó de la página que protege el acceso. Se eliminó la capa fija de pantalla completa para usar desplazamiento natural. Lives, productos, checkout y llaves usan cuadrículas adaptables en 1100, 720 y 480 px; la navegación y sus pestañas se ajustan al espacio disponible. Se eliminaron paddings anidados innecesarios del enlace al live. Las compras siguen siendo demostrativas y se indica en pantalla.
- **Vendedor (`/vendedor`)**: se conservó su diseño adaptable y se reforzaron encabezados, barras de herramientas, métricas y formularios para evitar anchos mínimos de contenido. Navegación táctil de al menos 44 px. Los diálogos permiten desplazamiento vertical dentro de la altura visible; las tablas anchas conservan su desplazamiento horizontal interno. Cerrar sesión vuelve al login.
- **Global**: imágenes y controles tienen ancho máximo; foco visible con teclado. La paleta sigue centralizada en `globals.css`; se reutilizan los tokens existentes y Lucide. Se usa la fuente compartida del layout, eliminando una carga duplicada en la portada.

La distribución adaptable se declara en módulos CSS; se retiraron las propiedades de layout inline que impedían aplicar los breakpoints.

## Verificación y límites

- Build de producción de Next.js aprobado: `next build --webpack`.
- TypeScript aprobado en frontend y backend.
- 15 pruebas del dominio vendedor, 1 de configuración y 12 de API aprobadas.
- ESLint de archivos editados: sin errores; el catálogo comprador conserva advertencias por imágenes externas `<img>`.
- Se aplicó la revisión de React: componentes fuera del render, hooks estables, acceso validado en servidor, formularios reutilizados y controles/avisos accesibles.
- La revisión visual en navegador **queda pendiente**: el servidor de esta sesión anunció inicio, pero las conexiones locales devolvieron `EACCES`/timeout y el navegador no alcanzó la página. No se presenta esa prueba como aprobada ni se modificaron las pantallas abiertas del usuario.

Para la revisión visual del equipo, abrir `/`, `/register`, `/login`, `/dashboard` con un comprador y `/vendedor` con un vendedor a 360, 768 y 1280 px. Comprobar menú, formularios, CAPTCHA, encabezados, checkout demostrativo, llaves, catálogo, tablas y diálogos, incluyendo zoom y navegación con teclado. Solo las tablas deben requerir desplazamiento horizontal interno.

La conexión y migraciones del registro se documentan en [REGISTRO_PERFILES.md](REGISTRO_PERFILES.md). Para producción todavía se necesitan dominios/URL de callback autorizados en Auth, claves reales de Turnstile y una prueba de entrega de correo con SMTP configurado.
