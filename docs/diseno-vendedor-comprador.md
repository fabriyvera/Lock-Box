# Diseño de los módulos de vendedor y comprador

Fecha: 20 de noviembre de 2026. Rama: `feat/home-design-guidelines`.

## Tema compartido

Los espacios de vendedor y comprador usan el mismo tema claro de la portada,
el inicio de sesión y el registro. `src/app/globals.css` es la fuente de colores:
la clase `app-theme` comparte los tokens de `home-theme`.

- Fondo claro, superficies blancas y textos azul oscuro.
- Verde petróleo para acciones principales y selecciones; azul para el foco.
- Estados con texto e indicadores: éxito, información, advertencia y error.
- Variantes de transparencia recalculadas dentro del tema claro, para evitar
  que hereden colores calculados desde el tema oscuro.
- Colores de categoría del catálogo adaptados a superficies claras.
- Código QR en negro sobre blanco para conservar su legibilidad.

Los componentes consumen variables semánticas mediante CSS Modules y Tailwind.
Los metadatos `themeColor` de `/vendedor`, `/comprador` y `/dashboard` coinciden
con el fondo claro, siguiendo el patrón de las páginas de acceso.

## Vendedor

Se actualizaron resumen, catálogo, editor de productos, lives, pedidos, saldo,
planes y perfil de tienda. Las tarjetas tienen bordes suaves, mayor legibilidad
y distribución adaptable. La tabla conserva el desplazamiento horizontal y
ahora se puede enfocar con teclado; sus encabezados identifican cada columna.

El gráfico de ventas incluye una opción «Ver importes por día», que permite
consultar los valores completos cuando las etiquetas del gráfico se acortan.
Los errores de precio y stock aparecen junto al campo correspondiente y lo
enfocan. Los errores generales del editor conservan el formulario y reciben foco.

## Comprador

Se actualizaron catálogo, filtros, carrito, compra de prueba, pedidos, QR,
cancelación, reseñas y reclamos. Se reemplazaron los textos blancos sobre
superficies claras por colores semánticos. El carrito distribuye cada artículo
en columnas adaptables, con controles de cantidad y eliminación accesibles.

La selección del punto usa radios agrupados con una leyenda; los métodos de
pago, categorías, filtro de live y puntuaciones comunican su selección mediante
atributos accesibles. Se solicita confirmación antes de quitar un artículo,
incluida la reducción de su cantidad de una unidad a cero.

## Navegación, formularios y diálogos

- Enlaces «Saltar al contenido» y un título principal en cada espacio.
- Secciones principales representadas en `?vista=...`, mediante la API nativa
  de historial compatible con Next.js. Se conserva la apertura de enlaces en
  otra pestaña y la navegación con Atrás/Adelante.
- Foco visible, controles de al menos 44 px de alto, nombres de formulario,
  etiquetas vinculadas y tamaños de entrada adecuados para móvil.
- Iconos decorativos ocultos a lectores de pantalla y avisos de carga/guardado
  anunciados mediante regiones de estado.
- Diálogos nativos con identificadores únicos, Escape, cierre desde el fondo
  exterior y devolución del foco al control que los abrió.
- Advertencias de cambios sin guardar al recargar/cerrar, al seguir enlaces y
  al cerrar los formularios modales de producto, reseña y reclamo.
- Movimiento reducido, contención del desplazamiento de diálogos, áreas seguras
  y tratamiento de nombres largos. El catálogo puede omitir el renderizado de
  tarjetas fuera de pantalla mediante `content-visibility`.

## Funcionalidad conservada

Se mantienen los stores conectados, endpoints y formatos de solicitudes:
catálogo, publicaciones, lives, despacho, planes, perfil, liquidaciones, carrito,
compra, cancelación, reseña y reclamo utilizan las acciones existentes. Las
restricciones de stock, elegibilidad y comisiones siguen en la lógica existente.
La creación de pedidos y los pagos continúan siendo de prueba; no se agregaron
cobros reales ni cambios de base de datos en este trabajo.

## Verificación

- Compilación de producción con Next.js y TypeScript.
- ESLint de los componentes de ambos módulos y de sus páginas.
- 15 pruebas existentes de vendedor, 7 del modelo de comprador y 3 de solicitudes
  del comprador: 25 aprobadas. Las pruebas del modelo de comprador incluyen el
  flujo local de demostración; no sustituyen una prueba del backend conectado.
- Revisión local de 15 escenarios de renderizado SSR con datos de prueba:
  las 7 vistas del vendedor, las 2 del comprador, carrito, compra, editor,
  estado de error y catálogos/pedidos vacíos. Se comprobaron títulos, enlaces,
  nombres de campos y agrupaciones. Esta revisión no ejecuta eventos de navegador.

La revisión visual y los flujos interactivos completos quedan pendientes: la
herramienta de control del navegador no está disponible en esta sesión. No se
hicieron operaciones de prueba contra la base de datos de producción.

Para la revisión manual, comprobar a 360, 768 y 1280 px, y con zoom al 200 %:
selecciones de navegación y Atrás/Adelante; acceso por teclado a tablas y
diálogos; foco al cerrar; campos inválidos; nombres largos; cancelación y
confirmación al descartar cambios. Con cuentas de prueba, comprobar también
catálogo → carrito → compra → pedidos y las operaciones del vendedor.

## Referencias

- [Web Design Guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines).
- [Reglas incluidas en la skill](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/references/command.md).
- Documentación de Next.js 16 incluida con la dependencia: CSS, componentes de
  servidor/cliente y navegación con la API nativa de historial.
