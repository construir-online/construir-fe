"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { authService } from "@/services/auth";
import { verifyEmailErrorKey } from "@/lib/email-verification-errors";
import {
  formatearEspera,
  useResendVerification,
} from "@/hooks/useResendVerification";

/**
 * `verified` es "acabas de activarla"; `already`, "ya estaba activa". Los dos
 * son un final feliz — la diferencia es sólo el texto. Antes el segundo caso
 * caía en `invalid` y le decía a quien hizo doble clic en el correo que su
 * enlace no servía.
 */
type Estado =
  | "loading"
  | "verified"
  | "already"
  | "expired"
  | "invalid"
  | "network"
  | "unexpected";

const ESTADOS_OK: Estado[] = ["verified", "already"];
/** Estados en los que pedir otro enlace es lo que desencalla al cliente. */
const ESTADOS_REENVIABLES: Estado[] = ["expired", "invalid"];

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const t = useTranslations("auth");
  // Sin token no hay nada que consultar, así que el estado arranca resuelto en
  // vez de pasar por "cargando" y corregirse dentro del efecto: ese rebote
  // pintaba un spinner que nunca iba a ir a ningún lado.
  const [estado, setEstado] = useState<Estado>(token ? "loading" : "invalid");
  const [correo, setCorreo] = useState("");
  const { reenviar, enviando, enviado, espera } = useResendVerification(correo);
  const llamado = useRef(false);

  useEffect(() => {
    if (!token || llamado.current) return;
    llamado.current = true;

    authService
      .verifyEmail(token)
      .then((res) => setEstado(res.alreadyVerified ? "already" : "verified"))
      // Se clasifica por el `code` que manda la API, no buscando trozos del
      // texto del mensaje: ese texto puede reescribirse sin avisar, y venía en
      // español, así que el día que viajara en inglés todo caía al genérico.
      .catch((err: unknown) => setEstado(verifyEmailErrorKey(err)));
  }, [token]);

  const esOk = ESTADOS_OK.includes(estado);
  const puedeReenviar = ESTADOS_REENVIABLES.includes(estado);

  return (
    <div className="min-h-screen bg-sand-50 flex items-start justify-center px-4 pt-10 pb-12 sm:items-center sm:py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-sand-300 bg-white p-8 text-center space-y-6">
          {estado === "loading" && (
            <>
              <div className="mx-auto w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center">
                <svg className="animate-spin w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <div>
                <h1 className="font-display text-[20px] font-bold tracking-tight text-ink">
                  {t("verifyEmail.loadingTitle")}
                </h1>
                <p className="text-sm text-sand-600 mt-1">{t("verifyEmail.loadingBody")}</p>
              </div>
            </>
          )}

          {esOk && (
            <>
              <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h1 className="font-display text-[23px] font-bold tracking-tight text-ink">
                  {t(estado === "already" ? "verifyEmail.alreadyTitle" : "verifyEmail.successTitle")}
                </h1>
                <p className="text-sm text-sand-600 mt-2">
                  {t(estado === "already" ? "verifyEmail.alreadyBody" : "verifyEmail.successBody")}
                </p>
              </div>
              <Link
                href="/login"
                className="flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700"
              >
                {t("login")}
              </Link>
            </>
          )}

          {!esOk && estado !== "loading" && (
            <>
              <div className="mx-auto w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="font-display text-[23px] font-bold tracking-tight text-ink">
                  {t(`verifyEmail.${estado}Title`)}
                </h1>
                <p className="text-sm text-sand-600 mt-2">{t(`verifyEmail.${estado}Body`)}</p>
              </div>

              {/* Un enlace vencido o inservible sólo se arregla con otro, y
                  para mandarlo hace falta el correo: el token que traía la URL
                  no sirve para identificar la cuenta. */}
              {puedeReenviar && (
                <div className="space-y-3 text-left">
                  {enviado && (
                    <p role="status" className="rounded-lg bg-success-50 border border-success-100 px-4 py-3 text-sm text-success-700">
                      {t("verificationSent")}
                    </p>
                  )}
                  <label htmlFor="resend-email" className="mb-1.5 block text-[11.5px] font-bold text-sand-700">
                    {t("email")}
                  </label>
                  <input
                    id="resend-email"
                    type="email"
                    autoComplete="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className="block min-h-11 w-full rounded-xl border border-sand-300 bg-sand-100 px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder-sand-600 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                  />
                  <button
                    type="button"
                    onClick={reenviar}
                    disabled={enviando || !correo || espera > 0}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {enviando
                      ? t("resending")
                      : espera > 0
                        ? t("resendAvailableIn", { tiempo: formatearEspera(espera) })
                        : t("resendVerification")}
                  </button>
                </div>
              )}

              <Link href="/login" className="inline-block text-sm font-semibold text-brand-600 hover:underline">
                {t("backToLogin")}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
