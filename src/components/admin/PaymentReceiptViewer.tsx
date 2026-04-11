'use client';

import { useState } from 'react';
import { X, Download, ExternalLink, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';

interface PaymentReceiptViewerProps {
  receiptUrl: string;
  orderNumber: string;
}

function getProxiedUrl(url: string): string {
  if (url.startsWith('http')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export function PaymentReceiptViewer({ receiptUrl, orderNumber }: PaymentReceiptViewerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [imageError, setImageError] = useState(false);

  const isPDF = receiptUrl.toLowerCase().endsWith('.pdf');
  const proxiedUrl = getProxiedUrl(receiptUrl);

  const handleDownload = async () => {
    try {
      const response = await fetch(receiptUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobante-${orderNumber}.${isPDF ? 'pdf' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Error al descargar el comprobante');
    }
  };

  return (
    <div>
      {/* Preview */}
      <div className="space-y-3">
        <div className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          {isPDF ? (
            <div
              className="p-12 text-center cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setIsModalOpen(true)}
            >
              <div className="text-6xl mb-3">📄</div>
              <p className="text-sm font-medium text-gray-700 mb-1">Comprobante PDF</p>
              <p className="text-xs text-gray-500">Click para ver en pantalla completa</p>
            </div>
          ) : imageError ? (
            <div className="p-12 text-center">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-2">No se pudo cargar la imagen</p>
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Abrir en nueva pestaña
              </a>
            </div>
          ) : (
            <div
              className="relative cursor-pointer p-4 flex items-center justify-center min-h-[300px]"
              onClick={() => setIsModalOpen(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proxiedUrl}
                alt="Comprobante de pago"
                className="max-w-full h-auto object-contain"
                style={{ maxHeight: '300px' }}
                onError={() => setImageError(true)}
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
            onClick={() => setIsModalOpen(true)}
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
              {isPDF ? (
                <iframe
                  src={receiptUrl}
                  className="w-full h-full bg-white rounded-lg"
                  title="Comprobante de pago PDF"
                />
              ) : (
                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proxiedUrl}
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
