"use client";

export const mapsConfigured = Boolean(
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY &&
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
);
export const googleMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
let loading: Promise<typeof google.maps> | undefined;

declare global {
  interface Window {
    google?: typeof google;
    lockboxMapsReady?: () => void;
    gm_authFailure?: () => void;
  }
}

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (!mapsConfigured)
    return Promise.reject(new Error("Google Maps no está disponible todavía."));
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    if (window.google?.maps?.Map) {
      resolve(window.google.maps);
      return;
    }
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => fail(), 15000);
    const fail = () => {
      window.clearTimeout(timeout);
      window.dispatchEvent(new Event("lockbox-maps-error"));
      reject(
        new Error(
          "No se pudo cargar Google Maps. Puedes usar la lista o ingresar coordenadas.",
        ),
      );
    };
    window.lockboxMapsReady = () => {
      window.clearTimeout(timeout);
      if (window.google?.maps) resolve(window.google.maps);
      else fail();
    };
    window.gm_authFailure = fail;
    const params = new URLSearchParams({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      callback: "lockboxMapsReady",
      loading: "async",
      v: "quarterly",
      libraries: "maps,marker,geocoding",
      language: "es",
      region: "BO",
      auth_referrer_policy: "origin",
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loading;
}
