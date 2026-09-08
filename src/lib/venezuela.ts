/**
 * Cédula y teléfono venezolanos: una sola definición para todo el frontend.
 *
 * Ninguno de los dos se validaba. El cliente podía registrarse con el teléfono
 * "asdf" o una cédula de tres dígitos, y eso se descubría después: cuando el
 * despachador intentaba llamar para coordinar la entrega, o cuando el recibo
 * salía con una cédula que no existe.
 *
 * Esta copia es un espejo de `src/common/validation/venezuela.ts` del backend
 * —son dos repos, no hay dónde compartirla— y sirve para avisarle al cliente
 * antes de enviar el formulario. La regla que MANDA es la del backend: acá se
 * valida por cortesía, no por seguridad.
 *
 * Además de validar se NORMALIZA. "0412-1234567", "+58 412 1234567" y
 * "04121234567" son el mismo número; guardarlos distinto hacía que buscar a un
 * cliente por su teléfono no encontrara nada.
 */

/** Formato en el que se guarda un teléfono: `04141234567`. */
export const TELEFONO_MOVIL_VE_CANONICO = /^0(412|414|416|424|426)\d{7}$/;

/** Formato en el que se guarda una cédula: `V-12345678`. */
export const CEDULA_VE_CANONICA = /^[VE]-\d{7,8}$/;

/**
 * Deja un teléfono en su forma canónica, o `null` si no es un móvil venezolano.
 *
 * Se aceptan las formas en las que la gente los escribe de verdad:
 * `0412-123.45.67`, `0412 1234567`, `+58 412 1234567` y `584121234567`.
 */
export function normalizarTelefonoMovilVE(valor: unknown): string | null {
  if (typeof valor !== "string") return null;

  // Fuera todo lo que sea separador visual: guiones, puntos, espacios,
  // paréntesis. Sólo interesan los dígitos y un posible "+" del prefijo país.
  let digitos = valor.replace(/[^\d+]/g, "");

  // `+58412...` y `58412...` son el mismo número con el prefijo del país. Se le
  // devuelve el 0 inicial que usa la numeración local.
  digitos = digitos.replace(/^\+?58/, "0");

  // Alguien que escribe "4121234567" se está saltando el 0; es interpretable.
  if (/^4(12|14|16|24|26)\d{7}$/.test(digitos)) {
    digitos = `0${digitos}`;
  }

  return TELEFONO_MOVIL_VE_CANONICO.test(digitos) ? digitos : null;
}

/**
 * Deja una cédula en su forma canónica `V-12345678`, o `null` si no lo es.
 *
 * Se aceptan `v12345678`, `V 12.345.678`, `12345678` (se asume V, que es el
 * caso de la enorme mayoría) y la forma canónica misma.
 */
export function normalizarCedulaVE(valor: unknown): string | null {
  if (typeof valor !== "string") return null;

  const limpio = valor.trim().toUpperCase().replace(/[\s.\-]/g, "");
  const match = /^([VE]?)(\d{7,8})$/.exec(limpio);
  if (!match) return null;

  const [, prefijo, numero] = match;
  return `${prefijo || "V"}-${numero}`;
}

/**
 * Une el tipo y el número que el formulario pide por separado y normaliza.
 *
 * El registro tiene un `select` de tipo y un campo de número aparte, pero el
 * cliente igual pega "V-12345678" completo en el número: el normalizador se
 * come el prefijo repetido en vez de rechazarlo.
 */
export function normalizarCedulaVEDesdePartes(
  tipo: unknown,
  numero: unknown,
): string | null {
  if (typeof tipo !== "string" || typeof numero !== "string") return null;

  const soloNumero = numero.trim().toUpperCase().replace(/^[VE][\s.\-]*/, "");
  return normalizarCedulaVE(`${tipo}${soloNumero}`);
}

/**
 * Sólo los dígitos de la cédula, que es como los guarda el backend: el tipo
 * (V/E) viaja en su propio campo.
 */
export function digitosCedulaVE(tipo: unknown, numero: unknown): string | null {
  const canonico = normalizarCedulaVEDesdePartes(tipo, numero);
  return canonico ? canonico.slice(2) : null;
}

export function esTelefonoMovilVE(valor: unknown): boolean {
  return normalizarTelefonoMovilVE(valor) !== null;
}

/**
 * `true` si el par tipo/número es una cédula válida.
 *
 * Sólo V y E tienen esta forma. Un RIF jurídico (J), de gobierno (G) o un
 * pasaporte (P) tienen otras reglas que acá no se definen: exigirles la de la
 * cédula bloquearía compras de empresas que hoy funcionan.
 */
export function esIdentificacionValidaVE(
  tipo: unknown,
  numero: unknown,
): boolean {
  if (tipo !== "V" && tipo !== "E") {
    return typeof numero === "string" && numero.trim().length > 0;
  }
  return normalizarCedulaVEDesdePartes(tipo, numero) !== null;
}
