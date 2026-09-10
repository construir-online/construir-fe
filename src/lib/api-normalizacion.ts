/**
 * Normalización de lo que llega de la API, en el borde.
 *
 * # Por qué existe este fichero
 *
 * `apiClient.get<T>()` no comprueba nada: la `T` es una promesa que nadie
 * verifica en tiempo de ejecución. Cuando la forma real de la respuesta no
 * coincide con la declarada, TypeScript no dice nada y el fallo aparece meses
 * después, en pantalla y con dinero delante.
 *
 * La mentira más frecuente tiene un origen único y aburrido: TypeORM serializa
 * las columnas `decimal` de Postgres como CADENA, no como número. Así que
 * `total`, `subtotal`, `tax`, `iva`, `priceWithIva`, `exchangeRate`, el valor
 * de un cupón… todo eso llega como `"37.12"` aunque el tipo prometa `number`.
 *
 * Casi todo el frontend sobrevive a eso por casualidad: `*` y `-` y `>`
 * coaccionan la cadena a número, y `formatCurrency`/`parsePrice` aceptan
 * `number | string`. Pero "por casualidad" no es un contrato:
 *
 *   - `"5.00" + "10.00"` es `"5.0010.00"`, no `15`.
 *   - `"481.22".toLocaleString('es-VE', {…})` IGNORA las opciones y devuelve el
 *     texto crudo, así que se lee `481.22` junto a `Bs. 5.023,91`.
 *   - un guarda `typeof x === 'number'` da falso y el dato DESAPARECE.
 *   - y la peor: la cadena se devuelve tal cual al backend en un PATCH, y el
 *     `ValidationPipe` la rechaza con un 400 (ver `discounts.ts`).
 *
 * # Por qué normalizar aquí y no validar en `apiClient`
 *
 * Validar la forma dentro de `apiClient` sería más potente, pero convierte una
 * etiqueta mal formateada en una pantalla en blanco: hoy TODAS estas respuestas
 * traen cadenas donde el tipo dice número, así que un validador estricto
 * rechazaría el catálogo, el carrito y el checkout enteros el día que se
 * encienda. En una tienda que cobra por adelantado, ese cambio es peor que el
 * fallo que arregla.
 *
 * Normalizar en el borde tiene el efecto contrario: es total y no puede fallar
 * —`Number("37.12")` siempre funciona— y el resto de la aplicación recibe por
 * fin el tipo que se le prometió, sin tocar ni un consumidor. Es además el
 * patrón que ya se había usado a mano en `services/exchangeRate.ts`
 * (`normalizeRate`); esto sólo lo generaliza y le pone nombre.
 */

/**
 * Coacciona a número lo que la API manda como cadena decimal.
 *
 * Devuelve `0` ante `null`, `undefined` o basura no numérica, que es lo mismo
 * que ya hacía `parsePrice`: en una columna de dinero, un hueco vale cero, y es
 * infinitamente preferible a propagar un `NaN` que luego se lee como "NaN" en
 * mitad de un total.
 */
export function aNumero(valor: unknown): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  if (typeof valor === "string") {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Igual que `aNumero`, pero conserva el nulo.
 *
 * La diferencia importa y no es cosmética: en los montos en bolívares, `null`
 * significa "este pedido es anterior a que se guardara el equivalente en Bs." y
 * la interfaz tiene que caer al dólar (`montoPrincipal` hace `ves != null`).
 * Aplanar ese `null` a `0` haría que un pedido viejo mostrara **Bs. 0,00** como
 * si la compra no hubiera costado nada.
 *
 * `undefined` se trata como nulo a propósito: un campo que no viaja y un campo
 * que viaja vacío son la misma ausencia para quien pinta la pantalla.
 */
export function aNumeroONulo(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  return aNumero(valor);
}

/**
 * Aviso en desarrollo cuando la respuesta real no tiene la forma declarada.
 *
 * Este es el intento de atacar la causa y no sólo los casos conocidos. Los
 * adaptadores de más abajo arreglan las mentiras que YA encontramos; esto es lo
 * que hace ruido con la SIGUIENTE, el día que el backend añada una columna
 * `decimal` o deje de mandar un campo.
 *
 * Sólo escribe en consola, y sólo fuera de producción: no lanza, no filtra, no
 * cambia el valor devuelto. Esa timidez es deliberada — un contrato que se
 * rompe no debe poder tumbar una compra.
 */
export function avisarSiDiverge(
  origen: string,
  crudo: unknown,
  esperado: Record<string, "number" | "string" | "boolean">,
): void {
  if (process.env.NODE_ENV === "production") return;
  if (crudo === null || typeof crudo !== "object") return;

  const fila = crudo as Record<string, unknown>;

  for (const [campo, tipo] of Object.entries(esperado)) {
    const valor = fila[campo];

    if (!(campo in fila)) {
      console.warn(
        `[contrato] ${origen}: el campo "${campo}" está declarado pero NO viaja en la respuesta.`,
      );
      continue;
    }

    // Un nulo declarado es una ausencia legítima en casi todos estos campos
    // (los montos en Bs. de los pedidos viejos), así que no se avisa.
    if (valor === null) continue;

    if (typeof valor !== tipo) {
      console.warn(
        `[contrato] ${origen}: "${campo}" se declara ${tipo} pero llega ${typeof valor} (${JSON.stringify(valor)}).`,
      );
    }
  }
}
