export type Coordinates = { lat: number; lng: number };

export function validCoordinates(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lng === "number" &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}

export function parseCoordinates(lat: string, lng: string): Coordinates | null {
  if (!lat.trim() || !lng.trim()) return null;
  const position = { lat: Number(lat), lng: Number(lng) };
  return validCoordinates(position.lat, position.lng) ? position : null;
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function mapsDirections(position: Coordinates) {
  return `https://www.google.com/maps/dir/?api=1&destination=${position.lat},${position.lng}`;
}
