import { describe, it, expect } from 'vitest';
import {
  construirLineaTiempo,
  claveEtapaPreparacion,
  claveEtapaFinal,
  type EntradaLineaTiempo,
} from '@/lib/order-timeline';

const base: EntradaLineaTiempo = {
  status: 'processing',
  deliveryMethod: 'delivery',
  createdAt: '2026-08-01T10:24:00.000Z',
  paymentVerifiedAt: '2026-08-01T12:00:00.000Z',
  dateCompleted: null,
  paymentStatus: 'verified',
};

const etapa = (linea: ReturnType<typeof construirLineaTiempo>, id: string) =>
  linea!.find((e) => e.id === id)!;

describe('línea de tiempo del pedido', () => {
  it('marca cumplidas las etapas anteriores y actual la que corre', () => {
    const linea = construirLineaTiempo(base)!;

    expect(etapa(linea, 'recibido').estado).toBe('cumplida');
    expect(etapa(linea, 'pago').estado).toBe('cumplida');
    expect(etapa(linea, 'preparacion').estado).toBe('actual');
    expect(etapa(linea, 'entregado').estado).toBe('pendiente');
  });

  it('sólo pone fecha donde hay una marca de tiempo real', () => {
    const linea = construirLineaTiempo(base)!;

    expect(etapa(linea, 'recibido').fecha).toBe('2026-08-01T10:24:00.000Z');
    expect(etapa(linea, 'pago').fecha).toBe('2026-08-01T12:00:00.000Z');
    // La tabla no guarda cuándo entró en preparación: no se inventa.
    expect(etapa(linea, 'preparacion').fecha).toBeNull();
    expect(etapa(linea, 'entregado').fecha).toBeNull();
  });

  it('deja el pago sin fecha en el seguimiento público, que no la recibe', () => {
    const publico = { ...base, paymentVerifiedAt: undefined };
    const linea = construirLineaTiempo(publico)!;

    expect(etapa(linea, 'pago').estado).toBe('cumplida');
    expect(etapa(linea, 'pago').fecha).toBeNull();
  });

  it('no da el pago por cumplido si sigue sin verificarse, aunque el pedido avance', () => {
    const linea = construirLineaTiempo({
      ...base,
      status: 'processing',
      paymentStatus: 'pending',
      paymentVerifiedAt: null,
    })!;

    expect(etapa(linea, 'pago').estado).toBe('pendiente');
    expect(etapa(linea, 'pago').fecha).toBeNull();
  });

  it('marca el pago como actual cuando el pedido está justo en esa etapa', () => {
    const linea = construirLineaTiempo({
      ...base,
      status: 'payment_review',
      paymentStatus: 'pending',
      paymentVerifiedAt: null,
    })!;

    expect(etapa(linea, 'pago').estado).toBe('actual');
  });

  it('un pedido entregado con el pago sin verificar no pinta el pago «en curso»', () => {
    // Ese estado existe en la base. Pintar ámbar «En curso» entre dos etapas
    // verdes se lee como que la línea fue hacia atrás.
    const linea = construirLineaTiempo({
      ...base,
      status: 'completed',
      paymentStatus: 'pending',
      paymentVerifiedAt: null,
      dateCompleted: '2026-08-01T14:30:00.000Z',
    })!;

    expect(etapa(linea, 'pago').estado).toBe('pendiente');
    expect(etapa(linea, 'entregado').estado).toBe('cumplida');
  });

  it('cierra todas las etapas cuando el pedido está entregado', () => {
    const linea = construirLineaTiempo({
      ...base,
      status: 'delivered',
      dateCompleted: '2026-08-03T15:00:00.000Z',
    })!;

    expect(etapa(linea, 'entregado').estado).toBe('cumplida');
    expect(etapa(linea, 'entregado').fecha).toBe('2026-08-03T15:00:00.000Z');
  });

  it('no dibuja línea para un pedido cancelado', () => {
    expect(construirLineaTiempo({ ...base, status: 'cancelled' })).toBeNull();
  });

  it('no dibuja línea para reembolsado ni en espera', () => {
    expect(construirLineaTiempo({ ...base, status: 'refunded' })).toBeNull();
    expect(construirLineaTiempo({ ...base, status: 'on-hold' })).toBeNull();
  });

  it('un pedido recién hecho sólo tiene la primera etapa en curso', () => {
    const linea = construirLineaTiempo({
      ...base,
      status: 'pending',
      paymentStatus: 'pending',
      paymentVerifiedAt: null,
    })!;

    expect(etapa(linea, 'recibido').estado).toBe('actual');
    expect(etapa(linea, 'pago').estado).toBe('pendiente');
  });

  it('nombra la tercera etapa según cómo se recibe el pedido', () => {
    // Regla de producto: no hay guía ni encomienda, así que en retiro nada
    // está «en camino» — el pedido espera en la tienda.
    expect(claveEtapaPreparacion('pickup')).toBe('stageReadyForPickup');
    expect(claveEtapaPreparacion('delivery')).toBe('stageOnTheWay');
    expect(claveEtapaFinal('pickup')).toBe('stagePickedUp');
    expect(claveEtapaFinal('delivery')).toBe('stageDelivered');
  });
});
