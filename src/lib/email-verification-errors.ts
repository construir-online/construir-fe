/**
 * Traduce el resultado de abrir un enlace de verificación a una clave de
 * `auth.verifyEmail`.
 *
 * Antes la pantalla clasificaba mirando el texto del backend
 * —`msg.includes("expirado")`, `msg.includes("inválido")`—, con dos problemas.
 * Uno: bastaba con reescribir un mensaje en el backend para que dejara de
 * reconocerlo, y el fallo no rompía ninguna prueba. Dos: el texto buscado era
 * español, así que el día que ese mensaje viajara en inglés todo caía al caso
 * genérico.
 *
 * La clasificación va por el `code` que manda `/users/verify-email`
 * (`EmailVerificationErrorCode` en el backend). Todo lo que no se reconozca cae
 * en `unexpected`: mejor un mensaje genérico pero claro que filtrarle al
 * cliente una traza técnica.
 */
export type VerifyEmailErrorKey = 'expired' | 'invalid' | 'network' | 'unexpected';

type ApiErrorLike = Error & { statusCode?: number; code?: string };

export function verifyEmailErrorKey(err: unknown): VerifyEmailErrorKey {
  const e = err as ApiErrorLike | undefined;

  switch (e?.code) {
    case 'EMAIL_VERIFICATION_TOKEN_EXPIRED':
      return 'expired';
    case 'EMAIL_VERIFICATION_TOKEN_INVALID':
      return 'invalid';
  }

  // `fetch` sólo lanza cuando la petición no llegó a completarse; un rechazo
  // del servidor viaja con `statusCode`. Sin esa distinción, "no hay internet"
  // se le mostraba al cliente como si su enlace estuviera malo, y lo mandaba a
  // pedir uno nuevo que tampoco le iba a llegar.
  if (e && e.statusCode === undefined) {
    return 'network';
  }

  // Respaldo para un backend anterior a los `code`: frontend y backend no se
  // despliegan juntos. Se conserva la comparación por texto que había, pero
  // sólo como último recurso y no como criterio principal.
  const msg = e?.message ?? '';
  if (msg.includes('expirado') || msg.includes('expired')) return 'expired';
  if (msg.includes('inválido') || msg.includes('invalid')) return 'invalid';

  return 'unexpected';
}
