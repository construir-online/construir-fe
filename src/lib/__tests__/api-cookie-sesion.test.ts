import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../api';

/**
 * El JWT de sesión vivía en `localStorage`, y `apiClient` lo leía de ahí para
 * armar la cabecera `Authorization`. Cualquier XSS —o una dependencia
 * comprometida, o una extensión— se llevaba la sesión de un cliente o de un
 * administrador con una línea de JavaScript.
 *
 * Ahora el token está en una cookie `httpOnly` que este código NO puede leer,
 * y el navegador la adjunta solo gracias a `credentials: 'include'`.
 *
 * Estas pruebas fijan las dos mitades de eso, porque las dos se rompen en
 * silencio: si alguien vuelve a leer `localStorage` el agujero regresa sin que
 * nada falle, y si alguien quita el `credentials: 'include'` la petición sale
 * sin cookie y TODA la aplicación empieza a responder 401.
 */
describe('apiClient — sesión por cookie', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  const respuesta = (body: unknown = {}, status = 200) =>
    ({
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => body,
      blob: async () => new Blob(['csv']),
    }) as unknown as Response;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(respuesta({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  /** Las opciones con que se llamó a `fetch`. */
  const opciones = (): RequestInit => fetchMock.mock.calls[0][1];

  it('manda la cookie de sesión en cada petición', async () => {
    await apiClient.get('/auth/profile');
    // Sin esto la cookie no viaja: la API está en otro puerto (y en producción
    // en otro subdominio), así que para `fetch` es una petición cruzada y el
    // valor por defecto, `same-origin`, la omite.
    expect(opciones().credentials).toBe('include');
  });

  it('NO manda `Authorization` aunque haya un token viejo en `localStorage`', async () => {
    // Un navegador que ya usó la versión anterior de la tienda conserva el
    // token guardado. Si `apiClient` lo siguiera leyendo, la migración no
    // cerraría nada: seguiría circulando el valor que el XSS puede robar.
    localStorage.setItem('token', 'jwt.viejo.de.localstorage');

    await apiClient.get('/auth/profile');

    const headers = opciones().headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
    expect(JSON.stringify(opciones())).not.toContain('jwt.viejo.de.localstorage');
  });

  it('también manda la cookie en las escrituras', async () => {
    await apiClient.post('/orders', { total: 1 });
    expect(opciones().credentials).toBe('include');
    expect((opciones().headers as Record<string, string>)['Content-Type'])
      .toBe('application/json');
  });

  it('no le pone `Content-Type` a un FormData', async () => {
    // El navegador tiene que poner el `boundary` del multipart; fijarlo a
    // mano rompía la subida del comprobante de pago y las imágenes de banners.
    const fd = new FormData();
    fd.append('receipt', new Blob(['x']));
    await apiClient.post('/orders/abc/receipt', fd);

    const headers = opciones().headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
    expect(opciones().credentials).toBe('include');
  });

  it('`getBlob` también va con sesión', async () => {
    // Las exportaciones a CSV del panel eran `fetch` sueltos que se armaban el
    // `Authorization` leyendo `localStorage`; sin pasar por acá se quedaban sin
    // credenciales y la descarga devolvía 401.
    const blob = await apiClient.getBlob('/customers/export/csv');
    expect(blob).toBeInstanceOf(Blob);
    expect(opciones().credentials).toBe('include');
  });

  it('sigue enriqueciendo el error con `statusCode` y `code`', async () => {
    // Contrato que ya existía y del que dependen las pantallas de login.
    fetchMock.mockResolvedValue(
      respuesta({ message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }, 401),
    );

    await expect(apiClient.post('/auth/login', {})).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });
});
