"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth";

type Status = "loading" | "success" | "expired" | "invalid" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (!token) {
      setStatus("invalid");
      return;
    }

    authService
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("expirado") || msg.includes("expired")) {
          setStatus("expired");
        } else if (msg.includes("inválido") || msg.includes("invalid")) {
          setStatus("invalid");
        } else {
          setStatus("error");
        }
      });
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) return;
    setResendLoading(true);
    setResendError("");
    try {
      await authService.resendVerification(resendEmail);
      setResendSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("ya fue verificado") || msg.includes("already verified")) {
        setResendError("Este correo ya fue verificado. Puedes iniciar sesión.");
      } else {
        setResendSuccess(true); // API always returns 200
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
          {status === "loading" && (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Verificando tu cuenta...</h2>
                <p className="text-sm text-gray-500 mt-1">Por favor espera un momento.</p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">¡Cuenta activada!</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Tu correo fue verificado exitosamente. Ya puedes iniciar sesión.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors"
              >
                Iniciar sesión
              </Link>
            </>
          )}

          {(status === "expired" || status === "invalid" || status === "error") && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {status === "expired" ? "Enlace expirado" : "Enlace inválido"}
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  {status === "expired"
                    ? "El enlace de verificación ha expirado. Solicita uno nuevo ingresando tu correo."
                    : "El enlace no es válido o ya fue utilizado."}
                </p>
              </div>

              {status === "expired" && (
                <div className="space-y-3 text-left">
                  {resendSuccess ? (
                    <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3">
                      <p className="text-sm text-green-700">
                        Si el correo existe y no está verificado, recibirás un nuevo enlace.
                      </p>
                    </div>
                  ) : (
                    <>
                      {resendError && (
                        <p className="text-sm text-red-600 text-center">{resendError}</p>
                      )}
                      <input
                        type="email"
                        required
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                      <button
                        onClick={handleResend}
                        disabled={resendLoading || !resendEmail}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        {resendLoading ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Enviando...
                          </>
                        ) : (
                          "Reenviar enlace"
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}

              <Link href="/login" className="inline-block text-sm text-blue-600 hover:underline">
                Volver al inicio de sesión
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
