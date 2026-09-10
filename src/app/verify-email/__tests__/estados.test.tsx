import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * El caso que motiva estas pruebas: abrir el enlace del correo dos veces —o que
 * el antivirus del proveedor lo visite antes que la persona— daba "Enlace
 * inválido", el mismo texto que un enlace inventado. El cliente creía que su
 * cuenta no había quedado activa cuando sí lo estaba, y se quedaba encallado.
 *
 * El mock global de next-intl devuelve la clave tal cual, así que lo que se
 * comprueba es QUÉ clave pide cada estado.
 */

const verifyEmail = vi.fn();
const token = { valor: 'tok' as string | null };

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => token.valor }),
}));
vi.mock('@/services/auth', () => ({
  authService: {
    verifyEmail: (t: string) => verifyEmail(t),
    resendVerification: vi.fn().mockResolvedValue({ message: 'ok' }),
  },
}));

import VerifyEmailPage from '../page';

const err = (code: string) =>
  Object.assign(new Error('x'), { statusCode: 400, code });

beforeEach(() => {
  vi.clearAllMocks();
  token.valor = 'tok';
});

describe('Verificar correo — cada caso dice lo suyo', () => {
  it('un enlace ya usado se cuenta como éxito, no como error', async () => {
    verifyEmail.mockResolvedValue({ message: 'ok', alreadyVerified: true });
    render(<VerifyEmailPage />);

    await waitFor(() =>
      expect(screen.getByText('verifyEmail.alreadyTitle')).toBeTruthy(),
    );
    // Lo que no puede pasar: tratarlo como enlace roto.
    expect(screen.queryByText('verifyEmail.invalidTitle')).toBeNull();
    expect(screen.queryByText('verifyEmail.expiredTitle')).toBeNull();
  });

  it('distingue recién activada de ya estaba activa', async () => {
    verifyEmail.mockResolvedValue({ message: 'ok', alreadyVerified: false });
    render(<VerifyEmailPage />);

    await waitFor(() =>
      expect(screen.getByText('verifyEmail.successTitle')).toBeTruthy(),
    );
    expect(screen.queryByText('verifyEmail.alreadyTitle')).toBeNull();
  });

  it('el enlace vencido ofrece pedir otro', async () => {
    verifyEmail.mockRejectedValue(err('EMAIL_VERIFICATION_TOKEN_EXPIRED'));
    render(<VerifyEmailPage />);

    await waitFor(() =>
      expect(screen.getByText('verifyEmail.expiredTitle')).toBeTruthy(),
    );
    expect(screen.getByPlaceholderText('emailPlaceholder')).toBeTruthy();
  });

  it('el enlace inservible también ofrece pedir otro', async () => {
    // Antes sólo lo ofrecía el vencido, y quien llegaba con un enlace roto se
    // quedaba sin salida en la pantalla.
    verifyEmail.mockRejectedValue(err('EMAIL_VERIFICATION_TOKEN_INVALID'));
    render(<VerifyEmailPage />);

    await waitFor(() =>
      expect(screen.getByText('verifyEmail.invalidTitle')).toBeTruthy(),
    );
    expect(screen.getByPlaceholderText('emailPlaceholder')).toBeTruthy();
  });

  it('un fallo de red no se disfraza de enlace roto', async () => {
    verifyEmail.mockRejectedValue(new Error('Failed to fetch'));
    render(<VerifyEmailPage />);

    await waitFor(() =>
      expect(screen.getByText('verifyEmail.networkTitle')).toBeTruthy(),
    );
    // Pedir otro enlace no arregla una conexión caída.
    expect(screen.queryByPlaceholderText('emailPlaceholder')).toBeNull();
  });

  it('sin token no consulta la API', async () => {
    token.valor = null;
    render(<VerifyEmailPage />);

    await waitFor(() =>
      expect(screen.getByText('verifyEmail.invalidTitle')).toBeTruthy(),
    );
    expect(verifyEmail).not.toHaveBeenCalled();
  });
});
