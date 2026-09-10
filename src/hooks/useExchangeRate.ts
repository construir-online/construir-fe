'use client';

import { useEffect, useState } from 'react';
import { exchangeRateService } from '@/services/exchangeRate';

/**
 * Tasa BCV vigente. El diseño la mantiene a la vista en toda la app (chip del
 * header, detalle de producto, resumen del carrito) porque el precio es dual:
 * Bs. protagonista y USD de referencia.
 */
export function useExchangeRate() {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    exchangeRateService
      .getCurrentRate()
      .then((current) => {
        if (active) setRate(current.rate);
      })
      .catch(() => {
        if (active) setRate(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { rate, loading };
}

/**
 * Formatea la tasa como la muestra el chip del header: `118,40`.
 *
 * Coacciona a número antes de formatear: `String.prototype.toLocaleString`
 * ignora las opciones y devolvería el texto crudo del backend (`481.22`), con
 * el separador decimal equivocado para es-VE.
 */
export function formatRate(rate: number): string {
  return Number(rate).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
