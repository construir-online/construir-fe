'use client';

import { ArrowUp, ArrowDown, Minus, LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string;
  secondaryValue?: string;
  /**
   * `null` cuando no hay con qué comparar (el tramo del mes anterior fue
   * cero). Se pinta "sin comparación" y no una flecha en 0%, que leería
   * "vendiste lo mismo que el mes pasado" cuando en realidad no hubo nada
   * que comparar.
   *
   * El aviso dice "no hubo INGRESOS VERIFICADOS", no "no hubo ventas": son
   * cosas distintas y confundirlas es justo lo que este bloque vino a
   * arreglar. En agosto de 2026 hubo pedidos por unos 430 USD y ni un solo
   * comprobante revisado; decir ahí "no hubo ventas" sería mentir.
   */
  percentageChange: number | null;
  /** Contra qué se compara. Por defecto, el mes anterior. */
  comparisonLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}

export default function MetricCard({
  title,
  value,
  secondaryValue,
  percentageChange,
  comparisonLabel = 'vs mes anterior',
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-50',
}: MetricCardProps) {
  const isPositive = percentageChange !== null && percentageChange > 0;
  const isNegative = percentageChange !== null && percentageChange < 0;
  const isNeutral = percentageChange === 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconBgColor}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        {secondaryValue && (
          <div className="text-sm text-gray-600">{secondaryValue}</div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1">
        {percentageChange === null && (
          <span className="text-sm text-gray-500">
            Sin comparación: no hubo ingresos verificados el mes anterior
          </span>
        )}
        {isPositive && percentageChange !== null && (
          <>
            <ArrowUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              {percentageChange.toFixed(1)}%
            </span>
          </>
        )}
        {isNegative && percentageChange !== null && (
          <>
            <ArrowDown className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-600">
              {Math.abs(percentageChange).toFixed(1)}%
            </span>
          </>
        )}
        {isNeutral && (
          <>
            <Minus className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">0%</span>
          </>
        )}
        {percentageChange !== null && (
          <span className="text-sm text-gray-500 ml-1">{comparisonLabel}</span>
        )}
      </div>
    </div>
  );
}
