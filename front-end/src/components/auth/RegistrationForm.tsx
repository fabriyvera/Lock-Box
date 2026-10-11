"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { apiUrl, openAccount, type AccountRole } from "@/lib/auth/account";
import styles from "./registration.module.css";

const fields = [
  {
    name: "fullName",
    label: "Nombre completo",
    type: "text",
    autoComplete: "name",
    maxLength: 80,
    placeholder: "María Gonzáles",
  },
  {
    name: "username",
    label: "Nombre de usuario",
    type: "text",
    autoComplete: "username",
    maxLength: 30,
    placeholder: "maria.gonzales",
  },
  {
    name: "email",
    label: "Correo electrónico",
    type: "email",
    autoComplete: "email",
    maxLength: 254,
    placeholder: "tucorreo@gmail.com",
  },
  {
    name: "phone",
    label: "Celular con código de país",
    type: "tel",
    autoComplete: "tel",
    maxLength: 25,
    placeholder: "+591 71234567",
  },
  {
    name: "password",
    label: "Contraseña (mínimo 8 caracteres)",
    type: "password",
    autoComplete: "new-password",
    maxLength: 128,
    placeholder: "Tu contraseña",
  },
  {
    name: "confirmPassword",
    label: "Confirmar contraseña",
    type: "password",
    autoComplete: "new-password",
    maxLength: 128,
    placeholder: "Repite tu contraseña",
  },
] as const;

export default function RegistrationForm({ role }: { role: AccountRole }) {
  const id = useId();
  const captcha = useRef<TurnstileInstance>(undefined);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const pending = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) || "");
    if (value("password") !== value("confirmPassword")) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!token) {
      setError("Completa la verificación de seguridad.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          email: value("email").trim(),
          password: value("password"),
          fullName: value("fullName").trim(),
          username: value("username").trim().replace(/^@/, "").toLowerCase(),
          phone: value("phone").replace(/[\s()-]/g, ""),
          role,
          captchaToken: token,
          ...(role === "vendedor"
            ? { storeName: value("storeName").trim() }
            : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        const errors = Object.values(result.errors ?? {})
          .flat()
          .join(" ");
        throw new Error(
          errors || result.message || "No se pudo crear tu cuenta.",
        );
      }
      form.reset();
      if (result.requiresConfirmation) setConfirmation(true);
      else if (result.session?.access_token && result.session?.refresh_token)
        await openAccount(result.session);
      else throw new Error("No se recibió la confirmación del registro.");
    } catch (err) {
      setError(
        err instanceof Error &&
          err.name !== "TimeoutError" &&
          err.name !== "TypeError"
          ? err.message
          : "No se pudo conectar con el servidor. Inténtalo nuevamente.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
      setToken(null);
      captcha.current?.reset();
    }
  }

  if (confirmation)
    return (
      <div className={styles.notice} role="status">
        <h3>Revisa tu correo</h3>
        <p>
          Confirma tu cuenta con el enlace que envía LockBox. Si ya tienes una
          cuenta, inicia sesión.
        </p>
        <Link href="/login" className={styles.submit}>
          Ir a iniciar sesión
        </Link>
        <button
          type="button"
          onClick={() => setConfirmation(false)}
          className={styles.back}
        >
          Volver al formulario
        </button>
      </div>
    );

  return (
    <form onSubmit={submit} className={styles.form} aria-busy={busy}>
      <h3>
        Registro como <span>{role}</span>
      </h3>
      <fieldset disabled={busy} className={styles.fields}>
        <legend className="sr-only">Datos de tu cuenta</legend>
        {fields.map(({ label, ...field }) => (
          <div key={field.name}>
            <label htmlFor={`${id}-${field.name}`}>{label}</label>
            <input
              {...field}
              id={`${id}-${field.name}`}
              required
              minLength={
                field.type === "password"
                  ? 8
                  : field.name === "fullName"
                    ? 2
                    : undefined
              }
              pattern={
                field.name === "username" ? "@?[a-zA-Z0-9._]{3,30}" : undefined
              }
              aria-describedby={
                field.name === "username" ? `${id}-username-hint` : undefined
              }
            />
            {field.name === "username" && (
              <small id={`${id}-username-hint`}>
                3–30 letras, números, puntos o guiones bajos. Sin puntos
                consecutivos ni al inicio o final.
              </small>
            )}
          </div>
        ))}
        {role === "vendedor" && (
          <div>
            <label htmlFor={`${id}-storeName`}>Nombre de tu tienda</label>
            <input
              id={`${id}-storeName`}
              name="storeName"
              required
              minLength={2}
              maxLength={80}
              autoComplete="organization"
              placeholder="Mi tienda"
            />
          </div>
        )}
      </fieldset>
      <div className={styles.captcha}>
        {siteKey ? (
          <Turnstile
            ref={captcha}
            siteKey={siteKey}
            options={{ theme: "dark", size: "compact" }}
            onSuccess={setToken}
            onExpire={() => setToken(null)}
            onError={() => {
              setToken(null);
              setError("No se pudo cargar la verificación. Recarga la página.");
            }}
          />
        ) : (
          <p role="alert">
            El registro estará disponible cuando se configure la verificación de
            seguridad.
          </p>
        )}
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button disabled={busy || !token} type="submit" className={styles.submit}>
        {busy ? "Creando tu cuenta…" : `Crear mi cuenta de ${role}`}
      </button>
      <p className={styles.signIn}>
        ¿Ya tienes una cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
    </form>
  );
}
