import { describe, it, expect } from 'vitest';
import { verifyEmailErrorKey } from '../email-verification-errors';
import { resetErrorKey } from '../password-reset-errors';

/**
 * La pantalla de verificación clasificaba el fallo con
 * `msg.includes('expirado')` sobre el texto del backend. Dos problemas:
 * reescribir un mensaje allá la rompía sin que fallara nada, y el texto
 * buscado era español, así que en inglés todo caía al genérico.
 */
const err = (props: Partial<{ statusCode: number; code: string; message: string }>) =>
  Object.assign(new Error(props.message ?? 'x'), props);

describe('verifyEmailErrorKey', () => {
  it('clasifica por el code de la API', () => {
    expect(
      verifyEmailErrorKey(
        err({ statusCode: 400, code: 'EMAIL_VERIFICATION_TOKEN_EXPIRED' }),
      ),
    ).toBe('expired');
    expect(
      verifyEmailErrorKey(
        err({ statusCode: 400, code: 'EMAIL_VERIFICATION_TOKEN_INVALID' }),
      ),
    ).toBe('invalid');
  });

  it('el code manda sobre el texto, aunque el texto diga otra cosa', () => {
    // Lo que blinda contra que alguien reescriba el mensaje del backend.
    const e = err({
      statusCode: 400,
      code: 'EMAIL_VERIFICATION_TOKEN_EXPIRED',
      message: 'Token de verificación inválido',
    });
    expect(verifyEmailErrorKey(e)).toBe('expired');
  });

  it('distingue el fallo de red del enlace malo', () => {
    // Sin `statusCode` la petición no llegó a completarse. Antes "no hay
    // internet" se le mostraba al cliente como un enlace inservible, y lo
    // mandaba a pedir otro que tampoco le iba a llegar.
    expect(verifyEmailErrorKey(err({ message: 'Failed to fetch' }))).toBe('network');
  });

  it('sigue reconociendo un backend anterior a los code', () => {
    // Frontend y backend no se despliegan juntos.
    expect(
      verifyEmailErrorKey(err({ statusCode: 400, message: 'El token ha expirado' })),
    ).toBe('expired');
    expect(
      verifyEmailErrorKey(
        err({ statusCode: 400, message: 'Token de verificación inválido' }),
      ),
    ).toBe('invalid');
  });

  it('cae en unexpected antes que filtrar una traza', () => {
    expect(
      verifyEmailErrorKey(err({ statusCode: 500, message: 'ECONNREFUSED at pg.js:22' })),
    ).toBe('unexpected');
  });
});

describe('resetErrorKey', () => {
  it('separa el enlace muerto de la contraseña corta', () => {
    // Antes buscaba "400" dentro del mensaje, así que a quien escribía cinco
    // letras lo mandaba a pedir un enlace nuevo.
    expect(
      resetErrorKey(err({ statusCode: 400, code: 'PASSWORD_RESET_TOKEN_INVALID' })),
    ).toBe('tokenInvalid');
    expect(
      resetErrorKey(err({ statusCode: 400, code: 'PASSWORD_RESET_WEAK_PASSWORD' })),
    ).toBe('weakPassword');
  });

  it('trata el 404 del endpoint de metadata como enlace muerto', () => {
    expect(resetErrorKey(err({ statusCode: 404 }))).toBe('tokenInvalid');
  });

  it('distingue el fallo de red', () => {
    expect(resetErrorKey(err({ message: 'Failed to fetch' }))).toBe('network');
  });
});
