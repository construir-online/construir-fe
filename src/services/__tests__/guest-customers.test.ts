import { describe, it, expect, vi, beforeEach } from 'vitest';
import { guestCustomersService } from '../guest-customers';
import { IdentificationType } from '@/types';

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api';

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * El buscador de invitados del checkout devolvía la ficha completa de un
 * comprador —nombre, correo, teléfono, dirección, GPS— con sólo el tipo y el
 * número de cédula, sin autenticación. Como las cédulas venezolanas son
 * secuenciales, recorrerlas en orden era bajarse la base de clientes entera.
 *
 * El cierre fue exigir un segundo dato, el teléfono. Estas pruebas evitan que
 * el frontend vuelva a pedir la ficha con la cédula sola: si alguien quita el
 * parámetro `phone` de la petición, el autocompletado deja de funcionar en
 * silencio y nadie se entera hasta que un cliente se queja.
 */
describe('guestCustomersService.searchByIdentification', () => {
  it('manda el teléfono además de la cédula', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(null);

    await guestCustomersService.searchByIdentification(
      IdentificationType.V,
      '12345678',
      '0414-1234567',
    );

    const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
    const params = new URLSearchParams(url.split('?')[1]);

    expect(params.get('identificationType')).toBe('V');
    expect(params.get('identificationNumber')).toBe('12345678');
    expect(params.get('phone')).toBe('0414-1234567');
  });

  it('manda el teléfono tal cual, sin normalizarlo antes', async () => {
    // La normalización la hace el backend, que es quien manda: si el frontend
    // "arreglara" el número primero, un cliente cuyo teléfono está guardado en
    // un formato que el frontend no contempla dejaría de reconocerse.
    vi.mocked(apiClient.get).mockResolvedValueOnce(null);

    await guestCustomersService.searchByIdentification(
      IdentificationType.V,
      '12345678',
      '+58 414 123 45 67',
    );

    const url = vi.mocked(apiClient.get).mock.calls[0][0] as string;
    expect(new URLSearchParams(url.split('?')[1]).get('phone')).toBe(
      '+58 414 123 45 67',
    );
  });

  it('devuelve null sin distinguir por qué falló la búsqueda', async () => {
    // El backend responde igual si la cédula no existe y si el teléfono no
    // coincide, a propósito. El frontend no puede inventarse la diferencia.
    vi.mocked(apiClient.get).mockResolvedValueOnce(null);
    const cedulaDesconocida = await guestCustomersService.searchByIdentification(
      IdentificationType.V,
      '99999999',
      '04141234567',
    );

    vi.mocked(apiClient.get).mockResolvedValueOnce(null);
    const telefonoIncorrecto = await guestCustomersService.searchByIdentification(
      IdentificationType.V,
      '12345678',
      '04241111111',
    );

    expect(cedulaDesconocida).toBeNull();
    expect(telefonoIncorrecto).toBeNull();
    expect(cedulaDesconocida).toEqual(telefonoIncorrecto);
  });

  it('devuelve la ficha cuando la cédula y el teléfono coinciden', async () => {
    const ficha = {
      identificationType: IdentificationType.V,
      identificationNumber: '12345678',
      firstName: 'Ana',
      lastName: 'Pérez',
      email: 'ana.perez@example.com',
      phone: '04141234567',
      address: 'Av. Principal, casa 4',
      ordersCount: 3,
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce(ficha);

    expect(
      await guestCustomersService.searchByIdentification(
        IdentificationType.V,
        '12345678',
        '04141234567',
      ),
    ).toEqual(ficha);
  });
});
