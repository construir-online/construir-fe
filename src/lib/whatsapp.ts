/**
 * Normalización de teléfonos venezolanos a enlaces de WhatsApp.
 *
 * Antes cada pantalla armaba el `https://wa.me/...` por su cuenta (o pintaba el
 * teléfono como texto muerto), así que el mismo número acababa en un enlace
 * distinto según dónde se mirara. Aquí queda la única versión de la regla.
 */

/** Códigos de operadora móvil en Venezuela. wa.me sólo tiene sentido en estos. */
const PREFIJOS_MOVILES = ['412', '414', '416', '424', '426'];

/**
 * Deja un teléfono venezolano en el formato que espera wa.me: 58 + 10 dígitos,
 * sin signos. Acepta lo que de verdad escribe la gente: "0412-1234567",
 * "0412 123 45 67", "+58 412 1234567", "412 1234567".
 *
 * Devuelve `null` si lo recibido no es un teléfono venezolano reconocible; el
 * llamador decide qué hacer, pero nunca se inventa un número.
 */
export function toVenezuelanNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Un "+" en medio o letras delatan basura ("no tiene", "0412 / 0414"); sólo se
  // tolera el "+" inicial del formato internacional.
  const limpio = phone.trim();
  if (/[a-zA-Z]/.test(limpio)) return null;
  if (limpio.includes('+') && !limpio.startsWith('+')) return null;

  const digitos = limpio.replace(/\D/g, '');

  let nacional: string;
  if (digitos.length === 12 && digitos.startsWith('58')) {
    nacional = digitos.slice(2);
  } else if (digitos.length === 11 && digitos.startsWith('0')) {
    nacional = digitos.slice(1);
  } else if (digitos.length === 10) {
    // Formato corto, sin 0 ni +58 ("412 1234567"). Se acepta porque es como
    // mucha gente teclea su móvil, pero tiene una colisión conocida: un número
    // norteamericano escrito sin su +1 y con código de área 412 (Pittsburgh),
    // 416 (Toronto) o 424 (Los Ángeles) sale de aquí como móvil venezolano, y
    // el chat se abriría con un desconocido. Con el +1 delante sí se rechaza.
    // Se asume a sabiendas: en una ferretería de Ciudad Bolívar perder el
    // formato corto molestaría a diario y el caso contrario no se ha visto.
    nacional = digitos;
  } else {
    return null;
  }

  // El área/operadora venezolana siempre empieza por 2 (fijo) o 4 (móvil).
  if (!/^[24]\d{9}$/.test(nacional)) return null;

  return `58${nacional}`;
}

/** ¿Es un móvil? Un fijo (0285…) no recibe WhatsApp por más que se enlace. */
export function isVenezuelanMobile(phone: string | null | undefined): boolean {
  const numero = toVenezuelanNumber(phone);
  return numero !== null && PREFIJOS_MOVILES.includes(numero.slice(2, 5));
}

/**
 * Enlace de WhatsApp para un teléfono.
 *
 * Devuelve `null` para los fijos a propósito: el cliente se quejaba de que el
 * teléfono de la tienda abría un chat que nadie leía. Un fijo se sigue
 * mostrando, pero como llamada, no como WhatsApp.
 */
export function toWhatsAppUrl(
  phone: string | null | undefined,
  text?: string
): string | null {
  if (!isVenezuelanMobile(phone)) return null;

  const numero = toVenezuelanNumber(phone)!;
  return text
    ? `https://wa.me/${numero}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${numero}`;
}

/** Enlace `tel:` en formato internacional, para cuando no hay WhatsApp. */
export function toTelHref(phone: string | null | undefined): string | null {
  const numero = toVenezuelanNumber(phone);
  if (numero) return `tel:+${numero}`;

  // Un número extranjero o con formato raro se sigue pudiendo marcar.
  const crudo = (phone ?? '').replace(/[^\d+]/g, '');
  return crudo.length >= 7 ? `tel:${crudo}` : null;
}

/**
 * El WhatsApp de la tienda, a partir del `whatsapp` de `/api/v1/store-info`.
 *
 * Es un campo aparte del `phone` porque el teléfono publicado de la tienda es
 * un fijo de Ciudad Bolívar y la atención por chat va a un móvil distinto.
 * Antes salía de `NEXT_PUBLIC_WHATSAPP_NUMBER`, que se fija al compilar: la web
 * llegó a producción con un número distinto del que usan los correos del
 * backend. Ahora hay una sola fuente, STORE_WHATSAPP_URL en el backend.
 */
export function storeWhatsAppNumber(configurado: string | null | undefined): string | null {
  // Se exige móvil, igual que hace `toWhatsAppUrl` con los teléfonos de
  // pantalla. Si alguien pega acá el fijo de la tienda —que es justo el número
  // que se publica en el pie— todos los botones de WhatsApp de la app
  // abrirían un chat que nadie lee. La regla ya existía; faltaba aplicarla
  // también al número de la tienda.
  if (!isVenezuelanMobile(configurado)) return null;

  return toVenezuelanNumber(configurado);
}

/** Enlace al WhatsApp de la tienda, con mensaje inicial opcional. */
export function storeWhatsAppUrl(
  configurado: string | null | undefined,
  text?: string
): string | null {
  const numero = storeWhatsAppNumber(configurado);
  if (!numero) return null;

  return text
    ? `https://wa.me/${numero}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${numero}`;
}

/** Cómo se muestra el WhatsApp de la tienda: "+58 412 000 0000". */
export function formatVenezuelanNumber(numero: string | null | undefined): string {
  const normalizado = toVenezuelanNumber(numero);
  if (!normalizado) return numero ?? '';

  const area = normalizado.slice(2, 5);
  const resto = normalizado.slice(5);
  return `+58 ${area} ${resto.slice(0, 3)} ${resto.slice(3)}`;
}
