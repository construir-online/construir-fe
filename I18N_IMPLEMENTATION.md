# Implementación de i18n (Internacionalización)

> ## ⚠️ ESTADO ACTUAL: la tienda va SIEMPRE en español
>
> El selector de idioma está **desactivado** y **no se muestra en ninguna
> pantalla**. La resolución del idioma vive en `src/lib/locale.ts` y devuelve
> `es` siempre, ignorando a propósito la cookie `NEXT_LOCALE` y el header
> `accept-language`.
>
> Lo que sigue documentado abajo (selector, detección por cookie/navegador,
> routing por locale) describe el comportamiento **que vuelve al reactivar el
> selector**, no el de hoy. La infraestructura sigue entera y sin tocar
> —next-intl, `messages/es.json`, `messages/en.json` y todos los
> `useTranslations`—, así que reactivarlo son 4 pasos: están escritos en el
> comentario de cabecera de **`src/lib/locale.ts`**, que es la fuente de verdad.

## Descripción General

Se ha implementado **next-intl** para soportar múltiples idiomas en la aplicación. Actualmente soporta **Español (es)** e **Inglés (en)** con español como idioma predeterminado.

## Características Implementadas

- ✅ **Routing con locale**: URLs tipo `/es/productos` y `/en/products`
- ⛔ **Detección automática**: Detecta el idioma del navegador — *desactivada, ver el aviso de arriba*
- ⛔ **Cambio de idioma**: Componente Language Switcher en el Navbar — *desactivado, ver el aviso de arriba*
- ✅ **Traducciones completas**: Navbar, Cart, Productos, Auth
- ✅ **Rutas protegidas**: Admin sin locale, rutas públicas con locale
- ✅ **SEO-friendly**: URLs indexables por Google en cada idioma

## Estructura de Archivos

```
src/
├── i18n/
│   └── request.ts                    # Configuración de next-intl
├── app/
│   ├── [locale]/                     # Rutas con locale
│   │   ├── layout.tsx                # Layout con NextIntlClientProvider
│   │   ├── page.tsx                  # Home
│   │   ├── login/
│   │   ├── registro/
│   │   └── productos/
│   └── admin/                        # Admin SIN locale
├── components/
│   └── LanguageSwitcher.tsx          # Selector de idioma (HOY NO SE MONTA)
└── middleware.ts                     # Middleware con locale routing

messages/
├── es.json                           # Traducciones en español
└── en.json                           # Traducciones en inglés
```

## URLs Generadas

### Antes (sin i18n):
```
/
/productos
/login
/registro
/admin (sin cambios)
```

### Después (con i18n):
```
/es             o   /en
/es/productos   o   /en/products (futuro)
/es/login       o   /en/login
/es/registro    o   /en/registro
/admin          (sin cambios - no tiene locale)
```

## Uso en Componentes

### 1. Traducir textos estáticos

```tsx
"use client";

import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('nav'); // Namespace del JSON

  return (
    <div>
      <h1>{t('products')}</h1>  {/* "Productos" o "Products" */}
      <p>{t('welcome', { name: 'Juan' })}</p>  {/* Con variables */}
    </div>
  );
}
```

### 2. Links con locale

```tsx
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function MyComponent() {
  const locale = useLocale(); // "es" o "en"

  return (
    <Link href={`/${locale}/productos`}>
      Ver productos
    </Link>
  );
}
```

### 3. Cambiar de idioma programáticamente

```tsx
import { useRouter, usePathname } from 'next/navigation';

export default function MyComponent() {
  const router = useRouter();
  const pathname = usePathname();

  const changeLanguage = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <button onClick={() => changeLanguage('en')}>
      Switch to English
    </button>
  );
}
```

## Archivos de Traducción

### Estructura del JSON

```json
{
  "nav": {
    "products": "Productos",
    "cart": "Carrito",
    "welcome": "Hola, {name}"
  },
  "cart": {
    "title": "Carrito",
    "empty": "Tu carrito está vacío",
    "addToCart": "Agregar al carrito"
  },
  "products": {
    "title": "Productos",
    "featured": "Destacado"
  }
}
```

### Namespaces disponibles:

- `common`: Botones y acciones comunes (guardar, cancelar, etc)
- `nav`: Navegación y menú
- `cart`: Carrito de compras
- `products`: Productos y catálogo
- `auth`: Login, registro, autenticación
- `errors`: Mensajes de error
- `footer`: Footer y enlaces legales

## Agregar Nuevas Traducciones

### Paso 1: Agregar al JSON
```json
// messages/es.json
{
  "checkout": {
    "title": "Finalizar compra",
    "shippingAddress": "Dirección de envío"
  }
}

// messages/en.json
{
  "checkout": {
    "title": "Checkout",
    "shippingAddress": "Shipping address"
  }
}
```

### Paso 2: Usar en el componente
```tsx
const t = useTranslations('checkout');

<h1>{t('title')}</h1>
<label>{t('shippingAddress')}</label>
```

## Agregar un Nuevo Idioma

### 1. Crear archivo de traducciones
```bash
cp messages/es.json messages/fr.json
# Editar messages/fr.json con traducciones en francés
```

### 2. Actualizar configuración
```ts
// src/i18n/request.ts
export const locales = ['es', 'en', 'fr'] as const;
```

