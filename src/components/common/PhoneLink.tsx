'use client';

import { toTelHref, toWhatsAppUrl } from '@/lib/whatsapp';

interface PhoneLinkProps {
  phone: string;
  /** Mensaje precargado del chat, cuando el enlace acaba siendo de WhatsApp. */
  message?: string;
  className?: string;
  /** Texto a mostrar, si no se quiere pintar el número tal cual. */
  children?: React.ReactNode;
}

/**
 * Un teléfono mostrado siempre debe ser pulsable.
 *
 * Si es un móvil venezolano abre WhatsApp (que es como el cliente realmente
 * escribe a la tienda); si es un fijo cae en `tel:`, porque enlazar un fijo a
 * wa.me abre un chat inexistente. Existe para que ninguna pantalla vuelva a
 * decidir esto por su cuenta.
 */
export default function PhoneLink({
  phone,
  message,
  className,
  children,
}: PhoneLinkProps) {
  const whatsApp = toWhatsAppUrl(phone, message);

  if (whatsApp) {
    return (
      <a
        href={whatsApp}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children ?? phone}
      </a>
    );
  }

  const tel = toTelHref(phone);
  if (!tel) return <span className={className}>{children ?? phone}</span>;

  return (
    <a href={tel} className={className}>
      {children ?? phone}
    </a>
  );
}
