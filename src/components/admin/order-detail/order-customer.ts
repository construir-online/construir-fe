import type { Order } from "@/types";

export interface OrderCustomer {
  /** Uuid del usuario o del invitado, que es como se direcciona en `/customers/:uuid`. */
  uuid: string | null;
  name: string;
  initials: string;
  email: string;
  phone: string;
  identification: string;
  isGuest: boolean;
}

/**
 * Reúne al comprador desde donde haya quedado en la orden.
 *
 * Hay tres fuentes y no siempre coinciden: el usuario registrado (`user`), el
 * invitado (`guestCustomer`) y la dirección de envío, que es la única que trae
 * datos en órdenes viejas anteriores a `guest_customers`. Se prefiere la más
 * fiable disponible y se completa hueco por hueco con las demás.
 */
export function getOrderCustomer(order: Order): OrderCustomer {
  const guest = order.guestCustomer;
  const user = order.user;
  const address = order.shippingAddress;

  const name =
    (guest && `${guest.firstName} ${guest.lastName}`.trim()) ||
    (user && `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()) ||
    (address && `${address.firstName ?? ""} ${address.lastName ?? ""}`.trim()) ||
    "";

  const identification =
    (guest && `${guest.identificationType}-${guest.identificationNumber}`) ||
    (address?.identificationNumber
      ? `${address.identificationType ?? ""}-${address.identificationNumber}`.replace(
          /^-/,
          ""
        )
      : "") ||
    "";

  // El uuid sale de la relación eager, no del id de la orden: `userId` y
  // `guestCustomerId` son correlativos internos y no sirven para direccionar.
  const uuid = user?.uuid ?? guest?.uuid ?? null;

  return {
    uuid,
    name,
    initials: toInitials(name),
    email: guest?.email || user?.email || address?.email || order.guestEmail || "",
    phone: guest?.phone || address?.phone || "",
    identification,
    isGuest: !order.userId,
  };
}

function toInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  return parts
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
