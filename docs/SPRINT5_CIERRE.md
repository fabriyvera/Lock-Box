# Revisión técnica del sprint 5

Fecha: 23 de noviembre de 2026. Referencia funcional: tabla 3.1, «Sprint 5. Administración, comisiones y cierre», del Documento Lock-Box. Este registro documenta la entrega técnica; la aprobación del equipo y el cierre académico corresponden a sus responsables y no se presumen firmados.

## Backlog y aceptación

| Trabajo del sprint | Resultado implementado | Evidencia |
|---|---|---|
| Planificación del módulo administrativo | Alcance, reglas, API, permisos y despliegue documentados | `SPRINT5_ADMINISTRACION_COMISIONES.md` |
| Diseño del cálculo de comisiones | Tarifa comprador Bs 8, punto Bs 4, costo estimado Bs 1,50 y contribución Bs 2,50; diagrama de actividades | Función `private.service_quote`, restricciones e instantáneas |
| Desarrollo y codificación de reportes | Panel `/admin`, periodos, resultados por punto/mes, pedidos, perfiles, auditoría y CSV | API y componentes de administración |
| Pruebas unitarias de comisiones | Redondeo, división de carritos por vendedor, precisión y CSV seguro | `front-end/scripts/test-sprint5.mjs`: 5 aprobadas |
| Pruebas de integración de administración | Autenticación, roles, fechas, campos inyectados y errores de negocio | Suite backend: 30 aprobadas, incluidas 4 nuevas de administración |
| Integración de entregas | Confirmación del saldo enviada al servidor, bloqueo de envío hasta marcarla y prevención de repetición | `test:point:workspace`: 3 aprobadas |
| Integridad en PostgreSQL | Cotización, checkout idempotente, pedidos históricos, permisos, QR, comisión única, liberación y exclusión de pruebas | `database/sprint5-verify.sql`, ejecutado con rollback |
| Verificación completa | API local → Supabase → pedido entregado/liberado → reporte administrativo | Pedido de prueba `6157b072-b6c7-4644-9dd4-931cec3572dc` |
| Compilación | TypeScript y build de producción frontend/backend | Verificados con Node 24.22.3 |
| Revisión visual | Login de administrador y panel con datos reales de Supabase | Navegador local, sin sesión inyectada |
| Exportación desde el navegador | Descarga CSV con el punto DEMO, un pedido y Bs 4 de comisión | Archivo descargado y contenido revisado |
| Calidad estática | Lint del frontend completo y verificación de espacios del diff | Se corrigieron dos nombres de variables de pruebas incompatibles con el lint de Next.js |
| Regresión de módulos existentes | Carrito y estado del comprador, formularios de acceso y separación de administración/punto | `test:buyer`: 7; `test:auth`: 7; `test:point`: 2 aprobadas |

## Resultado de la prueba completa

Se compró una lámpara ficticia de Bs 60 con la nueva versión: Bs 8 de servicio, Bs 38 de reserva y Bs 30 de saldo. El vendedor despachó, el punto recibió y preparó, la entrega exigió la declaración del saldo y el comprador liberó el pago simulado.

El reporte con pruebas incluidas registra un servicio: Bs 8 de ingreso, Bs 4 de comisión del punto, Bs 1,50 de otros costos estimados y Bs 2,50 de contribución. Repetir la entrega se rechazó y liberar el pago no generó otra comisión. Al excluir pruebas, los indicadores operativos permanecieron en cero. No se movió dinero real.

La cuenta `adminlockbox@gmail.com` se creó por petición expresa del usuario para revisar el módulo. El código no guarda su contraseña ni permite que el registro público elija el rol administrador.

En total se aprobaron 58 pruebas automáticas, además de las verificaciones transaccionales SQL y del recorrido contra Supabase. La activación final de los RPC públicos anteriores también se ensayó dentro de una transacción con rollback: no se dejó activada sobre `main`.

## Controles revisados

Se verificó la autorización en tres capas: página, API y RPC. Las tablas nuevas permanecen en esquema privado, con RLS, políticas explícitas de denegación y sin permisos directos de lectura/escritura para clientes. Los importes se generan en el servidor. No se concede acceso por datos de rol enviados desde el navegador ni por metadatos editables del usuario.

Se retiró el permiso anónimo de la liberación de pago y el permiso de clientes para ejecutar la liberación global. El acceso autenticado a la liberación individual conserva la validación de propiedad del comprador. El análisis de Supabase puede seguir mostrando esta función histórica como `SECURITY DEFINER` autenticada; su autorización interna se verificó. Las advertencias preexistentes sobre tablas de notificaciones/transacciones y protección de contraseñas filtradas no pertenecen a los objetos nuevos del sprint.

## Límites y cierre pendiente de aprobación

- El sistema sigue siendo un prototipo académico: no cobra tarjetas, QR bancario, escrow, comisiones ni liquidaciones reales.
- La verificación del saldo es una declaración manual del operador. No existe conciliación bancaria automática.
- La contribución no es utilidad neta ni reproduce la variación estacional de costos del estudio financiero de Tableau.
- La rutina histórica de liberación después de 48 horas no quedó programada por este sprint.
- Las comisiones históricas de planes permanecen en pedidos anteriores; no se recalcularon ni se cobraron tarifas retroactivas.
- La liberación de producción requiere desplegar ambas aplicaciones y ejecutar el script final de activación, según la guía. La rama técnica no equivale a un merge ni a una aprobación de cierre.

El equipo debe revisar la política de devoluciones y disputas para una operación comercial, aprobar la entrega del sprint y registrar su acta académica de cierre cuando corresponda.

