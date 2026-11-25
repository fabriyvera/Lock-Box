"use client";

import { useId, useMemo, useRef, useState } from "react";
import { loadGoogleMaps, mapsConfigured } from "@/lib/maps/google";
import { parseCoordinates, type Coordinates } from "@/lib/maps/location";
import { MapCanvas } from "./MapCanvas";
import styles from "./maps.module.css";

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  disabled,
}: {
  latitude: string;
  longitude: string;
  onChange: (lat: string, lng: string) => void;
  disabled: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [center, setCenter] = useState<Coordinates>();
  const request = useRef(0);
  const points = useMemo(() => {
    const position = parseCoordinates(latitude, longitude);
    return position
      ? [
          {
            ...position,
            id: "registration",
            name: "Ubicación del nuevo punto LockBox",
          },
        ]
      : [];
  }, [latitude, longitude]);
  function pick(position: Coordinates) {
    onChange(position.lat.toFixed(7), position.lng.toFixed(7));
    setMessage(
      "Ubicación seleccionada. Verifica que el marcador coincida con la entrada del punto.",
    );
  }
  async function search() {
    if (!query.trim() || searching) return;
    const current = ++request.current;
    setSearching(true);
    setMessage("");
    try {
      const maps = await loadGoogleMaps();
      const response = await new maps.Geocoder().geocode({
        address: query.trim(),
        region: "BO",
      });
      if (current !== request.current) return;
      if (!response.results[0]) throw new Error("Sin resultados");
      setCenter(response.results[0].geometry.location.toJSON());
      setMessage(
        "Haz clic en el mapa sobre la entrada de tu punto para confirmar su ubicación.",
      );
    } catch {
      setMessage(
        "No se encontró la dirección. Prueba con calle y ciudad, o ingresa las coordenadas.",
      );
    } finally {
      if (current === request.current) setSearching(false);
    }
  }
  return (
    <div className={styles.layout}>
      <strong>Ubicación del punto *</strong>
      <p>
        Busca tu dirección y marca la entrada en el mapa. También puedes
        ingresar latitud y longitud.
      </p>
      {mapsConfigured && (
        <div className={styles.search}>
          <label className={styles.field} htmlFor={`${id}-search`}>
            Buscar dirección en Google Maps
            <input
              id={`${id}-search`}
              value={query}
              maxLength={240}
              disabled={disabled}
              placeholder="Calle, zona y ciudad"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void search();
                }
              }}
            />
          </label>
          <button
            type="button"
            className={styles.button}
            disabled={disabled || searching || !query.trim()}
            onClick={() => void search()}
          >
            {searching ? "Buscando…" : "Buscar dirección"}
          </button>
        </div>
      )}
      <MapCanvas
        points={points}
        selectedId="registration"
        onPick={pick}
        center={center}
        disabled={disabled}
      />
      <p role="status">{message}</p>
      <div className={styles.coordinates}>
        <label className={styles.field} htmlFor={`${id}-lat`}>
          Latitud *
          <input
            id={`${id}-lat`}
            name="pointLatitude"
            type="number"
            step="any"
            min={-90}
            max={90}
            required
            value={latitude}
            disabled={disabled}
            placeholder="Ej. -16.500000"
            onChange={(event) => onChange(event.target.value, longitude)}
          />
        </label>
        <label className={styles.field} htmlFor={`${id}-lng`}>
          Longitud *
          <input
            id={`${id}-lng`}
            name="pointLongitude"
            type="number"
            step="any"
            min={-180}
            max={180}
            required
            value={longitude}
            disabled={disabled}
            placeholder="Ej. -68.130000"
            onChange={(event) => onChange(latitude, event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
