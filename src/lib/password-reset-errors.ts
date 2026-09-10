/**
 * Traduce un fallo de recuperación de contraseña a una clave de
 * `auth.resetErrors`.
 *
 * Va por el `code` que mandan `/auth/reset-password` y
 * `/auth/reset-password/:token` (`PasswordResetErrorCode` en el backend), no
 * por el texto del mensaje.
 *
 * Ojo con lo que NO se distingue: enlace inexistente, ya usado y vencido
 * comparten una sola clave, porque el backend a propósito no dice cuál de los
 * tres es — la diferencia sólo le sirve a quien esté probando tokens a ver cuál
 * acierta. Si algún día aparece un código por caso, el sitio para decidir si se
 * muestran distintos es el backend, no acá.
 */
export type ResetErrorKey =
  | 'tokenInvalid'
  | 'weakPassword'
  | 'network'
  | 'unexpected';

type ApiErrorLike = Error & { statusCode?: number; code?: string };

export function resetErrorKey(err: unknown): ResetErrorKey {
  const e = err as ApiErrorLike | undefined;

  switch (e?.code) {
    case 'PASSWORD_RESET_TOKEN_INVALID':
      return 'tokenInvalid';
    case 'PASSWORD_RESET_WEAK_PASSWORD':
      return 'weakPassword';
  }

  if (e && e.statusCode === undefined) {
    return 'network';
  }

  // Respaldo para un backend anterior a los `code`.
  const msg = e?.message ?? '';
  if (msg.includes('Token inválido') || msg.includes('no es válido')) {
    return 'tokenInvalid';
  }

  // El 404 del endpoint de metadata sólo puede ser el enlace: la ruta existe.
  if (e?.statusCode === 404) return 'tokenInvalid';

  return 'unexpected';
}