### 3. Actualizar Language Switcher
```tsx
// src/components/LanguageSwitcher.tsx
const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];
```

## Configuración del Middleware

El middleware maneja dos rutas diferentes:

1. **Rutas públicas** (`/`, `/productos`, etc.): Aplica locale
2. **Rutas admin** (`/admin/*`): No aplica locale (mantiene `/admin`)

```ts
// middleware.ts
export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',  // Rutas públicas con locale
    '/admin/:path*'                         // Rutas admin sin locale
  ],
};
```

## Detección del Idioma

**Hoy no hay detección**: `resolverLocale()` en `src/lib/locale.ts` devuelve
`es` en todos los casos, con el interruptor `SELECTOR_IDIOMA_ACTIVO` en `false`.
Da igual lo que traiga la cookie o el navegador.

Con el selector reactivado (`SELECTOR_IDIOMA_ACTIVO = true`) vuelve este orden,
que es el que sigue implementado en `resolverLocale()` y cubierto por
`src/lib/__tests__/locale.test.ts`:

1. **Cookie**: `NEXT_LOCALE=en` (la escribe el `LanguageSwitcher`)
2. **Header Accept-Language**: Del navegador, quedándose con el idioma sin
   región (`en-US` → `en`)
3. **Default**: Español, también ante una cookie o un idioma no soportados

Pendiente conocido para ese día: `src/app/layout.tsx` tiene `lang="es"` cableado
en el `<html>`; con el selector encendido el atributo miente si el usuario elige
inglés y hay que derivarlo del locale real.

## Plurales y Formateo

### Plurales
```json
{
  "cart": {
    "itemsCount": "{count} {count, plural, one {artículo} other {artículos}}"
  }
}
```

```tsx
t('itemsCount', { count: 1 })  // "1 artículo"
t('itemsCount', { count: 5 })  // "5 artículos"
```

### Números y Fechas
```tsx
import { useLocale } from 'next-intl';

const locale = useLocale();

// Formatear precio
const price = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'USD'
}).format(150.50);  // "$150.50" o "150,50 US$"

// Formatear fecha
const date = new Intl.DateTimeFormat(locale).format(new Date());
// "31/10/2025" (es) o "10/31/2025" (en)
```

## SEO y Metadata

Para cada página con locale:

```tsx
// src/app/[locale]/productos/page.tsx
import { useTranslations } from 'next-intl';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('products');

  return {
    title: t('title'),
    description: t('description'),
  };
}
```

## Migrar Páginas Existentes

Si tienes páginas sin traducir, sigue estos pasos:

### 1. Mover el archivo
```bash
# Antes
src/app/mipage/page.tsx

# Después
src/app/[locale]/mipage/page.tsx
```

### 2. Agregar traducciones
```tsx
// Antes
<h1>Mi Página</h1>

// Después
"use client";
import { useTranslations } from 'next-intl';

const t = useTranslations('mipage');
<h1>{t('title')}</h1>
```

### 3. Agregar al JSON
```json
// messages/es.json
{
  "mipage": {
    "title": "Mi Página"
  }
}

// messages/en.json
{
  "mipage": {
    "title": "My Page"
  }
}
```

## Testing

### Probar cambio de idioma:
1. Ir a `http://localhost:3000` → Redirige a `/es`
2. Click en Language Switcher → Cambiar a English
3. URL cambia a `/en` y textos se traducen
4. Navegar por la app verificando traducciones

### Probar detección automática:
1. Cambiar idioma del navegador a inglés
2. Limpiar cookies
3. Visitar `http://localhost:3000`
4. Debe redirigir a `/en` automáticamente

## Troubleshooting

### Error: "Messages not found"
- Verifica que el archivo `messages/{locale}.json` existe
- Asegúrate de que el namespace esté en el JSON

### El idioma no cambia
- **Es lo esperado hoy**: la tienda está fija en español (ver el aviso del
  principio). Sólo aplica lo de abajo con el selector reactivado.
- Verifica que la cookie `NEXT_LOCALE` esté configurada
- Limpia caché del navegador
- Reinicia el servidor de desarrollo

### Links no funcionan
- Asegúrate de incluir el locale: `/${locale}/ruta`
- Usa `useLocale()` para obtener el locale actual

### Admin pierde el locale
- Las rutas `/admin` NO deben tener locale
- Verifica que el middleware excluya `/admin` correctamente

## Comandos Útiles

```bash
# Instalar next-intl
npm install next-intl

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build

# Verificar traducciones
cat messages/es.json | jq
cat messages/en.json | jq
```

## Próximos Pasos

1. **Traducir nombres de rutas**: `/products` en inglés, `/productos` en español
2. **Traducir contenido dinámico**: Productos, categorías desde el backend
3. **Agregar más idiomas**: Francés, Portugués, etc.
4. **RTL Support**: Para árabe, hebreo
5. **Content Negotiation**: API que retorne contenido según idioma

## Recursos

- [Next-intl Docs](https://next-intl-docs.vercel.app/)
- [Next.js i18n Routing](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)

## Soporte

Para problemas o preguntas sobre i18n:
- Revisa este documento
- Consulta la documentación de next-intl
- Verifica los archivos de configuración en `src/i18n/`
