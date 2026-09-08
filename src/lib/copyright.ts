/**
 * Línea de copyright del pie.
 *
 * La razón social de la tienda ya termina en punto ("Hierros Ricupero, C.A.") y
 * la plantilla le añadía otro, así que el pie mostraba "C.A.. Todos los derechos
 * reservados.". Mientras el pie sólo se veía en escritorio pasó desapercibido;
 * al mostrarlo en el teléfono lo ve todo el cliente.
 *
 * Se decide mirando el propio texto en vez de retocar las traducciones, para
 * que valga en los dos idiomas y con cualquier razón social futura.
 */
export function lineaCopyright(
  year: number,
  companyName: string,
  allRightsReserved: string,
): string {
  const nombre = companyName.trim();
  const separador = /[.!?]$/.test(nombre) ? '' : '.';
  return `© ${year} ${nombre}${separador} ${allRightsReserved.trim()}.`;
}
