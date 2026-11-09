# Acceso desde los dominios de Vercel

Fecha: 9 de noviembre de 2026.

## Incidencia

El login desde `https://lock-box-d9wa-9zdhgev77-fabriyveras-projects.vercel.app` primero fallaba en Turnstile con el código `110200` (hostname no autorizado). Después de agregarlo al widget de Cloudflare, la verificación pasó, pero el formulario mostró «Error de conexión con el servidor».

La petición OPTIONS al backend respondió HTTP 204 con `Access-Control-Allow-Origin: https://lock-box-d9wa.vercel.app`, aunque el origen solicitado era el dominio largo. El navegador bloqueaba el acceso por CORS antes de poder iniciar sesión.

## Corrección

- `FRONTEND_URL` conserva el dominio principal y sigue definiendo el destino de confirmación de correo.
- La nueva variable opcional `CORS_ALLOWED_ORIGINS` acepta otros orígenes HTTP(S) separados por comas.
- CORS devuelve el origen coincidente de la lista y `Vary: Origin`. Se rechazan configuraciones con comodines, rutas, credenciales o parámetros.
- No se cambian las claves de Turnstile, las credenciales de usuarios ni las políticas de Supabase.

## Configuración en Vercel

En el proyecto **lockbox-backend**, ambiente **Production**, conservar:

```dotenv
FRONTEND_URL=https://lock-box-d9wa.vercel.app
```

Agregar:

```dotenv
CORS_ALLOWED_ORIGINS=https://lock-box-d9wa-9zdhgev77-fabriyveras-projects.vercel.app
```

Desplegar el backend después de cambiar la variable. El frontend existente usa el alias estable `https://lockbox-backend.vercel.app`, por lo que recibe la corrección sin reconstruirse. No autorizar globalmente `*.vercel.app`: la lista debe contener únicamente orígenes propios revisados.

En Cloudflare, ambos hostnames del frontend deben estar autorizados en el widget correspondiente a `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. El nombre visible «lockbox-backend» es solo una etiqueta del widget; los hostnames corresponden al sitio donde se presenta el formulario.

Para el uso habitual se recomienda `https://lock-box-d9wa.vercel.app/login`. Cada URL nueva de despliegue requiere autorización explícita tanto en Turnstile como en CORS si se desea iniciar sesión desde ella.

## Verificación

- `npm test` con Node 24: 22 pruebas aprobadas, incluidas las nuevas pruebas de CORS.
- `npm run build`: TypeScript aprobado.
- Las pruebas verifican OPTIONS, POST de login y GET de perfil desde ambos orígenes autorizados; comprueban que otros sitios no reciban autorización CORS.
- Para comprobar producción: iniciar sesión con una cuenta de prueba desde el dominio principal y desde el dominio largo; ambos deben abrir el panel correspondiente.

Referencia: [administración de hostnames de Turnstile](https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/).
