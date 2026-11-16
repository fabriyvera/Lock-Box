"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

type TurnstileApi = {
  ready(callback: () => void): void;
  render(container: HTMLElement, options: {
    sitekey: string;
    theme: "dark";
    size: "compact";
    language: "es";
    "response-field": false;
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }): string;
  remove(widget: string): void;
};

function getTurnstile() {
  return (window as Window & { turnstile?: TurnstileApi }).turnstile;
}

let loadingScript: Promise<TurnstileApi> | undefined;

function loadTurnstile() {
  if (loadingScript) return loadingScript;
  const api = getTurnstile();
  if (api) return new Promise<TurnstileApi>((resolve) => api.ready(() => resolve(api)));

  loadingScript = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    // Cloudflare's ready() requires the script to omit async and defer.
    script.async = false;

    function finish(api?: TurnstileApi) {
      window.clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
      if (api) resolve(api);
      else {
        script.remove();
        reject(new Error("No se pudo cargar Turnstile."));
      }
    }

    const timeout = window.setTimeout(() => finish(), 15000);
    script.onload = () => {
      const api = getTurnstile();
      if (api) api.ready(() => finish(api));
      else finish();
    };
    script.onerror = () => finish();
    document.head.appendChild(script);
  }).catch((error) => {
    loadingScript = undefined;
    throw error;
  });

  return loadingScript;
}

export default function DeferredCaptcha({
  ready,
  onToken,
}: {
  ready: boolean;
  onToken: (token: string | null) => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const reportToken = useEffectEvent(onToken);

  useEffect(() => {
    if (!ready || !siteKey) return;
    let active = true;
    let removeWidget: (() => void) | undefined;

    function failure() {
      if (!active) return;
      reportToken(null);
      setFailed(true);
    }

    const delay = window.setTimeout(() => {
      void loadTurnstile().then((api) => {
        if (!active || !container.current) return;
        const widget = api.render(container.current, {
          sitekey: siteKey,
          theme: "dark",
          size: "compact",
          language: "es",
          "response-field": false,
          callback(token) {
            if (!active) return;
            setFailed(false);
            reportToken(token);
          },
          "expired-callback"() {
            if (active) reportToken(null);
          },
          "error-callback": failure,
        });
        if (widget) removeWidget = () => api.remove(widget);
        else failure();
      }).catch(failure);
    }, 500);

    return () => {
      active = false;
      window.clearTimeout(delay);
      removeWidget?.();
    };
  }, [attempt, ready, siteKey]);

  if (!siteKey)
    return (
      <p role="alert" className="text-sm text-text-muted">
        El acceso requiere configurar la verificación de seguridad.
      </p>
    );
  if (!ready)
    return (
      <p role="status" className="text-sm text-text-muted text-center">
        Completa los datos del formulario para activar la verificación de seguridad.
      </p>
    );

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={container} />
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
              setAttempt((value) => value + 1);
            }}
          >
            Reintentar verificación
          </button>
        </>
      )}
    </div>
  );
}
