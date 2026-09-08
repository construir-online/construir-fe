import { describe, it, expect } from 'vitest';
import { loginErrorKey, isEmailNotVerified } from '../auth-errors';
import esMessages from '../../../messages/es.json';
import enMessages from '../../../messages/en.json';

/** El error tal como lo arma `apiClient` a partir de la respuesta del backend. */
const rechazo = (message: string, statusCode: number, code?: string) =>
  Object.assign(new Error(message), { statusCode, code });

describe('loginErrorKey', () => {
  it('clasifica por el `code` del backend', () => {
    expect(loginErrorKey(rechazo('Invalid credentials', 401, 'INVALID_CREDENTIALS')))
      .toBe('invalidCredentials');
    expect(loginErrorKey(rechazo('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED')))
      .toBe('accountDeactivated');
    expect(loginErrorKey(rechazo('Account not found', 401, 'ACCOUNT_NOT_FOUND')))
      .toBe('accountNotFound');
  });

  it('sigue funcionando contra un backend anterior a los `code`', () => {
    // Frontend y backend no se despliegan juntos: durante la ventana entre un
    // despliegue y otro el 401 llega sin `code`.
    expect(loginErrorKey(rechazo('Invalid credentials', 401)))
      .toBe('invalidCredentials');
    expect(loginErrorKey(rechazo('Account is deactivated', 401)))
      .toBe('accountDeactivated');
  });

  it('distingue "no hay conexión" de "credenciales mal"', () => {
    // `fetch` lanza sin `statusCode` cuando la petición no llegó a completarse.
    // Sin esta distinción, quedarse sin internet se le mostraba al cliente
    // como si su contraseña estuviera equivocada.
    expect(loginErrorKey(new Error('Failed to fetch'))).toBe('network');
  });

  it('trata el 400 del validador como correo mal escrito', () => {
    expect(loginErrorKey(rechazo('email must be an email', 400))).toBe('invalidEmail');
  });

  it('no deja escapar texto técnico al cliente', () => {
    // Un 500 o cualquier cosa desconocida cae en el mensaje genérico en vez de
    // pintarle al cliente "HTTP Error: 500 Internal Server Error".
    expect(loginErrorKey(rechazo('HTTP Error: 500 Internal Server Error', 500)))
      .toBe('unexpected');
    expect(loginErrorKey(undefined)).toBe('unexpected');
  });
});

describe('isEmailNotVerified', () => {
  it('reconoce el caso por `code` y por el texto viejo', () => {
    expect(isEmailNotVerified(rechazo('Email not verified', 401, 'EMAIL_NOT_VERIFIED'))).toBe(true);
    expect(isEmailNotVerified(rechazo('Email not verified', 401))).toBe(true);
    expect(isEmailNotVerified(rechazo('Invalid credentials', 401, 'INVALID_CREDENTIALS'))).toBe(false);
  });
});

describe('mensajes', () => {
  it('cada clave que devuelve el clasificador existe en los dos idiomas', () => {
    const claves = [
      'invalidCredentials',
      'accountDeactivated',
      'accountNotFound',
      'invalidEmail',
      'network',
      'unexpected',
    ];

    for (const clave of claves) {
      expect(esMessages.auth.loginErrors, `es: ${clave}`).toHaveProperty(clave);
      expect(enMessages.auth.loginErrors, `en: ${clave}`).toHaveProperty(clave);
    }
  });
});
