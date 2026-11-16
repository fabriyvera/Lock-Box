"use client";

import { useId, useRef, useState, type FormEvent } from "react";
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

function isEssentialRegistrationReady(data: FormData, role: AccountRole): boolean {
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
        "pointName",
        "pointAddress",
        "pointCapacity",
      ].includes(event.target.name)
    )
      return;
    setComplete(isEssentialRegistrationReady(new FormData(event.currentTarget), role));
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
    if (!isEssentialRegistrationReady(data, role)) {
      setError("Completa los campos obligatorios (*) y verifica tu contraseña.");
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
      value("username").trim().replace(/^@/, "").toLowerCase() || fallbackUsername;
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
      <div className={styles.notice} role="status" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "26px", fontWeight: 900, color: "#ffffff", marginBottom: "10px" }}>
          Revisa tu correo
        </h3>
        <p style={{ fontSize: "18px", color: "#f1f5f9", marginBottom: "20px" }}>
          Confirma tu cuenta con el enlace que envía LockBox. Si ya tienes una
          cuenta, inicia sesión.
        </p>
        <Link
          href="/login"
          className={styles.submit}
          style={{ fontSize: "17px", fontWeight: 900, padding: "14px 28px" }}
        >
          Ir a iniciar sesión
        </Link>
        <button
          type="button"
          onClick={() => setConfirmation(false)}
          className={styles.back}
          style={{ fontSize: "16px", marginTop: "12px" }}
        >
          Volver al formulario
        </button>
      </div>
    );

  const labelStyle = {
    display: "block",
    fontSize: "17px",
    fontWeight: 800,
    color: "#ffffff",
    marginBottom: "8px",
    letterSpacing: "0.02em",
  } as const;

  const inputStyle = {
    width: "100%",
    height: "54px",
    padding: "0 16px",
    fontSize: "18px",
    fontWeight: 600,
    color: "#ffffff",
    background: "var(--color-surface-raised, #0f172a)",
    border: "2px solid var(--color-border-strong, #334155)",
    borderRadius: "4px",
    outline: "none",
    boxSizing: "border-box",
  } as const;

  const hintStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: 500,
    color: "#cbd5e1",
    marginTop: "6px",
    lineHeight: 1.4,
  } as const;

  return (
    <form
      onSubmit={submit}
      onChange={changed}
      className={styles.form}
      aria-busy={busy}
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid var(--color-border-strong)",
          paddingBottom: "14px",
        }}
      >
        <h3
          style={{
            fontSize: "clamp(22px, 2.4vw, 28px)",
            fontWeight: 900,
            color: "#ffffff",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          2. Registro como{" "}
          <span style={{ color: "var(--color-accent)" }}>{ACCOUNT_LABELS[role]}</span>
        </h3>
        <span style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff" }}>
          Los campos con{" "}
          <span style={{ color: "var(--color-accent)", fontWeight: 900, fontSize: "20px" }}>
            *
          </span>{" "}
          son obligatorios
        </span>
      </div>

      <fieldset
        disabled={busy}
        className={styles.fields}
        style={{
          border: "none",
          padding: 0,
          margin: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px 24px",
        }}
      >
        <legend className="sr-only">Datos de tu cuenta</legend>
        {fields.map(({ label, required, ...field }) => (
          <div key={field.name}>
            <label htmlFor={`${id}-${field.name}`} style={labelStyle}>
              {label}
              {required && (
                <span
                  style={{
                    color: "var(--color-accent)",
                    fontWeight: 900,
                    fontSize: "20px",
                    marginLeft: "6px",
                  }}
                  aria-hidden="true"
                >
                  *
                </span>
              )}
            </label>
            <input
              {...field}
              id={`${id}-${field.name}`}
              required={required}
              style={inputStyle}
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
              <small id={`${id}-phone-hint`} style={hintStyle}>
                Opcional · 8 dígitos sin código de país.
              </small>
            )}
            {field.name === "username" && (
              <small id={`${id}-username-hint`} style={hintStyle}>
                Opcional · Si lo dejas vacío, se creará con tu correo.
              </small>
            )}
          </div>
        ))}

        {role === "vendedor" && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor={`${id}-storeName`} style={labelStyle}>
              Nombre de tu tienda{" "}
              <span
                style={{ color: "var(--color-accent)", fontWeight: 900, fontSize: "20px" }}
                aria-hidden="true"
              >
                *
              </span>
            </label>
            <input
              id={`${id}-storeName`}
              name="storeName"
              required
              minLength={2}
              maxLength={80}
              autoComplete="organization"
              placeholder="Ej: Moda Urbana La Paz"
              style={inputStyle}
            />
          </div>
        )}

        {role === "operador_punto" && (
          <div
            className={styles.pointFields}
            style={{
              gridColumn: "1 / -1",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px 24px",
              paddingTop: "12px",
              borderTop: "1px solid var(--color-border-strong)",
            }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <h4 style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", margin: "0 0 4px 0" }}>
                Datos de tu Punto LockBox
              </h4>
              <p style={{ fontSize: "16px", color: "#e2e8f0", margin: 0 }}>
                Crearemos un punto nuevo asociado a tu cuenta para recibir y entregar pedidos.
              </p>
            </div>
            <div>
              <label htmlFor={`${id}-pointName`} style={labelStyle}>
                Nombre del punto{" "}
                <span style={{ color: "var(--color-accent)", fontWeight: 900, fontSize: "20px" }} aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id={`${id}-pointName`}
                name="pointName"
                required
                minLength={2}
                maxLength={80}
                autoComplete="organization"
                placeholder="Punto LockBox Central"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor={`${id}-pointAddress`} style={labelStyle}>
                Dirección completa del punto{" "}
                <span style={{ color: "var(--color-accent)", fontWeight: 900, fontSize: "20px" }} aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id={`${id}-pointAddress`}
                name="pointAddress"
                required
                minLength={10}
                maxLength={240}
                autoComplete="street-address"
                placeholder="Av. Central 123, zona Centro, La Paz"
                aria-describedby={`${id}-point-address-help`}
                style={inputStyle}
              />
              <small id={`${id}-point-address-help`} style={hintStyle}>
                Incluye zona, localidad y una referencia clara.
              </small>
            </div>
            <div>
              <label htmlFor={`${id}-pointCapacity`} style={labelStyle}>
                Capacidad de paquetes (opcional)
              </label>
              <input
                id={`${id}-pointCapacity`}
                name="pointCapacity"
                type="number"
                inputMode="numeric"
                min={1}
                max={500}
                step={1}
                placeholder="50"
                aria-describedby={`${id}-point-capacity-help`}
                style={inputStyle}
              />
              <small id={`${id}-point-capacity-help`} style={hintStyle}>
                Por defecto 50 paquetes si lo dejas en blanco.
              </small>
            </div>
          </div>
        )}
      </fieldset>

      <div className={styles.captcha} style={{ margin: "4px 0" }}>
        <DeferredCaptcha
          key={revision}
          ready={complete && !busy}
          onToken={setToken}
        />
      </div>

      {error && (
        <p
          className={styles.error}
          role="alert"
          style={{
            fontSize: "16px",
            fontWeight: 700,
            padding: "12px 16px",
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          paddingTop: "8px",
        }}
      >
        <button
          disabled={busy || !complete || !token}
          type="submit"
          className={styles.submit}
          style={{
            height: "58px",
            padding: "0 36px",
            fontSize: "18px",
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: busy || !complete || !token ? "not-allowed" : "pointer",
          }}
        >
          {busy
            ? "Creando tu cuenta…"
            : role === "operador_punto"
              ? "Crear mi Punto LockBox →"
              : `Crear mi cuenta de ${role} →`}
        </button>

        <p
          className={styles.signIn}
          style={{
            fontSize: "17px",
            fontWeight: 600,
            color: "#ffffff",
            margin: 0,
          }}
        >
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--color-accent)",
              fontWeight: 900,
              textDecoration: "underline",
              marginLeft: "4px",
            }}
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </form>
  );
}