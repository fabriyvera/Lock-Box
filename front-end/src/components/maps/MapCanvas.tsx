"use client";

import { useEffect, useRef, useState } from "react";
import { googleMapId, loadGoogleMaps, mapsConfigured } from "@/lib/maps/google";
import type { Coordinates } from "@/lib/maps/location";
import styles from "./maps.module.css";

export type MapPoint = Coordinates & { id: string; name: string };
const LA_PAZ = { lat: -16.5, lng: -68.13 };

export function MapCanvas({
  points,
  selectedId,
  onSelect,
  onPick,
  center,
  disabled = false,
}: {
  points: MapPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onPick?: (position: Coordinates) => void;
  center?: Coordinates;
  disabled?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState("");
  const editable = Boolean(onPick);
  const callbacks = useRef({ onSelect, onPick, disabled });
  useEffect(() => {
    callbacks.current = { onSelect, onPick, disabled };
  }, [onSelect, onPick, disabled]);

  useEffect(() => {
    if (!mapsConfigured) return;
    let disposed = false;
    let instance: google.maps.Map | undefined;
    const authFailed = () =>
      setError(
        "Google Maps no está disponible. Puedes seguir usando la lista o las coordenadas.",
      );
    window.addEventListener("lockbox-maps-error", authFailed);
    void loadGoogleMaps()
      .then((maps) => {
        if (disposed || !host.current) return;
        instance = new maps.Map(host.current, {
          center: LA_PAZ,
          zoom: 13,
          mapId: googleMapId,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: "cooperative",
        });
        instance.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (!callbacks.current.disabled && event.latLng)
            callbacks.current.onPick?.(event.latLng.toJSON());
        });
        setMap(instance);
      })
      .catch((err: Error) => {
        if (!disposed) setError(err.message);
      });
    return () => {
      disposed = true;
      window.removeEventListener("lockbox-maps-error", authFailed);
      if (instance) window.google?.maps.event.clearInstanceListeners(instance);
    };
  }, []);

  useEffect(() => {
    if (!map || !window.google) return;
    const maps = window.google.maps;
    const markers = points.map((point) => {
      const marker = new maps.marker.AdvancedMarkerElement({
        map,
        position: point,
        title: point.name,
        gmpDraggable: editable && !disabled,
        zIndex: point.id === selectedId ? 10 : 1,
      });
      marker.addListener("click", () => {
        if (!callbacks.current.disabled) callbacks.current.onSelect?.(point.id);
      });
      marker.addListener("dragend", (event: google.maps.MapMouseEvent) => {
        if (!callbacks.current.disabled && event.latLng)
          callbacks.current.onPick?.(event.latLng.toJSON());
      });
      return marker;
    });
    const selected = points.find((point) => point.id === selectedId);
    if (selected) {
      map.panTo(selected);
      map.setZoom(16);
    } else if (points.length) {
      const bounds = new maps.LatLngBounds();
      points.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, 40);
      if (points.length === 1) map.setZoom(16);
    }
    return () =>
      markers.forEach((marker) => {
        maps.event.clearInstanceListeners(marker);
        marker.map = null;
      });
  }, [map, points, selectedId, editable, disabled]);

  useEffect(() => {
    if (map && center) {
      map.panTo(center);
      map.setZoom(17);
    }
  }, [map, center]);

  if (!mapsConfigured)
    return (
      <p className={styles.notice} role="status">
        El mapa interactivo estará disponible próximamente. Puedes usar las
        direcciones y coordenadas.
      </p>
    );
  return (
    <div>
      {error && (
        <p role="status" className={styles.notice}>
          {error}
        </p>
      )}
      {!map && !error && <p role="status">Cargando mapa…</p>}
      <div
        ref={host}
        className={styles.map}
        aria-label="Mapa de puntos LockBox"
        hidden={Boolean(error)}
      />
    </div>
  );
}
