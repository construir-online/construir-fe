import type { OrderStatus, PaymentStatus, DeliveryMethod } from '@/types';

/**
 * Avance de un pedido, para contárselo a quien ya pagó y está esperando.
 *
 * NO hay bitácora de estados en el backend: la tabla de pedidos guarda el
 * estado actual y sólo tres marcas de tiempo reales (`createdAt`,
 * `paymentInfo.verifiedAt` y `dateCompleted`). Así que las etapas se derivan
 * del estado y las fechas se ponen ÚNICAMENTE donde existe una marca de verdad.
 * Inventar «pago verificado hace 2 h» a partir de `updatedAt` sería peor que no
 * poner fecha: parece un dato y no lo es.
 *
 * El seguimiento público recibe todavía menos —su DTO no manda `verifiedAt`—,
 * por eso la fecha de cada etapa es opcional y cada vista pasa lo que tiene.
 */
export interface EntradaLineaTiempo {
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  createdAt: string;
  /** Sólo en la vista con sesión; el DTO público no lo envía. */
  paymentVerifiedAt?: string | null;
  dateCompleted?: string | null;
  paymentStatus?: PaymentStatus | null;
}

export type EstadoEtapa = 'cumplida' | 'actual' | 'pendiente';

export interface EtapaPedido {
  id: 'recibido' | 'pago' | 'preparacion' | 'entregado';
  estado: EstadoEtapa;
  /** ISO de la marca real, o `null` si esa etapa no tiene fecha registrada. */
  fecha: string | null;
}

/**
 * Estados que no forman una línea recta. Un pedido cancelado o reembolsado no
 * "va por la etapa 2": dibujarle una barra de avance mentiría sobre su
 * desenlace, así que estas vistas no pintan línea de tiempo.
 */
const SIN_LINEA: ReadonlySet<OrderStatus> = new Set([
  'cancelled',
  'refunded',
  'on-hold',
]);

/** Hasta qué etapa (índice) llegó cada estado. */
const ETAPA_POR_ESTADO: Partial<Record<OrderStatus, number>> = {
  pending: 0,
  payment_review: 1,
  confirmed: 1,
  processing: 2,
  shipped: 2,
  delivered: 3,
  completed: 3,
};

/**
 * La tercera etapa se llama distinto según cómo se recibe el pedido. En retiro
 * no hay nada «en camino»: el pedido espera en la tienda. Y en delivery se
 * coordina por WhatsApp con un vendedor — no hay guía ni empresa de encomienda,
 * así que ninguna etapa habla de tránsito con courier.
 */
export function claveEtapaPreparacion(deliveryMethod: DeliveryMethod): string {
  return deliveryMethod === 'pickup' ? 'stageReadyForPickup' : 'stageOnTheWay';
}

export function claveEtapaFinal(deliveryMethod: DeliveryMethod): string {
  return deliveryMethod === 'pickup' ? 'stagePickedUp' : 'stageDelivered';
}

/**
 * Devuelve las cuatro etapas con su estado y su fecha real, o `null` cuando el
 * pedido no admite línea de tiempo (cancelado, reembolsado, en espera).
 */
export function construirLineaTiempo(
  pedido: EntradaLineaTiempo,
): EtapaPedido[] | null {
  if (SIN_LINEA.has(pedido.status)) return null;

  const alcanzada = ETAPA_POR_ESTADO[pedido.status];
  if (alcanzada === undefined) return null;

  // El pago verificado es un hecho propio: un pedido puede estar "processing"
  // con el pago aún por verificar, y al revés. Se cree al estado del pago
  // cuando viaja, y si no, a la etapa que dice el estado del pedido.
  const pagoVerificado =
    pedido.paymentStatus != null
      ? pedido.paymentStatus === 'verified'
      : alcanzada >= 1;

  const fechas: Array<string | null> = [
    pedido.createdAt,
    pagoVerificado ? (pedido.paymentVerifiedAt ?? null) : null,
    null, // preparación / en camino: no hay marca de tiempo en la tabla
    pedido.dateCompleted ?? null,
  ];

  const ids: EtapaPedido['id'][] = [
    'recibido',
    'pago',
    'preparacion',
    'entregado',
  ];

  return ids.map((id, i) => {
    let estado: EstadoEtapa;
    if (i < alcanzada) estado = 'cumplida';
    else if (i === alcanzada) estado = alcanzada === 3 ? 'cumplida' : 'actual';
    else estado = 'pendiente';

    // La etapa del pago no se da por cumplida si el pago sigue sin verificarse,
    // aunque el pedido haya avanzado: es la duda que trae al cliente acá. Queda
    // como pendiente y no como actual, porque «en curso» entre dos etapas ya
    // cumplidas —un pedido entregado con el pago sin verificar, que existe en
    // la base— se lee como que la línea fue hacia atrás. Así se dice lo único
    // cierto: ese hito no ocurrió, y el pedido siguió igual.
    if (id === 'pago' && !pagoVerificado && estado === 'cumplida') {
      estado = 'pendiente';
    }

    return { id, estado, fecha: fechas[i] };
  });
}
