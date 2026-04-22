"use client";

import { Info } from "lucide-react";
import type { ZellePayment } from "@/types";

interface ZelleFormProps {
  data: ZellePayment;
  onChange: (data: ZellePayment) => void;
  total: number;
}

export default function ZelleForm({ }: ZelleFormProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-900 dark:text-blue-200">
          Un vendedor de <strong>Construir</strong> se comunicará contigo para suministrarte los datos de pago Zelle. Por favor mantén tu teléfono disponible.
        </p>
      </div>
    </div>
  );
}
