/**
 * Traduce un fallo de registro a una clave de `auth.registerErrors`.
 *
 * La pantalla de registro pintaba `err.message` tal cual, que es el texto que
 * redacta el backend: "Email already exists", la lista cruda del validador
 * ("phone must be a Venezuelan mobile number, password must be longer than or
 * equal to 6 characters"), "HTTP Error: 500 Internal Server Error" o, si el
 * servidor no respondía, el "Failed to fetch" del navegador. Al cliente le
 * llegaba en inglés —aunque tuviera la tienda en español— y con la redacción
 * de un log, sin decirle qué campo arreglar.
 *
 * La clasificación va por el `code` que manda `POST /users/register`
 * (`RegisterErrorCode` en el backend) y no por el texto en inglés, que puede
 * cambiar de redacción sin avisar. Todo lo que no se reconozca cae en
 * `unexpected`: es preferible un mensaje genérico pero claro a filtrarle al
 * cliente una traza técnica.
 *
 * Es el mismo patrón que `auth-errors.ts` usa para el login.
 */
export type RegisterErrorKey =
  | "emailAlreadyRegistered"
  | "invalidEmail"
  | "weakPassword"
  | "invalidPhone"
  | "invalidIdentification"
  | "missingFields"
  | "invalidData"
  | "network"
  | "unexpected";

type ApiErrorLike = Error & { statusCode?: number; code?: string };

/** `true` si el correo ya tiene cuenta: la pantalla ofrece iniciar sesión. */
export function isEmailAlreadyRegistered(err: unknown): boolean {
  return registerErrorKey(err) === "emailAlreadyRegistered";
}

export function registerErrorKey(err: unknown): RegisterErrorKey {
  const e = err as ApiErrorLike | undefined;

  switch (e?.code) {
    case "EMAIL_ALREADY_REGISTERED":
      return "emailAlreadyRegistered";
    case "INVALID_EMAIL":
      return "invalidEmail";
    case "WEAK_PASSWORD":
      return "weakPassword";
    case "INVALID_PHONE":
      return "invalidPhone";
    case "INVALID_IDENTIFICATION":
      return "invalidIdentification";
    case "MISSING_FIELDS":
      return "missingFields";
    case "INVALID_DATA":
      return "invalidData";
  }

  // `fetch` sólo lanza cuando la petición no llegó a completarse; un rechazo
  // del servidor viaja con `statusCode`. Sin esa distinción, "no hay internet"
  // se le mostraba al cliente como si sus datos estuvieran mal.
  if (e && e.statusCode === undefined) {
    return "network";
  }

  // Respaldo para un backend anterior a los `code`: frontend y backend no se
  // despliegan juntos, y durante esa ventana el rechazo llega sin `code`.
  if (e?.statusCode === 409 || e?.message === "Email already exists") {
    return "emailAlreadyRegistered";
  }
  if (e?.statusCode === 400) {
    return "invalidData";
  }

  return "unexpected";
}
