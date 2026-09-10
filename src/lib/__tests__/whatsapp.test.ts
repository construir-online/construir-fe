import { describe, it, expect, afterEach } from 'vitest';
import {
  formatVenezuelanNumber,
  isVenezuelanMobile,
  storeWhatsAppNumber,
  storeWhatsAppUrl,
  toTelHref,
  toVenezuelanNumber,
  toWhatsAppUrl,
} from '../whatsapp';

/**
 * Los teléfonos se guardan y se publican tal como los escribe la gente
 * ("0412-1234567", "+58 412 123 45 67"), y cada pantalla los enlazaba a su
 * manera: unas dejaban el número como texto muerto y otras armaban un wa.me con
 * el 0 inicial dentro, que WhatsApp rechaza. Estas pruebas fijan la única
 * normalización válida.
 */
describe('toVenezuelanNumber', () => {
  it('acepta los formatos en que la gente escribe su móvil', () => {
    expect(toVenezuelanNumber('0412-1234567')).toBe('584121234567');
    expect(toVenezuelanNumber('0412 123 45 67')).toBe('584121234567');
    expect(toVenezuelanNumber('(0412) 123-4567')).toBe('584121234567');
    expect(toVenezuelanNumber('04121234567')).toBe('584121234567');
  });

  it('acepta el formato internacional con y sin +', () => {
    expect(toVenezuelanNumber('+58 412 1234567')).toBe('584121234567');
    expect(toVenezuelanNumber('+584121234567')).toBe('584121234567');
    expect(toVenezuelanNumber('584121234567')).toBe('584121234567');
  });

  it('acepta el número sin el 0 inicial', () => {
    // Es como lo teclea quien viene de guardar contactos en formato corto.
    expect(toVenezuelanNumber('4121234567')).toBe('584121234567');
  });

  it('normaliza también los fijos, que se siguen pudiendo llamar', () => {
    expect(toVenezuelanNumber('+58 285 632 0178')).toBe('582856320178');
    expect(toVenezuelanNumber('0285-6320178')).toBe('582856320178');
  });

  it('rechaza lo que no es un teléfono venezolano', () => {
    // Antes cualquier texto acababa dentro de un wa.me y el enlace abría un
    // chat con un número inventado.
    expect(toVenezuelanNumber('')).toBeNull();
    expect(toVenezuelanNumber(null)).toBeNull();
    expect(toVenezuelanNumber(undefined)).toBeNull();
    expect(toVenezuelanNumber('no tengo')).toBeNull();
    expect(toVenezuelanNumber('0412-12345')).toBeNull(); // corto
    expect(toVenezuelanNumber('041212345678901')).toBeNull(); // largo
    expect(toVenezuelanNumber('+1 415 555 2671')).toBeNull(); // extranjero
    expect(toVenezuelanNumber('0912-1234567')).toBeNull(); // área inexistente
    expect(toVenezuelanNumber('0412-1234567 / 0414-7654321')).toBeNull(); // dos números
  });
});

describe('isVenezuelanMobile', () => {
  it('reconoce las operadoras móviles', () => {
    for (const prefijo of ['412', '414', '416', '424', '426']) {
      expect(isVenezuelanMobile(`0${prefijo}1234567`)).toBe(true);
    }
  });

  it('no toma un fijo por un móvil', () => {
    expect(isVenezuelanMobile('+58 285 632 0178')).toBe(false);
    expect(isVenezuelanMobile('0212-5551234')).toBe(false);
  });
});

describe('toWhatsAppUrl', () => {
  it('arma el enlace con el número en formato internacional', () => {
    expect(toWhatsAppUrl('0412-1234567')).toBe('https://wa.me/584121234567');
  });

  it('escapa el mensaje inicial', () => {
    expect(toWhatsAppUrl('0412-1234567', 'Hola, ¿tienen cabillas?')).toBe(
      'https://wa.me/584121234567?text=Hola%2C%20%C2%BFtienen%20cabillas%3F'
    );
  });

  it('no le inventa WhatsApp a un fijo', () => {
    // El teléfono publicado de la tienda es el fijo de Ciudad Bolívar: enlazarlo
    // a wa.me abría un chat que nadie contestaba.
    expect(toWhatsAppUrl('+58 285 632 0178')).toBeNull();
  });

  it('devuelve null en vez de un enlace roto', () => {
    expect(toWhatsAppUrl('')).toBeNull();
    expect(toWhatsAppUrl('no tiene')).toBeNull();
  });
});

describe('toTelHref', () => {
  it('normaliza a formato internacional', () => {
    expect(toTelHref('0285-6320178')).toBe('tel:+582856320178');
  });

  it('deja marcable un número extranjero aunque no lo entienda', () => {
    expect(toTelHref('+1 415 555 2671')).toBe('tel:+14155552671');
  });

  it('no genera un tel: vacío', () => {
    expect(toTelHref('')).toBeNull();
    expect(toTelHref('123')).toBeNull();
  });
});

describe('storeWhatsAppUrl', () => {
  const original = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  afterEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = original;
  });

  it('usa el número configurado del entorno', () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '0412-0000000';
    expect(storeWhatsAppNumber()).toBe('584120000000');
    expect(storeWhatsAppUrl()).toBe('https://wa.me/584120000000');
  });

  it('sin configurar no pinta un botón que no lleva a nadie', () => {
    delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    expect(storeWhatsAppUrl()).toBeNull();
  });

  it('rechaza un fijo configurado por error, como hace toWhatsAppUrl', () => {
    // El fijo de la tienda es el número que se publica en el pie; si acaba acá
    // por copiar y pegar, todos los botones de WhatsApp abrirían un chat muerto.
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '0285-6320178';
    expect(storeWhatsAppNumber()).toBeNull();
    expect(storeWhatsAppUrl()).toBeNull();
  });
});

describe('formatVenezuelanNumber', () => {
  it('lo muestra agrupado y legible', () => {
    expect(formatVenezuelanNumber('584121234567')).toBe('+58 412 123 4567');
  });

  it('devuelve lo recibido si no lo reconoce, en vez de vaciar la pantalla', () => {
    expect(formatVenezuelanNumber('no tiene')).toBe('no tiene');
    expect(formatVenezuelanNumber(null)).toBe('');
  });
});
