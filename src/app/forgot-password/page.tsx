"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { authService } from "@/services/auth";
import { resetErrorKey } from "@/lib/password-reset-errors";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(t(`resetErrors.${resetErrorKey(err)}`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 flex items-start justify-center px-4 pt-10 pb-12 sm:items-center sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">{t("forgotTitle")}</h1>
          <p className="mt-2 text-sm text-sand-600">
            {t("rememberedPassword")}{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-500 transition-colors">
              {t("loginHere")}
            </Link>
          </p>
        </div>

        <div className="rounded-2xl border border-sand-300 bg-white p-6 sm:p-8">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-display text-base font-bold text-ink">{t("checkEmailTitle")}</p>
                <p className="mt-1 text-sm text-sand-600">
                  {t("forgotSentBody")}
                </p>
              </div>
              <Link
                href="/login"
                className="inline-block mt-2 text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors"
              >
                {t("backToLogin")}
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-lg bg-danger-50 border border-danger-100 px-4 py-3">
                  <svg className="w-5 h-5 text-danger-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-danger-700">{error}</p>
                </div>
              )}

              <p className="text-sm text-sand-700 mb-5">
                {t("forgotIntro")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-[11.5px] font-bold text-sand-700">
                    {t("email")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className="block min-h-11 w-full rounded-xl border border-sand-300 bg-sand-100 px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder-sand-600 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                  />
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
                      {t("sending")}
                    </>
                  ) : (
                    t("forgotSubmit")
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
