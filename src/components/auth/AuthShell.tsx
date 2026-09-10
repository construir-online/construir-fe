'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { formatRate, useExchangeRate } from '@/hooks/useExchangeRate';

interface AuthShellProps {
  /** Pestaña activa dentro del par ingresar / crear cuenta. */
  active: 'login' | 'register';
  children: ReactNode;
}

/** Ganchos de venta del panel de marca: sólo en ingresar, como en D5. */
const VENTAJAS = ['pickup', 'delivery'] as const;
/** Los tres pasos del registro, como en D6. */
const PASOS = ['step1', 'step2', 'step3'] as const;

function IconoTienda() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 9.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5" />
      <path d="M3 5h18l-1 4.5a2.6 2.6 0 0 1-5 .3 2.6 2.6 0 0 1-5 0 2.6 2.6 0 0 1-5-.3L3 5Z" />
    </svg>
  );
}

function IconoCamion() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 7.5h11v9H2z" />
      <path d="M13 10.5h4l3 3v3h-7z" />
      <circle cx="6.5" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  );
}

/** Chip con la tasa BCV sobre el panel navy. */
function ChipTasa() {
  const { rate, loading } = useExchangeRate();
  // Se oculta en vez de mostrar un guion: una tasa en blanco sobre el panel de
  // marca se lee como un fallo de la tienda, no como un dato que aún no llega.
  if (loading || rate === null) return null;

  return (
    <span className="inline-flex items-center gap-2 self-start rounded-xl bg-white/[0.07] px-3.5 py-2.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-400">
        BCV
      </span>
      <span className="text-[13px] font-bold text-white">{formatRate(rate)}</span>
    </span>
  );
}

/**
 * Marco de las pantallas de acceso.
 *
 * En móvil es una cabecera navy con el logo sobre el formulario. A partir de
 * `lg` se parte en dos como en los lienzos D5 y D6: el panel de marca ocupa la
 * mitad izquierda a pantalla completa y el formulario vive en una columna de
 * 448 px a la derecha. Antes el mismo banner móvil se estiraba a lo ancho y
 * dejaba media pantalla en blanco bajo el formulario.
 */
export default function AuthShell({ active, children }: AuthShellProps) {
  const t = useTranslations('auth');
  const esLogin = active === 'login';

  const tabCls = (isActive: boolean) =>
    `flex min-h-11 flex-1 items-center justify-center rounded-[9px] text-[13px] transition-colors ${
      isActive
        ? 'bg-white font-bold text-ink shadow-[0_1px_3px_rgba(20,24,29,0.08)]'
        : 'font-semibold text-sand-600 hover:text-sand-700'
    }`;

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Panel de marca */}
      <div className="relative flex flex-col overflow-hidden bg-brand-900 px-6 py-9 lg:justify-between lg:px-14 lg:py-14">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, #fff, #fff 12px, transparent 12px, transparent 24px)',
          }}
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-3 lg:gap-6">
          <div className="self-start rounded-2xl bg-white px-4 py-3">
            <Image
              src="/construir-logo.png"
              alt="Constru-ir"
              width={140}
              height={34}
              className="h-8 w-auto"
              priority
            />
          </div>

          {/* El titular grande sólo cabe en escritorio; en móvil manda la
              bajada corta, que es lo que dibuja el lienzo 10 y el 14. */}
          <p className="max-w-[280px] text-[13.5px] font-medium leading-[1.5] text-white/70 lg:hidden">
            {t(esLogin ? 'loginTagline' : 'registerTagline')}
          </p>

          <div className="hidden lg:flex lg:flex-col lg:gap-5">
            <h2 className="max-w-[420px] font-display text-[40px] font-bold leading-[1.12] tracking-tight text-white">
              {t(esLogin ? 'loginHeadline' : 'registerHeadline')}
            </h2>
            <p className="max-w-[380px] text-[15px] font-medium leading-[1.55] text-white/70">
              {t(esLogin ? 'loginHeadlineSub' : 'registerHeadlineSub')}
            </p>
          </div>
        </div>

        {/* Pie del panel: ventajas y tasa en ingresar, pasos en crear cuenta. */}
        <div className="relative mt-10 hidden lg:flex lg:flex-col lg:gap-5">
          {esLogin ? (
            <>
              {VENTAJAS.map((clave) => (
                <div key={clave} className="flex items-start gap-3.5">
                  <span className="mt-0.5 text-accent-400">
                    {clave === 'pickup' ? <IconoTienda /> : <IconoCamion />}
                  </span>
                  <div>
                    <div className="text-[14px] font-bold text-white">
                      {t(`aside.${clave}Title`)}
                    </div>
                    <div className="mt-0.5 text-[13px] font-medium leading-[1.45] text-white/60">
                      {t(`aside.${clave}Body`)}
                    </div>
                  </div>
                </div>
              ))}
              <ChipTasa />
            </>
          ) : (
            PASOS.map((clave, i) => (
              <div key={clave} className="flex items-center gap-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-[12px] font-bold text-accent-400">
                  {i + 1}
                </span>
                <span className="text-[13.5px] font-medium leading-[1.45] text-white/75">
                  {t(`aside.${clave}`)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Columna del formulario */}
      <div className="flex justify-center px-5 py-6 lg:items-center lg:px-10 lg:py-14">
        <div className="w-full max-w-md lg:max-w-[448px]">
          {/* Pestañas */}
          <div className="mb-5 flex gap-1 rounded-xl bg-sand-100 p-1 lg:mb-7">
            <Link href="/login" className={tabCls(esLogin)}>
              {t('tabLogin')}
            </Link>
            <Link href="/register" className={tabCls(!esLogin)}>
              {t('tabRegister')}
            </Link>
          </div>

          {/* En móvil la pestaña activa ya dice en qué pantalla estás; en
              escritorio el lienzo repite el título en Archivo sobre el form. */}
          <h1 className="mb-5 hidden font-display text-[28px] font-bold leading-tight tracking-tight text-ink lg:block">
            {t(esLogin ? 'loginHeading' : 'registerHeading')}
          </h1>

          {children}
        </div>
      </div>
    </div>
  );
}
