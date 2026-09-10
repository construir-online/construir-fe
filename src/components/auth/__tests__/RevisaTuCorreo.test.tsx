import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * Hasta ahora esta pantalla no ofrecía nada. Si el correo de verificación no
 * llegaba, el cliente se quedaba encallado: cuenta creada pero inutilizable
 * —el login rechaza a quien no ha verificado— y sin ninguna salida a la vista.
 */

const resendVerification = vi.fn();
vi.mock('@/services/auth', () => ({
  authService: {
    resendVerification: (email: string) => resendVerification(email),
  },
}));

import RevisaTuCorreo from '../RevisaTuCorreo';

beforeEach(() => {
  vi.clearAllMocks();
  resendVerification.mockResolvedValue({ message: 'ok' });
});

describe('Revisa tu correo', () => {
  it('ofrece reenviar el enlace al correo de la cuenta', async () => {
    render(<RevisaTuCorreo email="jose@correo.com" />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(
      () => expect(resendVerification).toHaveBeenCalledWith('jose@correo.com'),
      { timeout: 15000 },
    );
  });

  it('deja de aceptar clics mientras corre la espera', async () => {
    render(<RevisaTuCorreo email="jose@correo.com" />);
    const boton = screen.getByRole('button');

    fireEvent.click(boton);
    await waitFor(() => expect(boton).toBeDisabled(), { timeout: 15000 });
    fireEvent.click(boton);

    // Sin esto, tres clics seguidos chocan con el tope del backend y el cliente
    // recibe un error que parece un fallo de la tienda.
    expect(resendVerification).toHaveBeenCalledTimes(1);
  });

  it('muestra el correo al que se mandó el enlace', () => {
    render(<RevisaTuCorreo email="jose@correo.com" />);
    expect(screen.getByText('jose@correo.com')).toBeTruthy();
  });

  it('explica dónde buscar antes de que el cliente pida otro enlace', () => {
    // Un enlace nuevo acaba en la misma carpeta de spam que el primero.
    render(<RevisaTuCorreo email="jose@correo.com" />);
    for (const pista of ['spam', 'expiry', 'guest']) {
      expect(screen.getByText(`checkEmailHint.${pista}`)).toBeTruthy();
    }
  });

  it('deja volver a ingresar', () => {
    const { container } = render(<RevisaTuCorreo email="jose@correo.com" />);
    const enlaces = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(enlaces).toContain('/login');
  });

  it('respeta el objetivo táctil de 44 px en botón y enlace', () => {
    const { container } = render(<RevisaTuCorreo email="jose@correo.com" />);
    expect(screen.getByRole('button').className).toContain('min-h-11');
    for (const a of container.querySelectorAll('a')) {
      expect(a.className).toContain('min-h-11');
    }
  });
});
