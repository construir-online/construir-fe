import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import WhatsAppPedidoBoton from '@/components/orders/WhatsAppPedidoBoton';

/**
 * El enlace lo arma el helper compartido; acá se fija lo que decidimos en estas
 * pantallas: que el mensaje diga de qué pedido se habla, y que sin número de
 * WhatsApp configurado el botón no se pinte —como en el pie y en contacto—,
 * porque un enlace a un chat inexistente es peor que no ofrecerlo.
 */
const original = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

const href = () =>
  (screen.getByRole('link') as HTMLAnchorElement).getAttribute('href') ?? '';

describe('WhatsAppPedidoBoton', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '0414-1925544';
  });
  afterEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = original;
    cleanup();
  });

  it('nombra el pedido en el mensaje precargado', () => {
    render(<WhatsAppPedidoBoton orderNumber="ORD-PRUEBA-0001">Escribir</WhatsAppPedidoBoton>);

    expect(decodeURIComponent(href())).toContain('ORD-PRUEBA-0001');
  });

  it('usa el número normalizado por el helper compartido', () => {
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
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '';
    render(<WhatsAppPedidoBoton orderNumber="ORD-1">Escribir</WhatsAppPedidoBoton>);

    expect(screen.queryByRole('link')).toBeNull();
  });

  it('tampoco se pinta si el número configurado no es un móvil venezolano', () => {
    // Un fijo no recibe WhatsApp por más que se enlace.
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '0285-6320178';
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
