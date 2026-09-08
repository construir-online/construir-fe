'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Mail, MapPin, Phone } from 'lucide-react';
import { useStoreInfo } from '@/hooks/useStoreInfo';
import PhoneLink from '@/components/common/PhoneLink';
import type { SeccionLegal } from '@/lib/legal';

/**
 * Armazón compartido de /terms y /privacy.
 *
 * Las dos páginas son el mismo objeto: un documento largo de texto con índice,
 * un aviso de que falta revisión legal y una ficha de contacto al final. Se
 * comparte el componente para que no se separen visualmente con el tiempo y
 * para que el aviso de "pendiente de revisión" no se pueda quitar de una sola
 * de las dos sin darse cuenta.
 *
 * Los textos no se incrustan: llegan por next-intl bajo `legal.<documento>`.
 */
interface PaginaLegalProps {
  /** Espacio de nombres en los mensajes: `legal.terms` o `legal.privacy`. */
  documento: 'terms' | 'privacy';
  secciones: SeccionLegal[];
}

/**
 * Los huecos que tiene que rellenar el dueño se marcan en el propio texto
 * traducido con `[POR DEFINIR: …]` / `[TO BE DEFINED: …]`. Se resaltan al
 * pintarlos para que nadie los confunda con texto legal de verdad: un término
 * inventado que parece real es peor que un hueco evidente.
 */
const MARCADOR_SEPARADOR = /(\[(?:POR DEFINIR|TO BE DEFINED)[^\]]*\])/g;
/** Sin la bandera `g`: `RegExp.test` con `g` guarda `lastIndex` y falla en bucle. */
const ES_MARCADOR = /^\[(?:POR DEFINIR|TO BE DEFINED)[^\]]*\]$/;

function conMarcadores(texto: string) {
  return texto.split(MARCADOR_SEPARADOR).map((trozo, indice) =>
    ES_MARCADOR.test(trozo) ? (
      <mark
        key={`${indice}-${trozo}`}
        className="rounded bg-accent-100 px-1 py-0.5 font-bold text-accent-700"
      >
        {trozo}
      </mark>
    ) : (
      <span key={`${indice}-${trozo}`}>{trozo}</span>
    ),
  );
}

