const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/**
 * Convierte el "YYYY-MM" que manda el backend en "septiembre 2026".
 *
 * Se arma a mano en vez de con `new Date('2026-09')` porque ese formato lo
 * parsea el navegador como medianoche UTC: en Venezuela (UTC-4) esa fecha cae
 * en el mes anterior y la cabecera del panel diría "agosto 2026" mientras las
 * tarjetas debajo muestran las ventas de septiembre.
 *
 * Si la cadena no tiene la forma esperada devuelve la original: es sólo una
 * etiqueta, no vale la pena reventar el panel por ella.
 */
export function formatMonthLabel(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;

  const indice = Number(match[2]) - 1;
  if (indice < 0 || indice > 11) return month;

  return `${MESES[indice]} ${match[1]}`;
}

/** Sólo el nombre del mes, sin el año: "2026-08" → "agosto". */
export function formatMonthName(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;

  const indice = Number(match[2]) - 1;
  if (indice < 0 || indice > 11) return month;

  return MESES[indice];
}

/**
 * Contra qué se compara la tarjeta, dicho entero: "vs los primeros 9 días de
 * agosto".
 *
 * El bloque enseña lo que va del mes y el porcentaje se calcula contra el
 * mismo tramo del mes anterior. Con un rótulo genérico —"vs mes anterior"— el
 * dueño leería nueve días contra un mes cerrado y creería que se le hundió el
 * negocio cada primero de mes.
 */
export function formatComparisonLabel(
  daysElapsed: number,
  previousMonth: string,
): string {
  const mes = formatMonthName(previousMonth);
  if (daysElapsed <= 1) return `vs el primer día de ${mes}`;
  return `vs los primeros ${daysElapsed} días de ${mes}`;
}
