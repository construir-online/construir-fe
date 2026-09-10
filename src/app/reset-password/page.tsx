"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { authService } from "@/services/auth";
import { resetErrorKey } from "@/lib/password-reset-errors";

function ResetPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationError("");

    if (newPassword !== confirmPassword) {
      setValidationError(t("fieldErrors.passwordsMismatch"));
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      router.push("/login?reset=success");
    } catch (err: unknown) {
      // El `code` de la API distingue "el enlace ya no sirve" de "la
      // contraseña es corta". Antes buscaba "400" dentro del mensaje, así que
      // a quien escribía cinco letras lo mandaba a pedir un enlace nuevo.
      setError(resetErrorKey(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-sand-700">{t("resetErrors.tokenInvalid")}</p>
        <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors">
          {t("requestNewLink")}
        </Link>
      </div>
    );
  }

  if (error === "tokenInvalid") {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="font-display text-base font-bold text-ink">{t("resetInvalidTitle")}</p>
          <p className="mt-1 text-sm text-sand-600">
            {t("resetErrors.tokenInvalid")}
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-block text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors"
        >
          {t("requestNewLink")}
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && error !== "tokenInvalid" && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-danger-50 border border-danger-100 px-4 py-3">
          <svg className="w-5 h-5 text-danger-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-danger-700">{t(`resetErrors.${error}`)}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="newPassword" className="mb-1.5 block text-[11.5px] font-bold text-sand-700">
            {t("newPassword")}
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("passwordMinPlaceholder")}
              className="block pr-11 min-h-11 w-full rounded-xl border border-sand-300 bg-sand-100 px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder-sand-600 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-sand-500 hover:text-sand-700"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-[11.5px] font-bold text-sand-700">
            {t("confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("confirmPasswordPlaceholder")}
            className={`block min-h-11 w-full rounded-xl border bg-sand-100 px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder-sand-600 focus:bg-white focus:outline-none focus:ring-2 ${
              validationError
                ? "border-danger-500 bg-danger-50 focus:border-danger-500 focus:ring-danger-500/25"
                : "border-sand-300 focus:border-brand-500 focus:ring-brand-500/25"
            }`}
          />
          {validationError && (
            <p className="mt-1 text-xs text-danger-600">{validationError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t("resetting")}
            </>
          ) : (
            t("resetSubmit")
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  return (
    <div className="min-h-screen bg-sand-50 flex items-start justify-center px-4 pt-10 pb-12 sm:items-center sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">{t("resetTitle")}</h1>
          <p className="mt-2 text-sm text-sand-600">
            {t("resetIntro")}
          </p>
        </div>

        <div className="rounded-2xl border border-sand-300 bg-white p-6 sm:p-8">
          <Suspense fallback={<div className="text-center text-sm text-sand-600">{t("loading")}</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