export default function PaginaLegal({ documento, secciones }: PaginaLegalProps) {
  const t = useTranslations(`legal.${documento}`);
  const tComun = useTranslations('legal');
  const { storeInfo, loading, error, reload } = useStoreInfo();

  /** `t.raw` porque los párrafos y las viñetas son arreglos en los mensajes. */
  const lista = (clave: string): string[] => {
    const valor = t.raw(clave);
    return Array.isArray(valor) ? (valor as string[]) : [];
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-3 max-w-[65ch] leading-relaxed text-sand-700">{t('intro')}</p>
        <p className="mt-3 text-sm text-sand-600">{tComun('lastUpdated')}</p>
      </header>

      {/* El aviso va arriba del todo y en color: si esto se publica sin repasar,
          al menos el cliente ve que el texto no es definitivo. */}
      <div
        role="note"
        className="mb-10 rounded-xl border border-accent-300 bg-accent-50 p-4 sm:p-5"
      >
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-bold text-accent-700">{tComun('draftTitle')}</p>
            <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-sand-700">
              {tComun('draftBody')}
            </p>
            <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-sand-700">
              {tComun('draftPlaceholders')}
            </p>
          </div>
        </div>
      </div>

      {/* Índice: son documentos largos y en móvil sin él hay que bajar a ciegas. */}
      <nav aria-labelledby="indice-legal" className="mb-10">
        <h2
          id="indice-legal"
          className="mb-3 text-xs font-bold uppercase tracking-wider text-sand-600"
        >
          {tComun('tableOfContents')}
        </h2>
        <ol className="space-y-1 text-sm">
          {secciones.map((seccion, indice) => (
            <li key={seccion.id}>
              <a
                href={`#${seccion.id}`}
                className="inline-block rounded py-1 text-brand-600 hover:text-brand-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {indice + 1}. {t(`sections.${seccion.id}.title`)}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10">
        {secciones.map((seccion, indice) => (
          <section key={seccion.id} id={seccion.id} className="scroll-mt-24">
            <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
              <span className="text-sand-500">{indice + 1}.</span>{' '}
              {t(`sections.${seccion.id}.title`)}
            </h2>
            <div className="mt-3 space-y-3">
              {lista(`sections.${seccion.id}.body`).map((parrafo) => (
                <p key={parrafo} className="max-w-[65ch] leading-relaxed text-sand-700">
                  {conMarcadores(parrafo)}
                </p>
              ))}
            </div>
            {seccion.conLista && (
              <ul className="mt-4 max-w-[65ch] list-disc space-y-2 pl-5 text-sand-700 marker:text-sand-500">
                {lista(`sections.${seccion.id}.list`).map((punto) => (
                  <li key={punto} className="leading-relaxed">
                    {conMarcadores(punto)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* Los datos de la tienda no se vuelven a escribir: salen del mismo
          /api/v1/store-info que usan el pie de página y la página de contacto,
          para que un documento legal no contradiga al resto de la tienda. */}
      <section aria-labelledby="contacto-legal" className="mt-12">
        <h2
          id="contacto-legal"
          className="font-display text-xl font-bold text-ink sm:text-2xl"
        >
          {tComun('contactTitle')}
        </h2>
        <p className="mt-3 max-w-[65ch] leading-relaxed text-sand-700">
          {t('contactIntro')}
        </p>

        {loading && (
          <div className="mt-4 animate-pulse space-y-3 rounded-2xl border border-sand-300 bg-white p-6">
            <div className="h-4 w-2/5 rounded bg-sand-200" />
            <div className="h-4 w-3/4 rounded bg-sand-200" />
          </div>
        )}

        {/* Sin datos no se calla: es la vía por la que el cliente reclama. */}
        {!loading && (error || !storeInfo) && (
          <div className="mt-4 rounded-2xl border border-sand-300 bg-white p-6">
            <p className="text-sm text-sand-700">{tComun('loadError')}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-2 min-h-11 text-sm font-bold text-brand-600 hover:text-brand-700"
            >
              {tComun('retry')}
            </button>
          </div>
        )}

        {!loading && storeInfo && (
          <div className="mt-4 divide-y divide-sand-200 overflow-hidden rounded-2xl border border-sand-300 bg-white">
            <p className="p-5 font-bold text-ink">{storeInfo.name}</p>

            {storeInfo.email && (
              <a
                href={`mailto:${storeInfo.email}`}
                className="flex items-center gap-4 p-5 transition-colors hover:bg-sand-50"
              >
                <Mail className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium text-sand-600">
                    {tComun('email')}
                  </span>
                  <span className="block truncate font-medium text-ink">
                    {storeInfo.email}
                  </span>
                </span>
              </a>
            )}

            {storeInfo.phone && (
              <PhoneLink
                phone={storeInfo.phone}
                className="flex items-center gap-4 p-5 transition-colors hover:bg-sand-50"
              >
                <Phone className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium text-sand-600">
                    {tComun('phone')}
                  </span>
                  <span className="block font-medium text-ink">{storeInfo.phone}</span>
                </span>
              </PhoneLink>
            )}

            {(storeInfo.address || storeInfo.city) && (
              <div className="flex items-start gap-4 p-5">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent-500" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-sand-600">
                    {tComun('address')}
                  </p>
                  <p className="font-medium leading-snug text-ink">
                    {[storeInfo.address, storeInfo.city].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* El RIF y la razón social NO los sirve /api/v1/store-info, así que
                no hay de dónde sacarlos sin inventarlos. */}
            <p className="p-5 text-sm leading-relaxed text-sand-700">
              {conMarcadores(tComun('fiscalPending'))}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
