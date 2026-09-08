import { describe, it, expect } from 'vitest';
import { registerErrorKey, isEmailAlreadyRegistered } from '../register-errors';
import esMessages from '../../../messages/es.json';
import enMessages from '../../../messages/en.json';

/** El error tal como lo arma `apiClient` a partir de la respuesta del backend. */
const rechazo = (message: string, statusCode: number, code?: string) =>
  Object.assign(new Error(message), { statusCode, code });

/**
 * La pantalla de registro pintaba `err.message` tal cual, que es el texto que
 * redacta el backend: "Email already exists" o la lista cruda del validador
 * ("phone must be a Venezuelan mobile number"). Al cliente le llegaba en
 * inglés —aunque tuviera la tienda en español— y con redacción de log, sin
 * decirle qué campo arreglar.
 *
 * Estas pruebas fijan el contrato con el backend: se clasifica por `code`, y
 * lo desconocido nunca se le pinta crudo al cliente.
 */
describe('registerErrorKey', () => {
  it('clasifica por el `code` del backend', () => {
    expect(registerErrorKey(rechazo('Email already exists', 409, 'EMAIL_ALREADY_REGISTERED')))
      .toBe('emailAlreadyRegistered');
    expect(registerErrorKey(rechazo('email must be an email', 400, 'INVALID_EMAIL')))
      .toBe('invalidEmail');
    expect(registerErrorKey(rechazo('password too short', 400, 'WEAK_PASSWORD')))
      .toBe('weakPassword');
    expect(registerErrorKey(rechazo('phone must be a Venezuelan mobile number', 400, 'INVALID_PHONE')))
      .toBe('invalidPhone');
    expect(registerErrorKey(rechazo('identificationNumber must be...', 400, 'INVALID_IDENTIFICATION')))
      .toBe('invalidIdentification');
    expect(registerErrorKey(rechazo('firstName should not be empty', 400, 'MISSING_FIELDS')))
      .toBe('missingFields');
    expect(registerErrorKey(rechazo('property foo should not exist', 400, 'INVALID_DATA')))
      .toBe('invalidData');
  });

  it('sigue funcionando contra un backend anterior a los `code`', () => {
    // Frontend y backend no se despliegan juntos: durante la ventana entre un
    // despliegue y otro el rechazo llega sin `code`.
    expect(registerErrorKey(rechazo('Email already exists', 409))).toBe('emailAlreadyRegistered');
    expect(registerErrorKey(rechazo('phone must be a string', 400))).toBe('invalidData');
  });

  it('distingue "no hay conexión" de "los datos están mal"', () => {
    // `fetch` lanza sin `statusCode` cuando la petición no llegó a completarse.
    expect(registerErrorKey(new Error('Failed to fetch'))).toBe('network');
  });

  it('no deja escapar texto técnico al cliente', () => {
    expect(registerErrorKey(rechazo('HTTP Error: 500 Internal Server Error', 500)))
      .toBe('unexpected');
    expect(registerErrorKey(undefined)).toBe('unexpected');
  });
});

describe('isEmailAlreadyRegistered', () => {
  it('reconoce el caso por `code` y por el 409 del backend viejo', () => {
    expect(isEmailAlreadyRegistered(rechazo('Email already exists', 409, 'EMAIL_ALREADY_REGISTERED'))).toBe(true);
    expect(isEmailAlreadyRegistered(rechazo('Email already exists', 409))).toBe(true);
    expect(isEmailAlreadyRegistered(rechazo('phone invalid', 400, 'INVALID_PHONE'))).toBe(false);
  });
});

describe('mensajes', () => {
  it('cada clave que devuelve el clasificador existe en los dos idiomas', () => {
    const claves = [
      'emailAlreadyRegistered',
      'invalidEmail',
      'weakPassword',
      'invalidPhone',
      'invalidIdentification',
      'missingFields',
      'invalidData',
      'network',
      'unexpected',
    ];

    for (const clave of claves) {
      expect(esMessages.auth.registerErrors, `es: ${clave}`).toHaveProperty(clave);
      expect(enMessages.auth.registerErrors, `en: ${clave}`).toHaveProperty(clave);
    }
  });

  it('el formulario de registro tiene sus avisos de campo en los dos idiomas', () => {
    const claves = [
      'required',
      'email',
      'password',
      'passwordsMismatch',
      'phone',
      'identification',
    ];

    for (const clave of claves) {
      expect(esMessages.auth.fieldErrors, `es: ${clave}`).toHaveProperty(clave);
      expect(enMessages.auth.fieldErrors, `en: ${clave}`).toHaveProperty(clave);
    }
  });

  it('el checkout tiene los mismos avisos de teléfono y cédula traducidos', () => {
    for (const clave of ['phoneInvalid', 'identificationInvalid']) {
      expect(esMessages.checkout.errors, `es: ${clave}`).toHaveProperty(clave);
      expect(enMessages.checkout.errors, `en: ${clave}`).toHaveProperty(clave);
    }
  });
});
