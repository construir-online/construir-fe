'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { formatVES } from '@/lib/currency';
import {
  RANGOS_DE_PRECIO,
  UMBRAL_STOCK_BAJO,
  buildClearFiltersHref,
  buildPriceHref,
  buildStockHref,
  contarFiltrosActivos,
  parseProductListParams,
  rangoActivo,
  type RangoDePrecio,
} from '@/lib/product-list-params';

/**
 * Filtros del listado: precio y disponibilidad.
 *
 * Con 1089 productos y 102 categorías, el catálogo se recorre a ciegas: la
 * categoría más poblada no cabe en una pantalla ni en diez, y la única forma
 * de acotar era escribir el nombre exacto en la búsqueda.
 *
 * Cada opción es un `<Link>` de verdad, no un `onClick`, y todo lo que
 * selecciona vive en los query params. Con eso los filtros heredan gratis lo
 * mismo que ya tenían la búsqueda, la categoría, el orden y la página: se
 * comparten por enlace, sobreviven a la recarga, el botón "atrás" los deshace
 * uno a uno, y se puede ver a dónde lleva cada uno antes de tocarlo.
 *
 * NO hay filtro de marca. El diseño lo pinta, pero la marca no existe como
 * dato: la entidad `Product` no tiene esa columna, `tags` está vacío en 1.266
 * de los 1.267 productos y `barcode` está vacío en todos. La marca aparece
 * suelta dentro del nombre ("PINT PLAST AZUL 1G SOLINTEX 185") y en cualquier
 * posición, así que un filtro sacado de ahí acertaría a veces y fallaría el
 * resto sin avisar. Cuando exista la columna, entra acá como un chip más.
 */
