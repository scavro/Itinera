import type { Trip } from "./domain";
export type Notebook = { trips: Trip[]; active: string; provider: string };
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(
      0,
      "No se ha podido conectar. Comprueba la conexión y vuelve a intentarlo.",
    );
  }
  if (!response.ok) {
    const message =
      response.status === 401
        ? "Tu sesión ha finalizado. Vuelve a entrar."
        : response.status === 409
          ? "El cuaderno ha cambiado en otro dispositivo. Exporta tus cambios antes de cargar la versión guardada."
          : response.status === 429
            ? "Demasiados intentos. Espera cinco minutos antes de volver a entrar."
            : response.status >= 500
              ? "El servicio no está disponible. Vuelve a intentarlo en unos momentos."
              : "No se ha podido completar la operación. Revisa los datos e inténtalo de nuevo.";
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {}
    const serverMessage =
      detail &&
      typeof detail === "object" &&
      "error" in detail &&
      typeof detail.error === "string" &&
      detail.error.length < 400
        ? detail.error
        : message;
    throw new ApiError(
      response.status,
      response.status === 401 ? message : serverMessage,
    );
  }
  return response.json() as Promise<T>;
}
