import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentReceiptViewer } from '../PaymentReceiptViewer';
import { ordersService } from '@/services/orders';

/**
 * Regresión: el visor recibía `receiptUrl` — una dirección directa y permanente
 * al bucket de S3, que el backend metía dentro de la orden y que respondía 200 a
 * cualquiera sin credenciales. Cualquier persona con esa URL veía la captura del
 * pago del cliente: nombre, cédula, banco y número de cuenta. El componente
 * además la pasaba por `/api/image-proxy`, una ruta abierta del propio frontend
 * que reenviaba cualquier objeto de ese bucket.
 *
 * Ahora el visor sólo conoce el uuid de la orden y pide el enlace a
 * `GET /orders/:uuid/receipt`, que autoriza y devuelve algo que caduca. Estas
 * pruebas evitan que se vuelva a colar una URL fija en el componente.
 */
describe('PaymentReceiptViewer — el comprobante ya no viaja como URL pública', () => {
  const URL_FIRMADA =
    'https://congress-marketing.s3.us-east-2.amazonaws.com/private/receipts/abc.png' +
    '?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=300&X-Amz-Signature=deadbeef';

  beforeEach(() => {
    vi.spyOn(ordersService, 'getReceiptUrl').mockResolvedValue({
      url: URL_FIRMADA,
      expiresIn: 300,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('pide el enlace por el uuid de la orden y no por ninguna URL guardada', async () => {
    render(<PaymentReceiptViewer orderUuid="uuid-orden" orderNumber="1042" />);

    await waitFor(() =>
      expect(ordersService.getReceiptUrl).toHaveBeenCalledWith('uuid-orden'),
    );
  });

  it('pinta la imagen con el enlace firmado, sin pasarla por el proxy del frontend', async () => {
    render(<PaymentReceiptViewer orderUuid="uuid-orden" orderNumber="1042" />);

    const img = await screen.findByAltText('Comprobante de pago');
    expect(img).toHaveAttribute('src', URL_FIRMADA);
    // `/api/image-proxy` reenviaba cualquier objeto del bucket a quien lo pidiera.
    expect(img.getAttribute('src')).not.toContain('/api/image-proxy');
  });

  it('vuelve a pedir el enlace al abrir el modal, porque el anterior caduca', async () => {
    const usuario = userEvent.setup();
    render(<PaymentReceiptViewer orderUuid="uuid-orden" orderNumber="1042" />);

    await screen.findByAltText('Comprobante de pago');
    expect(ordersService.getReceiptUrl).toHaveBeenCalledTimes(1);

    await usuario.click(screen.getByRole('button', { name: /ver completo/i }));

    await waitFor(() =>
      expect(ordersService.getReceiptUrl).toHaveBeenCalledTimes(2),
    );
  });

  it('la descarga pide un enlace aparte marcado como descarga', async () => {
    const usuario = userEvent.setup();
    render(<PaymentReceiptViewer orderUuid="uuid-orden" orderNumber="1042" />);
    await screen.findByAltText('Comprobante de pago');

    await usuario.click(screen.getByRole('button', { name: /descargar/i }));

    await waitFor(() =>
      expect(ordersService.getReceiptUrl).toHaveBeenCalledWith('uuid-orden', {
        download: true,
      }),
    );
  });

  it('avisa en vez de romperse cuando el backend no autoriza', async () => {
    vi.mocked(ordersService.getReceiptUrl).mockRejectedValue(
      new Error('Access denied to this order'),
    );

    render(<PaymentReceiptViewer orderUuid="uuid-ajeno" orderNumber="1042" />);

    expect(
      await screen.findByText('No se pudo cargar el comprobante'),
    ).toBeInTheDocument();
    expect(screen.queryByAltText('Comprobante de pago')).toBeNull();
  });
});
