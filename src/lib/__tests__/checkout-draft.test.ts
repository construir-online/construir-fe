import { describe, it, expect } from 'vitest';
import {
  CLAVE_BORRADOR_CHECKOUT,
  restaurarBorradorCheckout,
  serializarBorradorCheckout,
  type EstadoBorradorCheckout,
} from '../checkout-draft';
import type { CheckoutData } from '@/types';
import { IdentificationType } from '@/types';
import { PaymentMethod } from '@/lib/enums';

const formulario = (over: Partial<CheckoutData> = {}): CheckoutData => ({
  deliveryMethod: 'delivery',
  identificationType: IdentificationType.V,
  identificationNumber: '12345678',
  firstName: 'Ana',
  lastName: 'Pérez',
  email: 'ana.perez@example.com',
  phone: '04141234567',
  address: 'Av. Principal, casa 4',
  city: 'Barquisimeto',
  state: 'Lara',
  zipCode: '3001',
  country: 'Venezuela',
  paymentMethod: PaymentMethod.PAGO_MOVIL,
  createAccount: true,
  password: 'MiClaveSecreta123',
  ...over,
});

const estado = (over: Partial<EstadoBorradorCheckout> = {}) =>
  ({
    form: formulario(),
    locationMethod: 'manual',
    identificationType: IdentificationType.V,
    identificationNumber: '12345678',
    ...over,
  }) as EstadoBorradorCheckout;

/**
 * El borrador del checkout se guarda en `sessionStorage` para que recargar a
 * media compra no obligue a empezar de cero, y se guardaba volcando el
 * formulario entero con `JSON.stringify`. Cuando el cliente marcaba "crear
 * cuenta", eso incluía el campo `password`: la contraseña que acababa de
 * escribir quedaba en texto plano en el navegador, legible por cualquier
 * script de la página y por quien tuviera el equipo delante.
 *
 * El código ya sabía hacerlo bien con los comprobantes de pago (`receipt:
 * null`); faltaba el mismo cuidado con la contraseña. Estas pruebas fijan las
 * dos mitades: que no se escriba nunca, y que al restaurar quede vacía —
 * incluso leyendo un borrador escrito por la versión anterior, que sí la
 * guardaba y que sigue estando en el navegador de los clientes.
 */
describe('serializarBorradorCheckout — la contraseña no se persiste', () => {
  it('no escribe la contraseña en el borrador', () => {
    const crudo = serializarBorradorCheckout(estado());

    // La comprobación importante es sobre el texto crudo: es exactamente lo
    // que termina en `sessionStorage` y lo que leería cualquier script.
    expect(crudo).not.toContain('MiClaveSecreta123');
    expect(crudo).not.toContain('password');
    expect(JSON.parse(crudo).form).not.toHaveProperty('password');
  });

  it('sigue guardando el resto del borrador', () => {
    // No vale "arreglarlo" dejando de guardar el borrador: la recarga a media
    // compra tiene que seguir restaurando lo demás.
    const guardado = JSON.parse(serializarBorradorCheckout(estado()));

    expect(guardado.form).toMatchObject({
      firstName: 'Ana',
      lastName: 'Pérez',
      email: 'ana.perez@example.com',
      phone: '04141234567',
      address: 'Av. Principal, casa 4',
      city: 'Barquisimeto',
      deliveryMethod: 'delivery',
    });
    expect(guardado.identificationNumber).toBe('12345678');
    expect(guardado.locationMethod).toBe('manual');
  });

  it('conserva "crear cuenta" para poder avisar de la contraseña al volver', () => {
    expect(JSON.parse(serializarBorradorCheckout(estado())).form.createAccount)
      .toBe(true);
  });

  it('tampoco guarda los comprobantes de pago', () => {
    const guardado = JSON.parse(
      serializarBorradorCheckout(
        estado({
          pagomovilPayment: {
            phoneNumber: '04141234567',
            cedula: 'V-12345678',
            bankCode: '0102',
            referenceCode: '123456',
            receipt: new File(['x'], 'comprobante.png'),
          } as EstadoBorradorCheckout['pagomovilPayment'],
        }),
      ),
    );

    expect(guardado.pagomovilPayment.receipt).toBeNull();
    expect(guardado.pagomovilPayment.referenceCode).toBe('123456');
  });
});

describe('restaurarBorradorCheckout — la contraseña vuelve vacía', () => {
  it('vacía la contraseña de un borrador viejo que sí la traía', () => {
    // En el navegador de los clientes que ya usaron el checkout hay borradores
    // escritos por la versión anterior, con la contraseña dentro. Restaurar
    // uno de esos no puede devolverla al formulario.
    const viejo = JSON.stringify({
      form: formulario(),
      locationMethod: 'manual',
    });

    const restaurado = restaurarBorradorCheckout(viejo);

    expect(restaurado?.estado.form?.password).toBe('');
    expect(restaurado?.estado.form?.firstName).toBe('Ana');
  });

  it('pide la contraseña de nuevo si el borrador quería crear cuenta', () => {
    // Sin este aviso el cliente se encuentra la casilla marcada y el campo
    // vacío, y el envío le falla sin que entienda por qué.
    const conCuenta = restaurarBorradorCheckout(
      serializarBorradorCheckout(estado()),
    );
    expect(conCuenta?.pedirContrasenaDeNuevo).toBe(true);

    const sinCuenta = restaurarBorradorCheckout(
      serializarBorradorCheckout(
        estado({ form: formulario({ createAccount: false }) }),
      ),
    );
    expect(sinCuenta?.pedirContrasenaDeNuevo).toBe(false);
  });

  it('restaura el resto del borrador como antes', () => {
    const restaurado = restaurarBorradorCheckout(
      serializarBorradorCheckout(estado()),
    );

    expect(restaurado?.estado.form).toMatchObject({
      firstName: 'Ana',
      email: 'ana.perez@example.com',
      address: 'Av. Principal, casa 4',
      deliveryMethod: 'delivery',
    });
    expect(restaurado?.estado.identificationNumber).toBe('12345678');
  });

  it('no revienta con un borrador ausente o corrupto', () => {
    expect(restaurarBorradorCheckout(null)).toBeNull();
    expect(restaurarBorradorCheckout('')).toBeNull();
    expect(restaurarBorradorCheckout('{no es json')).toBeNull();
    expect(restaurarBorradorCheckout('null')).toBeNull();
  });

  it('no cambia la clave de almacenamiento', () => {
    // Cambiarla dejaría huérfanos los borradores en curso de los clientes.
    expect(CLAVE_BORRADOR_CHECKOUT).toBe('checkout_draft');
  });
});
