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
