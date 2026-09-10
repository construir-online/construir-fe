'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { authService } from '@/services/auth';

/** Segundos que el botón queda inhabilitado tras un envío. */
export const ESPERA_REENVIO = 60;

/**
 * Reenvío del enlace de verificación, con espera entre intentos.
 *
 * Las tres pantallas que ofrecen reenviar —ingresar, crear cuenta y verificar
 * correo— repetían el mismo trío de estados (enviando / enviado / error) con
 * pequeñas diferencias. Acá viven una sola vez.
 *
 * Sobre la espera: el tope de verdad es del backend, que limita el endpoint a 3
 * por minuto por IP. Sin él esto sería un emisor de correos a demanda, y una
 * cuenta atrás en el navegador no defiende de nada porque quien quiera abusar
 * no pasa por esta pantalla. Lo que hace la cuenta atrás es lo que el backend
 * no puede: decirle a un cliente honesto que el correo ya salió y que apretar
 * otra vez no lo hace llegar antes — sin eso, aprieta tres veces, se topa con
 * el límite y recibe un error que parece un fallo de la tienda.
 *
 * El estado vive en el componente: recargar la página lo reinicia, y está
 * bien, porque quien recarga ya esperó y el backend sigue cubriendo el resto.
 */
export function useResendVerification(email: string) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [espera, setEspera] = useState(0);
  const temporizador = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearInterval(temporizador.current);
    };
  }, []);

  const arrancarEspera = useCallback(() => {
    setEspera(ESPERA_REENVIO);
    if (temporizador.current) clearInterval(temporizador.current);
    temporizador.current = setInterval(() => {
      setEspera((s) => {
        if (s <= 1) {
          if (temporizador.current) clearInterval(temporizador.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const reenviar = useCallback(async () => {
    if (!email || enviando || espera > 0) return;
    setEnviando(true);
    try {
      await authService.resendVerification(email);
    } catch {
      // El endpoint responde igual exista o no el correo, justamente para no
      // delatar qué direcciones tienen cuenta. Un fallo acá es de red o del
      // servidor, y repetir el mensaje de éxito mantiene esa promesa: decir
      // "no pudimos" sólo para ciertos correos sería la fuga por otra puerta.
    } finally {
      setEnviando(false);
      setEnviado(true);
      arrancarEspera();
    }
  }, [email, enviando, espera, arrancarEspera]);

  return { reenviar, enviando, enviado, espera };
}

/** `m:ss` para la cuenta atrás del botón. */
export function formatearEspera(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
