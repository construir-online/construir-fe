"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function ContactSection() {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1 mb-2">
        Contacto
      </h2>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700 overflow-hidden">
        <a
          href="tel:+582856320178"
          className="flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 dark:text-gray-500">Teléfono</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">+58 285 632 0178</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        </a>

        <a
          href="mailto:info@constru-ir.com"
          className="flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 dark:text-gray-500">Correo</p>
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
              info@constru-ir.com
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        </a>

        <div className="flex items-start gap-4 p-5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-orange-500 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Dirección</p>
            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-snug">
              Av. Principal, Local #01, Maturín, Venezuela
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Horario</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">Lun – Vie: 8:00 AM – 6:00 PM</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">Sáb: 8:00 AM – 2:00 PM</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Dom: Cerrado</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function GuestView() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mi Cuenta</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Inicia sesión para ver tus pedidos y más
        </p>
      </div>

      {/* Acciones de autenticación */}
      <div className="space-y-3">
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-colors"
        >
          <LogIn className="w-5 h-5" />
          Iniciar sesión
        </Link>
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-2xl font-semibold border border-gray-200 dark:border-slate-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Crear cuenta
        </Link>
      </div>

      {/* Contacto */}
      <ContactSection />

      {/* Redes sociales */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1 mb-3">
          Síguenos
        </h2>
        <div className="flex gap-3">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5 text-blue-600" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5 text-pink-600" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all"
            aria-label="Twitter / X"
          >
            <Twitter className="w-5 h-5 text-sky-500" />
          </a>
        </div>
      </section>
    </div>
  );
}

function AuthenticatedView({ user, onLogout }: { user: NonNullable<ReturnType<typeof useAuth>["user"]>; onLogout: () => void }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Header de usuario */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold select-none">
          {user.firstName?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
      </div>

      {/* Mis pedidos */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1 mb-2">
          Pedidos
        </h2>
        <Link
          href="/mi-cuenta/ordenes"
          className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
            Mis pedidos
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </section>

      {/* Contacto */}
      <ContactSection />

      {/* Cerrar sesión */}
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
          <LogOut className="w-5 h-5 text-red-500 dark:text-red-400" />
        </div>
        <span className="flex-1 font-medium text-red-600 dark:text-red-400">
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
