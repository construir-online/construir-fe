import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '@/services/auth';

vi.mock('@/services/auth', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    register: vi.fn(),
  },
}));

/**
 * `AuthContext` guardaba el JWT en `localStorage` y además lo escribía como
 * cookie con `document.cookie` — que por definición no puede ser `httpOnly`.
 * Cualquier script de la página se llevaba la sesión.
 *
 * Ahora el token no pasa por acá: lo pone el backend en una cookie `httpOnly`
 * y el contexto sólo sabe SI hay sesión, preguntándole a `/auth/profile`.
 *
 * Estas pruebas fijan tres cosas que se rompen calladas:
 *  - que el token no vuelva a quedar guardado en el navegador,
 *  - que `loading` no baje antes de saber si hay sesión (si baja antes, la app
 *    parpadea de "invitado" a "con sesión" y el carrito se confunde),
 *  - que cerrar sesión llame al servidor, único que puede borrar la cookie.
 */
describe('AuthContext — sesión sin token en el navegador', () => {
  const usuario = { id: 1, uuid: 'u-1', email: 'a@b.com', role: 'customer' };
  const envoltura = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.cookie.split(';').forEach((c) => {
      document.cookie = `${c.split('=')[0].trim()}=;max-age=0;path=/`;
    });
  });

  afterEach(() => localStorage.clear());

  it('no guarda NADA del token al entrar', async () => {
    vi.mocked(authService.getProfile).mockRejectedValue(new Error('401'));
    vi.mocked(authService.login).mockResolvedValue({
      access_token: 'jwt.secreto.robable',
      user: usuario,
    } as never);

    const { result } = renderHook(() => useAuth(), { wrapper: envoltura });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login({ email: 'a@b.com', password: 'x' });
    });

    expect(result.current.isAuthenticated).toBe(true);
    // Lo que se está cerrando: el token no puede quedar en ningún sitio que el
    // JavaScript de la página alcance.
    expect(localStorage.getItem('token')).toBeNull();
    expect(JSON.stringify(localStorage)).not.toContain('jwt.secreto.robable');
    expect(document.cookie).not.toContain('jwt.secreto.robable');
  });

  it('deduce la sesión de `/auth/profile`, no de `localStorage`', async () => {
    // Antes sólo preguntaba si `localStorage` tenía algo. Con la cookie
    // `httpOnly` no hay nada que mirar: si no se pregunta siempre, un usuario
    // con sesión válida aparecía como invitado en cada recarga.
    vi.mocked(authService.getProfile).mockResolvedValue(usuario as never);

    const { result } = renderHook(() => useAuth(), { wrapper: envoltura });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(authService.getProfile).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(usuario);
  });

  it('`loading` sigue en `true` hasta que el servidor conteste', async () => {
    // Si `loading` bajara antes, quien pinta según la sesión —el carrito, sin
    // ir más lejos— vería "invitado" por un instante y mostraría el carrito
    // local a alguien que ya tiene el suyo en el servidor.
    let resolver: (u: unknown) => void = () => {};
    vi.mocked(authService.getProfile).mockReturnValue(
      new Promise((r) => { resolver = r; }) as never,
    );

    const { result } = renderHook(() => useAuth(), { wrapper: envoltura });

    expect(result.current.loading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => { resolver(usuario); });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('un perfil rechazado deja al usuario como invitado, sin romper', async () => {
    vi.mocked(authService.getProfile).mockRejectedValue(new Error('401'));

    const { result } = renderHook(() => useAuth(), { wrapper: envoltura });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('cerrar sesión le pide al SERVIDOR que borre la cookie', async () => {
    // Una cookie `httpOnly` no la puede borrar el JavaScript del cliente: el
    // `document.cookie` que hacía el logout de antes ya no tiene efecto. Sin
    // esta llamada, "cerrar sesión" limpiaba la pantalla y dejaba la sesión
    // viva en el navegador.
    vi.mocked(authService.getProfile).mockResolvedValue(usuario as never);
    vi.mocked(authService.logout).mockResolvedValue({ message: 'ok' } as never);

    const { result } = renderHook(() => useAuth(), { wrapper: envoltura });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => { await result.current.logout(); });

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('si el logout del servidor falla, igual saca al usuario de la pantalla', async () => {
    vi.mocked(authService.getProfile).mockResolvedValue(usuario as never);
    vi.mocked(authService.logout).mockRejectedValue(new Error('sin red'));

    const { result } = renderHook(() => useAuth(), { wrapper: envoltura });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => { await result.current.logout(); });

    expect(result.current.isAuthenticated).toBe(false);
  });
});
