# Celular de 8 dígitos en el registro

El formulario compartido por la portada y `/register` solicita **Celular (8 dígitos)** para compradores y vendedores. Ejemplo: `71234567`. No se introduce el código de país.

- El campo usa teclado numérico, autocompletado de número nacional, longitud mínima/máxima de 8 y patrón `[0-9]{8}`. Al escribir se eliminan caracteres no numéricos. Un texto con menos de 8 dígitos no habilita el envío ni inicia el CAPTCHA.
- `registrationComplete` exige exactamente 8 dígitos para ambos perfiles. No acepta espacios, letras ni `+591`.
- `POST /api/auth/register` recibe `phone` como cadena de 8 dígitos y rechaza otros formatos con HTTP 400 antes de llamar a Auth.
- El esquema del backend transforma el valor validado: `71234567` → `+59171234567`. Esa cadena se envía como metadato de Auth y el trigger existente la guarda en `profiles.phone`.
- Se conserva el formato internacional de la base de datos, su restricción de unicidad y los teléfonos existentes. No se requiere migración ni modificación de cuentas.

Las pruebas de API comprueban que ambos roles reciben el prefijo automáticamente y rechazan 7/9 dígitos, letras, espacios y prefijo explícito. Las pruebas de preparación comprueban la misma longitud en comprador y vendedor antes de activar Cloudflare.

Archivos: `RegistrationForm.tsx`, `form-readiness.ts`, `auth.schema.ts`, `registration-api.test.ts` y `test-auth.mjs`.

Verificación: 12 pruebas de API y 6 de preparación del formulario aprobadas; ESLint y TypeScript sin errores en los cambios. Se verificó que el teléfono entregado a Auth es `+59171234567` cuando cualquiera de los dos perfiles registra `71234567`.

La compilación completa de producción no pudo verificarse: Windows devolvió `EPERM` al crear directorios generados dentro de `.next`. Las comprobaciones independientes de TypeScript, ESLint y las pruebas indicadas arriba sí finalizaron correctamente.
