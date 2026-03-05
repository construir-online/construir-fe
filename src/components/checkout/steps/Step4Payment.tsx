'use client';

import { useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import ZelleForm from '@/components/payment/ZelleForm';
import PagoMovilForm from '@/components/payment/PagoMovilForm';
import TransferenciaForm from '@/components/payment/TransferenciaForm';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import type { CheckoutData, ZellePayment, PagoMovilPayment, TransferenciaPayment } from '@/types';
import { PaymentMethod } from '@/lib/enums';

interface Step4PaymentProps {
  register: UseFormRegister<CheckoutData>;
  errors: FieldErrors<CheckoutData>;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  zellePayment: ZellePayment;
  onZelleChange: (data: ZellePayment) => void;
  pagomovilPayment: PagoMovilPayment;
  onPagomovilChange: (data: PagoMovilPayment) => void;
  transferenciaPayment: TransferenciaPayment;
  onTransferenciaChange: (data: TransferenciaPayment) => void;
  totalUSD: number;
  totalVES: number | null;
  isAuthenticated: boolean;
  createAccount: boolean;
}

export default function Step4Payment({
  register,
  errors,
  paymentMethod,
  onPaymentMethodChange,
  zellePayment,
  onZelleChange,
  pagomovilPayment,
  onPagomovilChange,
  transferenciaPayment,
  onTransferenciaChange,
  totalUSD,
  totalVES,
  isAuthenticated,
  createAccount
}: Step4PaymentProps) {
  const t = useTranslations('checkout');
  const { methods: paymentMethods, loading, error } = usePaymentMethods();

  // Auto-seleccionar el primer método disponible si el actual no está en la lista
  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethods.some((m) => m.type === paymentMethod)) {
      onPaymentMethodChange(paymentMethods[0].type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethods]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando métodos de pago...</span>
      </div>
    );
  }

  if (error || paymentMethods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        {/* Icono animado */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
            <CreditCard className="w-9 h-9 text-blue-400" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-400 items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </span>
          </span>
        </div>

        {/* Título */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Pagos en línea próximamente
        </h3>

        {/* Descripción */}
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">
          Estamos configurando los métodos de pago para ofrecerte la mejor experiencia.
          Por ahora, contáctanos directamente para completar tu pedido.
        </p>

        {/* Divider con etiqueta */}
        <div className="w-full max-w-xs flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">MIENTRAS TANTO</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Opciones de contacto */}
        <div className="w-full max-w-xs space-y-3">
          <a
            href="https://wa.me/584120000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-4 py-3 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.134.558 4.133 1.535 5.865L.057 23.604a.75.75 0 00.92.92l5.739-1.478A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.951 9.951 0 01-5.03-1.36l-.362-.214-3.732.96.977-3.61-.235-.373A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
            </svg>
            <span>Escribir por WhatsApp</span>
          </a>

          <a
            href="tel:+584120000000"
            className="flex items-center gap-3 w-full px-4 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium rounded-xl border border-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Llamar ahora</span>
          </a>
        </div>

        {/* Nota final */}
        <p className="text-xs text-gray-400 mt-6 max-w-xs">
          Tu carrito se mantendrá guardado mientras tanto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          {t('paymentMethod')}
        </h2>
        <p className="text-sm text-gray-600">
          {t('paymentDescription', { defaultValue: 'Selecciona tu método de pago y completa la información' })}
        </p>
      </div>

      {/* Selector de Método de Pago */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paymentMethods.map((method) => (
          <button
            key={method.uuid}
            type="button"
            onClick={() => onPaymentMethodChange(method.type as PaymentMethod)}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              paymentMethod === method.type
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-2xl mb-2">{method.icon}</div>
            <div className="font-semibold text-gray-900">{method.name}</div>
            <div className="text-xs text-gray-500 mt-1">{method.description}</div>
          </button>
        ))}
      </div>

      {/* Formulario según método seleccionado */}
      {paymentMethod === 'zelle' && (
        <ZelleForm
          data={zellePayment}
          onChange={onZelleChange}
          total={totalUSD}
        />
      )}

      {paymentMethod === 'pagomovil' && (
        <PagoMovilForm
          data={pagomovilPayment}
          onChange={onPagomovilChange}
          total={totalVES || 0}
        />
      )}

      {paymentMethod === 'transferencia' && (
        <TransferenciaForm
          data={transferenciaPayment}
          onChange={onTransferenciaChange}
          total={totalVES || 0}
        />
      )}

      {/* Crear Cuenta (solo para invitados) */}
      {!isAuthenticated && (
        <div className="border-t pt-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('createAccount')}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {t('createAccount')}
            </span>
          </label>

          {createAccount && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('password')} *
              </label>
              <input
                type="password"
                {...register('password', {
                  required: createAccount,
                  minLength: 6
                })}
                placeholder={t('passwordPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.password && (
                <span className="text-red-500 text-xs mt-1">
                  {t('errors.passwordMin', { defaultValue: 'Mínimo 6 caracteres' })}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
