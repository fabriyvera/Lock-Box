"use client";

import { useId, useMemo, useState } from "react";
import type { LockBoxPoint } from "@/lib/buyer/model";
import {
  mapsDirections,
  normalizeSearch,
  validCoordinates,
} from "@/lib/maps/location";
import { MapCanvas } from "@/components/maps/MapCanvas";
import styles from "@/components/maps/maps.module.css";

export function PointsFinder({
  points,
  selectedId,
  onSelect,
  disabled = false,
}: {
  points: LockBoxPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [focusedId, setFocusedId] = useState("");
  const selection = selectedId ?? focusedId;
  const filtered = useMemo(() => {
    const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
    return points.filter((point) => {
      const text = normalizeSearch(
        `${point.name} ${point.address} ${point.city}`,
      );
      return words.every((word) => text.includes(word));
    });
  }, [points, query]);
  const markers = useMemo(
    () =>
      filtered
        .filter((point) => validCoordinates(point.latitude, point.longitude))
        .map((point) => ({
          id: point.id,
          name: `${point.name}${point.locationIsApproximate ? " (ubicación provisional)" : ""}`,
          lat: point.latitude!,
          lng: point.longitude!,
        })),
    [filtered],
  );
  function select(pointId: string) {
    if (!disabled) {
      setFocusedId(pointId);
      onSelect?.(pointId);
    }
  }
  const selected = points.find((point) => point.id === selection);
  return (
    <section className={styles.layout} aria-label="Buscar puntos LockBox">
      <label className={styles.field} htmlFor={`${id}-search`}>
        Buscar puntos por nombre, zona o dirección
        <input
          id={`${id}-search`}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ej. Miraflores, Obrajes, San Pedro…"
        />
      </label>
      <p role="status">
        {filtered.length} puntos encontrados · {markers.length} con ubicación en
        el mapa.
      </p>
      {selected && (
        <p className={styles.notice}>
          Punto seleccionado: <strong>{selected.name}</strong> ·{" "}
          {selected.address}
        </p>
      )}
      <div className={styles.columns}>
        <MapCanvas
          points={markers}
          selectedId={selection}
          onSelect={select}
          disabled={disabled}
        />
        <div className={styles.list}>
          {filtered.map((point) => (
            <article
              key={point.id}
              className={styles.point}
              data-selected={selection === point.id}
            >
              <label>
                <input
                  type="radio"
                  name={`${id}-point`}
                  checked={selection === point.id}
                  disabled={disabled}
                  onChange={() => select(point.id)}
                />
                {point.name}
              </label>
              <p>
                {point.address}
                {point.city ? ` · ${point.city}` : ""}
              </p>
              {point.phone && <p>Contacto: {point.phone}</p>}
              {point.locationIsApproximate && (
                <p>
                  Ubicación provisional. Confirma la dirección con el punto
                  antes de acudir.
                </p>
              )}
              {validCoordinates(point.latitude, point.longitude) ? (
                <a
                  href={mapsDirections({
                    lat: point.latitude!,
                    lng: point.longitude!,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {point.locationIsApproximate
                    ? "Ver ubicación provisional en Google Maps"
                    : "Cómo llegar con Google Maps"}
                </a>
              ) : (
                <p>
                  Ubicación pendiente de confirmar; consulta la dirección con el
                  punto.
                </p>
              )}
            </article>
          ))}
          {!filtered.length && <p>No encontramos puntos con esa búsqueda.</p>}
        </div>
      </div>
    </section>
  );
}
