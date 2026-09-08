/**
 * Índice de las secciones de las páginas legales (/terms y /privacy).
 *
 * Vive aparte de los componentes por dos razones: el orden del documento se
 * lee de un vistazo sin bajar por el JSX, y las pruebas pueden recorrerlo para
 * comprobar que cada sección tiene sus textos en es.json Y en en.json. Sin esa
 * lista, una sección añadida sólo en español se publicaría con la clave cruda
 * a la vista del cliente inglés.
 *
 * IMPORTANTE: el contenido de estas páginas NO está revisado por un abogado.
 * Ver el comentario de cabecera de src/app/terms/page.tsx y de
 * src/app/privacy/page.tsx antes de publicar.
 */
export interface SeccionLegal {
  /** Sufijo de la clave de traducción y ancla (#id) de la sección. */
  id: string;
  /** La sección lleva además una lista de viñetas (`sections.<id>.list`). */
  conLista?: boolean;
}

/**
 * Términos y condiciones.
 *
 * El orden va de lo general (quién vende, qué se acepta) a lo concreto de una
 * compra (precio, pago, entrega, devolución) y termina en lo jurídico, que es
 * lo que menos gente lee.
 */
export const SECCIONES_TERMINOS: SeccionLegal[] = [
  { id: 'identidad' },
  { id: 'aceptacion' },
  { id: 'cuenta', conLista: true },
  { id: 'productos', conLista: true },
  { id: 'precios', conLista: true },
  { id: 'pedido' },
  { id: 'pago', conLista: true },
  { id: 'entrega', conLista: true },
  { id: 'devoluciones', conLista: true },
  { id: 'garantias', conLista: true },
  { id: 'cancelacion' },
  { id: 'promociones' },
  { id: 'responsabilidad' },
  { id: 'propiedad' },
  { id: 'cambios' },
  { id: 'ley', conLista: true },
];

/**
 * Política de privacidad.
 *
 * A diferencia de los términos, esto NO es una plantilla: cada dato listado se
 * comprobó en el código (formularios del storefront y entidades del backend).
 * Si se añade un campo nuevo a un formulario o a una entidad, hay que
 * actualizar la sección `datos` de los mensajes.
 */
export const SECCIONES_PRIVACIDAD: SeccionLegal[] = [
  { id: 'responsable' },
  { id: 'alcance' },
  { id: 'datosCuenta', conLista: true },
  { id: 'datosPedido', conLista: true },
  { id: 'datosPago', conLista: true },
  { id: 'datosTecnicos', conLista: true },
  { id: 'cookies', conLista: true },
  { id: 'finalidades', conLista: true },
  { id: 'terceros', conLista: true },
  { id: 'conservacion' },
  { id: 'seguridad', conLista: true },
  { id: 'derechos', conLista: true },
  { id: 'menores' },
  { id: 'cambios' },
];
