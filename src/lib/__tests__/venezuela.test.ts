import { describe, it, expect } from 'vitest';
import {
  digitosCedulaVE,
  esIdentificacionValidaVE,
  esTelefonoMovilVE,
  normalizarCedulaVE,
  normalizarCedulaVEDesdePartes,
  normalizarTelefonoMovilVE,
} from '../venezuela';

/**
 * Ni la cédula ni el teléfono se validaban al registrarse ni al comprar. El
 * cliente podía dejar "asdf" de teléfono y una cédula de tres dígitos, y eso
 * se descubría cuando el despachador intentaba llamarlo para coordinar la
 * entrega o cuando el recibo salía con una identificación que no existe.
 *
 * Estas pruebas fijan las dos mitades del trato: qué se acepta —porque la
 * gente escribe los números de muchas formas y rechazar algo interpretable es
 * un cliente perdido— y qué NO, para que nadie afloje la regla sin darse
 * cuenta. Tienen que decir lo mismo que `venezuela.spec.ts` del backend, que
 * es el que manda.
 */
describe('normalizarTelefonoMovilVE', () => {
  it('acepta las formas en que la gente escribe su móvil y las deja iguales', () => {
    for (const escrito of [
      '04141234567',
      '0414-1234567',
      '0414 123 45 67',
      '0414.123.4567',
      '(0414) 1234567',
      '+58 414 1234567',
      '584141234567',
      '4141234567',
      // Código de país y encima el 0 de la numeración local: es como lo copia
      // la gente de su propio contacto de WhatsApp.
      '+58 (0414) 1234567',
      '+58 0414 123 45 67',
      '5804141234567',
      // La raya larga que pega Word o el teclado del móvil.
      '0414\u20131234567',
    ]) {
      expect(normalizarTelefonoMovilVE(escrito), escrito).toBe('04141234567');
    }
  });

  it('acepta las cinco operadoras móviles', () => {
    for (const prefijo of ['0412', '0414', '0416', '0424', '0426']) {
      expect(esTelefonoMovilVE(`${prefijo}1234567`), prefijo).toBe(true);
    }
  });

  it('deja fuera el prefijo internacional escrito con 00', () => {
    // `0058...` no lo escribe nadie y aceptarlo abriría la puerta a cualquier
    // cosa que empiece por ceros.
    expect(esTelefonoMovilVE('0058 414 1234567')).toBe(false);
    expect(esTelefonoMovilVE('004141234567')).toBe(false);
  });

  it('rechaza lo que no es un móvil venezolano', () => {
    // Fijos de Caracas y Valencia: no sirven para coordinar una entrega.
    for (const malo of [
      '02121234567',
      '02411234567',
      '04151234567',
      '0414123456',
      '041412345678',
      'asdf',
      '',
    ]) {
      expect(esTelefonoMovilVE(malo), malo).toBe(false);
    }
    expect(esTelefonoMovilVE(undefined)).toBe(false);
    expect(esTelefonoMovilVE(4141234567)).toBe(false);
  });
});

describe('normalizarCedulaVE', () => {
  it('acepta con guion, sin guion, en minúscula y con puntos', () => {
    for (const escrito of [
      'V-12345678',
      'v12345678',
      'V 12.345.678',
      '12345678',
      ' v-12345678 ',
      // La misma raya larga que el teléfono ya aceptaba. Que una la tragara y
      // la otra no era una asimetría sin motivo.
      'V\u201312345678',
      'V\u201412345678',
    ]) {
      expect(normalizarCedulaVE(escrito), escrito).toBe('V-12345678');
    }
  });

  it('conserva el prefijo E de los extranjeros', () => {
    expect(normalizarCedulaVE('e-12345678')).toBe('E-12345678');
  });

  it('acepta 7 dígitos además de 8', () => {
    // Las cédulas viejas tienen siete. Exigir ocho dejaba fuera a los clientes
    // de más edad.
    expect(normalizarCedulaVE('V-1234567')).toBe('V-1234567');
  });

  it('rechaza lo que no es una cédula', () => {
    for (const malo of ['123456', '123456789', 'J-123456789', 'V-1234567A', '']) {
      expect(normalizarCedulaVE(malo), malo).toBeNull();
    }
  });
});

describe('normalizarCedulaVEDesdePartes / digitosCedulaVE', () => {
  it('une el tipo del `select` con el número del campo de al lado', () => {
    expect(normalizarCedulaVEDesdePartes('V', '12345678')).toBe('V-12345678');
    expect(normalizarCedulaVEDesdePartes('E', '1234567')).toBe('E-1234567');
  });

  it('no se rompe si el cliente pega la cédula completa en el número', () => {
    // Pasa todo el tiempo: el `select` ya dice V y aun así pegan "V-12345678".
    expect(normalizarCedulaVEDesdePartes('V', 'V-12345678')).toBe('V-12345678');
    expect(normalizarCedulaVEDesdePartes('E', 'e12345678')).toBe('E-12345678');
  });

  it('deja sólo los dígitos, que es como los guarda el backend', () => {
    expect(digitosCedulaVE('V', 'v-12.345.678')).toBe('12345678');
    expect(digitosCedulaVE('V', '123')).toBeNull();
  });
});

describe('esIdentificacionValidaVE', () => {
  it('exige forma de cédula a V y E', () => {
    expect(esIdentificacionValidaVE('V', '12345678')).toBe(true);
    expect(esIdentificacionValidaVE('E', '1234567')).toBe(true);
    expect(esIdentificacionValidaVE('V', '123')).toBe(false);
    expect(esIdentificacionValidaVE('V', 'ABC12345')).toBe(false);
    expect(esIdentificacionValidaVE('V', '')).toBe(false);
  });

  it('no le aplica la regla de la cédula a un RIF ni a un pasaporte', () => {
    // Un jurídico (J), de gobierno (G) o un pasaporte (P) tienen otras reglas
    // que acá no se definen. Aplicarles la de la cédula bloquearía compras de
    // empresas que hoy funcionan.
    expect(esIdentificacionValidaVE('J', '123456789')).toBe(true);
    expect(esIdentificacionValidaVE('P', 'AB123456')).toBe(true);
    expect(esIdentificacionValidaVE('J', '')).toBe(false);
  });
});
