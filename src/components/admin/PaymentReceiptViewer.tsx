'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, Download, ExternalLink, FileText, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import { ordersService } from '@/services/orders';

interface PaymentReceiptViewerProps {
  /**
   * Ya no se recibe la URL del comprobante, sino el uuid de la orden.
   *
   * La URL venía dentro de la orden, apuntaba directo al bucket y era pública y
   * permanente: cualquiera que la tuviera veía la captura del pago con el
   * nombre, la cédula, el banco y el número de cuenta del cliente. Ahora el
   * enlace se pide a `GET /orders/:uuid/receipt`, que comprueba quién pregunta
   * y devuelve algo que caduca en minutos — por eso se pide aquí y no se
   * guarda en ningún sitio.
   */
  orderUuid: string;
  orderNumber: string;
  /**
   * `full` es la vista previa grande con sus botones (detalle público).
   * `thumbnail` es la miniatura cuadrada del detalle de orden del admin, donde
   * el comprobante va en una columna estrecha al lado de los datos del pago.
   * Ambas abren el mismo modal a pantalla completa.
   */
  variant?: 'full' | 'thumbnail';
}

export function PaymentReceiptViewer({
  orderUuid,
  orderNumber,
  variant = 'full',
}: PaymentReceiptViewerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // El enlace firmado caduca, así que se vuelve a pedir al abrir el modal: si
  // el admin dejó el detalle abierto media hora, el que ya tenía no sirve.
  const loadReceiptUrl = useCallback(async () => {
    try {
      const { url } = await ordersService.getReceiptUrl(orderUuid);
      setReceiptUrl(url);
      setError(null);
      return url;
    } catch {
      setError('No se pudo cargar el comprobante');
      return null;
    }
  }, [orderUuid]);

  useEffect(() => {
    void loadReceiptUrl();
  }, [loadReceiptUrl]);

  const openModal = async () => {
    await loadReceiptUrl();
    setIsModalOpen(true);
  };

  // El nombre del objeto sigue en la ruta de la URL firmada, antes de la firma.
  const isPDF = (receiptUrl?.split('?')[0] ?? '').toLowerCase().endsWith('.pdf');

  const handleDownload = async () => {
    try {
      // Se pide un enlace aparte con `Content-Disposition: attachment`: la
      // descarga la resuelve S3 con el nombre correcto, sin proxear el fichero
      // por el frontend ni pelear con CORS.
      const { url } = await ordersService.getReceiptUrl(orderUuid, {
        download: true,
      });
      window.location.href = url;
    } catch {
      setError('No se pudo descargar el comprobante');
    }
  };

  const previewFallback = (className: string) => (
    <div className={className}>
      {error ? (
        <>
          <ImageIcon className="mb-2 h-7 w-7 text-sand-500" strokeWidth={1.8} />
          <span className="text-[11px] font-semibold">{error}</span>
        </>
      ) : (
        <span className="text-[11px] font-semibold">Cargando…</span>
      )}
    </div>
  );

  return (
    <div>
      {/* Preview */}
      {variant === 'thumbnail' ? (
        <button
          type="button"
          onClick={openModal}
          title={`Comprobante de pago — orden ${orderNumber}`}
          className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-sand-300 bg-sand-100 transition-colors hover:border-brand-300"
        >
          {!receiptUrl ? (
            previewFallback(
              'flex h-full w-full flex-col items-center justify-center px-2 text-center text-sand-600',
            )
          ) : isPDF ? (
            <FileText className="h-7 w-7 text-sand-500" strokeWidth={1.8} />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={receiptUrl}
              alt="Comprobante de pago"
              className="h-full w-full object-cover"
              onError={() => setError('No se pudo cargar el comprobante')}
            />
          )}
          <span className="absolute inset-x-0 bottom-0 bg-white/90 py-1.5 text-[11px] font-bold text-brand-600">
            Ver comprobante
          </span>
        </button>
      ) : (
      <div className="space-y-3">
        <div className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          {!receiptUrl ? (
            previewFallback(
              'flex min-h-[300px] flex-col items-center justify-center p-12 text-center text-gray-600',
            )
          ) : isPDF ? (
            <div
              className="p-12 text-center cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={openModal}
            >
              <div className="text-6xl mb-3">📄</div>
              <p className="text-sm font-medium text-gray-700 mb-1">Comprobante PDF</p>
              <p className="text-xs text-gray-500">Click para ver en pantalla completa</p>
            </div>
          ) : (
            <div
              className="relative cursor-pointer p-4 flex items-center justify-center min-h-[300px]"
              onClick={openModal}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receiptUrl}
                alt="Comprobante de pago"
                className="max-w-full h-auto object-contain"
                style={{ maxHeight: '300px' }}
                onError={() => setError('No se pudo cargar el comprobante')}
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-opacity flex items-center justify-center pointer-events-none">
                <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openModal}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Ver completo
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Descargar
          </button>
        </div>
      </div>
      )}

      {/* Full screen modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-4">
              <h3 className="text-white font-semibold">
                Comprobante de Pago - Orden {orderNumber}
              </h3>
              <div className="flex items-center gap-2">
                {!isPDF && (
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                    <button
                      onClick={() => setZoom(Math.max(50, zoom - 10))}
                      className="text-black hover:text-gray-300"
                      disabled={zoom <= 50}
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="text-black text-sm font-medium min-w-[4rem] text-center">
                      {zoom}%
                    </span>
                    <button
                      onClick={() => setZoom(Math.min(200, zoom + 10))}
                      className="text-black hover:text-gray-300"
                      disabled={zoom >= 200}
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <button
                  onClick={handleDownload}
                  className="p-2 bg-white/20 rounded-lg text-black hover:bg-white/30 transition-colors"
                  title="Descargar"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-white/20 rounded-lg text-black hover:bg-white/30 transition-colors"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto flex items-center justify-center">
              {!receiptUrl ? (
                <p className="text-white text-sm">{error ?? 'Cargando…'}</p>
              ) : isPDF ? (
                <iframe
                  src={receiptUrl}
                  className="w-full h-full bg-white rounded-lg"
                  title="Comprobante de pago PDF"
                />
              ) : (
                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receiptUrl}
                    alt="Comprobante de pago"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
