import { describe, it, expect } from 'vitest';
import { SECCIONES_TERMINOS, SECCIONES_PRIVACIDAD, type SeccionLegal } from '../legal';
import esMessages from '../../../messages/es.json';
import enMessages from '../../../messages/en.json';

/**
 * Cada clave que /terms y /privacy piden a next-intl tiene que existir en los
 * dos idiomas.
 *
 * Estas páginas arman sus claves a mano (`sections.${id}.body`), así que ni
 * TypeScript ni el build detectan una que falte: next-intl pinta la clave cruda
 * —"legal.terms.sections.garantias.title"— en medio del documento legal y sólo
 * se descubre mirando la página en el idioma que nadie revisa. Añadir una
 * sección a src/lib/legal.ts sin traducirla al inglés falla aquí.
 */
type Diccionario = Record<string, unknown>;

const idiomas: Array<[string, Diccionario]> = [
  ['es', esMessages as unknown as Diccionario],
  ['en', enMessages as unknown as Diccionario],
];

/** Baja por una ruta tipo `legal.terms.sections.pago.body`. */
function enRuta(mensajes: Diccionario, ruta: string): unknown {
  return ruta
    .split('.')
    .reduce<unknown>(
      (nodo, tramo) =>
        nodo && typeof nodo === 'object'
          ? (nodo as Diccionario)[tramo]
          : undefined,
      mensajes,
    );
}

/** Las claves comunes al armazón, que piden las dos páginas por igual. */
const CLAVES_COMUNES = [
  'draftTitle',
  'draftBody',
  'draftPlaceholders',
  'lastUpdated',
  'tableOfContents',
  'contactTitle',
  'email',
  'phone',
  'address',
  'fiscalPending',
  'loadError',
  'retry',
];

/** Las claves propias de cada documento, fuera de las secciones. */
const CLAVES_DOCUMENTO = ['title', 'intro', 'contactIntro'];

const documentos: Array<[string, SeccionLegal[]]> = [
  ['terms', SECCIONES_TERMINOS],
  ['privacy', SECCIONES_PRIVACIDAD],
];

describe('mensajes de las páginas legales', () => {
  it.each(idiomas)('%s tiene las claves comunes del armazón', (_, mensajes) => {
    for (const clave of CLAVES_COMUNES) {
      expect(enRuta(mensajes, `legal.${clave}`), clave).toBeTypeOf('string');
    }
  });

  it.each(idiomas)('%s tiene el encabezado de cada documento', (_, mensajes) => {
    for (const [documento] of documentos) {
      for (const clave of CLAVES_DOCUMENTO) {
        expect(
          enRuta(mensajes, `legal.${documento}.${clave}`),
          `${documento}.${clave}`,
        ).toBeTypeOf('string');
      }
    }
  });

  it.each(idiomas)('%s tiene título, párrafos y viñetas de cada sección', (_, mensajes) => {
    for (const [documento, secciones] of documentos) {
      for (const seccion of secciones) {
        const base = `legal.${documento}.sections.${seccion.id}`;

        expect(enRuta(mensajes, `${base}.title`), `${base}.title`).toBeTypeOf('string');

        const cuerpo = enRuta(mensajes, `${base}.body`);
        expect(Array.isArray(cuerpo), `${base}.body debe ser un arreglo`).toBe(true);
        // Una sección sin párrafos se pintaría como un h2 suelto.
        expect((cuerpo as unknown[]).length, `${base}.body vacío`).toBeGreaterThan(0);

        const lista = enRuta(mensajes, `${base}.list`);
        if (seccion.conLista) {
          expect(Array.isArray(lista), `${base}.list debe ser un arreglo`).toBe(true);
          expect((lista as unknown[]).length, `${base}.list vacío`).toBeGreaterThan(0);
        } else {
          // Al revés también importa: una lista traducida que el componente no
          // pinta es texto legal que el cliente nunca llega a leer.
          expect(lista, `${base}.list existe pero la sección no la pinta`).toBeUndefined();
        }
      }
    }
  });

  it('las dos traducciones tienen el mismo número de párrafos y viñetas', () => {
    // Si el inglés pierde una viñeta al traducir, se cae un punto entero del
    // documento —un plazo, una exclusión— sin que nada avise.
    for (const [documento, secciones] of documentos) {
      for (const seccion of secciones) {
        for (const parte of ['body', 'list']) {
          const ruta = `legal.${documento}.sections.${seccion.id}.${parte}`;
          const es = enRuta(esMessages as unknown as Diccionario, ruta) as unknown[];
          const en = enRuta(enMessages as unknown as Diccionario, ruta) as unknown[];
          if (!Array.isArray(es)) continue;
          expect(en?.length, ruta).toBe(es.length);
        }
      }
    }
  });
});

/**
 * Los huecos que tiene que rellenar el dueño se marcan en el texto y la página
 * los resalta. Si alguien "termina" el documento inventando el plazo de
 * devolución, este test no lo impide —ni podría—, pero sí impide lo contrario:
 * que se borre el marcador dejando una frase a medias, o que el español lleve
 * un aviso que el inglés no lleva.
 */
describe('marcadores pendientes de decidir', () => {
  const MARCADOR_ES = /\[POR DEFINIR:[^\]]*\]/g;
  const MARCADOR_EN = /\[TO BE DEFINED:[^\]]*\]/g;

  const contar = (valor: unknown, patron: RegExp): number =>
    JSON.stringify(valor ?? '').match(patron)?.length ?? 0;

  it('los términos siguen marcando lo que el dueño no ha decidido', () => {
    const es = enRuta(esMessages as unknown as Diccionario, 'legal.terms');
    // Devoluciones, garantías, despacho y jurisdicción son decisiones suyas:
    // si esto baja de golpe es que alguien las rellenó a ojo.
    expect(contar(es, MARCADOR_ES)).toBeGreaterThan(20);
  });

  it('la privacidad marca lo que no se puede deducir del código', () => {
    const es = enRuta(esMessages as unknown as Diccionario, 'legal.privacy');
    expect(contar(es, MARCADOR_ES)).toBeGreaterThan(5);
  });

  it('inglés y español marcan exactamente los mismos huecos', () => {
    for (const [documento] of documentos) {
      const es = enRuta(esMessages as unknown as Diccionario, `legal.${documento}`);
      const en = enRuta(enMessages as unknown as Diccionario, `legal.${documento}`);
      expect(contar(en, MARCADOR_EN), documento).toBe(contar(es, MARCADOR_ES));
    }
  });
});
