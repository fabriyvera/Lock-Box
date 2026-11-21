"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import DeferredCaptcha from "./DeferredCaptcha";
import { apiUrl, openAccount, type AccountRole } from "@/lib/auth/account";
import { loginComplete } from "@/lib/auth/form-readiness";
import styles from "./auth.module.css";
export default function LoginForm({ role }: { role: AccountRole | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const pending = useRef(false);
  const navigating = useRef(false);
  const summary = useRef<HTMLParagraphElement>(null);
  const complete = loginComplete(email, password);
  useEffect(() => {
    if (error) summary.current?.focus();
  }, [error]);
  useEffect(() => {
    if (!password) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (navigating.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [password]);
  function changed() {
    setToken(null);
    setRevision((v) => v + 1);
    setErrors({});
    setError("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const inputs = Array.from(event.currentTarget.querySelectorAll("input"));
    const invalid = inputs.filter((input) => !input.validity.valid);
    setErrors(
      Object.fromEntries(
        invalid.map((input) => [input.name, input.validationMessage]),
      ),
    );
    if (invalid.length) {
      invalid[0].focus();
      return;
    }
    if (!complete) {
      setError("Revisa tu correo y contraseña.");
      return;
    }
    if (!token) {
      setError("Completa la verificación de seguridad antes de ingresar.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          email: email.trim(),
          password,
          captchaToken: token,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message ||
            "No se pudo iniciar sesión. Revisa tus datos e inténtalo nuevamente.",
        );
      if (!data.session?.access_token || !data.session?.refresh_token)
        throw new Error(
          "No se recibió una sesión válida. Inténtalo nuevamente.",
        );
      navigating.current = true;
      await openAccount(data.session);
    } catch (reason) {
      navigating.current = false;
      setError(
        reason instanceof Error &&
          !["TypeError", "TimeoutError"].includes(reason.name)
          ? reason.message
          : "No se pudo conectar con el servidor. Inténtalo nuevamente.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
      setToken(null);
      setRevision((v) => v + 1);
    }
  }
  return (
    <form
      noValidate
      onSubmit={submit}
      aria-busy={busy}
      className={styles.form}
      aria-label={`Inicio de sesión${role ? ` de ${role === "operador_punto" ? "Punto LockBox" : role}` : ""}`}
    >
      <fieldset disabled={busy} className={styles.fields}>
        <legend className="sr-only">Datos de acceso</legend>
        <div>
          <label htmlFor="login-email">Correo electrónico</label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            autoCapitalize="none"
            placeholder="Ej. nombre@correo.com…"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              changed();
            }}
            aria-invalid={!!errors.email}
            aria-describedby="login-email-error"
          />
          <p
            id="login-email-error"
            className={styles.fieldError}
            aria-live="polite"
          >
            {errors.email}
          </p>
        </div>
        <div>
          <label htmlFor="login-password">Contraseña</label>
          <div className={styles.password}>
            <input
              id="login-password"
              name="password"
              type={visible ? "text" : "password"}
              required
              autoComplete="current-password"
              spellCheck={false}
              placeholder="Tu contraseña…"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                changed();
              }}
              aria-invalid={!!errors.password}
              aria-describedby="login-password-error"
            />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={visible}
              aria-controls="login-password"
            >
              {visible ? (
                <EyeOff size={19} aria-hidden="true" />
              ) : (
                <Eye size={19} aria-hidden="true" />
              )}
            </button>
          </div>
          <p
            id="login-password-error"
            className={styles.fieldError}
            aria-live="polite"
          >
            {errors.password}
          </p>
        </div>
      </fieldset>
      <div id="login-security" className={styles.security}>
        <DeferredCaptcha
          key={revision}
          ready={complete && !busy}
          onToken={setToken}
        />
      </div>
      <p
        ref={summary}
        role="alert"
        tabIndex={-1}
        className={error ? styles.error : styles.fieldError}
      >
        {error}
      </p>
      <button
        type="submit"
        disabled={busy}
        aria-describedby="login-security"
        className={styles.submit}
      >
        {busy ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Verificando acceso…
          </>
        ) : (
          <>
            Iniciar sesión
            <ArrowRight size={18} aria-hidden="true" />
          </>
        )}
      </button>
      <span className="sr-only" role="status">
        {busy ? "Verificando acceso…" : ""}
      </span>
    </form>
  );
}
