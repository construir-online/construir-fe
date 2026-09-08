"use client";

import { useState } from "react";
import { Check, Copy, MapPin, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Order } from "@/types";
import { Card, Field } from "./primitives";
import PhoneLink from "@/components/common/PhoneLink";

/**
 * Entrega. Dos formas según `deliveryMethod`: el delivery muestra la dirección
 * completa con su mapa, el retiro en tienda no tiene dirección de envío
 * (`shippingAddress` llega nulo) y solo confirma quién retira.
 */
export function DeliveryCard({ order }: { order: Order }) {
  const t = useTranslations("orders");
  const address = order.shippingAddress;
  const isPickup = order.deliveryMethod === "pickup";

  const fullAddress = address
    ? [
        address.address,
        [address.city, address.state, address.zipCode]
          .filter(Boolean)
          .join(", "),
        address.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const hasCoords =
    address?.latitude != null && address?.longitude != null;

  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${address!.latitude},${address!.longitude}`
    : fullAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
      : null;

  return (
    <Card
      title={isPickup ? t("pickupTitle") : t("shippingAddress")}
      icon={
        isPickup ? (
          <Store className="h-[17px] w-[17px] text-brand-600" />
        ) : (
          <MapPin className="h-[17px] w-[17px] text-brand-600" />
        )
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-1 flex-col gap-3">
          <Field label={t("deliveryMethodLabel")}>
            {isPickup ? t("methodPickup") : t("methodDelivery")}
          </Field>

          {address && (
            <>
              <Field label={t("receivedBy")}>
                {[address.firstName, address.lastName]
                  .filter(Boolean)
                  .join(" ")}
                {address.phone ? (
                  <>
                    {" · "}
                    <PhoneLink
                      phone={address.phone}
                      className="hover:text-success-700 hover:underline"
                    />
                  </>
                ) : null}
              </Field>

              {!isPickup && fullAddress && (
                <Field label={t("addressLabel")}>
                  <span className="block font-medium">{address.address}</span>
                  <span className="block font-medium text-sand-700">
                    {[address.city, address.state, address.zipCode]
                      .filter(Boolean)
                      .join(", ")}
                    {address.country ? ` · ${address.country}` : ""}
                  </span>
                </Field>
              )}

              {address.additionalInfo && (
                <Field label={t("customerReference")}>
                  <span className="font-medium text-sand-700">
                    {address.additionalInfo}
                  </span>
                </Field>
              )}
            </>
          )}

          {!address && !isPickup && (
            <p className="text-[13px] text-sand-600">{t("noAddress")}</p>
          )}

          {!isPickup && (mapsUrl || fullAddress) && (
            <div className="mt-1 flex flex-wrap gap-2">
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-[10px] border border-sand-300 px-3 py-2 text-xs font-bold text-brand-600 transition-colors hover:bg-brand-50"
                >
                  {t("openInMaps")}
                </a>
              )}
              {fullAddress && (
                <CopyButton value={fullAddress} label={t("copyAddress")} />
              )}
            </div>
          )}
        </div>

        {!isPickup && hasCoords && (
          <div className="relative flex h-40 w-full flex-none items-center justify-center rounded-xl border border-sand-300 bg-sand-100 lg:h-[196px] lg:w-[270px]">
            <MapPin className="h-7 w-7 text-accent-500" strokeWidth={2} />
            <span className="absolute bottom-2 left-2 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-sand-700">
              {Number(address!.latitude).toFixed(4)} ·{" "}
              {Number(address!.longitude).toFixed(4)}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="inline-flex items-center gap-1.5 rounded-[10px] border border-sand-300 px-3 py-2 text-xs font-bold text-ink transition-colors hover:bg-sand-100"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-success-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {label}
    </button>
  );
}
