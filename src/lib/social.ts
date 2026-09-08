/**
 * Perfiles de redes sociales de la tienda.
 *
 * Los tres iconos del pie y de "Mi cuenta" apuntaban a las portadas genéricas
 * (`https://facebook.com`, `https://instagram.com`, `https://twitter.com`), no a
 * los perfiles de la tienda: el cliente que los pulsaba acababa en Facebook sin
 * más. Mientras el pie sólo se veía en escritorio pasaba desapercibido; ahora lo
 * ve todo el mundo desde el teléfono.
 *
 * Es el mismo caso que los teléfonos muertos: si no hay a dónde llevar, no se
 * pinta el enlace. Cada perfil sale de su variable de entorno y, sin ella
 * configurada, ese icono no aparece.
 */

export type RedSocial = 'facebook' | 'instagram' | 'twitter';

export interface PerfilSocial {
  red: RedSocial;
  url: string;
}

/**
 * Sólo cuenta como perfil una URL http(s) absoluta: una variable a medio poner
 * ("facebook.com/tienda", "pendiente") daría un enlace relativo que saca al
 * cliente de la tienda hacia una ruta que no existe.
 */
function perfilValido(url: string | undefined): string | null {
  const limpio = url?.trim();
  if (!limpio) return null;
  try {
    const { protocol } = new URL(limpio);
    return protocol === 'http:' || protocol === 'https:' ? limpio : null;
  } catch {
    return null;
  }
}

/**
 * Perfiles configurados, en el orden en que se pintan. Vacío si no hay ninguno,
 * y entonces quien llama no debe dibujar el bloque "Síguenos".
 *
 * Las variables se leen literales a propósito: Next sustituye `NEXT_PUBLIC_*`
 * en tiempo de compilación y no lo hace si el nombre se arma dinámicamente.
 */
export function perfilesSociales(): PerfilSocial[] {
  const candidatos: { red: RedSocial; url: string | undefined }[] = [
    { red: 'facebook', url: process.env.NEXT_PUBLIC_FACEBOOK_URL },
    { red: 'instagram', url: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
    { red: 'twitter', url: process.env.NEXT_PUBLIC_TWITTER_URL },
  ];

  return candidatos.flatMap(({ red, url }) => {
    const valido = perfilValido(url);
    return valido ? [{ red, url: valido }] : [];
  });
}
