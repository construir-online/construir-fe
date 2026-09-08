'use client';

import { useState } from 'react';
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
  Heart,
  MessageCircle,
  Send
} from 'lucide-react';
import { useStoreInfo } from '@/hooks/useStoreInfo';
import PhoneLink from '@/components/common/PhoneLink';
import { formatVenezuelanNumber, storeWhatsAppNumber, storeWhatsAppUrl } from '@/lib/whatsapp';

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const { storeInfo } = useStoreInfo();
  const whatsAppUrl = storeWhatsAppUrl();
  const whatsAppNumber = storeWhatsAppNumber();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const currentYear = new Date().getFullYear();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);

    // Simular suscripción (aquí conectarías con tu backend/servicio de newsletter)
    setTimeout(() => {
      setIsSubscribing(false);
      setSubscribeStatus('success');
      setEmail('');

      // Reset status después de 3 segundos
      setTimeout(() => setSubscribeStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <footer className="bg-brand-900 text-sand-500">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">

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

            {/* Redes Sociales */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">
                {t('followUs')}
              </h4>
              {/* El pie nunca se había visto en el teléfono: los 40px de estos
                  botones se quedaban cortos para el dedo, así que en móvil suben
                  a 44 y sólo vuelven a 40 en escritorio, donde hay ratón. */}
              <div className="flex gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-brand-600 flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-accent-500 flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-brand-500 flex items-center justify-center transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
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
                      className="inline-flex min-h-11 items-center transition-colors hover:text-white md:min-h-0"
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
                      className="inline-flex min-h-11 items-center transition-colors hover:text-white md:min-h-0"
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
                      className="inline-flex min-h-11 items-center transition-colors hover:text-white md:min-h-0"
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

          {/* Columna 4: Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {t('newsletter')}
            </h4>
            <p className="text-sm text-sand-500 mb-4">
              {t('newsletterDescription')}
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="w-full px-4 py-3 bg-white/8 text-white rounded-xl border border-white/15 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm"
                  required
                  disabled={isSubscribing}
                />
              </div>

              <button
                type="submit"
                disabled={isSubscribing || !email}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubscribing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('subscribing')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t('subscribe')}
                  </>
                )}
              </button>

              {subscribeStatus === 'success' && (
                <p className="text-success-500 text-sm">
                  {t('subscribeSuccess')}
                </p>
              )}
              {subscribeStatus === 'error' && (
                <p className="text-danger-500 text-sm">
                  {t('subscribeError')}
                </p>
              )}
            </form>
          </div>

        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-sand-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">

            {/* Copyright */}
            <div className="text-sm text-sand-500 text-center md:text-left">
              © {currentYear} {t('companyName')}. {t('allRightsReserved')}.
            </div>

            {/* Legal Links */}
            <div className="flex gap-6 text-sm">
              <Link
                href="/terms"
                className="inline-flex min-h-11 items-center text-sand-500 transition-colors hover:text-white md:min-h-0"
              >
                {t('terms')}
              </Link>
              <Link
                href="/privacy"
                className="inline-flex min-h-11 items-center text-sand-500 transition-colors hover:text-white md:min-h-0"
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
