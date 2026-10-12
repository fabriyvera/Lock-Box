# Acceso directo y verificación de formularios

Fecha: 11 de octubre de 2026. Rama: `backend-sellers`.

## Inicio de sesión sin confirmación por correo

Se desactivó y guardó **Confirm email** en Supabase → Authentication → Sign In / Providers para **LockBox's Project** (`anprldvvagovpyyenrif`), según lo solicitado para esta etapa temprana. El servicio real confirmó `mailer_autoconfirm=true`, correo habilitado y registro habilitado.

El login utiliza `POST /api/auth/login` y `auth.signInWithPassword`: correo y contraseña, sin OTP ni enlaces mágicos. El correo anterior era la confirmación de registro configurada en Supabase, no un segundo factor implementado por el endpoint de login.

Con la confirmación desactivada, `auth.signUp` devuelve una sesión y `/api/auth/register` responde `201`. El frontend guarda esa sesión, consulta `GET /api/auth/me` y abre `/vendedor` o `/dashboard` según el rol persistido. No debe aparecer la pantalla «Revisa tu correo» en este modo.

El backend conserva la respuesta `202` y el callback como compatibilidad si el equipo vuelve a activar la confirmación en el futuro. No se omiten las contraseñas ni el CAPTCHA; se mantienen la verificación del JWT, perfiles activos, permisos y RLS.

La configuración de Auth pertenece al proyecto de Supabase y afecta a los clientes que utilizan ese proyecto, independientemente de la rama de Git. No se añade ninguna clave administrativa al código ni se modifica el esquema de tablas.

Antes del ajuste se comprobaron **15 perfiles activos de comprador/vendedor y 0 cuentas con correo pendiente de confirmar**. Por eso no fue necesario actualizar manualmente `auth.users`, alterar roles ni cambiar `profiles.is_verified`, que representa la verificación comercial del perfil.

## Botón para regresar al inicio

`front-end/src/app/login/page.tsx` incorpora **Volver al inicio**, un enlace a `/` con el icono `ArrowLeft` de Lucide, foco visible y altura mínima de 44 px. Se mantiene la paleta existente y el diseño responsive.

## Cloudflare después de completar el formulario

`DeferredCaptcha` se comparte entre login y registro (portada y `/register`):

1. Mientras faltan campos, solo muestra un aviso. El widget no se monta ni inicia la verificación.
2. En login requiere correo con formato válido y contraseña presente, conservando compatibilidad con contraseñas anteriores más cortas.
3. En registro requiere nombre, usuario válido, correo, celular de exactamente 8 dígitos sin código de país, contraseña de 8–128 caracteres y confirmación coincidente. El vendedor además debe completar el nombre de la tienda. El backend añade `+591` al guardar el celular; ver [CELULAR_BOLIVIA.md](CELULAR_BOLIVIA.md).
4. Tras completar los datos, espera 500 ms sin cambios antes de montar el widget. Esto evita iniciar un desafío por cada tecla durante la escritura.
5. Cada modificación invalida el token previo y recrea el componente con una nueva revisión. Los callbacks de un componente desmontado no pueden entregar un token a la siguiente revisión.
6. Los botones de envío quedan deshabilitados hasta tener formulario completo y token válido; tampoco permiten doble envío mientras hay una solicitud pendiente.
7. Una expiración elimina el token. Ante errores se ofrece **Reintentar verificación**. El backend continúa validando el token con el servicio `siteverify`.

La validación de preparación se concentra en `front-end/src/lib/auth/form-readiness.ts`. El registro normaliza el usuario y exige 8 dígitos para el teléfono, igual que al enviar los datos. Solo los cambios de los campos de la cuenta reinician el CAPTCHA: se ignoran los campos internos que agrega Cloudflare.

## Archivos principales

- `front-end/src/app/login/page.tsx`: regreso al inicio, preparación del formulario, renovación de CAPTCHA y bloqueo de doble envío.
- `front-end/src/components/auth/RegistrationForm.tsx`: preparación por rol y reutilización del CAPTCHA diferido.
- `front-end/src/components/auth/DeferredCaptcha.tsx`: montaje diferido, expiración, errores y reintento.
- `front-end/src/lib/auth/form-readiness.ts`: criterios para iniciar la verificación.
- `front-end/scripts/test-auth.mjs` y `front-end/package.json`: `npm run test:auth`.

## Verificación

Las pruebas de preparación cubren login con campos incompletos, compatibilidad con credenciales existentes, datos obligatorios del comprador, tienda obligatoria del vendedor, contraseñas distintas/cortas y formatos de usuario/celular. Se conservan las pruebas del backend, dominio vendedor y configuración.

Resultado: **33 pruebas aprobadas** (5 de preparación, 12 de API, 15 de vendedor y 1 de configuración), ESLint sin errores en los archivos editados y build de producción de Next.js aprobado con `--webpack`.

Además se probó la API real contra este proyecto de Supabase y `siteverify` con las claves oficiales de prueba de Cloudflare. Se crearon dos cuentas QA temporales con correos reservados de prueba, una por rol, y se obtuvieron estos resultados:

| Perfil | Registro | Confirmación requerida | Login con contraseña | Perfil propio | Estado de vendedor |
| --- | --- | --- | --- | --- | --- |
| Comprador | 201 | No | 200 | 200 | 403 |
| Vendedor | 201 | No | 200 | 200 | 200 |

Las sesiones QA se cerraron antes de eliminar exclusivamente esas dos cuentas; no se eliminaron registros del equipo. La comprobación posterior registró **16 perfiles en el proyecto y 0 perfiles QA de esta prueba**. No se enviaron correos de confirmación y no se publicaron credenciales de pruebas. Las claves utilizadas son las [claves de prueba oficiales de Turnstile](https://developers.cloudflare.com/turnstile/troubleshooting/testing/); el código no introduce un bypass de CAPTCHA.

El ajuste se verificó también en el panel web de Supabase, con **Confirm email** apagado y **Save changes** deshabilitado después de guardar. La revisión visual del formulario local queda pendiente por la limitación de conexiones localhost de esta sesión, documentada en `RESPONSIVE.md`; las pruebas de preparación y compilación sí se completaron.

La configuración efectiva de Auth debe verificarse consultando `/auth/v1/settings` con la clave pública del proyecto: `mailer_autoconfirm=true`, correo habilitado y registro habilitado. Esto comprueba que la opción se guardó en el proyecto real; no requiere exponer claves.

Referencias: [autenticación con contraseña](https://supabase.com/docs/guides/auth/passwords), [configuración del widget Turnstile](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/).

Para volver a exigir confirmación: activar **Confirm email** en el mismo panel y configurar SMTP y las URL de callback. Los flujos compatibles ya se conservan en el código.
