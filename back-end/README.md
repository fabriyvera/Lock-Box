# Backend LockBox

Express + TypeScript + Supabase. El backend valida sesiones reales y entrega el estado del vendedor al frontend. Las operaciones escriben en la base mediante RPC transaccionales con validación de propietario y reglas de negocio.

## Ejecutar

Node.js 22 o superior (verificado con Node 24). Ejecuta `npm ci`, copia `.env.example` a `.env` y configura:

```dotenv
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://anprldvvagovpyyenrif.supabase.co
SUPABASE_PUBLISHABLE_KEY=<clave pública del proyecto>
TURNSTILE_SECRET_KEY=<secret Turnstile>
```

Se acepta `SUPABASE_ANON_KEY` como alternativa legacy. No se necesita service_role. El proceso falla con un mensaje de configuración si falta la URL o clave pública. `npm run dev` inicia el servidor; `npm run build` y `npm start` ejecutan la versión compilada.

## API

| Método y ruta              | Autorización                           | Resultado                                            |
| -------------------------- | -------------------------------------- | ---------------------------------------------------- |
| GET `/api/health`          | Público                                | Estado del servidor; no verifica conexión a Supabase |
| POST `/api/auth/login`     | Correo, contraseña y captcha           | Sesión real de Supabase y perfil activo              |
| GET `/api/seller/state`    | `Authorization: Bearer <access_token>` | `{ state: SellerState }` bajo RLS                    |
| POST `/api/seller/actions` | Mismo JWT, perfil vendedor activo      | `{ success: true, requestId }`                       |

Ejemplo de cuerpo para acciones:

```json
{
  "requestId": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  "action": { "type": "changePlan", "plan": "pro" }
}
```

Reutiliza exactamente el cuerpo y requestId cuando el resultado de una escritura sea incierto. Un reintento no repite el efecto. El frontend vuelve a consultar el estado después de cada operación; no actualiza saldos de forma optimista.

Acciones: `saveProduct`, `setProductStatus`, `startLive`, `endLive`, `dispatchOrder`, `changePlan`, `saveProfile`, `requestPayout`. La API rechaza campos adicionales (owner/role/montos de liquidación). UUID y fechas se validan; Supabase decide las fechas y los importes efectivos. Solo se puede despachar un pedido propio pagado. No existen acciones de vendedor para pagar, entregar por QR o liberar fondos.

Errores: 400 datos/reglas inválidos; 401 sesión ausente/inválida; 403 perfil o propiedad no autorizados; 409 conflicto; 500 fallo de base/conexión. Las respuestas de datos y login usan `Cache-Control: no-store`. CORS admite el origen configurado en `FRONTEND_URL`.

## Verificación y base de datos

`npm test` compila y ejecuta pruebas HTTP de autenticación, roles, validación, errores y transporte del JWT. `npm run typecheck` y `npm run build` verifican TypeScript. Las pruebas automáticas locales usan dobles de Supabase; también se realizaron pruebas reales contra el proyecto y el navegador, documentadas en [BACKEND_SELLERS.md](../docs/BACKEND_SELLERS.md).

El esquema y fixtures ya están aplicados en `LockBox's Project`. No vuelvas a ejecutar los DDL sobre ese proyecto. Los scripts en `../database` son la referencia incremental sobre el esquema original. Consulta el documento antes de reproducirlos en otro entorno.
