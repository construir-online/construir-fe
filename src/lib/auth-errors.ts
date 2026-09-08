/**
 * Traduce un fallo de inicio de sesión a una clave de `auth.loginErrors`.
 *
 * Antes las pantallas de acceso pintaban `err.message` tal cual, que es el
 * texto que redacta el backend: "Invalid credentials", "Account is
 * deactivated", "HTTP Error: 500 Internal Server Error" o, si el servidor no
 * respondía, el "Failed to fetch" del navegador. Al cliente le llegaba en
 * inglés — aunque tuviera la tienda en español — y con la redacción de un log,
 * sin decirle qué hacer al respecto.
 *
 * La clasificación va por el `code` que manda `/auth/login`
 * (`AuthErrorCode` en el backend) y no por el texto en inglés, que puede
 * cambiar de redacción sin avisar. Todo lo que no se reconozca cae en
 * `unexpected`: es preferible un mensaje genérico pero claro a filtrarle al
 * cliente una traza técnica.
 */
export type LoginErrorKey =
  | 'invalidCredentials'
  | 'accountDeactivated'
  | 'accountNotFound'
  | 'invalidEmail'
  | 'network'
  | 'unexpected';

/** El backend pide verificar el correo: la pantalla lo trata aparte, con la opción de reenviar el enlace. */
export const EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED';

type ApiErrorLike = Error & { statusCode?: number; code?: string };

/** `true` si el rechazo es "falta verificar el correo". */
export function isEmailNotVerified(err: unknown): boolean {
  const e = err as ApiErrorLike | undefined;
  // El texto sigue contemplado por si el backend desplegado es anterior a los
  // `code`: frontend y backend no se despliegan juntos.
  return e?.code === EMAIL_NOT_VERIFIED || e?.message === 'Email not verified';
}

export function loginErrorKey(err: unknown): LoginErrorKey {
  const e = err as ApiErrorLike | undefined;

  switch (e?.code) {
    case 'INVALID_CREDENTIALS':
      return 'invalidCredentials';
    case 'ACCOUNT_DEACTIVATED':
      return 'accountDeactivated';
    case 'ACCOUNT_NOT_FOUND':
      return 'accountNotFound';
  }

  // `fetch` sólo lanza cuando la petición no llegó a completarse; un rechazo
  // del servidor viaja con `statusCode`. Sin esa distinción, "no hay internet"
  // se le mostraba al cliente como si sus credenciales estuvieran mal.
  if (e && e.statusCode === undefined) {
    return 'network';
  }

  // 400 del ValidationPipe: el correo no tiene forma de correo.
  if (e?.statusCode === 400) {
    return 'invalidEmail';
  }

  // Respaldo para un backend anterior a los `code`.
  switch (e?.message) {
    case 'Invalid credentials':
      return 'invalidCredentials';
    case 'Account is deactivated':
      return 'accountDeactivated';
    case 'Account not found':
      return 'accountNotFound';
  }

  return 'unexpected';
}
