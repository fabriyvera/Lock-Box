"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import DeferredCaptcha from "./DeferredCaptcha";
import { registrationComplete } from "@/lib/auth/form-readiness";
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
    label: "Celular (8 dígitos)",
    type: "tel",
    autoComplete: "tel-national",
    maxLength: 8,
    placeholder: "71234567",
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
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [complete, setComplete] = useState(false);
  const [revision, setRevision] = useState(0);
  const pending = useRef(false);

  function changed(event: FormEvent<HTMLFormElement>) {
    if (
      !(event.target instanceof HTMLInputElement) ||
      ![
        "fullName",
        "username",
        "email",
        "phone",
        "password",
        "confirmPassword",
        "storeName",
      ].includes(event.target.name)
    )
      return;
    setComplete(registrationComplete(new FormData(event.currentTarget), role));
    setToken(null);
    setRevision((value) => value + 1);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) || "");
    if (!registrationComplete(data, role)) {
      setError("Revisa los datos y la confirmación de la contraseña.");
      return;
    }
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
          phone: value("phone"),
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
      setComplete(false);
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
      setRevision((value) => value + 1);
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
    <form
      onSubmit={submit}
      onChange={changed}
      className={styles.form}
      aria-busy={busy}
    >
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
              inputMode={field.name === "phone" ? "numeric" : undefined}
              onInput={
                field.name === "phone"
                  ? (event) => {
                      event.currentTarget.value = event.currentTarget.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 8);
                    }
                  : undefined
              }
              minLength={
                field.type === "password"
                  ? 8
                  : field.name === "fullName"
                    ? 2
                    : field.name === "phone"
                      ? 8
                      : undefined
              }
              pattern={
                field.name === "username"
                  ? "@?[a-zA-Z0-9._]{3,30}"
                  : field.name === "phone"
                    ? "[0-9]{8}"
                    : undefined
              }
              aria-describedby={
                field.name === "username"
                  ? `${id}-username-hint`
                  : field.name === "phone"
                    ? `${id}-phone-hint`
                    : undefined
              }
            />
            {field.name === "phone" && (
              <small id={`${id}-phone-hint`}>
                Ingresa 8 dígitos, sin código de país.
              </small>
            )}
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
        <DeferredCaptcha
          key={revision}
          ready={complete && !busy}
          onToken={setToken}
        />
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button
        disabled={busy || !complete || !token}
        type="submit"
        className={styles.submit}
      >
        {busy ? "Creando tu cuenta…" : `Crear mi cuenta de ${role}`}
      </button>
      <p className={styles.signIn}>
        ¿Ya tienes una cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
    </form>
  );
}
