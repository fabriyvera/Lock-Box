# Diseño del módulo del punto de recojo

Fecha: 21 de noviembre de 2026. Rama de trabajo: `feat/home-design-guidelines`.

## Diseño compartido

El módulo `/punto-recojo` y la pantalla de punto sin asignar usan `app-theme`,
el mismo tema claro del vendedor y comprador. Todos los colores proceden de
`front-end/src/app/globals.css`: fondo claro, superficies blancas, texto azul
oscuro y verde petróleo para acciones principales. La barra del navegador
coincide con el fondo de la página.

Se adaptaron tarjetas de capacidad y entregas, selector del punto, lector de
códigos, pedidos y actividad reciente. Los estados incluyen texto además de
colores; se distinguen pedidos en camino, recibidos, listos y entregados.

## Accesibilidad y adaptación

- Enlace para saltar al contenido, encabezados ordenados y foco visible.
- Controles con etiquetas, nombres de formulario y altura mínima de 44 px.
- Entrada de códigos sin autocapitalización ni corrección ortográfica. El campo
  admite pegado y lectores que escriben como teclado, igual que antes.
- Error junto al campo cuando falta el código, con foco para corregirlo.
- Foco en el resultado de consulta y en errores del servidor. Tras guardar y
  actualizar los datos, el foco vuelve al campo de código.
- Mensajes de carga y guardado anunciados como estados. Los indicadores de
  movimiento respetan la preferencia de movimiento reducido.
- Diseño en una columna en pantallas pequeñas, botones adaptables, áreas
  seguras y tratamiento de nombres, direcciones y productos largos.
- Diálogo nativo compartido para revisar cada transición, con resumen del
  pedido, comprador, punto, estado actual y siguiente estado. Cancelarlo no
  escribe datos. Escape y cierre devuelven el foco; durante una solicitud,
  se impide cerrar la confirmación o enviar una segunda escritura.

## Flujo conservado

1. Seleccionar un punto asignado.
2. Consultar el código del pedido.
3. Revisar y confirmar la siguiente acción permitida:
   `dispatched → in_lockbox → ready → delivered`.
4. Actualizar los indicadores y actividad desde el backend.

Se conservan `pointRequest`, autenticación, selección de puntos, consulta por
código y formato del `PATCH` (`qrCode` y `status`). También se mantiene la
distinción entre un fallo al guardar y un fallo de actualización posterior a
un guardado exitoso. No se agregan integraciones de cámara, cambios de permisos,
tablas o cobros reales.

## Verificación

- Compilación de producción con Next.js y TypeScript.
- ESLint de los componentes modificados y de la prueba nueva.
- 38 pruebas aprobadas del frontend, incluidas las pruebas existentes de autenticación,
  configuración, vendedor, comprador, solicitudes y estados del punto.
- Tres pruebas nuevas de los manejadores reales del módulo, con API simulada:
  validación de códigos y codificación de URL; revisión/cancelación y formato
  de solicitud de las tres transiciones; protección contra escrituras dobles
  y aviso cuando falla la actualización después de guardar.
- 6 pruebas aprobadas de la API del punto con un servidor y base simulados:
  autenticación, perfiles activos, consulta, formato de transiciones y errores.

Ejecutar las nuevas pruebas con `npm run test:point:workspace` desde `front-end`.
Estas pruebas verifican el comportamiento de los manejadores, no el navegador
ni la base de datos de producción.

La revisión visual e interacción real quedan pendientes porque no hay una
herramienta de control del navegador disponible en esta sesión. Para revisión
manual: probar a 360, 768 y 1280 px; zoom al 200 %; navegación con teclado;
Escape y devolución del foco; códigos vacíos e inválidos; cambio de punto;
cancelación del diálogo y las tres confirmaciones con pedidos de prueba.

## Referencia

Se aplicaron los [Web Design Guidelines de Vercel](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines)
y sus [reglas incluidas](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/references/command.md),
usando los tokens y componentes compartidos del proyecto.
