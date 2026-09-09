import { apiClient } from '@/lib/api';
import type { GuestCustomer, IdentificationType } from '@/types';

/**
 * Servicio para gestión de clientes guest
 */
export const guestCustomersService = {
  /**
   * Busca un cliente guest para autocompletar el checkout.
   *
   * Hacen falta DOS datos, no sólo la identificación. Con la cédula sola el
   * endpoint entregaba la ficha completa de cualquier comprador, y como las
   * cédulas venezolanas son secuenciales bastaba con recorrerlas en orden para
   * bajarse la base de clientes entera. El teléfono es el segundo dato: el
   * cliente que vuelve se lo sabe, quien enumera cédulas no.
   *
   * El backend responde igual —cuerpo vacío— si la cédula no existe y si el
   * teléfono no coincide, a propósito: distinguirlos permitiría enumerar otra
   * vez. Acá eso se ve como un `null` en los dos casos, y no hay forma de
   * saber cuál de los dos fue.
   *
   * Sigue limitado a 5 consultas por minuto, así que conviene no dispararlo en
   * cada pulsación: el checkout sólo consulta al salir de un campo y no repite
   * la misma combinación dos veces.
   *
   * Ojo con el tipo: aunque `GuestCustomer` declare `latitude` y `longitude`,
   * esta ruta NO las devuelve. Son el punto exacto de la casa de alguien y la
   * ruta no tiene sesión; el checkout pide la dirección a mano, así que no
   * hacían falta. Si algún día vuelve el mapa, reabrir eso es una decisión a
   * tomar a conciencia, no algo que se dé por hecho porque el tipo lo diga.
   */
  async searchByIdentification(
    identificationType: IdentificationType,
    identificationNumber: string,
    phone: string
  ): Promise<GuestCustomer | null> {
    const params = new URLSearchParams({
      identificationType,
      identificationNumber,
      phone,
    });

    const response = await apiClient.get<GuestCustomer | null>(
      `/guest-customers/search?${params.toString()}`
    );

    return response || null;
  },
};
