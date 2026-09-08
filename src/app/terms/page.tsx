'use client';

import PaginaLegal from '@/components/legal/PaginaLegal';
import { SECCIONES_TERMINOS } from '@/lib/legal';

/**
 * Términos y condiciones de venta.
 *
 * El pie de página llevaba a /terms desde siempre y la ruta no existía: el
 * cliente pulsaba "Términos y condiciones" y le salía el 404 de Next.
 *
 * ⚠️ ESTE TEXTO NO ES DEFINITIVO Y NO ESTÁ REVISADO POR UN ABOGADO. ⚠️
 *
 * Lo que hay aquí es la ESTRUCTURA del documento, no su contenido definitivo.
 * Los términos de venta dependen de decisiones del negocio que no se pueden
 * deducir del código: plazos de devolución, garantías, zonas y costos de
 * despacho, jurisdicción, razón social y RIF, condiciones de pago. Cada uno de
 * esos puntos está marcado en los mensajes (messages/es.json y en.json, bajo
 * `legal.terms`) con `[POR DEFINIR: …]`, y la página los resalta en pantalla
 * para que no pasen por texto legal de verdad.
 *
 * QUIÉN LO COMPLETA: el dueño de la tienda decide cada `[POR DEFINIR]` y un
 * abogado revisa el documento entero antes de publicarlo. Hasta entonces la
 * página muestra un aviso visible de que es un borrador; ese aviso se quita
 * (`legal.draftTitle` y `legal.draftBody`) sólo cuando el texto esté revisado.
 */
export default function TermsPage() {
  return <PaginaLegal documento="terms" secciones={SECCIONES_TERMINOS} />;
}
