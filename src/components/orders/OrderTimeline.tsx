"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import {
  construirLineaTiempo,
  claveEtapaPreparacion,
  claveEtapaFinal,
  type EntradaLineaTiempo,
} from "@/lib/order-timeline";

/**
 * Avance del pedido, para el cliente que ya pagó y está esperando.
 *
 * Las fechas que se pintan son sólo las que el backend guarda de verdad; las
 * etapas sin marca de tiempo se muestran igual, pero sin fecha. Ver
 * `order-timeline.ts` para el porqué.
 */
export default function OrderTimeline({ pedido }: { pedido: EntradaLineaTiempo }) {
  const t = useTranslations("tracking");
  const etapas = construirLineaTiempo(pedido);

  if (!etapas) return null;

  const etiqueta = (id: string) => {
    if (id === "recibido") return t("stageReceived");
    if (id === "pago") return t("stagePaymentVerified");
    if (id === "preparacion") return t(claveEtapaPreparacion(pedido.deliveryMethod));
    return t(claveEtapaFinal(pedido.deliveryMethod));
  };

  const fecha = (iso: string) =>
    new Date(iso).toLocaleString("es-VE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="rounded-2xl border border-sand-300 bg-white p-5">
      <h2 className="font-display text-base font-bold text-ink mb-4">
        {t("progressTitle")}
      </h2>

      <ol className="flex flex-col gap-0">
        {etapas.map((etapa, i) => {
          const ultima = i === etapas.length - 1;
          const cumplida = etapa.estado === "cumplida";
          const actual = etapa.estado === "actual";

          return (
            <li key={etapa.id} className="flex gap-3">
              {/* Punto + línea vertical */}
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 ${
                    cumplida
                      ? "border-success-600 bg-success-600 text-white"
                      : actual
                        ? "border-accent-500 bg-accent-500 text-white"
                        : "border-sand-400 bg-white"
                  }`}
                  aria-hidden="true"
                >
                  {cumplida && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                {!ultima && (
                  <span
                    className={`w-0.5 flex-1 ${cumplida ? "bg-success-600" : "bg-sand-300"}`}
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className={`min-w-0 flex-1 ${ultima ? "pb-0" : "pb-5"}`}>
                <p
                  className={`text-[14px] font-bold ${
                    etapa.estado === "pendiente" ? "text-sand-600" : "text-ink"
                  }`}
                >
                  {etiqueta(etapa.id)}
                </p>
                {etapa.fecha ? (
                  <p className="mt-0.5 text-[12px] font-medium text-sand-600">
                    {fecha(etapa.fecha)}
                  </p>
                ) : actual ? (
                  <p className="mt-0.5 text-[12px] font-medium text-accent-700">
                    {t("stageInProgress")}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
