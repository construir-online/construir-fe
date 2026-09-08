import type { ApiError } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Set Content-Type only if body is not FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
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
      throw error;
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