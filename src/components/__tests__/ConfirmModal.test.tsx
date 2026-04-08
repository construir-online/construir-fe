import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal } from '../ConfirmModal';


const defaultProps = {
  isOpen: true,
  title: 'Eliminar categoría',
  message: '¿Estás seguro de que deseas eliminar esta categoría?',
  confirmText: 'Eliminar',
  cancelText: 'Cancelar',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('ConfirmModal', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza el título cuando isOpen es true', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Eliminar categoría')).toBeInTheDocument();
  });

  it('renderiza el mensaje cuando isOpen es true', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('¿Estás seguro de que deseas eliminar esta categoría?')).toBeInTheDocument();
  });

  it('llama a onConfirm al hacer click en el botón de confirmación', () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Eliminar'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('llama a onCancel al hacer click en el botón de cancelar', () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancelar'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('llama a onCancel al hacer click en el overlay', () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    // El overlay es el div con bg-black/30
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/30');
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay!);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
