'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  formatearEspera,
  useResendVerification,
} from '@/hooks/useResendVerification';

/** Las tres razones por las que el correo no aparece, del lienzo 15. */
const PISTAS = ['spam', 'expiry', 'guest'] as const;

/**
 * Pantalla de "revisa tu correo" tras crear la cuenta (lienzo 15).
 *
 * Hasta ahora esta pantalla no ofrecía nada: si el correo no llegaba, el
 * cliente se quedaba encallado —cuenta creada pero inutilizable, porque el
 * login rechaza a quien no ha verificado— sin más salida que adivinar. El
 * reenvío es lo que lo desencalla, así que acá es la acción principal.
 *
 * El lienzo pone de principal un "Abrir mi correo" y deja el reenvío de
 * secundario. No está: abrir el correo del cliente exige adivinar su proveedor
 * a partir del dominio, y con un dominio propio no hay a dónde mandarlo.
 */
export default function RevisaTuCorreo({ email }: { email: string }) {
  const t = useTranslations('auth');
  const { reenviar, enviando, enviado, espera } = useResendVerification(email);

  return (
    <div className="flex min-h-screen items-start justify-center bg-sand-50 px-4 pt-10 pb-12 sm:items-center sm:py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success-600">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2.2" />
              <path d="M3.6 6.4 12 12.6l8.4-6.2" />
            </svg>
          </span>

          <h1 className="font-display text-[23px] font-bold tracking-tight text-ink">
            {t('checkEmailTitle')}
          </h1>
          <p className="max-w-[300px] text-[13.5px] font-medium leading-[1.6] text-sand-700">
            {t.rich('checkEmailBody', {
              email: () => <strong className="font-bold text-ink">{email}</strong>,
            })}
          </p>

          {/* Qué hacer si no aparece, antes de que el cliente vuelva a pedir
              otro enlace que va a acabar en la misma carpeta de spam. */}
          <div className="mt-1 w-full rounded-2xl border border-sand-300 bg-white p-4 text-left">
            <div className="font-display text-[12.5px] font-bold text-ink">
              {t('checkEmailHintsTitle')}
            </div>
            <ul className="mt-2.5 flex flex-col gap-2">
              {PISTAS.map((pista) => (
                <li
                  key={pista}
                  className="flex gap-2.5 text-[12px] font-medium leading-[1.45] text-sand-700"
                >
                  <span aria-hidden="true" className="font-extrabold text-brand-600">
                    ·
                  </span>
                  {t(`checkEmailHint.${pista}`)}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-1 flex w-full flex-col gap-2.5">
            {enviado && espera > 0 ? (
              <p
                role="status"
                className="rounded-xl bg-success-50 px-3 py-2.5 text-[12.5px] font-medium text-success-700"
              >
                {t('verificationSent')}
              </p>
            ) : null}

            <button
              type="button"
              onClick={reenviar}
              disabled={enviando || espera > 0}
              className="flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando
                ? t('resending')
                : espera > 0
                  ? t('resendAvailableIn', { tiempo: formatearEspera(espera) })
                  : t('resendVerification')}
            </button>

            <Link
              href="/login"
              className="flex min-h-11 w-full items-center justify-center rounded-xl border-[1.5px] border-sand-300 px-4 py-3 text-[13.5px] font-bold text-sand-700 transition-colors hover:bg-sand-100"
            >
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
