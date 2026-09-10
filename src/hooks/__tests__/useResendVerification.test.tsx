import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

/**
 * El reenvío del enlace de verificación es lo que desencalla a quien creó su
 * cuenta y nunca recibió el correo. Sin espera entre intentos también es un
 * emisor de correos a demanda, así que lo que se fija acá es que la espera
 * exista y que de verdad bloquee el segundo envío.
 *
 * Ojo con lo que esta espera NO es: el tope de verdad lo pone el backend (3 por
 * minuto por IP), porque quien quiera abusar no pasa por esta pantalla. Lo de
 * acá es para que un cliente honesto no apriete tres veces, se tope con el
 * límite y reciba un error que parece un fallo de la tienda.
 */

const resendVerification = vi.fn();
vi.mock('@/services/auth', () => ({
  authService: {
    resendVerification: (email: string) => resendVerification(email),
  },
}));

import {
  ESPERA_REENVIO,
  formatearEspera,
  useResendVerification,
} from '../useResendVerification';

beforeEach(() => {
  vi.clearAllMocks();
  resendVerification.mockResolvedValue({ message: 'ok' });
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useResendVerification', () => {
  it('envía el enlace y arranca la espera', async () => {
    const { result } = renderHook(() => useResendVerification('jose@correo.com'));

    await act(async () => {
      await result.current.reenviar();
    });

    expect(resendVerification).toHaveBeenCalledWith('jose@correo.com');
    expect(result.current.enviado).toBe(true);
    expect(result.current.espera).toBe(ESPERA_REENVIO);
  });

  it('no vuelve a enviar mientras corre la espera', async () => {
    const { result } = renderHook(() => useResendVerification('jose@correo.com'));

    await act(async () => {
      await result.current.reenviar();
    });
    await act(async () => {
      await result.current.reenviar();
    });

    expect(resendVerification).toHaveBeenCalledTimes(1);
  });

  it('vuelve a permitir el envío cuando la espera termina', async () => {
    const { result } = renderHook(() => useResendVerification('jose@correo.com'));

    await act(async () => {
      await result.current.reenviar();
    });
    await act(async () => {
      vi.advanceTimersByTime(ESPERA_REENVIO * 1000);
    });

    await waitFor(() => expect(result.current.espera).toBe(0));

    await act(async () => {
      await result.current.reenviar();
    });
    expect(resendVerification).toHaveBeenCalledTimes(2);
  });

  it('no envía nada sin correo', async () => {
    const { result } = renderHook(() => useResendVerification(''));

    await act(async () => {
      await result.current.reenviar();
    });

    expect(resendVerification).not.toHaveBeenCalled();
  });

  it('muestra el mismo éxito aunque la API falle', async () => {
    // El endpoint responde igual exista o no el correo, justamente para no
    // delatar qué direcciones tienen cuenta. Decir "no pudimos" sólo para
    // algunos correos sería la misma fuga por otra puerta.
    resendVerification.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useResendVerification('jose@correo.com'));

    await act(async () => {
      await result.current.reenviar();
    });

    expect(result.current.enviado).toBe(true);
    expect(result.current.espera).toBe(ESPERA_REENVIO);
  });
});

describe('formatearEspera', () => {
  it('cuenta en m:ss', () => {
    expect(formatearEspera(60)).toBe('1:00');
    expect(formatearEspera(42)).toBe('0:42');
    expect(formatearEspera(5)).toBe('0:05');
  });
});
