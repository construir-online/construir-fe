'use client';

import { MapPin, Phone, Clock, ExternalLink, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useStoreInfo } from '@/hooks/useStoreInfo';
import PhoneLink from '@/components/common/PhoneLink';
import { formatVenezuelanNumber, storeWhatsAppNumber, storeWhatsAppUrl } from '@/lib/whatsapp';

export default function StoreInfo() {
  const t = useTranslations('checkout');
  const { storeInfo, loading, error, reload } = useStoreInfo();
  const whatsAppUrl = storeWhatsAppUrl();
  const whatsAppNumber = storeWhatsAppNumber();

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-2/5 rounded bg-brand-200/70" />
          <div className="h-4 w-3/4 rounded bg-brand-200/50" />
          <div className="h-4 w-1/2 rounded bg-brand-200/50" />
          <div className="h-4 w-2/3 rounded bg-brand-200/50" />
        </div>
      </div>
    );
  }

  // Nunca desaparecer en silencio: sin estos datos el comprador no sabe dónde
  // retirar su pedido, así que se avisa y se ofrece reintentar.
  if (error || !storeInfo) {
    return (
      <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-ink">
          <MapPin className="h-5 w-5 text-brand-600" />
          {t('pickupLocationTitle')}
        </h3>
        <p className="text-sm text-sand-700">
          No pudimos cargar los datos de la tienda.
        </p>
        <button
          type="button"
          onClick={reload}
          className="mt-2 min-h-11 text-sm font-bold text-brand-600 hover:text-brand-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-brand-50 border-2 border-brand-200 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-brand-600" />
        {t('pickupLocationTitle')}
      </h3>

      <div className="space-y-3">
        {/* Dirección */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-sand-700 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-ink">{storeInfo.name}</p>
            {storeInfo.address && (
              <p className="text-sm text-sand-700">{storeInfo.address}</p>
            )}
            {storeInfo.city && (
              <p className="text-sm text-sand-700">{storeInfo.city}</p>
            )}
          </div>
        </div>

        {/* WhatsApp: el fijo de la tienda no lo tiene, así que es un número aparte */}
        {whatsAppUrl && (
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-sand-700 flex-shrink-0" />
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              {formatVenezuelanNumber(whatsAppNumber)}
            </a>
          </div>
        )}

        {/* Teléfono */}
        {storeInfo.phone && (
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-sand-700 flex-shrink-0" />
            <PhoneLink
              phone={storeInfo.phone}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            />
          </div>
        )}

        {/* Horario */}
        {storeInfo.hours && (
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-sand-700 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-sand-700">{storeInfo.hours}</p>
          </div>
        )}

        {/* Link al mapa — solo si hay STORE_MAP_URL configurada */}
        {storeInfo.mapUrl && (
          <a
            href={storeInfo.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium mt-2"
          >
            {t('viewOnMap')}
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Instrucciones */}
      <div className="mt-4 pt-4 border-t border-brand-200">
        <p className="text-sm text-sand-700">
          <strong className="text-ink">{t('note')}:</strong> {t('pickupInstructions')}
        </p>
      </div>
    </div>
  );
}
