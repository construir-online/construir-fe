"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import AuthShell from "@/components/auth/AuthShell";
import { registerErrorKey } from "@/lib/register-errors";
import { digitosCedulaVE, normalizarTelefonoMovilVE } from "@/lib/venezuela";
import { IdentificationType } from "@/types";

/** El `select` de tipo. La etiqueta larga se traduce; la letra no. */
const ID_TYPES = [
  { value: IdentificationType.V, labelKey: "idTypeV" },
  { value: IdentificationType.E, labelKey: "idTypeE" },
  { value: IdentificationType.J, labelKey: "idTypeJ" },
  { value: IdentificationType.G, labelKey: "idTypeG" },
  { value: IdentificationType.P, labelKey: "idTypeP" },
] as const;

const INPUT_CLASS =
  "block min-h-11 w-full rounded-xl border border-sand-300 bg-sand-100 px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder-sand-600 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25";
const INPUT_ERROR_CLASS =
  "border-danger-500 bg-danger-50 focus:border-danger-500 focus:ring-danger-500/25";
const LABEL_CLASS = "mb-1.5 block text-[11.5px] font-bold text-sand-700";

/** Clave de `auth.fieldErrors` por campo; ausente = el campo está bien. */
type FieldErrors = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "email"
    | "password"
    | "confirmPassword"
    | "phone"
    | "identificationNumber",
    string
  >
>;

