'use client';

import { useTranslations } from 'next-intl';
import {
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { useStoreInfo } from '@/hooks/useStoreInfo';
import PhoneLink from '@/components/common/PhoneLink';
import { formatVenezuelanNumber, storeWhatsAppNumber, storeWhatsAppUrl } from '@/lib/whatsapp';

/**
 * Página de contacto.
 *
 * El pie de página llevaba a /contact desde siempre, pero la ruta no existía:
 * el cliente hacía clic en "Contacto" y le salía el 404 de Next. Los datos no
 * se vuelven a escribir aquí; salen del mismo `/api/v1/store-info` que ya usan
 * el checkout, el pie de página y "Mi cuenta", para que no se contradigan.
 */
export default function ContactPage() {
  const t = useTranslations('contact');
  const { storeInfo, loading, error, reload } = useStoreInfo();

  const whatsApp = storeWhatsAppUrl(t('whatsappGreeting'));
  const whatsAppNumber = storeWhatsAppNumber();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-sand-700">{t('subtitle')}</p>
      </header>

      {loading && (
        <div className="animate-pulse space-y-3 rounded-2xl border border-sand-300 bg-white p-6">
          <div className="h-5 w-2/5 rounded bg-sand-200" />
          <div className="h-4 w-3/4 rounded bg-sand-200" />
          <div className="h-4 w-1/2 rounded bg-sand-200" />
        </div>
      )}

      {/* Sin datos no se calla: el cliente vino aquí justamente a buscarlos. */}
      {!loading && (error || !storeInfo) && (
        <div className="rounded-2xl border border-sand-300 bg-white p-6">
          <p className="text-sm text-sand-700">{t('loadError')}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-2 min-h-11 text-sm font-bold text-brand-600 hover:text-brand-700"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {!loading && storeInfo && (
        <div className="divide-y divide-sand-200 overflow-hidden rounded-2xl border border-sand-300 bg-white">
          {/* WhatsApp primero: es por donde de verdad escribe el cliente. */}
          {whatsApp && (
            <a
              href={whatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 transition-colors hover:bg-sand-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-50">
                <MessageCircle className="h-5 w-5 text-success-600" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-medium text-sand-600">
                  {t('whatsapp')}
                </span>
                <span className="block font-medium text-ink">
                  {formatVenezuelanNumber(whatsAppNumber)}
                </span>
              </span>
            </a>
          )}

          {storeInfo.phone && (
            <PhoneLink
              phone={storeInfo.phone}
              className="flex items-center gap-4 p-5 transition-colors hover:bg-sand-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <Phone className="h-5 w-5 text-brand-600" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-medium text-sand-600">
                  {t('phone')}
                </span>
                <span className="block font-medium text-ink">{storeInfo.phone}</span>
              </span>
            </PhoneLink>
          )}

          {storeInfo.email && (
            <a
              href={`mailto:${storeInfo.email}`}
              className="flex items-center gap-4 p-5 transition-colors hover:bg-sand-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <Mail className="h-5 w-5 text-brand-600" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-medium text-sand-600">
                  {t('email')}
                </span>
                <span className="block truncate font-medium text-ink">
                  {storeInfo.email}
                </span>
              </span>
            </a>
          )}

          {(storeInfo.address || storeInfo.city) && (
            <div className="flex items-start gap-4 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50">
                <MapPin className="h-5 w-5 text-accent-500" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-sand-600">
                  {t('address')}
                </p>
                <p className="font-medium leading-snug text-ink">
                  {[storeInfo.address, storeInfo.city].filter(Boolean).join(', ')}
                </p>
                {storeInfo.mapUrl && (
                  <a
                    href={storeInfo.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700"
                  >
                    {t('viewOnMap')}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {storeInfo.hours && (
            <div className="flex items-start gap-4 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand-100">
                <Clock className="h-5 w-5 text-sand-700" />
              </span>
              <div>
                <p className="text-[11px] font-medium text-sand-600">{t('hours')}</p>
                {storeInfo.hours.split('·').map((linea) => (
                  <p key={linea} className="text-sm leading-relaxed text-ink">
                    {linea.trim()}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
