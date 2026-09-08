'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

interface AuthShellProps {
  /** Pestaña activa dentro del par ingresar / crear cuenta. */
  active: 'login' | 'register';
  children: ReactNode;
}

/**
 * Marco de las pantallas de acceso: cabecera navy con el logo y el par de
 * pestañas ingresar / crear cuenta.
 */
export default function AuthShell({ active, children }: AuthShellProps) {
  const t = useTranslations('auth');
  const tabCls = (isActive: boolean) =>
    `flex min-h-11 flex-1 items-center justify-center rounded-[9px] text-[13px] transition-colors ${
      isActive
        ? 'bg-white font-bold text-ink shadow-[0_1px_3px_rgba(20,24,29,0.08)]'
        : 'font-semibold text-sand-600 hover:text-sand-700'
    }`;

  return (
    <div className="min-h-screen bg-white">
      {/* Cabecera de marca */}
      <div className="relative flex min-h-[200px] flex-col justify-center gap-3 overflow-hidden bg-brand-900 px-6 py-10">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, #fff, #fff 12px, transparent 12px, transparent 24px)',
          }}
          aria-hidden="true"
        />
        <div className="relative self-start rounded-2xl bg-white px-4 py-3">
          <Image
            src="/construir-logo.png"
            alt="Constru-ir"
            width={140}
            height={34}
            className="h-8 w-auto"
            priority
          />
        </div>
        <p className="relative max-w-[260px] text-[13.5px] font-medium leading-[1.5] text-white/70">
          {t('tagline')}
        </p>
      </div>

      <div className="mx-auto w-full max-w-md px-5 py-6">
        {/* Pestañas */}
        <div className="mb-5 flex gap-1 rounded-xl bg-sand-100 p-1">
          <Link href="/login" className={tabCls(active === 'login')}>
            {t('tabLogin')}
          </Link>
          <Link href="/register" className={tabCls(active === 'register')}>
            {t('tabRegister')}
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
