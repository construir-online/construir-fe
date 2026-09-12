import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import WhatsAppPedidoBoton from '@/components/orders/WhatsAppPedidoBoton';

/**
 * El enlace lo arma el helper compartido; acá se fija lo que decidimos en estas
 * pantallas: que el mensaje diga de qué pedido se habla, y que sin número de
 * WhatsApp configurado el botón no se pinte —como en el pie y en contacto—,
 * porque un enlace a un chat inexistente es peor que no ofrecerlo.
 */
const tienda = vi.hoisted(() => ({ whatsapp: '' as string | undefined, cargada: true }));

vi.mock('@/hooks/useStoreInfo', () => ({
  useStoreInfo: () => ({
    storeInfo: tienda.cargada ? { whatsapp: tienda.whatsapp } : null,
    loading: !tienda.cargada,
    error: false,
  }),
}));

const href = () =>
  (screen.getByRole('link') as HTMLAnchorElement).getAttribute('href') ?? '';

describe('WhatsAppPedidoBoton', () => {
  beforeEach(() => {
    tienda.whatsapp = '584141925544';
    tienda.cargada = true;
  });
  afterEach(() => {
    cleanup();
  });

  it('nombra el pedido en el mensaje precargado', () => {
    render(<WhatsAppPedidoBoton orderNumber="ORD-PRUEBA-0001">Escribir</WhatsAppPedidoBoton>);

    expect(decodeURIComponent(href())).toContain('ORD-PRUEBA-0001');
  });

  it('usa el número que sirve el backend', () => {
    render(<WhatsAppPedidoBoton orderNumber="ORD-1">Escribir</WhatsAppPedidoBoton>);

    expect(href()).toContain('wa.me/584141925544');
  });

  it('sin número de pedido manda un mensaje genérico, no uno roto', () => {
    render(<WhatsAppPedidoBoton>Escribir</WhatsAppPedidoBoton>);

    const texto = decodeURIComponent(href());
    expect(texto).toContain('ayuda');
    expect(texto).not.toContain('undefined');
  });

  it('no se pinta si no hay WhatsApp configurado', () => {
    tienda.whatsapp = '';
    render(<WhatsAppPedidoBoton orderNumber="ORD-1">Escribir</WhatsAppPedidoBoton>);

    expect(screen.queryByRole('link')).toBeNull();
  });

  it('no se pinta mientras no han cargado los datos de la tienda', () => {
    tienda.cargada = false;
    render(<WhatsAppPedidoBoton orderNumber="ORD-1">Escribir</WhatsAppPedidoBoton>);

    expect(screen.queryByRole('link')).toBeNull();
  });

  it('tampoco se pinta si el número configurado no es un móvil venezolano', () => {
    // Un fijo no recibe WhatsApp por más que se enlace.
    tienda.whatsapp = '0285-6320178';
    render(<WhatsAppPedidoBoton orderNumber="ORD-1">Escribir</WhatsAppPedidoBoton>);

    expect(screen.queryByRole('link')).toBeNull();
  });

  it('abre en pestaña nueva y sin filtrar el referer', () => {
    render(<WhatsAppPedidoBoton orderNumber="ORD-1">Escribir</WhatsAppPedidoBoton>);
    const enlace = screen.getByRole('link');

    expect(enlace.getAttribute('target')).toBe('_blank');
    expect(enlace.getAttribute('rel')).toContain('noopener');
  });
});
