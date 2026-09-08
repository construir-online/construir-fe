"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { customersService } from "@/services/customers";
import { formatUSD, formatVES } from "@/lib/currency";
import type { CustomerDetailResponseDto, Order } from "@/types";
import { Card, Pill } from "./primitives";
import { getOrderCustomer } from "./order-customer";
import { toWhatsAppUrl } from "@/lib/whatsapp";
import PhoneLink from "@/components/common/PhoneLink";

/**
 * Ficha del cliente que hizo la orden.
 *
 * Identidad y contacto salen de la propia orden (relación eager `user` o
 * `guestCustomer`), así que la tarjeta pinta completa de entrada. El historial
 * de compra —cuántos pedidos lleva y cuánto ha gastado— sí exige otra llamada;
 * si falla, la tarjeta se queda sin ese bloque en vez de romperse.
 */
export function CustomerCard({ order }: { order: Order }) {
  const t = useTranslations("orders");
  const customer = getOrderCustomer(order);
  const [detail, setDetail] = useState<CustomerDetailResponseDto | null>(null);

  useEffect(() => {
    if (!customer.uuid) return;
    let active = true;

    customersService
      .getCustomerDetail(customer.uuid)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch((error) => {
        console.error("No se pudo cargar el historial del cliente:", error);
      });

    return () => {
      active = false;
    };
  }, [customer.uuid]);

  const stats = detail?.stats;
  const isRecurring = (stats?.totalOrders ?? 0) > 1;
  const whatsAppUrl = toWhatsAppUrl(customer.phone);

  return (
    <Card
      title={t("customer")}
      icon={<User className="h-[17px] w-[17px] text-brand-600" />}
      aside={
        customer.uuid ? (
          <Link
            href={`/admin/dashboard/clientes/${customer.uuid}`}
            className="text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            {t("viewCustomerFile")}
          </Link>
        ) : null
      }
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-600 text-[15px] font-extrabold text-white">
          {customer.initials}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold text-ink">
            {customer.name || t("unknownCustomer")}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Pill>{customer.isGuest ? t("guest") : t("registered")}</Pill>
            {isRecurring && <Pill tone="brand">{t("recurring")}</Pill>}
          </div>
        </div>
      </div>

      <dl className="mt-4 flex flex-col gap-2.5 border-t border-sand-200 pt-3.5">
        {customer.identification && (
          <DataRow label={t("identification")} value={customer.identification} />
        )}
        {customer.phone && (
          <DataRow
            label={t("phone")}
            value={
              <span className="inline-flex items-center gap-2">
                {/* El número entero es el enlace: con un fijo el icono no sale
                    y antes el teléfono quedaba muerto, sin ni siquiera tel: */}
                <PhoneLink
                  phone={customer.phone}
                  className="hover:text-success-700 hover:underline"
                />
                {whatsAppUrl && (
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("writeToCustomer")}
                    className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-success-50 transition-colors hover:bg-success-100"
                  >
                    <MessageCircle className="h-3 w-3 text-success-600" />
                  </a>
                )}
              </span>
            }
          />
        )}
        {customer.email && (
          <DataRow
            label={t("email")}
            value={
              <a
                href={`mailto:${customer.email}`}
                className="break-all hover:text-brand-600"
              >
                {customer.email}
              </a>
            }
          />
        )}
        {detail?.customer.createdAt && (
          <DataRow
            label={t("customerSince")}
            value={new Date(detail.customer.createdAt).toLocaleDateString(
              "es-VE",
              { month: "short", year: "numeric" }
            )}
          />
        )}
      </dl>

      {stats && (
        <div className="mt-3.5 grid grid-cols-2 gap-2.5 border-t border-sand-200 pt-3.5">
          <div className="rounded-xl bg-sand-100 px-3 py-2.5">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-sand-600">
              {t("customerOrders")}
            </div>
            <div className="mt-0.5 text-[17px] font-extrabold text-ink">
              {stats.totalOrders}
            </div>
          </div>
          <div className="rounded-xl bg-sand-100 px-3 py-2.5">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-sand-600">
              {t("totalSpent")}
            </div>
            <div className="mt-0.5 text-[17px] font-extrabold text-ink">
              {stats.totalSpentVES > 0
                ? formatVES(stats.totalSpentVES)
                : formatUSD(stats.totalSpentUSD)}
            </div>
            {stats.totalSpentVES > 0 && (
              <div className="text-[11px] font-medium text-sand-600">
                {formatUSD(stats.totalSpentUSD)}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex-none text-xs font-semibold text-sand-600">{label}</dt>
      <dd className="min-w-0 text-right text-[12.5px] font-bold text-ink">
        {value}
      </dd>
    </div>
  );
}
