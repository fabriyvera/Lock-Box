# Categorías, tallas y puntos en Google Maps

Aplicar las migraciones en orden: `20261123164453_product_categories_sizes.sql` y `20261125122043_lockbox_point_maps.sql`, antes de desplegar el backend y el frontend.

Las migraciones conservan los productos, puntos, pedidos y asignaciones existentes. Los productos sin tallas siguen siendo válidos; para productos con tallas el stock total debe coincidir con la suma de sus variantes. Cada talla tiene stock independiente y comparte el precio del producto. Los pedidos guardan talla y categoría como datos históricos, y la cancelación devuelve el stock a la talla comprada.

El registro nuevo solicita ciudad, latitud y longitud. El backend conserva compatibilidad con clientes anteriores que omiten ambas coordenadas; rechaza pares incompletos o fuera de rango. La base valida también los metadatos del registro directo. El comprador recibe únicamente puntos activos y puede buscarlos por nombre, ciudad o dirección, seleccionarlos en el mapa o en la lista y usarlos durante la compra.

Se usan los 10 puntos previamente georreferenciados sin duplicarlos. Por solicitud del propietario se asigna una ubicación **provisional** a Almacén Pérez (`-16.5100000, -68.1290000`), identificada mediante `location_is_approximate=true`. No representa una entrada verificada. Los tres puntos de demostración sin coordenadas permanecen en la lista sin marcadores inventados. Esta integración muestra marcadores dentro de LockBox; no crea fichas públicas de negocios en Google Maps.

En Vercel, proyecto frontend `lock-box-d9wa`, configurar en Production:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: clave de navegador restringida a los dominios de LockBox y a Maps JavaScript API + Geocoding API.
- `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`: ID de mapa JavaScript del mismo proyecto de Google Cloud.

Google Cloud debe tener facturación activa y ambas APIs habilitadas. El cargador envía el origen como referencia: las restricciones deben permitir el dominio sin exigir una ruta. Las variables públicas se incorporan durante la compilación; cambiarlas requiere volver a desplegar. Nunca se usa una clave de servicio de Supabase en el navegador.

Pruebas transaccionales: `product-sizes-verify.sql` y `lockbox-point-maps-verify.sql`. Ambas revierten sus datos de prueba. Después del despliegue, verificar el mapa del registro de operador, buscar una dirección y seleccionar un marcador; en comprador, revisar Puntos LockBox y la selección durante checkout. Si Google no carga, la lista y las coordenadas siguen disponibles.
