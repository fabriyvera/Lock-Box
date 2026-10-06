# Frontend LockBox

Next.js 16 / React 19. El módulo `/vendedor` consulta y guarda datos en Supabase a través del backend Express. Conserva los colores y componentes del módulo inicial; no usa localStorage para guardar la tienda.

## Ejecutar

Usa Node.js 22 o superior (verificado con Node 24). Instala dependencias con `npm ci` y copia `.env.example` a `.env.local`.

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://anprldvvagovpyyenrif.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clave pública del proyecto>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<sitekey Turnstile>
```

También se acepta `NEXT_PUBLIC_SUPABASE_ANON_KEY` si usas la clave legacy. Publishable tiene prioridad; las variables vacías no configuran el cliente. Nunca uses una clave service_role en el frontend.

Inicia el backend y ejecuta `npm run dev`. Abre `/login` y entra con una cuenta de Supabase cuyo perfil sea `vendedor` y esté activo. Serás dirigido a `/vendedor`. El comprador de los fixtures no tiene acceso de login.

La portada y el shell `/vendedor` son públicos; los datos requieren una sesión validada por Express. El proxy de Next reemplaza la convención antigua `middleware.ts`. Las demás rutas devuelven un mensaje 503 claro cuando falta la configuración de Supabase.

## Verificación

- `npm run test:seller`: reglas de presentación, saldos y validación de snapshots.
- `npm run test:config`: claves modernas/legacy y configuración ausente.
- `npx tsc --noEmit`.
- `npm run build -- --webpack` (compilación verificada).
- `npm run lint`: incluye problemas previos en la portada y dashboard del comprador. El código modificado del vendedor, login y Supabase pasa ESLint.

Los lives siguen siendo simulados y los planes/liquidaciones son de prueba. Consulta [la documentación de la integración](../docs/BACKEND_SELLERS.md) para los fixtures, seguridad, pruebas y configuración del captcha local.
