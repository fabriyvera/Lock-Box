"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import DeferredCaptcha from "./DeferredCaptcha";
import {
  ACCOUNT_LABELS,
  apiUrl,
  openAccount,
  type AccountRole,
} from "@/lib/auth/account";
import styles from "./registration.module.css";

const fields = [
  {
    name: "fullName",
    label: "Nombre completo",
    type: "text",
    autoComplete: "name",
    maxLength: 80,
    placeholder: "María Gonzáles",
    required: true,
  },
  {
    name: "username",
    label: "Nombre de usuario (opcional)",
    type: "text",
    autoComplete: "username",
    maxLength: 30,
    placeholder: "maria.gonzales",
    required: false,
  },
  {
    name: "email",
    label: "Correo electrónico",
    type: "email",
    autoComplete: "email",
    maxLength: 254,
    placeholder: "tucorreo@gmail.com",
    required: true,
  },
  {
    name: "phone",
    label: "Celular de contacto (opcional)",
    type: "tel",
    autoComplete: "tel-national",
    maxLength: 8,
    placeholder: "71234567",
    required: false,
  },
  {
    name: "password",
    label: "Contraseña (mínimo 8 caracteres)",
    type: "password",
    autoComplete: "new-password",
    maxLength: 128,
    placeholder: "Tu contraseña",
    required: true,
  },
  {
    name: "confirmPassword",
    label: "Confirmar contraseña",
    type: "password",
    autoComplete: "new-password",
    maxLength: 128,
    placeholder: "Repite tu contraseña",
    required: true,
  },
] as const;

function isEssentialRegistrationReady(
  data: FormData,
  role: AccountRole,
): boolean {
  const fullName = String(data.get("fullName") || "").trim();
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");
  const confirmPassword = String(data.get("confirmPassword") || "");

  if (fullName.length < 2) return false;
  if (!email.includes("@") || email.length < 5) return false;
  if (password.length < 8 || password !== confirmPassword) return false;

  if (role === "vendedor") {
    const storeName = String(data.get("storeName") || "").trim();
    if (storeName.length < 2) return false;
  }

  if (role === "operador_punto") {
    const pointName = String(data.get("pointName") || "").trim();
    const pointAddress = String(data.get("pointAddress") || "").trim();
    if (pointName.length < 2 || pointAddress.length < 10) return false;
  }

  return true;
}

