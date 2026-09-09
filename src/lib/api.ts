import type { ApiError } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Lanza la petición con la cookie de sesión.
   *
   * `credentials: 'include'` es lo que reemplaza a la cabecera
   * `Authorization` que se armaba acá leyendo el token de `localStorage`. El
   * token ahora vive en una cookie `httpOnly` que este código NO puede leer —
   * ese es el punto: un XSS ya no se la puede llevar— y el navegador la
   * adjunta solo.
   *
   * Va en `include` y no en el `same-origin` por defecto porque la API está en
   * otro puerto (y en producción en otro subdominio), así que para `fetch` es
   * una petición cruzada aunque para la cookie sea el mismo sitio.
   */
  private async peticion(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Set Content-Type only if body is not FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });
  }

  /** Convierte una respuesta con error en el `Error` enriquecido de siempre. */
  private async fallo(response: Response): Promise<Error> {
    // El `statusCode` viaja en el error para que quien llama pueda distinguir
    // un rechazo del servidor (404, 403…) de un fallo de red — que no llega
    // acá, sino que hace que `fetch` reviente. Sin esa distinción, código como
    // el del carrito no puede decidir si un producto de verdad ya no existe o
    // si simplemente no hubo conexión.
    const body: ApiError | null = await response.json().catch(() => null);

    const message = body
      ? Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message
      : response.status === 403
        ? 'No tienes permisos para realizar esta acción'
        : `HTTP Error: ${response.status} ${response.statusText}`;

    const error = new Error(message) as Error & {
      statusCode?: number;
      code?: string;
    };
    error.statusCode = response.status;
    // `code` es el identificador estable del motivo del rechazo (lo manda
    // `/auth/login`, por ejemplo). Es lo que se traduce: el `message` viene
    // en inglés y con redacción de log, así que mostrarlo tal cual le dejaba
    // al cliente cosas como "Invalid credentials" sin importar su idioma.
    error.code = body?.code;
    return error;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await this.peticion(endpoint, options);

    if (!response.ok) {
      throw await this.fallo(response);
    }

    // Handle no content response
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return null as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  /**
   * Descarga un archivo (las exportaciones a CSV del panel).
   *
   * Existe como método del cliente y no como `fetch` suelto en cada servicio
   * porque esos `fetch` sueltos eran justamente los que se armaban el
   * `Authorization` a mano leyendo `localStorage`; sin pasar por acá se
   * quedaban sin sesión y la descarga devolvía 401.
   */
  async getBlob(endpoint: string): Promise<Blob> {
    const response = await this.peticion(endpoint, { method: "GET" });

    if (!response.ok) {
      throw await this.fallo(response);
    }

    return response.blob();
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_URL);