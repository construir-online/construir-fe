import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CategoriesTable } from '../admin/CategoriesTable';
import type { Category } from '@/types';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  uuid: 'cat-1',
  name: 'Herramientas',
  slug: 'herramientas',
  visible: true,
  isFeatured: false,
  order: 0,
  ...overrides,
} as Category);

const parentCategory = makeCategory({
  uuid: 'cat-parent',
  name: 'Maquinaria',
  slug: 'maquinaria',
  childrens: [makeCategory()],
});

const childCategory = makeCategory({
  uuid: 'cat-child',
  name: 'Mano',
  slug: 'mano',
  parent: parentCategory,
  childrens: [],
});

const standaloneCategory = makeCategory({
  uuid: 'cat-solo',
  name: 'Pinturas',
  slug: 'pinturas',
  childrens: [],
});

const defaultProps = {
  categories: [parentCategory, childCategory, standaloneCategory],
  onDelete: vi.fn(),
  onToggleFeatured: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CategoriesTable — íconos de tipo', () => {
  it('muestra el tooltip "Categoría padre" para una categoría con hijos', () => {
    render(<CategoriesTable {...defaultProps} />);
    const icon = document.querySelector('[title="Categoría padre"]');
    expect(icon).toBeTruthy();
  });

  it('muestra el tooltip "Subcategoría" para una categoría con parent', () => {
    render(<CategoriesTable {...defaultProps} />);
    const icon = document.querySelector('[title="Subcategoría"]');
    expect(icon).toBeTruthy();
  });

  it('muestra el tooltip "Independiente" para una categoría sin parent ni hijos', () => {
    render(<CategoriesTable {...defaultProps} />);
    const icon = document.querySelector('[title="Independiente"]');
    expect(icon).toBeTruthy();
  });
});

describe('CategoriesTable — nombre y slug', () => {
  it('muestra el nombre de la categoría', () => {
    render(<CategoriesTable {...defaultProps} categories={[standaloneCategory]} />);
    expect(screen.getAllByText('Pinturas').length).toBeGreaterThan(0);
  });

  it('muestra customName en lugar de name cuando está disponible', () => {
    const cat = makeCategory({ customName: 'Pinturas Premium', childrens: [] });
    render(<CategoriesTable {...defaultProps} categories={[cat]} />);
    expect(screen.getAllByText('Pinturas Premium').length).toBeGreaterThan(0);
  });

  it('muestra el slug como texto secundario', () => {
    render(<CategoriesTable {...defaultProps} categories={[standaloneCategory]} />);
    expect(screen.getAllByText('pinturas').length).toBeGreaterThan(0);
  });
});

describe('CategoriesTable — estado vacío', () => {
  it('muestra el mensaje de sin categorías cuando el array está vacío', () => {
    render(<CategoriesTable {...defaultProps} categories={[]} />);
    expect(screen.getByText('noCategories')).toBeInTheDocument();
  });
});

describe('CategoriesTable — acción destacado', () => {
  it('llama a onToggleFeatured con el uuid y el valor actual al hacer click en la estrella', () => {
    render(<CategoriesTable {...defaultProps} categories={[standaloneCategory]} />);

    // Botones de estrella (desktop + mobile)
    const starButtons = screen.getAllByTitle('markFeatured');
    fireEvent.click(starButtons[0]);

    expect(defaultProps.onToggleFeatured).toHaveBeenCalledWith('cat-solo', false);
  });
});

describe('CategoriesTable — acción eliminar', () => {
  it('abre el modal de confirmación al hacer click en eliminar', () => {
    render(<CategoriesTable {...defaultProps} categories={[standaloneCategory]} />);

    // Botones de delete (desktop + mobile)
    const deleteButtons = screen.getAllByTitle('delete');
    fireEvent.click(deleteButtons[0]);

    // El modal debe aparecer (tiene el título 'delete' traducido)
    // Con el mock de traducciones retorna la key tal cual
    expect(screen.getAllByText('delete').length).toBeGreaterThan(0);
  });

  it('llama a onDelete con el uuid correcto al confirmar', async () => {
    const onDelete = vi.fn().mockResolvedValueOnce(undefined);
    render(
      <CategoriesTable
        {...defaultProps}
        categories={[standaloneCategory]}
        onDelete={onDelete}
      />,
    );

    // Abrir modal
    const deleteButtons = screen.getAllByTitle('delete');
    fireEvent.click(deleteButtons[0]);

    // El ConfirmModal renderiza el botón de confirmación con confirmText = 'delete'
    // Con el mock de traducciones, el botón tiene texto 'delete'
    const confirmButtons = screen.getAllByText('delete');
    // El último es el botón de confirmar en el modal
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(onDelete).toHaveBeenCalledWith('cat-solo');
  });
});
