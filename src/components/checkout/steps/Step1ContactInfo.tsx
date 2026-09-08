'use client';

import { Check, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { CheckoutData } from '@/types';
import { IdentificationType } from '@/types';
import { esTelefonoMovilVE } from '@/lib/venezuela';

/** El paso de contacto son dos pantallas: primero la cédula, luego el resto de datos. */
export type ContactSubStep = 'identification' | 'details';

const FIELD_CLASS =
  'min-h-11 w-full rounded-xl border border-sand-300 bg-sand-100 px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder-sand-600 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25';
const LABEL_CLASS = 'mb-1.5 block text-[11.5px] font-bold text-sand-700';

interface Step1ContactInfoProps {
  register: UseFormRegister<CheckoutData>;
  errors: FieldErrors<CheckoutData>;
  isAuthenticated: boolean;
  subStep: ContactSubStep;
  identificationType?: IdentificationType;
  identificationNumber?: string;
  onIdentificationChange: (type: IdentificationType, number: string) => void;
  onIdentificationBlur?: () => void;
  isSearching?: boolean;
  /** Identificación con la que se autocompletó el formulario, p. ej. "V-18.402.117". */
  autofilledIdentification?: string | null;
  /** Pedidos previos del invitado encontrado, para dar contexto en el aviso. */
  autofilledOrdersCount?: number;
  /** Vuelve a la pantalla de identificación desde el aviso de autocompletado. */
  onChangeIdentification?: () => void;
  createAccount: boolean;
  /**
   * El borrador restaurado quería crear cuenta pero la contraseña no se
   * guarda: hay que decir por qué el campo está vacío en vez de dejar que el
   * cliente descubra el problema al enviar.
   */
  pedirContrasenaDeNuevo?: boolean;
}

export default function Step1ContactInfo({
  register,
  errors,
  isAuthenticated,
  subStep,
  identificationType,
  identificationNumber,
  onIdentificationChange,
  onIdentificationBlur,
  isSearching,
  autofilledIdentification,
  autofilledOrdersCount,
  onChangeIdentification,
  createAccount,
  pedirContrasenaDeNuevo,
}: Step1ContactInfoProps) {
  const t = useTranslations('checkout');

  const campoTelefono = register('phone', {
    required: true,
    // Misma regla que el registro (`@/lib/venezuela`), no una copia con otro
    // criterio: el teléfono es por donde el despachador coordina la entrega, y
    // hasta hace poco se aceptaba cualquier cosa escrita ahí.
    validate: esTelefonoMovilVE,
  });

  // ── Pantalla 1: identificación ──
  if (subStep === 'identification') {
    return (
      <div className="flex flex-col gap-3.5">
        <h2 className="font-display text-[21px] font-bold leading-[1.2] text-ink">
          {t('identificationHeadline', {
            defaultValue: 'Identifícate: cédula o RIF y teléfono',
          })}
        </h2>
        <p className="text-[13.5px] font-medium leading-[1.5] text-sand-700">
          {t('identificationDescription', {
            defaultValue:
              'Si ya compraste con nosotros, completamos el resto de tus datos automáticamente.',
          })}
        </p>

        <div className="mt-1.5 grid grid-cols-[104px_1fr] gap-2.5">
          <div>
            <label className={LABEL_CLASS}>
              {t('identificationType', { defaultValue: 'Tipo · V / E / J' })}
            </label>
            <select
              value={identificationType || IdentificationType.V}
              onChange={(e) =>
                onIdentificationChange(
                  e.target.value as IdentificationType,
                  identificationNumber || '',
                )
              }
              className={FIELD_CLASS}
            >
              <option value={IdentificationType.V}>V</option>
              <option value={IdentificationType.E}>E</option>
              <option value={IdentificationType.J}>J</option>
              <option value={IdentificationType.G}>G</option>
              <option value={IdentificationType.P}>P</option>
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>
              {t('identificationNumber', { defaultValue: 'Número' })}
            </label>
            <input
              type="text"
              inputMode="numeric"
              // El teclado móvil rotula la tecla como "siguiente" en vez de un
              // retorno genérico: Enter avanza de paso, así que la tecla dice
              // lo que hace.
              enterKeyHint="next"
              value={identificationNumber || ''}
              onChange={(e) =>
                onIdentificationChange(
                  identificationType || IdentificationType.V,
                  e.target.value,
                )
              }
              onBlur={onIdentificationBlur}
              placeholder={t('identificationPlaceholder', { defaultValue: 'Ej: 12345678' })}
              className={FIELD_CLASS}
            />
          </div>
        </div>

        {/*
          El teléfono se pide acá, junto a la cédula, porque es el segundo dato
          con el que el backend decide si entrega la ficha del cliente. Antes
          bastaba la cédula, y como las venezolanas son secuenciales cualquiera
          podía recorrerlas y bajarse los datos de todos los compradores.

          No le cuesta nada al cliente que vuelve: se lo sabe de memoria y lo
          iba a escribir igual en la pantalla siguiente, que es este mismo
          campo del formulario.
        */}
        <div>
          <label className={LABEL_CLASS}>
            {t('phone')} *
          </label>
          <input
            type="tel"
            inputMode="tel"
            enterKeyHint="next"
            {...campoTelefono}
            // Se encadena en vez de reemplazar: el `onBlur` de react-hook-form
            // es el que marca el campo como tocado y dispara su validación.
            onBlur={(e) => {
              void campoTelefono.onBlur(e);
              onIdentificationBlur?.();
            }}
            placeholder="0412-1234567"
            className={FIELD_CLASS}
          />
          {errors.phone ? (
            <span className="text-danger-500 text-xs mt-1">
              {errors.phone.type === 'required'
                ? t('errors.fieldRequired', { defaultValue: 'Este campo es requerido' })
                : t('errors.phoneInvalid', {
                    defaultValue:
                      'Escribe un móvil venezolano: 0412, 0414, 0416, 0424 o 0426 + 7 dígitos.',
                  })}
            </span>
          ) : (
            <p className="mt-1.5 text-[11px] font-medium text-sand-600">
              {t('identificationPhoneHelp', {
                defaultValue:
                  'Con tu cédula y tu teléfono reconocemos tus compras anteriores.',
              })}
            </p>
          )}
        </div>

        {isSearching && (
          <p className="flex items-center gap-2 text-xs font-medium text-sand-600">
            <span className="h-3.5 w-3.5 flex-none animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            {t('searchingByIdentification', {
              defaultValue: 'Buscando tus datos por cédula…',
            })}
          </p>
        )}

        <div className="mt-2 flex items-start gap-2.5 rounded-xl bg-sand-100 p-3">
          <Info className="mt-px h-4 w-4 flex-none text-sand-600" strokeWidth={2} />
          <p className="text-xs font-medium leading-[1.5] text-sand-700">
            {t('identificationPrivacyNote', {
              defaultValue:
                'Usamos tu cédula solo para identificar tu pedido y emitir el recibo.',
            })}
          </p>
        </div>
      </div>
    );
  }

  // ── Pantalla 2: resto de los datos ──
  return (
    <div className="flex flex-col gap-3.5">
      {autofilledIdentification && (
        <div className="flex items-center gap-2.5 rounded-xl border border-success-200 bg-success-50 px-3.5 py-3">
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-success-600 text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold text-ink">
              {t('autofilledTitle', { defaultValue: 'Datos autocompletados' })}
            </p>
            <p className="mt-0.5 truncate text-[11.5px] font-medium text-sand-700">
              {autofilledIdentification}
              {autofilledOrdersCount
                ? ` · ${autofilledOrdersCount} ${
                    autofilledOrdersCount === 1 ? 'pedido anterior' : 'pedidos anteriores'
                  }`
                : ''}
            </p>
          </div>
          {onChangeIdentification && (
            <button
              type="button"
              onClick={onChangeIdentification}
              className="flex-none rounded-lg px-1 py-1 text-[12.5px] font-bold text-brand-600 hover:underline"
            >
              {t('change', { defaultValue: 'Cambiar' })}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <div>
          <label className={LABEL_CLASS}>{t('firstName')} *</label>
          <input type="text" {...register('firstName', { required: true })} className={FIELD_CLASS} />
          {errors.firstName && (
            <span className="text-danger-500 text-xs mt-1">
              {t('errors.fieldRequired', { defaultValue: 'Este campo es requerido' })}
            </span>
          )}
        </div>

        <div>
          <label className={LABEL_CLASS}>{t('lastName')} *</label>
          <input type="text" {...register('lastName', { required: true })} className={FIELD_CLASS} />
          {errors.lastName && (
            <span className="text-danger-500 text-xs mt-1">
              {t('errors.fieldRequired', { defaultValue: 'Este campo es requerido' })}
            </span>
          )}
        </div>

        <div>
          <label className={LABEL_CLASS}>{t('phone')} *</label>
          <input
            type="tel"
            inputMode="tel"
            {...campoTelefono}
            placeholder="0412-1234567"
            className={FIELD_CLASS}
          />
          {errors.phone ? (
            <span className="text-danger-500 text-xs mt-1">
              {errors.phone.type === 'required'
                ? t('errors.fieldRequired', { defaultValue: 'Este campo es requerido' })
                : t('errors.phoneInvalid', {
                    defaultValue:
                      'Escribe un móvil venezolano: 0412, 0414, 0416, 0424 o 0426 + 7 dígitos.',
                  })}
            </span>
          ) : (
            <p className="mt-1.5 text-[11px] font-medium text-sand-600">
              {t('errors.phoneInvalid', {
                defaultValue:
                  'Escribe un móvil venezolano: 0412, 0414, 0416, 0424 o 0426 + 7 dígitos.',
              })}
            </p>
          )}
        </div>

        <div>
          <label className={LABEL_CLASS}>{t('email')} *</label>
          <input
            type="email"
            {...register('email', {
              required: true,
              pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            })}
            className={FIELD_CLASS}
          />
          {errors.email ? (
            <span className="text-danger-500 text-xs mt-1">
              {t('errors.emailInvalid', { defaultValue: 'Email válido requerido' })}
            </span>
          ) : (
            <p className="mt-1.5 text-[11px] font-medium text-sand-600">
              {t('emailHelp', {
                defaultValue: 'Te enviamos el recibo y el estado del pedido aquí',
              })}
            </p>
          )}
        </div>
      </div>

      {!isAuthenticated && (
        <div>
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              {...register('createAccount')}
              className="h-5 w-5 rounded-md border-sand-400 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-[12.5px] font-semibold text-sand-700">
              {t('createAccount', { defaultValue: 'Crear cuenta para seguir mis pedidos' })}
            </span>
          </label>

          {createAccount && (
            <div className="mt-2">
              <label className={LABEL_CLASS}>{t('password')} *</label>
              <input
                type="password"
                {...register('password', { required: createAccount, minLength: 6 })}
                placeholder={t('passwordPlaceholder')}
                className={FIELD_CLASS}
              />
              {errors.password ? (
                <span className="text-danger-500 text-xs mt-1">
                  {t('errors.passwordMin', { defaultValue: 'Mínimo 6 caracteres' })}
                </span>
              ) : (
                pedirContrasenaDeNuevo && (
                  // El borrador no guarda la contraseña: si no se dice, el
                  // cliente vuelve, ve la casilla marcada y el campo vacío, y
                  // no entiende por qué falla al enviar.
                  <p className="mt-1.5 text-[11px] font-medium text-sand-600">
                    {t('passwordNotSaved', {
                      defaultValue:
                        'Por seguridad no guardamos tu contraseña: vuelve a escribirla.',
                    })}
                  </p>
                )
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-[11.5px] font-medium text-sand-600">
        {t('allFieldsRequired', { defaultValue: 'Todos los campos son obligatorios.' })}
      </p>
    </div>
  );
}
