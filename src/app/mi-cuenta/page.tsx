"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ShoppingBag,
  Phone,
  Mail,
  MapPin,
  Clock,
  LogOut,
  ChevronRight,
  User,
  Facebook,
  Instagram,
  Twitter,
  LogIn,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { perfilesSociales, type RedSocial } from "@/lib/social";
import { useStoreInfo } from "@/hooks/useStoreInfo";
import PhoneLink from "@/components/common/PhoneLink";
import {
  formatVenezuelanNumber,
  storeWhatsAppNumber,
  storeWhatsAppUrl,
} from "@/lib/whatsapp";

/** Contacto de la tienda. Los datos vienen del backend (variables STORE_*). */
function ContactSection() {
  const t = useTranslations("myAccount");
  const { storeInfo } = useStoreInfo();
  const whatsAppUrl = storeWhatsAppUrl();
  const whatsAppNumber = storeWhatsAppNumber();

  if (!storeInfo) return null;

  const fullAddress = [storeInfo.address, storeInfo.city]
    .filter(Boolean)
    .join(", ");

  return (
    <section>
      <h2 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sand-600">
        Contacto
      </h2>
      <div className="bg-white rounded-2xl border border-sand-300 divide-y divide-sand-200 overflow-hidden">
        {/* WhatsApp aparte del fijo: el número publicado de la tienda no lo tiene */}
        {whatsAppUrl && (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 hover:bg-sand-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-success-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-sand-600">
                {t("whatsapp")}
              </p>
              <p className="font-medium text-ink">
                {formatVenezuelanNumber(whatsAppNumber)}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-sand-500 shrink-0" />
          </a>
        )}

        {storeInfo.phone && (
          <PhoneLink
            phone={storeInfo.phone}
            className="flex items-center gap-4 p-5 hover:bg-sand-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Phone className="w-5 h-5 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-sand-600">Teléfono</p>
              <p className="font-medium text-ink">{storeInfo.phone}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-sand-500 shrink-0" />
          </PhoneLink>
        )}

        {storeInfo.email && (
          <a
            href={`mailto:${storeInfo.email}`}
            className="flex items-center gap-4 p-5 hover:bg-sand-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Mail className="w-5 h-5 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-sand-600">Correo</p>
              <p className="font-medium text-ink truncate">{storeInfo.email}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-sand-500 shrink-0" />
          </a>
        )}

        {fullAddress && (
          <div className="flex items-start gap-4 p-5">
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-accent-500" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-sand-600">Dirección</p>
              <p className="font-medium text-ink text-sm leading-snug">
                {fullAddress}
              </p>
            </div>
          </div>
        )}

        {storeInfo.hours && (
          <div className="flex items-start gap-4 p-5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-sand-600">Horario</p>
              {storeInfo.hours.split("·").map((line) => (
                <p key={line} className="text-sm text-ink">
                  {line.trim()}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Iconos de cada red, para pintar sólo las que tienen perfil configurado. */
const REDES: Record<RedSocial, { Icono: typeof Facebook; etiqueta: string; borde: string; fondo: string; color: string }> = {
  facebook: { Icono: Facebook, etiqueta: "Facebook", borde: "hover:border-brand-300", fondo: "hover:bg-brand-50", color: "text-brand-600" },
  instagram: { Icono: Instagram, etiqueta: "Instagram", borde: "hover:border-accent-300", fondo: "hover:bg-accent-50", color: "text-accent-600" },
  twitter: { Icono: Twitter, etiqueta: "Twitter / X", borde: "hover:border-brand-300", fondo: "hover:bg-brand-50", color: "text-brand-500" },
};

/** Redes de la tienda; si no hay ninguna configurada, no se pinta la sección. */
function SocialSection() {
  const redes = perfilesSociales();
  if (redes.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sand-600">
        Síguenos
      </h2>
      <div className="flex gap-3">
        {redes.map(({ red, url }) => {
          const { Icono, etiqueta, borde, fondo, color } = REDES[red];
          return (
            <a
              key={red}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 flex min-h-11 items-center justify-center gap-2 py-3 bg-white rounded-2xl border border-sand-300 ${borde} ${fondo} transition-all`}
              aria-label={etiqueta}
            >
              <Icono className={`w-5 h-5 ${color}`} />
            </a>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Atajo a contacto y a las páginas legales.
 *
 * Estos enlaces sólo existían en el pie, que no se muestra en las pantallas a
 * pantalla completa: desde el listado de productos o el checkout, llegar a los
 * términos obligaba a volver al inicio y bajar el pie entero. "Cuenta" está en
 * la barra inferior desde cualquier pantalla, así que es el camino corto.
 */
function LegalSection() {
  const t = useTranslations("myAccount");
  const tFooter = useTranslations("footer");

  const enlaces = [
    { href: "/contact", texto: tFooter("contact") },
    { href: "/terms", texto: tFooter("terms") },
    { href: "/privacy", texto: tFooter("privacy") },
  ];

  return (
    <section>
      <h2 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sand-600">
        {t("helpAndInfo")}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-sand-300 divide-y divide-sand-200 bg-white">
        {enlaces.map(({ href, texto }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-11 items-center gap-3 px-5 py-3.5 text-sm text-sand-700 transition-colors hover:bg-sand-50"
          >
            <span className="flex-1">{texto}</span>
            <ChevronRight className="w-4 h-4 shrink-0 text-sand-500" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function GuestView() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-sand-100 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-sand-500" />
        </div>
        <h1 className="font-display text-xl font-bold text-ink">Mi Cuenta</h1>
        <p className="text-sm text-sand-600 mt-1">
          Inicia sesión para ver tus pedidos y más
        </p>
      </div>

      {/* Acciones de autenticación */}
      <div className="space-y-3">
        <Link
          href="/login"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-700"
        >
          <LogIn className="w-5 h-5" />
          Iniciar sesión
        </Link>
        <Link
          href="/register"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-ink bg-white py-3.5 text-sm font-bold text-ink transition-colors hover:bg-sand-100"
        >
          <UserPlus className="w-5 h-5" />
          Crear cuenta
        </Link>
      </div>

      {/* Contacto */}
      <ContactSection />

      {/* Redes sociales */}
      <SocialSection />

      {/* Contacto y páginas legales */}
      <LegalSection />

    </div>
  );
}

function AuthenticatedView({ user, onLogout }: { user: NonNullable<ReturnType<typeof useAuth>["user"]>; onLogout: () => void }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Header de usuario */}
      <div className="flex items-center gap-4 bg-white rounded-2xl border border-sand-300 p-4">
        <div className="flex h-12 w-12 flex-none select-none items-center justify-center rounded-full bg-brand-600 text-lg font-extrabold text-white">
          {user.firstName?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="font-display text-base font-bold leading-tight text-ink">
            {user.firstName} {user.lastName}
          </p>
          <p className="mt-0.5 text-[12px] font-medium text-sand-600">{user.email}</p>
        </div>
      </div>

      {/* Mis pedidos */}
      <section>
        <h2 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sand-600">
          Pedidos
        </h2>
        <Link
          href="/mi-cuenta/ordenes"
          className="flex items-center gap-4 bg-white rounded-2xl border border-sand-300 p-4 transition-colors hover:border-brand-300"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-brand-600" />
          </div>
          <span className="flex-1 font-medium text-ink">
            Mis pedidos
          </span>
          <ChevronRight className="w-5 h-5 text-sand-500" />
        </Link>
      </section>

      {/* Contacto */}
      <ContactSection />

      {/* Contacto y páginas legales */}
      <LegalSection />

      {/* Cerrar sesión */}
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-4 bg-white rounded-2xl border border-sand-300 p-4 hover:border-danger-100 hover:bg-danger-50 transition-all text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center">
          <LogOut className="w-5 h-5 text-danger-500" />
        </div>
        <span className="flex-1 font-medium text-danger-600">
          Cerrar sesión
        </span>
      </button>
    </div>
  );
}

export default function MiCuentaPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!user) {
    return <GuestView />;
  }

  return <AuthenticatedView user={user} onLogout={handleLogout} />;
}