export default function RegisterPage() {
  const t = useTranslations("auth");
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    identificationType: IdentificationType.V as IdentificationType,
    identificationNumber: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // El aviso desaparece en cuanto el cliente empieza a corregir: dejarlo
    // puesto mientras escribe da la impresión de que sigue estando mal.
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  /**
   * Revisa el formulario antes de enviarlo.
   *
   * Es una cortesía —avisar sin gastar un viaje al servidor—, no la autoridad:
   * la regla que manda es la del backend, que valida lo mismo porque a esa API
   * se le puede hablar sin pasar por este formulario.
   */
  const validar = (): FieldErrors => {
    const errores: FieldErrors = {};

    if (!formData.firstName.trim()) errores.firstName = "required";
    if (!formData.lastName.trim()) errores.lastName = "required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) {
      errores.email = "email";
    }
    if (formData.password.length < 6) errores.password = "password";
    if (formData.password !== formData.confirmPassword) {
      errores.confirmPassword = "passwordsMismatch";
    }
    if (!normalizarTelefonoMovilVE(formData.phone)) errores.phone = "phone";

    // La forma de cédula sólo aplica a V y E. Un RIF (J, G) o un pasaporte (P)
    // tienen otras reglas que no se definen acá: exigirles la de la cédula
    // dejaría fuera a las empresas.
    const esCedula =
      formData.identificationType === IdentificationType.V ||
      formData.identificationType === IdentificationType.E;
    if (esCedula) {
      if (
        !digitosCedulaVE(
          formData.identificationType,
          formData.identificationNumber,
        )
      ) {
        errores.identificationNumber = "identification";
      }
    } else if (!formData.identificationNumber.trim()) {
      errores.identificationNumber = "required";
    }

    return errores;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const errores = validar();
    setFieldErrors(errores);
    if (Object.keys(errores).length > 0) return;

    setLoading(true);
    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        // Se envía normalizado: el mismo número escrito "0412-1234567",
        // "+58 412 1234567" o "04121234567" tiene que quedar igual guardado,
        // o buscar al cliente por su teléfono no encuentra nada.
        phone: normalizarTelefonoMovilVE(formData.phone) ?? formData.phone,
        identificationType: formData.identificationType,
        identificationNumber:
          digitosCedulaVE(
            formData.identificationType,
            formData.identificationNumber,
          ) ?? formData.identificationNumber.trim(),
      });
      setSuccess(true);
    } catch (err: unknown) {
      // Nunca se muestra `err.message`: es el texto del backend, en inglés y
      // con redacción de log ("Email already exists", "phone must be a
      // Venezuelan mobile number"), o el "Failed to fetch" del navegador
      // cuando el servidor no responde. Se clasifica el fallo y se pinta el
      // texto del idioma que el cliente eligió.
      setError(t(`registerErrors.${registerErrorKey(err)}`));
    } finally {
      setLoading(false);
    }
  };

  const errorDe = (campo: keyof FieldErrors) =>
    fieldErrors[campo] ? t(`fieldErrors.${fieldErrors[campo]}`) : null;

  const claseDe = (campo: keyof FieldErrors) =>
    `${INPUT_CLASS} ${fieldErrors[campo] ? INPUT_ERROR_CLASS : ""}`;

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="rounded-2xl border border-sand-300 bg-white p-8 space-y-5">
            <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ink">{t("checkEmailTitle")}</h2>
              <p className="mt-2 text-sand-600 text-sm leading-relaxed">
                {t("checkEmailBody", { email: formData.email })}
              </p>
            </div>
            <p className="text-xs text-sand-500">
              {t.rich("checkEmailSpam", {
                link: () => (
                  <Link href="/login" className="text-brand-600 hover:underline">
                    {t("checkEmailSpamLink")}
                  </Link>
                ),
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthShell active="register">
      <div>
          {error && (
            <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg bg-danger-50 border border-danger-100 px-4 py-3">
              <svg className="w-5 h-5 text-danger-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={LABEL_CLASS}>
                  {t("firstName")} <span className="text-danger-500">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder={t("firstNamePlaceholder")}
                  aria-invalid={!!fieldErrors.firstName}
                  className={claseDe("firstName")}
                />
                {errorDe("firstName") && (
                  <p className="mt-1 text-xs text-danger-600">{errorDe("firstName")}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className={LABEL_CLASS}>
                  {t("lastName")} <span className="text-danger-500">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder={t("lastNamePlaceholder")}
                  aria-invalid={!!fieldErrors.lastName}
                  className={claseDe("lastName")}
                />
                {errorDe("lastName") && (
                  <p className="mt-1 text-xs text-danger-600">{errorDe("lastName")}</p>
                )}
              </div>
            </div>

            {/* Identificación */}
            <div>
              <label htmlFor="identificationNumber" className={LABEL_CLASS}>
                {t("identification")} <span className="text-danger-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  name="identificationType"
                  aria-label={t("identification")}
                  value={formData.identificationType}
                  onChange={handleChange}
                  className={`w-24 shrink-0 ${INPUT_CLASS}`}
                >
                  {ID_TYPES.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.value}
                    </option>
                  ))}
                </select>
                <input
                  id="identificationNumber"
                  name="identificationNumber"
                  type="text"
                  // El teclado numérico sólo sirve para lo que es sólo dígitos.
                  // Un pasaporte lleva letras, y con `numeric` fijo el móvil no
                  // las ofrecía: fricción justo en el caso que sí se acepta.
                  inputMode={
                    formData.identificationType === IdentificationType.P
                      ? "text"
                      : "numeric"
                  }
                  value={formData.identificationNumber}
                  onChange={handleChange}
                  placeholder={t("identificationPlaceholder")}
                  aria-invalid={!!fieldErrors.identificationNumber}
                  className={`min-w-0 flex-1 ${claseDe("identificationNumber")}`}
                />
              </div>
              {errorDe("identificationNumber") ? (
                <p className="mt-1 text-xs text-danger-600">
                  {errorDe("identificationNumber")}
                </p>
              ) : (
                <p className="mt-1 text-xs text-sand-500">
                  {t(
                    ID_TYPES.find(
                      (tipo) => tipo.value === formData.identificationType,
                    )?.labelKey ?? "idTypeV",
                  )}
                </p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className={LABEL_CLASS}>
                {t("phone")} <span className="text-danger-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t("phonePlaceholder")}
                aria-invalid={!!fieldErrors.phone}
                className={claseDe("phone")}
              />
              {errorDe("phone") ? (
                <p className="mt-1 text-xs text-danger-600">{errorDe("phone")}</p>
              ) : (
                <p className="mt-1 text-xs text-sand-500">{t("phoneHelp")}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={LABEL_CLASS}>
                {t("email")} <span className="text-danger-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t("emailPlaceholder")}
                aria-invalid={!!fieldErrors.email}
                className={claseDe("email")}
              />
              {errorDe("email") && (
                <p className="mt-1 text-xs text-danger-600">{errorDe("email")}</p>
              )}
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className={LABEL_CLASS}>
                  {t("password")} <span className="text-danger-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t("passwordMinPlaceholder")}
                    aria-invalid={!!fieldErrors.password}
                    className={`pr-11 ${claseDe("password")}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
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
                {errorDe("password") && (
                  <p className="mt-1 text-xs text-danger-600">{errorDe("password")}</p>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className={LABEL_CLASS}>
                  {t("confirmPassword")} <span className="text-danger-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={t("confirmPasswordPlaceholder")}
                    aria-invalid={!!fieldErrors.confirmPassword}
                    className={`pr-11 ${claseDe("confirmPassword")}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? t("hidePassword") : t("showPassword")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-sand-500 hover:text-sand-700"
                    tabIndex={-1}
                  >
                    {showConfirm ? (
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
                {errorDe("confirmPassword") && (
                  <p className="mt-1 text-xs text-danger-600">
                    {errorDe("confirmPassword")}
                  </p>
                )}
              </div>
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
                  {t("registering")}
                </>
              ) : (
                t("registerTitle")
              )}
            </button>

            <p className="text-center text-xs text-sand-500">
              {t("termsNotice")}{" "}
              <span className="text-sand-600 font-medium">{t("termsLink")}</span>
            </p>
          </form>
      </div>
    </AuthShell>
  );
}
