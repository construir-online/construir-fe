"use client";

import { MessageCircle } from "lucide-react";
import { useStoreInfo } from "@/hooks/useStoreInfo";
import { storeWhatsAppUrl } from "@/lib/whatsapp";

interface Props {
  /**
   * Número de pedido, si se conoce. Va en el mensaje precargado para que el
   * vendedor sepa de cuál le hablan sin tener que preguntarlo.
   */
  orderNumber?: string;
  /** Texto del botón. */
  children: React.ReactNode;
  variante?: "primario" | "secundario";
  className?: string;
}

/**
 * Botón de WhatsApp para las pantallas de pedido.
 *
 * El enlace lo arma `storeWhatsAppUrl`, que es la única versión de la regla de
 * normalización; aquí no se vuelve a tocar el número, que llega de
 * `/api/v1/store-info`. Mientras carga, o si el backend no tiene WhatsApp
 * configurado, el botón no se pinta — igual que se resolvió en el pie y en
 * contacto: mejor nada que un enlace que abre un chat inexistente.
 */
export default function WhatsAppPedidoBoton({
  orderNumber,
  children,
  variante = "secundario",
  className = "",
}: Props) {
  const { storeInfo } = useStoreInfo();
  const mensaje = orderNumber
    ? `Hola, quiero preguntar por mi pedido ${orderNumber}.`
    : "Hola, necesito ayuda con un pedido de la tienda.";

  const url = storeWhatsAppUrl(storeInfo?.whatsapp, mensaje);
  if (!url) return null;

  const estilo =
    variante === "primario"
      ? "bg-brand-600 text-white hover:bg-brand-700"
      : "border-[1.5px] border-sand-400 text-ink hover:bg-sand-100";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-colors ${estilo} ${className}`}
    >
      <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
      {children}
    </a>
  );
}
