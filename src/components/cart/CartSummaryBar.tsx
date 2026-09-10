'use client';

import Link from 'next/link';
import { useCartTotals } from '@/hooks/useCartTotals';
import { formatVES, formatUSD } from '@/lib/currency';
import {
  CLASE_BARRA_CARRITO_AL_BORDE,
  CLASE_BARRA_CARRITO_SOBRE_NAV,
} from './barras-fijas';

/**
 * Barra flotante de carrito: recuento, total dual y salto al carrito.
 *
 * Acompaña mientras se recorre el catálogo — portada, categorías y listado —
 * para que saber por cuánto se va no obligue a entrar y salir del carrito. Con
 * 1089 productos, esa ida y vuelta se repite mucho.
 *
 * `sobreBarraInferior` la sube por encima de `BottomNav` en las pantallas que
 * la llevan: las dos a `bottom-0` se solapan y la de carrito taparía las cinco
 * pestañas, dejando al usuario sin forma de moverse por la tienda. El listado
 * y la ficha no tienen navegación inferior, así que allí va al borde. Los
 * números están en `barras-fijas.ts`, junto al hueco que hay que dejarle al
 * pie: son la misma cuenta y no pueden discrepar.
 */
export default function CartSummaryBar({
  sobreBarraInferior = false,
}: {
  sobreBarraInferior?: boolean;
}) {
  const { totalItems, subtotal, subtotalVES } = useCartTotals();

  if (totalItems === 0) return null;

  return (
    <div
      data-testid="barra-carrito"
      className={`fixed inset-x-0 z-30 border-t border-sand-300 bg-white px-4 pt-3 md:hidden ${
        sobreBarraInferior
          ? `${CLASE_BARRA_CARRITO_SOBRE_NAV} pb-3`
          : `${CLASE_BARRA_CARRITO_AL_BORDE} pb-[calc(1.375rem+env(safe-area-inset-bottom))]`
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-sand-600">
            Carrito · {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
          </p>
          <p className="truncate text-[15px] font-extrabold text-ink">
            {subtotalVES && subtotalVES > 0 ? formatVES(subtotalVES) : formatUSD(subtotal)}
            {subtotalVES && subtotalVES > 0 && (
              <span className="ml-1 text-xs font-medium text-sand-600">
                · {formatUSD(subtotal)}
              </span>
            )}
          </p>
        </div>
        <Link
          href="/carrito"
          className="flex min-h-11 flex-none items-center rounded-xl bg-brand-600 px-5 text-[13.5px] font-bold text-white transition-colors hover:bg-brand-700"
        >
          Ver carrito
        </Link>
      </div>
    </div>
  );
}
