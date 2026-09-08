import type {
  CheckoutData,
  ZellePayment,
  PagoMovilPayment,
  TransferenciaPayment,
  IdentificationType,
} from "@/types";

/**
 * El borrador del checkout: lo que se guarda para que recargar a media compra
 * no obligue a empezar de cero.
 *
 * Vive en `sessionStorage`, o sea en texto plano, legible por cualquier script
 * de la página y por quien tenga el equipo delante. Por eso lo que se guarda
 * se decide acá y a mano, y no volcando el formulario entero: el comprobante
 * de pago ya se excluía (`receipt: null`) y la contraseña no, así que la que
 * el cliente acababa de escribir para crear su cuenta quedaba ahí, en claro.
 *
 * Una contraseña no es como el resto del borrador. La dirección o la cédula
 * son datos del propio cliente en su propio equipo; una contraseña es una
 * credencial que además suele repetirse en otros sitios.
 */

export const CLAVE_BORRADOR_CHECKOUT = "checkout_draft";

export interface EstadoBorradorCheckout {
  form: CheckoutData;
  locationMethod: "manual" | "auto" | "map";
  identificationType?: IdentificationType;
  identificationNumber?: string;
  zellePayment?: ZellePayment;
  pagomovilPayment?: PagoMovilPayment;
  transferenciaPayment?: TransferenciaPayment;
}

/**
 * Arma el JSON que se escribe en `sessionStorage`.
 *
 * `password` se saca aquí y no se guarda nunca, por la misma razón por la que
 * los tres `receipt` van a `null`: hay cosas que no deben sobrevivir a la
 * pestaña. `createAccount` sí se conserva, para poder avisarle al cliente al
 * volver de que su contraseña se descartó a propósito.
 */
export function serializarBorradorCheckout(
  estado: EstadoBorradorCheckout,
): string {
  // Desestructurar y descartar es a propósito: si mañana alguien añade un
  // campo al formulario, entra solo al borrador, pero la contraseña tiene que
  // seguir saliendo de forma explícita.
  const { password: _descartada, ...formSinContrasena } = estado.form;
  void _descartada;

  return JSON.stringify({
    ...estado,
    form: formSinContrasena,
    zellePayment: estado.zellePayment
      ? { ...estado.zellePayment, receipt: null }
      : undefined,
    pagomovilPayment: estado.pagomovilPayment
      ? { ...estado.pagomovilPayment, receipt: null }
      : undefined,
    transferenciaPayment: estado.transferenciaPayment
      ? { ...estado.transferenciaPayment, receipt: null }
      : undefined,
  });
}

export interface BorradorRestaurado {
  estado: Partial<EstadoBorradorCheckout>;
  /**
   * El borrador venía con "crear cuenta" marcado, así que hay que decirle al
   * cliente por qué el campo de contraseña le aparece vacío. Sin este aviso se
   * encontraría un formulario que promete crear una cuenta y que falla al
   * enviarlo sin explicar por qué.
   */
  pedirContrasenaDeNuevo: boolean;
}

/**
 * Lee el borrador guardado. Devuelve `null` si no hay o si está corrupto.
 *
 * La contraseña se vacía SIEMPRE al restaurar, no sólo porque ya no se guarda:
 * en los navegadores de los clientes que ya usaron el checkout hay borradores
 * escritos por la versión anterior, y esos sí la traen dentro.
 */
export function restaurarBorradorCheckout(
  crudo: string | null,
): BorradorRestaurado | null {
  if (!crudo) return null;

  let data: Partial<EstadoBorradorCheckout>;
  try {
    data = JSON.parse(crudo) as Partial<EstadoBorradorCheckout>;
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;

  const form = data.form;
  const pedirContrasenaDeNuevo = Boolean(form?.createAccount);

  return {
    estado: {
      ...data,
      form: form ? { ...form, password: "" } : undefined,
    },
    pedirContrasenaDeNuevo,
  };
}
