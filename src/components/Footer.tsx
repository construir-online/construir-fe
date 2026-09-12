'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  MessageCircle
} from 'lucide-react';
import { useStoreInfo } from '@/hooks/useStoreInfo';
import PhoneLink from '@/components/common/PhoneLink';
import { formatVenezuelanNumber, storeWhatsAppNumber, storeWhatsAppUrl } from '@/lib/whatsapp';
import { perfilesSociales, type RedSocial } from '@/lib/social';
import { lineaCopyright } from '@/lib/copyright';

/** Cada red con su icono y el color con el que se ilumina al pasar por encima. */
const REDES: Record<RedSocial, { Icono: typeof Facebook; etiqueta: string; hover: string }> = {
  facebook: { Icono: Facebook, etiqueta: 'Facebook', hover: 'hover:bg-brand-600' },
  instagram: { Icono: Instagram, etiqueta: 'Instagram', hover: 'hover:bg-accent-500' },
  twitter: { Icono: Twitter, etiqueta: 'Twitter', hover: 'hover:bg-brand-500' },
};

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const { storeInfo } = useStoreInfo();
  const whatsAppUrl = storeWhatsAppUrl(storeInfo?.whatsapp);
  const whatsAppNumber = storeWhatsAppNumber(storeInfo?.whatsapp);
  const redes = perfilesSociales();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-900 text-sand-500">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">

          {/* Columna 1: Sobre la Empresa */}
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-white text-xl font-bold mb-2">
                {t('companyName')}
              </h3>
              <p className="text-sm text-sand-500">
                {t('tagline')}
              </p>
            </div>

            {/* Redes Sociales: sólo las que tienen perfil configurado. Los tres
                iconos llevaban a las portadas genéricas de cada red, y al
                agrandarlos para el dedo se volvían más fáciles de pulsar sin
                llevar a ninguna parte. */}
            {redes.length > 0 && (
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">
                  {t('followUs')}
                </h4>
                {/* El pie nunca se había visto en el teléfono: los 40px de estos
                    botones se quedaban cortos para el dedo, así que en móvil suben
                    a 44 y sólo vuelven a 40 en escritorio, donde hay ratón. */}
                <div className="flex gap-3">
                  {redes.map(({ red, url }) => {
                    const { Icono, etiqueta, hover } = REDES[red];
                    return (
                      <a
                        key={red}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-11 h-11 md:w-10 md:h-10 rounded-full bg-white/10 ${hover} flex items-center justify-center transition-colors`}
                        aria-label={etiqueta}
                      >
                        <Icono className="w-5 h-5" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {t('quickLinks')}
            </h4>
            {/* Igual que las redes: en el teléfono estos enlaces medían 20px de
                alto y eran casi imposibles de acertar; el `min-h-11` sólo aplica
                en móvil para no estirar la columna en escritorio. */}
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="inline-flex min-h-11 items-center text-sm transition-colors hover:translate-x-1 hover:text-white md:min-h-0 md:inline-block"
                >
                  {tNav('home')}
                </Link>
              </li>
              <li>
                <Link
                  href="/productos"
                  className="inline-flex min-h-11 items-center text-sm transition-colors hover:translate-x-1 hover:text-white md:min-h-0 md:inline-block"
                >
                  {tNav('products')}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="inline-flex min-h-11 items-center text-sm transition-colors hover:translate-x-1 hover:text-white md:min-h-0 md:inline-block"
                >
                  {tNav('about')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="inline-flex min-h-11 items-center text-sm transition-colors hover:translate-x-1 hover:text-white md:min-h-0 md:inline-block"
                >
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Información de Contacto */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {t('contactInfo')}
            </h4>
            {/* Los valores vienen del backend (STORE_*); las etiquetas siguen traducidas */}
            <ul className="space-y-3">
              {storeInfo && (storeInfo.address || storeInfo.city) && (
                <li className="flex gap-3 text-sm">
                  <MapPin className="w-5 h-5 flex-shrink-0 text-brand-300" />
                  <span>
                    {[storeInfo.address, storeInfo.city].filter(Boolean).join(', ')}
                  </span>
                </li>
              )}
              {/* El WhatsApp va antes que el fijo: es el canal que la tienda atiende */}
              {whatsAppUrl && (
                <li className="flex gap-3 text-sm">
                  <MessageCircle className="w-5 h-5 flex-shrink-0 text-brand-300" />
                  <div>
                    <p className="font-medium text-white">{t('whatsapp')}</p>
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center transition-colors hover:text-white md:inline md:min-h-0"
                    >
                      {formatVenezuelanNumber(whatsAppNumber)}
                    </a>
                  </div>
                </li>
              )}
              {storeInfo?.phone && (
                <li className="flex gap-3 text-sm">
                  <Phone className="w-5 h-5 flex-shrink-0 text-brand-300" />
                  <div>
                    <p className="font-medium text-white">{t('phone')}</p>
                    <PhoneLink
                      phone={storeInfo.phone}
                      className="inline-flex min-h-11 items-center transition-colors hover:text-white md:inline md:min-h-0"
                    />
                  </div>
                </li>
              )}
              {storeInfo?.email && (
                <li className="flex gap-3 text-sm">
                  <Mail className="w-5 h-5 flex-shrink-0 text-brand-300" />
                  <div>
                    <p className="font-medium text-white">{t('email')}</p>
                    <a
                      href={`mailto:${storeInfo.email}`}
                      className="inline-flex min-h-11 items-center transition-colors hover:text-white md:inline md:min-h-0"
                    >
                      {storeInfo.email}
                    </a>
                  </div>
                </li>
              )}
              {storeInfo?.hours && (
                <li className="flex gap-3 text-sm">
                  <Clock className="w-5 h-5 flex-shrink-0 text-brand-300" />
                  <div>
                    <p className="font-medium text-white mb-1">{t('hours')}</p>
                    {storeInfo.hours.split('·').map((line) => (
                      <p key={line} className="text-xs">
                        {line.trim()}
                      </p>
                    ))}
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Aquí vivía el boletín. Era un `setTimeout` que contestaba
              "¡Gracias por suscribirte!" sin llamar a ningún backend: mientras
              el pie sólo se veía en escritorio era deuda tolerable, pero al
              mostrarlo en el teléfono pasaba a ser la mayoría de los clientes
              recibiendo una confirmación falsa. Si algún día hay servicio de
              boletín, la columna vuelve aquí con su formulario conectado; las
              claves de traducción se quitaron con él. */}

        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-sand-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">

            {/* Copyright */}
            <div className="text-sm text-sand-500 text-center md:text-left">
              {lineaCopyright(currentYear, t('companyName'), t('allRightsReserved'))}
            </div>

            {/* Legal Links */}
            <div className="flex gap-6 text-sm">
              <Link
                href="/terms"
                className="inline-flex min-h-11 items-center text-sand-500 transition-colors hover:text-white md:inline md:min-h-0"
              >
                {t('terms')}
              </Link>
              <Link
                href="/privacy"
                className="inline-flex min-h-11 items-center text-sand-500 transition-colors hover:text-white md:inline md:min-h-0"
              >
                {t('privacy')}
              </Link>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
