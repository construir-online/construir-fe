import type { ApiError } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/**
 * `code` del error que se lanza cuando la API no contesta a tiempo.
 *
 * Va por `code` y no por el texto del mensaje por lo mismo que los errores de
 * `/auth/login`: el texto se reescribe sin avisar, el `code` no.
 */
export const TIMEOUT = "TIMEOUT";

/**
 * Cuánto se espera a la API antes de dar la petición por perdida.
 *
 * Sin esto, si el backend acepta la conexión pero no responde nunca —proceso
 * colgado, pool de conexiones agotado, un `await` que no vuelve— `fetch` no
 * corta jamás y la pantalla se queda cargando para siempre: el formulario de
 * contacto con el botón inhabilitado, el checkout sin decir si el pedido entró.
 * Un error es peor que un acierto, pero muchísimo mejor que un giro infinito.
 *
 * 20 segundos es holgado a propósito. La mayoría de las respuestas están muy
 * por debajo, pero el alta de un pedido escribe en la base y encima manda
 * correos, y buena parte de los clientes entran desde un móvil con una conexión
 * mala. Cortar a 5 o 10 segundos convertiría una compra lenta pero buena en un
 * error, que es justo el fallo caro: el cliente reintenta y se duplica el
 * pedido. Aquí sólo se quiere atrapar el caso de "esto no va a contestar nunca".
 */
const TIEMPO_MAXIMO_MS = 20_000;

/**
 * Las descargas del panel (las exportaciones a CSV) se miden en otra escala:
 * el servidor arma el archivo entero antes de mandar nada, y el listado de
 * pedidos crece. Un minuto es tolerable para un administrador que acaba de
 * pulsar "exportar" y ve el navegador trabajando.
 */
const TIEMPO_MAXIMO_DESCARGA_MS = 60_000;

type ErrorDeApi = Error & { statusCode?: number; code?: string };

/** `true` si el fallo es "la API no contestó a tiempo". */
export function isTimeout(err: unknown): boolean {
  return (err as ErrorDeApi | undefined)?.code === TIMEOUT;
}

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
   *
   * Y corta por tiempo con un `AbortController`: ver `TIEMPO_MAXIMO_MS`.
   */
  private async peticion(
    endpoint: string,
    options: RequestInit = {},
    tiempoMaximoMs: number = TIEMPO_MAXIMO_MS
  ): Promise<Response> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Set Content-Type only if body is not FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const controlador = new AbortController();
    // Hay que anotar quién abortó. Cuando salta el reloj y cuando quien llama
    // cancela a mano, `fetch` lanza exactamente el mismo `AbortError`, y no son
    // lo mismo: una cancelación pedida no es un fallo que haya que enseñarle a
    // nadie.
    let vencido = false;
    const reloj = setTimeout(() => {
      vencido = true;
      controlador.abort();
    }, tiempoMaximoMs);

    // Si quien llama trajo su propia señal, se respeta: se encadena a la
    // nuestra en vez de descartarla.
    const señalExterna = options.signal;
    const propagarCancelacion = () => controlador.abort();
    señalExterna?.addEventListener("abort", propagarCancelacion);

    try {
      return await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
        signal: controlador.signal,
      });
    } catch (err) {
      if (vencido) {
        throw this.tiempoAgotado();
      }
      throw err;
    } finally {
      clearTimeout(reloj);
      señalExterna?.removeEventListener("abort", propagarCancelacion);
    }
  }

  /**
   * El error de "no contestó a tiempo".
   *
   * Deliberadamente SIN `statusCode`, igual que un fallo de red: no hubo
   * respuesta del servidor, así que no hay estado que poner y fingir uno
   * (un 408, por ejemplo) haría que el clasificador de `auth-errors` lo tomara
   * por un rechazo del backend. Lo que lo separa de "no hay conexión" es el
   * `code`, que es el mecanismo que ya usa el resto de la aplicación; quien
   * necesite distinguirlo tiene `isTimeout()`.
   */
  private tiempoAgotado(): ErrorDeApi {
    const error = new Error(
      "La solicitud tardó demasiado y se canceló"
    ) as ErrorDeApi;
    error.code = TIMEOUT;
    return error;
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
    const response = await this.peticion(
      endpoint,
      { method: "GET" },
      TIEMPO_MAXIMO_DESCARGA_MS
    );

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