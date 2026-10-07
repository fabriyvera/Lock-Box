# Estilos del frontend

## Colores centralizados

`front-end/src/app/globals.css` es la única fuente de valores de color. La paleta mantiene los fondos azul oscuro y unifica el verde de marca en `accent`.

Los tokens tienen nombres por función: `canvas`, `surface`, `surface-raised`, `foreground`, `text-secondary`, `text-muted`, `border`, `accent`, `info`, `warning` y `danger`. Las ilustraciones de categorías tienen tokens `product-*` para conservar su identidad visual. Las transparencias se derivan con `color-mix`, sin duplicar valores RGB.

Tailwind v4 publica los tokens con `@theme static`, incluidos los usados únicamente por CSS Modules o estilos inline. La paleta predeterminada de Tailwind se desactiva para que las nuevas pantallas utilicen el mismo tema.

### Cómo utilizarlos

- Tailwind: `bg-surface text-foreground border-border`, `hover:bg-accent-hover`.
- CSS Modules: `background: var(--color-surface); color: var(--color-text-muted);`.
- Estilos inline / SVG: `color: 'var(--color-accent)'`, `fill="var(--color-accent)"`.
- Transparencia adicional en Tailwind: `bg-surface/50`; para estados compartidos, usar `accent-soft`, `accent-border`, etc.

No declarar colores hexadecimales, RGB ni variables de color locales en los componentes. Agregar un token semántico aquí solamente cuando un nuevo uso lo justifique; reutilizar los existentes para mantener consistencia.

La portada, acceso, registro, panel comprador y módulo vendedor consumen el tema común. Se conservan los estados de éxito, advertencia, información y error, además de los colores del autofill, sombras, gráficas y ventanas emergentes.

## Iconos

Se utiliza [Lucide React](https://lucide.dev/guide/react/), que ya estaba instalado y se empleaba en el módulo vendedor. No se agrega otra dependencia. Los imports nombrados permiten incluir únicamente los iconos utilizados; evitar imports dinámicos de todo el catálogo.

La portada, las dos vistas de registro y el panel comprador sustituyen emojis por SVG: roles, servicios, pasos de compra, métodos de pago, espectadores, etiquetas de productos, ubicación, cuenta, navegación y llaves. La ubicación conserva el texto «Bolivia» en lugar de depender de una bandera. El estado de pago muestra `LoaderCircle` y respeta la preferencia de reducir movimiento.

`front-end/src/components/ui/DecorativeIcon.tsx` uniforma tamaño y alineación. Sus iconos heredan `currentColor`, son decorativos (`aria-hidden`, `focusable=false`) y deben acompañar una etiqueta visible. Para controles sin texto, poner una etiqueta accesible en el botón. Las ilustraciones de QR y el logotipo de TikTok conservan sus SVG originales.

Ejemplo: `<DecorativeIcon icon={Store} size={28} className="text-accent" />` junto a la etiqueta «Vendedor».

La barra del comprador se extrae a un componente estable fuera del render para evitar que se recree al cambiar el estado. También se escapan las comillas del texto de la portada que impedían completar la revisión de ESLint.

## Validación

- 15 pruebas del módulo vendedor y 1 prueba de configuración: aprobadas.
- TypeScript: sin errores.
- ESLint de las pantallas modificadas y el componente de iconos: sin errores. Permanecen 8 advertencias existentes sobre imágenes sin optimización y fuentes incluidas en la portada.
- Compilación de producción con `next build --webpack`: aprobada, incluidas portada, acceso, registro, comprador y vendedor. Se usó la configuración original; no se agregaron cambios de compilación al repositorio.
- Auditoría: 65 tokens emitidos en el CSS de producción, sin referencias a tokens inexistentes ni valores hex/RGB/HSL de color fuera de `globals.css`. Los números de direcciones se mantienen como datos.
- No quedan emojis en `front-end/src`; las etiquetas de botones y estados se mantienen junto a los iconos.
- Revisión React: imports estáticos, componente de navegación estable, sin nuevos efectos ni cambios en el orden de los hooks; iconos decorativos ocultos para lectores de pantalla.

La comprobación visual e interactiva en navegador queda pendiente: el servidor local no fue accesible desde el navegador de verificación, y la política del navegador rechazó abrir una previsualización con protocolo `file:`. Estas comprobaciones no prueban una sesión autenticada de vendedor ni acciones contra la base de datos.

Entrega en dos commits separados en `backend-sellers`: centralización de colores y sustitución de emojis por Lucide.
