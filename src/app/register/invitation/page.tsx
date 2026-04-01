"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { invitationsService } from "@/services/invitations";
import type { InvitationTokenInfo } from "@/types";

type PageState = "loading" | "form" | "invalid" | "used" | "expired" | "success";

export default function InvitacionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [pageState, setPageState] = useState<PageState>("loading");
  const [tokenInfo, setTokenInfo] = useState<InvitationTokenInfo | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setPageState("invalid");
      return;
    }
    invitationsService.validateToken(token).then((result) => {
      if (result.status === "ok") {
        setTokenInfo(result.data);
        setFirstName(result.data.firstName ?? "");
        setLastName(result.data.lastName ?? "");
        setPageState("form");
      } else {
        setPageState(result.status); // 'invalid' | 'used' | 'expired'
      }
    });
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await invitationsService.completeRegistration({ token, firstName, lastName, password });
      router.push("/login?invited=1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al completar el registro");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-500">Validando enlace...</p>
        </div>
      </div>
    );
  }

  // ── Error states ──────────────────────────────────────────────────────────

  const errorConfig: Record<"invalid" | "used" | "expired", { icon: string; title: string; desc: string }> = {
    invalid: {
      icon: "❌",
      title: "Enlace inválido",
      desc: "Este enlace de invitación no es válido. Verifica que lo hayas copiado correctamente.",
    },
    used: {
      icon: "✅",
      title: "Enlace ya utilizado",
      desc: "Este enlace ya fue usado para crear una cuenta. Si olvidaste tu contraseña, puedes recuperarla desde el login.",
    },
    expired: {
      icon: "⏰",
      title: "Enlace expirado",
      desc: "Este enlace de invitación ha vencido. Solicita una nueva invitación al administrador.",
    },
  };

  if (pageState in errorConfig) {
    const cfg = errorConfig[pageState as "invalid" | "used" | "expired"];
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center space-y-4">
          <div className="text-5xl">{cfg.icon}</div>
          <h1 className="text-xl font-bold text-gray-900">{cfg.title}</h1>
          <p className="text-gray-600 text-sm">{cfg.desc}</p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Image src="/construir-logo.png" alt="Construir" width={140} height={40} className="mx-auto" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Completa tu registro</h2>
          <p className="mt-1 text-sm text-gray-500">
            Has sido invitado a crear una cuenta.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 space-y-5">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
              {tokenInfo?.email}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">Mínimo 6 caracteres</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors text-sm"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
