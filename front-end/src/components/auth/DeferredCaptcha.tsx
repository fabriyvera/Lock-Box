"use client";

import { useEffect, useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

export default function DeferredCaptcha({
  ready,
  onToken,
}: {
  ready: boolean;
  onToken: (token: string | null) => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const captcha = useRef<TurnstileInstance>(undefined);
  const alive = useRef(false);
  const [armed, setArmed] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => setArmed(true), 500);
    return () => clearTimeout(timer);
  }, [ready]);
  function failure() {
    if (!alive.current) return;
    onToken(null);
    setFailed(true);
  }
  if (!siteKey)
    return (
      <p role="alert" className="text-sm text-text-muted">
        El acceso requiere configurar la verificación de seguridad.
      </p>
    );
  if (!ready || !armed)
    return (
      <p role="status" className="text-sm text-text-muted text-center">
        Completa los datos del formulario para activar la verificación de
        seguridad.
      </p>
    );
  return (
    <div className="flex flex-col items-center gap-3">
      <Turnstile
        ref={captcha}
        siteKey={siteKey}
        options={{ theme: "dark", size: "compact", language: "es" }}
        onSuccess={(token) => {
          if (alive.current) {
            setFailed(false);
            onToken(token);
          }
        }}
        onExpire={() => {
          if (alive.current) onToken(null);
        }}
        onError={failure}
        scriptOptions={{ onError: failure }}
      />
      {failed && (
        <>
          <p role="alert" className="text-sm text-danger text-center">
            No se pudo completar la verificación de seguridad.
          </p>
          <button
            type="button"
            className="min-h-11 text-sm text-accent underline"
            onClick={() => {
              setFailed(false);
              captcha.current?.reset();
            }}
          >
            Reintentar verificación
          </button>
        </>
      )}
    </div>
  );
}