export default function ProductFilters({ className = '' }: { className?: string }) {
  const searchParams = useSearchParams();
  const { rate } = useExchangeRate();
  const panelId = useId();
  const [panelAbierto, setPanelAbierto] = useState(false);

  const estado = parseProductListParams(searchParams);
  const activos = contarFiltrosActivos(estado);
  const rango = rangoActivo(estado);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Resumen: cuántos filtros hay puestos. En el diseño es la píldora
            oscura de la izquierda. Abre y cierra el panel de precio. */}
        <button
          type="button"
          onClick={() => setPanelAbierto((abierto) => !abierto)}
          aria-expanded={panelAbierto}
          aria-controls={panelId}
          className={`flex min-h-11 flex-none items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-bold transition-colors ${
            activos > 0
              ? 'bg-ink text-white'
              : 'border border-sand-300 bg-white text-sand-700 hover:bg-sand-100'
          }`}
        >
          <SlidersHorizontal className="h-[15px] w-[15px]" strokeWidth={2.2} />
          Filtros
          {activos > 0 && (
            <span className="ml-0.5 rounded-full bg-accent-500 px-1.5 text-[11px] font-extrabold text-ink">
              {activos}
            </span>
          )}
        </button>

        <ChipDePrecio
          rango={rango}
          rate={rate}
          abierto={panelAbierto}
          onToggle={() => setPanelAbierto((abierto) => !abierto)}
          panelId={panelId}
        />

        {/* Disponibilidad. No dice "en stock" porque el catálogo público ya
            esconde lo agotado y ese filtro no quitaría ni un producto: lo que
            de verdad cambia la lista es cuántas unidades hay. */}
        <Link
          href={buildStockHref(!estado.stockAmplio, searchParams)}
          aria-pressed={estado.stockAmplio}
          role="button"
          className={`flex min-h-11 flex-none items-center whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-semibold transition-colors ${
            estado.stockAmplio
              ? 'border border-brand-600 bg-brand-50 font-bold text-brand-600'
              : 'border border-sand-300 bg-white text-sand-700 hover:bg-sand-100'
          }`}
        >
          Más de {UMBRAL_STOCK_BAJO} unidades
        </Link>

        {activos > 0 && (
          <Link
            href={buildClearFiltersHref(searchParams)}
            className="flex min-h-11 flex-none items-center gap-1 whitespace-nowrap rounded-full px-3 text-[12.5px] font-bold text-brand-600 hover:bg-brand-50"
          >
            <X className="h-[14px] w-[14px]" strokeWidth={2.5} />
            Limpiar
          </Link>
        )}
      </div>

      {panelAbierto && (
        <div
          id={panelId}
          className="mt-2 rounded-2xl border border-sand-300 bg-white p-2"
        >
          <p className="px-2 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-sand-600">
            Precio con IVA
          </p>
          <ul className="flex flex-col">
            <li>
              <OpcionDeRango
                href={buildPriceHref(null, null, searchParams)}
                activa={rango === null && estado.precioMin === null && estado.precioMax === null}
                etiqueta="Cualquier precio"
              />
            </li>
            {RANGOS_DE_PRECIO.map((opcion) => (
              <li key={opcion.key}>
                <OpcionDeRango
                  // Tocar el rango que ya está puesto lo quita. Sin esto, el
                  // único camino de vuelta a "cualquier precio" sería bajar
                  // hasta la primera opción de la lista.
                  href={
                    rango?.key === opcion.key
                      ? buildPriceHref(null, null, searchParams)
                      : buildPriceHref(opcion.min, opcion.max, searchParams)
                  }
                  activa={rango?.key === opcion.key}
                  etiqueta={etiquetaEnUsd(opcion)}
                  secundaria={etiquetaEnBs(opcion, rate)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ChipDePrecio({
  rango,
  rate,
  abierto,
  onToggle,
  panelId,
}: {
  rango: RangoDePrecio | null;
  rate: number | null;
  abierto: boolean;
  onToggle: () => void;
  panelId: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={abierto}
      aria-controls={panelId}
      className={`flex min-h-11 flex-none items-center gap-1 whitespace-nowrap rounded-full px-3.5 text-[12.5px] transition-colors ${
        rango
          ? 'border border-brand-600 bg-brand-50 font-bold text-brand-600'
          : 'border border-sand-300 bg-white font-semibold text-sand-700 hover:bg-sand-100'
      }`}
    >
      {rango ? etiquetaEnUsd(rango) : 'Precio'}
      {/* El importe en Bs. es el protagonista en toda la app, así que el chip
          activo lo lleva también, no sólo el dólar del enlace. */}
      {rango && rate !== null && (
        <span className="font-medium text-sand-600">· {etiquetaEnBs(rango, rate)}</span>
      )}
      <ChevronDown
        className={`h-[15px] w-[15px] transition-transform ${abierto ? 'rotate-180' : ''}`}
        strokeWidth={2.2}
      />
    </button>
  );
}

function OpcionDeRango({
  href,
  activa,
  etiqueta,
  secundaria,
}: {
  href: string;
  activa: boolean;
  etiqueta: string;
  secundaria?: string | null;
}) {
  return (
    <Link
      href={href}
      aria-current={activa ? 'true' : undefined}
      className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-2.5 text-[13.5px] transition-colors ${
        activa ? 'bg-brand-50 font-bold text-brand-600' : 'font-medium text-ink hover:bg-sand-100'
      }`}
    >
      <span>{etiqueta}</span>
      {secundaria && (
        <span className="text-[12px] font-medium text-sand-600">{secundaria}</span>
      )}
    </Link>
  );
}

/** "Hasta $5", "$5 – $20", "Más de $50". */
function etiquetaEnUsd(rango: RangoDePrecio): string {
  if (rango.min === null && rango.max !== null) return `Hasta $${rango.max}`;
  if (rango.min !== null && rango.max === null) return `Más de $${rango.min}`;
  return `$${rango.min} – $${rango.max}`;
}

/**
 * El mismo rango en bolívares, a la tasa del momento.
 *
 * Sólo se pinta si hay tasa: sin ella, inventar un "Bs. 0,00" al lado del
 * dólar sería peor que no decir nada. Se redondea a bolívares enteros porque
 * son cifras de cuatro y cinco dígitos y los céntimos en un chip no ayudan a
 * decidir.
 */
function etiquetaEnBs(rango: RangoDePrecio, rate: number | null): string | null {
  if (rate === null) return null;
  const bs = (usd: number) => formatVES(Math.round(usd * rate)).replace(',00', '');
  if (rango.min === null && rango.max !== null) return `hasta ${bs(rango.max)}`;
  if (rango.min !== null && rango.max === null) return `desde ${bs(rango.min)}`;
  return `${bs(rango.min as number)} – ${bs(rango.max as number)}`;
}
