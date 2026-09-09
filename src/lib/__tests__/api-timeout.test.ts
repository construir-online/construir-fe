import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, isTimeout, TIMEOUT } from '../api';
import { loginErrorKey } from '../auth-errors';

/**
 * `apiClient` no cortaba nunca. Si el backend aceptaba la conexión pero no
 * respondía —proceso colgado, pool de conexiones agotado, un `await` que no
 * vuelve— `fetch` se quedaba esperando indefinidamente y la pantalla con él:
 * el formulario de contacto con el botón inhabilitado sin explicación, el
 * checkout girando sin decirle al cliente si su pedido entró o no.
 *
 * Ahora hay un `AbortController` con reloj. Estas pruebas fijan las tres cosas
 * que se rompen en silencio:
 *
 *  - que la señal de aborto llegue de verdad a `fetch` (sin ella el reloj corre
 *    y no corta nada);
 *  - que el error que sale se pueda distinguir de "no hay conexión", que es un
 *    problema distinto y con otra solución para el cliente;
 *  - que ese error NO traiga `statusCode`, porque el clasificador de
 *    `auth-errors` usa justamente su ausencia para separar el fallo de red de
 *    un rechazo del servidor.
 */
describe('apiClient — corte por tiempo', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /** Un `fetch` que nunca responde, pero que sí obedece a la señal de aborto. */
  const backendColgado = () =>
    fetchMock.mockImplementation(
      (_url: string, options: RequestInit) =>
        new Promise((_resolver, rechazar) => {
          options.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted.');
            err.name = 'AbortError';
            rechazar(err);
          });
        })
    );

  it('le pasa a fetch una señal de aborto', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({}),
    } as unknown as Response);

    await apiClient.get('/contact');

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.signal?.aborted).toBe(false);
  });

  it('corta la petición que no responde y no se queda esperando', async () => {
    backendColgado();

    const promesa = apiClient.get('/contact');
    // Se enganchan los dos desenlaces antes de mover el reloj: si el corte no
    // ocurriera, la promesa quedaría pendiente y esta prueba se colgaría igual
    // que la pantalla que arregla.
    const resultado = promesa.then(
      () => 'resolvió',
      (err) => err
    );

    await vi.advanceTimersByTimeAsync(20_000);

    const err = await resultado;
    expect(err).toBeInstanceOf(Error);
    expect((err as Error & { code?: string }).code).toBe(TIMEOUT);
  });

  it('aguanta sin cortar mientras el backend siga dentro del plazo', async () => {
    backendColgado();

    let cortada = false;
    const promesa = apiClient.get('/contact').catch(() => {
      cortada = true;
    });

    // Un segundo antes del límite la petición sigue viva. Sin esto, un reloj
    // puesto en, digamos, 200 ms pasaría la prueba anterior y rompería cualquier
    // compra hecha desde un móvil con mala señal.
    await vi.advanceTimersByTimeAsync(19_000);
    expect(cortada).toBe(false);

    await vi.advanceTimersByTimeAsync(2_000);
    await promesa;
    expect(cortada).toBe(true);
  });

  it('el error del corte se distingue de uno de red', async () => {
    backendColgado();

    const promesa = apiClient.get('/contact').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(20_000);
    const porTiempo = await promesa;

    // `fetch` sin conexión lanza un Error pelado, sin `code` ni `statusCode`.
    const porRed = new Error('Failed to fetch');

    expect(isTimeout(porTiempo)).toBe(true);
    expect(isTimeout(porRed)).toBe(false);
  });

  it('no le inventa un statusCode al error del corte', async () => {
    backendColgado();

    const promesa = apiClient.get('/auth/login').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(20_000);
    const err = (await promesa) as Error & { statusCode?: number };

    // Poner aquí un 408 haría que `loginErrorKey` lo tomara por un rechazo del
    // servidor y le dijera al cliente que sus credenciales están mal.
    expect(err.statusCode).toBeUndefined();
    expect(loginErrorKey(err)).toBe('network');
  });

  it('deja el reloj sin cuerda cuando la petición sí responde', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ ok: true }),
    } as unknown as Response);

    await apiClient.get('/contact');

    // Si el `clearTimeout` se cayera, cada petición dejaría un temporizador
    // vivo hasta 20 s después. No rompe nada visible, y por eso nadie lo
    // notaría: sólo va acumulando trabajo pendiente en cada navegación.
    expect(vi.getTimerCount()).toBe(0);
  });
});
