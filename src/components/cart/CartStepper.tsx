"use client";

import { useState } from "react";
import { ShoppingCart, Loader2, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";

interface CartStepperProps {
  productUuid: string;
  inventory?: number;
  className?: string;
  compact?: boolean;
  /**
   * Reemplaza el texto del botón inicial, p. ej. "Agregar · Bs. 1.480,00".
   *
   * Como función recibe la cantidad elegida, para que el botón diga el total
   * de lo que se va a agregar y no el precio de una unidad: si no, el selector
   * enseñaría "5" al lado del importe de uno solo.
   */
  addLabel?: string | ((cantidad: number) => string);
  /**
   * Deja elegir cuántas unidades agregar ANTES de agregarlas.
   *
   * Es para la ficha de producto. Hasta ahora la única forma de llevarse diez
   * sacos de cemento era pulsar "+" diez veces, y cada pulsación es una
   * llamada al carrito: diez viajes de red para una compra de obra normal.
   * Acá la cantidad se ajusta en local y se agrega de una sola vez, por el
   * mismo camino de alta que usa el resto de la app.
   */
  conSelectorDeCantidad?: boolean;
}

export default function CartStepper({
  productUuid,
  inventory,
  className = "",
  compact = false,
  addLabel,
  conSelectorDeCantidad = false,
}: CartStepperProps) {
  const t = useTranslations("cart");
  const { addToCart, getItemQuantity, updateQuantity, removeFromCart } = useCart();
  const [loading, setLoading] = useState(false);
  // Cantidad todavía NO agregada. Vive sólo acá: mientras el usuario la
  // ajusta no ha comprado nada, y llevarla al carrito a cada toque es
  // exactamente la fricción que se viene a quitar.
  const [cantidadElegida, setCantidadElegida] = useState(1);

  const currentQty = getItemQuantity(productUuid);
  const isAtStockLimit = inventory !== undefined && currentQty >= inventory;

  // El inventario manda: no se puede elegir más de lo que hay. El `max(1, …)`
  // es para que un producto con inventario 0 no deje el selector en cero — esa
  // pantalla ni siquiera pinta el stepper, pero si algún día lo hiciera, un
  // "Agregar · 0 unidades" sería peor que un botón deshabilitado.
  const topeDelSelector = inventory !== undefined ? Math.max(1, inventory) : Infinity;
  const cantidad = Math.min(cantidadElegida, topeDelSelector);
  const enElTope = cantidad >= topeDelSelector;

  const textoDelBoton =
    typeof addLabel === "function"
      ? addLabel(conSelectorDeCantidad ? cantidad : 1)
      : (addLabel ?? t("addToCart"));

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await addToCart(productUuid, conSelectorDeCantidad ? cantidad : 1);
      // Agregado: el selector vuelve a 1. Si se quedara en 5, el siguiente
      // toque agregaría otros 5 sin que nadie lo hubiera pedido.
      setCantidadElegida(1);
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAtStockLimit) return;
    try {
      setLoading(true);
      await addToCart(productUuid, 1);
    } catch (error) {
      console.error("Error updating cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrease = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      if (currentQty === 1) {
        await removeFromCart(productUuid);
      } else {
        await updateQuantity(productUuid, currentQty - 1);
      }
    } catch (error) {
      console.error("Error updating cart:", error);
    } finally {
      setLoading(false);
    }
  };

  if (currentQty > 0) {
    return (
      <div
        className={`flex min-h-11 items-center justify-between rounded-xl border-[1.5px] border-brand-600 bg-white ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDecrease}
          disabled={loading}
          className="flex h-11 w-11 items-center justify-center rounded-l-[10px] text-brand-600 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Disminuir cantidad"
        >
          <Minus className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <span className="min-w-[2ch] text-center text-[13px] font-extrabold text-ink">
          {loading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : currentQty}
        </span>
        <button
          onClick={handleIncrease}
          disabled={loading || isAtStockLimit}
          className="flex h-11 w-11 items-center justify-center rounded-r-[10px] text-brand-600 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Aumentar cantidad"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  const botonAgregar = (
    <button
      onClick={handleAdd}
      disabled={loading}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 ${compact ? 'px-3 py-2.5 text-[12.5px]' : 'px-6 py-3.5 text-sm'} ${conSelectorDeCantidad ? 'flex-1' : className}`}
    >
      {loading ? (
        <Loader2 className={compact ? 'h-4 w-4 animate-spin' : 'h-5 w-5 animate-spin'} />
      ) : (
        <ShoppingCart className={compact ? 'hidden h-4 w-4 sm:block' : 'h-5 w-5'} />
      )}
      <span>{textoDelBoton}</span>
    </button>
  );

  if (!conSelectorDeCantidad) return botonAgregar;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/*
        Selector de cantidad. `role="group"` con nombre para que un lector de
        pantalla anuncie de qué es la cantidad: en la barra fija de la ficha
        hay dos controles pegados y "1" a secas no dice nada.
      */}
      <div
        role="group"
        aria-label="Cantidad a agregar"
        className="flex min-h-11 flex-none items-center justify-between rounded-xl border-[1.5px] border-sand-300 bg-white"
      >
        <button
          type="button"
          onClick={() => setCantidadElegida(Math.max(1, cantidad - 1))}
          disabled={loading || cantidad <= 1}
          className="flex h-11 w-11 items-center justify-center rounded-l-[10px] text-brand-600 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Quitar una unidad"
        >
          <Minus className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <span
          aria-live="polite"
          className="min-w-[2ch] px-0.5 text-center text-[15px] font-extrabold text-ink"
        >
          {cantidad}
        </span>
        <button
          type="button"
          // El tope es el inventario. Sin esto se podía pedir 40 sacos de un
          // producto con 3, y el rechazo no llegaba hasta el carrito.
          onClick={() => setCantidadElegida(Math.min(topeDelSelector, cantidad + 1))}
          disabled={loading || enElTope}
          className="flex h-11 w-11 items-center justify-center rounded-r-[10px] text-brand-600 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={
            enElTope ? `No hay más de ${topeDelSelector} unidades` : "Agregar una unidad"
          }
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
      {botonAgregar}
    </div>
  );
}
