# Desarrollo local y fuentes de LockBox

Fecha: 12 de octubre de 2026. Rama: `backend-sellers`.

La misma rama funciona en WSL y Vercel. Los archivos locales `.env`/`.env.local` definen las URL de localhost; Vercel utiliza sus propias variables por proyecto. Un deploy no obliga a utilizar el backend publicado durante el desarrollo.

## Corrección de la fuente

El error `next/font/google queries have exactly one entry` ocurre al resolver archivos de Google Fonts en Next.js/Turbopack. Hay un [reporte con el mismo mensaje en Next.js](https://github.com/vercel/next.js/issues/99114): algunas respuestas de Google contienen URL sin extensión y parámetros que el cargador interpreta incorrectamente. Es un fallo de carga de fuentes, independiente de Auth, Supabase o la configuración de producción.

`src/app/layout.tsx` ahora usa `next/font/local` con Inter Variable 4.1, descargada del [repositorio oficial de Inter](https://github.com/rsms/inter/blob/v4.1/docs/font-files/InterVariable.woff2). Se conserva `--font-inter`, `display: swap` y soporte de pesos 100–900. El archivo original y su licencia SIL Open Font License 1.1 están en `src/app/fonts`. La compilación ya no consulta Google para obtener esta fuente.

`npm run dev` ejecuta `next dev --webpack` y `npm run build` ejecuta `next build --webpack`. Next.js [admite esta opción en desarrollo y producción](https://nextjs.org/docs/app/api-reference/cli/next). No se instala el módulo interno `@vercel/turbopack-next`: ese nombre forma parte del cargador de Next, no es una dependencia que deba agregarse a LockBox.

## Ejecutar en WSL

Si tienes cambios propios pendientes, guárdalos en un commit antes de actualizar la rama. Detén los servidores anteriores con Ctrl+C.

```bash
cd ~/lock-box
git switch backend-sellers
git pull --ff-only origin backend-sellers
```

En `front-end/.env.local`, conserva tus claves públicas de Supabase y configura:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://anprldvvagovpyyenrif.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clave pública existente>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site key para desarrollo>
```

En `back-end/.env`, conserva las claves del mismo proyecto y utiliza:

```dotenv
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://anprldvvagovpyyenrif.supabase.co
SUPABASE_PUBLISHABLE_KEY=<clave pública existente>
TURNSTILE_SECRET_KEY=<secret key correspondiente al widget>
```

Cada línea anterior corresponde a un archivo `.env`. En la interfaz de Vercel, Name y Value son campos separados. No reemplaces las claves existentes por los textos entre `< >`.

Primera terminal:

```bash
cd ~/lock-box/back-end
npm ci --include=dev
npm run dev
```

Segunda terminal:

```bash
cd ~/lock-box/front-end
npm ci --include=dev
npm run dev
```

Abre `http://localhost:3000` y comprueba `curl http://localhost:4000/api/health`. Para el nuevo módulo, registra un Punto LockBox en `/register`; su sesión abrirá `/punto-recojo`.

Si mantienes un widget real de Turnstile, autoriza el hostname `localhost` en ese widget y utiliza las claves del mismo widget en ambos servicios. Para pruebas automáticas o locales puedes usar el par público de prueba de [Cloudflare](https://developers.cloudflare.com/turnstile/troubleshooting/testing/): site key `1x00000000000000000000AA` y secret key `1x0000000000000000000000000000000AA`. Este par acepta siempre la prueba; úsalo exclusivamente en los archivos locales, no en Vercel Production.

Las pruebas locales con estas URL siguen conectadas al proyecto Supabase configurado: un registro crea datos reales allí. No requieren ejecutar PostgreSQL ni Supabase localmente. Para aislamiento total se necesita otro proyecto de pruebas o una instancia local con sus migraciones.

## Producción

Conserva en Vercel `NEXT_PUBLIC_API_URL=https://lockbox-backend.vercel.app`, `FRONTEND_URL=https://lock-box-d9wa.vercel.app` y las claves reales de Turnstile. Los archivos locales están ignorados por Git y no se suben. Las migraciones del rol de punto ya están aplicadas; no hace falta repetirlas para iniciar los servidores.

La fuente local se empaqueta automáticamente con Next.js. No requiere un servicio de fuentes ni variables adicionales. Cuando este commit llegue a `main`, Vercel utilizará el mismo comando de build con Webpack.

## Verificación del cambio

- Arranque de Next.js en modo desarrollo con Webpack: `/register` responde HTTP 200 y renderiza la opción Punto LockBox; `/punto-recojo` sin sesión responde HTTP 307 hacia `/login`.
- Compilación de producción con Webpack y fuente local: aprobada, incluida la comprobación de TypeScript.
- ESLint de `src/app/layout.tsx`: aprobado.
- Archivo WOFF2 original verificado; SHA-256 `693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3`. Licencia incluida.
- No se cambia el registro, las políticas de datos ni la validación de CAPTCHA. Este ajuste no instala dependencias nuevas.