export default function RegistrationForm({
  role,
  headingLevel = 3,
}: {
  role: AccountRole;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const id = useId();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [complete, setComplete] = useState(false);
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const errorSummary = useRef<HTMLParagraphElement>(null);
  const pending = useRef(false);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (error) errorSummary.current?.focus();
  }, [error]);

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
        "pointName",
        "pointAddress",
        "pointCapacity",
      ].includes(event.target.name)
    )
      return;
    setDirty(true);
    setFieldErrors({});
    setComplete(
      isEssentialRegistrationReady(new FormData(event.currentTarget), role),
    );
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
    const inputs = Array.from(form.querySelectorAll("input"));
    const invalidFields = Object.fromEntries(
      inputs
        .filter((input) => !input.validity.valid)
        .map((input) => [input.name, input.validationMessage]),
    );
    if (value("password") !== value("confirmPassword")) {
      invalidFields.confirmPassword =
        "Repite la misma contraseña en ambos campos.";
    }
    setFieldErrors(invalidFields);
    const invalid = inputs.find((input) => invalidFields[input.name]);
    if (invalid) {
      setError("");
      invalid.focus();
      return;
    }
    if (!isEssentialRegistrationReady(data, role)) {
      setError(
        "Completa los campos obligatorios (*) y verifica tu contraseña.",
      );
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

    const emailClean = value("email").trim();
    const fallbackUsername =
      emailClean
        .split("@")[0]
        .replace(/[^a-zA-Z0-9._]/g, "")
        .replace(/^\.+|\.+$/g, "")
        .slice(0, 24) || "usuario.lbx";

    const finalUsername =
      value("username").trim().replace(/^@/, "").toLowerCase() ||
      fallbackUsername;
    const finalPhone = value("phone").trim() || "70000000";

    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          email: emailClean,
          password: value("password"),
          fullName: value("fullName").trim(),
          username: finalUsername,
          phone: finalPhone,
          role,
          captchaToken: token,
          ...(role === "vendedor"
            ? { storeName: value("storeName").trim() }
            : {}),
          ...(role === "operador_punto"
            ? {
                pointName: value("pointName").trim(),
                pointAddress: value("pointAddress").trim(),
                pointCapacity: Number(value("pointCapacity") || 50),
              }
            : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        const errorsByField: Record<string, string> = {};
        for (const [name, messages] of Object.entries(result.errors ?? {})) {
          if (inputs.some((input) => input.name === name)) {
            errorsByField[name] = Array.isArray(messages)
              ? messages.join(" ")
              : String(messages);
          }
        }
        if (Object.keys(errorsByField).length) {
          setFieldErrors(errorsByField);
          inputs.find((input) => errorsByField[input.name])?.focus();
          return;
        }
        const errors = Object.values(result.errors ?? {})
          .flat()
          .join(" ");
        throw new Error(
          errors || result.message || "No se pudo crear tu cuenta.",
        );
      }
      form.reset();
      setDirty(false);
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
        <Heading>Revisa tu correo</Heading>
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

  const additionalFields =
    role === "vendedor"
      ? [
          {
            name: "storeName",
            label: "Nombre de tu tienda",
            type: "text",
            autoComplete: "organization",
            maxLength: 80,
            minLength: 2,
            placeholder: "Ej. Moda Urbana…",
            required: true,
          },
        ]
      : role === "operador_punto"
        ? [
            {
              name: "pointName",
              label: "Nombre del punto",
              type: "text",
              autoComplete: "organization",
              maxLength: 80,
              minLength: 2,
              placeholder: "Ej. Punto LockBox Central…",
              required: true,
            },
            {
              name: "pointAddress",
              label: "Dirección completa del punto",
              type: "text",
              autoComplete: "street-address",
              maxLength: 240,
              minLength: 10,
              placeholder: "Ej. Av. Central 123, La Paz…",
              required: true,
            },
            {
              name: "pointCapacity",
              label: "Capacidad de paquetes (opcional)",
              type: "number",
              autoComplete: "off",
              placeholder: "Ej. 50…",
              required: false,
            },
          ]
        : [];

  const renderField = (field: {
    name: string;
    label: string;
    type: string;
    autoComplete: string;
    placeholder: string;
    required: boolean;
    maxLength?: number;
    minLength?: number;
  }) => {
    const fieldError = fieldErrors[field.name];
    const hints: Record<string, string> = {
      username: "Si lo dejas vacío, se creará con tu correo.",
      phone: "8 dígitos sin código de país.",
      pointAddress: "Incluye zona, localidad y una referencia clara.",
      pointCapacity: "Capacidad predeterminada de 50 paquetes.",
    };
    const hint = hints[field.name];
    return (
      <div key={field.name} className={styles.field}>
        <label htmlFor={`${id}-${field.name}`}>
          {field.label}
          {field.required && <span aria-hidden="true"> *</span>}
        </label>
        <input
          {...field}
          id={`${id}-${field.name}`}
          placeholder={
            field.placeholder.endsWith("…")
              ? field.placeholder
              : `${field.placeholder}…`
          }
          spellCheck={
            !["email", "username", "password", "confirmPassword"].includes(
              field.name,
            )
          }
          autoCapitalize={
            ["email", "username"].includes(field.name) ? "none" : undefined
          }
          inputMode={
            field.name === "phone" || field.type === "number"
              ? "numeric"
              : undefined
          }
          min={field.type === "number" ? 1 : undefined}
          max={field.type === "number" ? 500 : undefined}
          step={field.type === "number" ? 1 : undefined}
          minLength={
            field.type === "password"
              ? 8
              : field.name === "fullName"
                ? 2
                : field.minLength
          }
          pattern={
            field.name === "username"
              ? "@?[a-zA-Z0-9._]{3,30}"
              : field.name === "phone"
                ? "[0-9]{8}"
                : undefined
          }
          aria-invalid={!!fieldError}
          aria-describedby={[
            `${id}-${field.name}-error`,
            hint ? `${id}-${field.name}-hint` : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
        {hint && <small id={`${id}-${field.name}-hint`}>{hint}</small>}
        <p
          id={`${id}-${field.name}-error`}
          className={styles.fieldError}
          aria-live="polite"
        >
          {fieldError}
        </p>
      </div>
    );
  };

  return (
    <form
      noValidate
      onSubmit={submit}
      onChange={changed}
      className={styles.form}
      aria-busy={busy}
      aria-labelledby={`${id}-heading`}
    >
      <div className={styles.heading}>
        <Heading id={`${id}-heading`}>
          Registro como <span>{ACCOUNT_LABELS[role]}</span>
        </Heading>
        <p>Los campos con * son obligatorios.</p>
      </div>
      <fieldset disabled={busy} className={styles.fields}>
        <legend className="sr-only">Datos de tu cuenta</legend>
        {fields.map(renderField)}
      </fieldset>
      {additionalFields.length > 0 && (
        <fieldset disabled={busy} className={styles.fields}>
          <legend>
            {role === "vendedor"
              ? "Datos de tu tienda"
              : "Datos de tu Punto LockBox"}
          </legend>
          {additionalFields.map(renderField)}
        </fieldset>
      )}
      <div className={styles.captcha} id={`${id}-security`}>
        <DeferredCaptcha
          key={revision}
          ready={complete && !busy}
          onToken={setToken}
        />
      </div>
      <p
        ref={errorSummary}
        className={error ? styles.error : styles.emptyError}
        role="alert"
        tabIndex={-1}
      >
        {error}
      </p>
      <div className={styles.actions}>
        <button
          disabled={busy}
          type="submit"
          className={styles.submit}
          aria-describedby={`${id}-security`}
        >
          {busy && <span className={styles.spinner} aria-hidden="true" />}
          {busy
            ? "Creando tu cuenta…"
            : role === "operador_punto"
              ? "Crear tu Punto LockBox"
              : `Crear cuenta de ${role}`}
        </button>
        <p className={styles.signIn}>
          ¿Ya tienes una cuenta? <Link href="/login">Inicia sesión</Link>.
        </p>
      </div>
      <span role="status" className="sr-only">
        {busy ? "Creando tu cuenta…" : ""}
      </span>
    </form>
  );
}
