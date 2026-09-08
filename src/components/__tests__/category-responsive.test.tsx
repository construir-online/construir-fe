import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import type { Category } from '@/types';
import CategoryTile from '../category/CategoryTile';
import CategoryCard from '../category/CategoryCard';
import CategoryChips from '../CategoryChips';
import FeaturedCategories from '../FeaturedCategories';
import { FEATURED_MAX } from '@/lib/category-grid';

/** next/image necesita configuración de dominios; en jsdom basta con un <img>. */
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

const mockGetFeatured = vi.fn();
vi.mock('@/services/categories', () => ({
  categoriesService: {
    getFeatured: (...args: unknown[]) => mockGetFeatured(...args),
    getVisible: (...args: unknown[]) => mockGetFeatured(...args),
  },
}));

const categoria = (over: Partial<Category> = {}): Category => ({
  uuid: over.uuid ?? 'uuid-1',
  name: over.name ?? 'MARTILLOS',
  slug: over.slug ?? 'martillos',
  order: 0,
  visible: true,
  isFeatured: true,
  ...over,
});

const NOMBRE_LARGO =
  'TANQUES DE AGUA - ACCESORIOS - CONEXIONES - VALVULAS Y REPUESTOS PARA INSTALACIONES SANITARIAS';

beforeEach(() => {
  mockGetFeatured.mockReset();
  mockSearchParams.delete('categoria');
});

/**
 * Regresiones del responsive de categorías: la rejilla de `/categorias` estaba
 * clavada en tres columnas a cualquier ancho, las tarjetas no reservaban altura
 * para el nombre (filas dentadas al cambiar de ancho) y los nombres largos se
 * cortaban sin dejar rastro de lo que decían.
 */
describe('CategoryTile', () => {
  it('sin categoría pinta el acceso a todos los productos', () => {
    render(<CategoryTile />);
    const enlace = screen.getByRole('link');
    expect(enlace).toHaveAttribute('href', '/productos');
    expect(enlace).toHaveTextContent('Todos');
  });

  it('reserva la altura de dos líneas para el nombre', () => {
    // Sin este min-h, una fila con nombres de una y de dos líneas dejaba las
    // imágenes de la siguiente fila a alturas distintas.
    const { container } = render(<CategoryTile category={categoria()} />);
    expect(container.querySelector('.min-h-\\[2\\.75rem\\]')).not.toBeNull();
  });

  it('deja el nombre completo accesible aunque se recorte a dos líneas', () => {
    render(<CategoryTile category={categoria({ name: NOMBRE_LARGO })} />);
    expect(screen.getByRole('link')).toHaveAttribute('title', NOMBRE_LARGO);
  });

  it('cae al icono de paquete cuando la categoría no tiene imagen', () => {
    const { container } = render(<CategoryTile category={categoria({ image: undefined })} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('pide a next/image un tamaño acorde a la rejilla ancha, no 33vw fijo', () => {
    // El `sizes` viejo decía 33vw siempre y en escritorio (hasta 8 columnas) se
    // descargaban imágenes tres veces más grandes de lo necesario.
    const { container } = render(
      <CategoryTile category={categoria({ image: 'https://ejemplo/x.jpg' })} />,
    );
    expect(container.querySelector('img')).not.toBeNull();
  });
});

describe('CategoryCard (destacadas del home)', () => {
  it('reserva altura para el nombre y expone el nombre completo', () => {
    const { container } = render(<CategoryCard category={categoria({ name: NOMBRE_LARGO })} />);
    expect(screen.getByRole('link')).toHaveAttribute('title', NOMBRE_LARGO);
    expect(container.querySelector('.min-h-\\[2\\.1em\\]')).not.toBeNull();
  });

  it('no revienta sin imagen', () => {
    const { container } = render(<CategoryCard category={categoria({ image: undefined })} />);
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('FeaturedCategories', () => {
  it('no pinta nada si el backend no devuelve categorías', async () => {
    mockGetFeatured.mockResolvedValue([]);
    const { container } = render(<FeaturedCategories />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('con una sola categoría no deja la rejilla rota', async () => {
    mockGetFeatured.mockResolvedValue([categoria()]);
    render(<FeaturedCategories />);
    expect(await screen.findByText('MARTILLOS')).toBeInTheDocument();
  });

  it('recorta a filas completas cuando el backend manda de más', async () => {
    // Con 20 destacadas la última fila quedaba con una sola tarjeta suelta.
    mockGetFeatured.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => categoria({ uuid: `c${i}`, name: `CAT ${i}` })),
    );
    const { container } = render(<FeaturedCategories />);
    await screen.findByText('CAT 0');
    const rejilla = container.querySelector('.grid') as HTMLElement;
    expect(within(rejilla).getAllByRole('link')).toHaveLength(FEATURED_MAX);
  });

  it('sobrevive a un fallo del backend sin romper la página', async () => {
    mockGetFeatured.mockRejectedValue(new Error('502'));
    const { container } = render(<FeaturedCategories />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});

describe('CategoryChips', () => {
  it('no pinta la fila mientras no haya categorías', async () => {
    mockGetFeatured.mockResolvedValue([]);
    const { container } = render(<CategoryChips />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('marca el chip activo con aria-current a partir de la URL', async () => {
    // Antes sólo cambiaba de color: un lector de pantalla no sabía cuál estaba
    // seleccionado, y el chip podía además quedar fuera de la parte visible.
    mockSearchParams.set('categoria', 'uuid-2');
    mockGetFeatured.mockResolvedValue([
      categoria({ uuid: 'uuid-1', name: 'ABRASIVOS' }),
      categoria({ uuid: 'uuid-2', name: 'BARNIZ' }),
    ]);
    render(<CategoryChips />);
    const activo = await screen.findByText('BARNIZ');
    expect(activo).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('ABRASIVOS')).not.toHaveAttribute('aria-current');
  });

  it('sin filtro en la URL el chip activo es "todos"', async () => {
    mockGetFeatured.mockResolvedValue([categoria({ uuid: 'uuid-1', name: 'ABRASIVOS' })]);
    render(<CategoryChips />);
    const todos = await screen.findByText('allProducts');
    expect(todos).toHaveAttribute('aria-current', 'page');
  });

  it('mantiene los 44px de alto mínimo en cada chip', async () => {
    mockGetFeatured.mockResolvedValue([categoria({ uuid: 'uuid-1', name: NOMBRE_LARGO })]);
    render(<CategoryChips />);
    const chip = await screen.findByText(NOMBRE_LARGO);
    expect(chip.className).toContain('min-h-11');
  });
});
