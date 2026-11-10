export function buyerErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (["TimeoutError", "AbortError"].includes(error.name))
      return "La conexión tardó demasiado. Pulsa Actualizar o reintenta la operación.";
    if (error instanceof TypeError)
      return "No se pudo conectar con el servidor. Revisa tu conexión y vuelve a intentarlo.";
    return error.message;
  }
  return "No se pudo completar la operación. Vuelve a intentarlo.";
}

// Reads can retry once after a cold start/network failure. Never retry a write here;
// the store retains its requestId so an explicit retry is deduplicated by PostgreSQL.
export async function buyerRequest(
  url: string,
  init: RequestInit,
  fetcher: typeof fetch = fetch,
) {
  const read = !init.method || init.method === "GET";
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetcher(url, {
        ...init,
        signal: AbortSignal.timeout(30000),
      });
      if (read && attempt === 0 && response.status >= 500) continue;
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "No se pudo completar la operación.");
      return result;
    } catch (error) {
      const transient =
        error instanceof TypeError ||
        (error instanceof Error &&
          ["TimeoutError", "AbortError"].includes(error.name));
      if (read && attempt === 0 && transient) continue;
      throw error;
    }
  }
}
