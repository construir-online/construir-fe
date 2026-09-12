'use client';

import { useEffect } from 'react';
import { Clock, CreditCard } from 'lucide-react';
import { storeWhatsAppNumber, storeWhatsAppUrl, toTelHref } from '@/lib/whatsapp';
import PhoneLink from '@/components/common/PhoneLink';
import { useStoreInfo } from '@/hooks/useStoreInfo';
import { useTranslations } from 'next-intl';
import { formatUSD } from '@/lib/currency';
import ZelleForm from '@/components/payment/ZelleForm';
import PagoMovilForm from '@/components/payment/PagoMovilForm';
import TransferenciaForm from '@/components/payment/TransferenciaForm';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import type { ZellePayment, PagoMovilPayment, TransferenciaPayment } from '@/types';
import { PaymentMethod } from '@/lib/enums';

interface CartItemSummary {
  productName: string;
  quantity: number;
  price: number;
  priceVes?: number | null;
}

interface Step4PaymentProps {
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
  cartItems: CartItemSummary[];
  customerName: string;
  customerPhone: string;
  deliveryMethod: 'pickup' | 'delivery';
}

export default function Step4Payment({
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
  cartItems,
  customerName,
  customerPhone,
  deliveryMethod,
}: Step4PaymentProps) {
  const t = useTranslations('checkout');
  const { methods: paymentMethods, loading, error } = usePaymentMethods();
  // De aquí sale el WhatsApp, y el fijo y el correo de respaldo si no hay
  const { storeInfo } = useStoreInfo();

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        <span className="ml-3 text-sand-700">Cargando métodos de pago...</span>
      </div>
    );
  }

  if (error || paymentMethods.length === 0) {
    const productLines = cartItems.map(
      (item) => `• ${item.quantity}x ${item.productName} - ${formatUSD(item.price)}`
    );
    const messageLines = [
      'Hola! Quiero hacer el siguiente pedido:',
      '',
      '*PRODUCTOS:*',
      ...productLines,
      '',
      `*Total:* ${formatUSD(totalUSD)}`,
      '',
      '*DATOS:*',
      customerName ? `Nombre: ${customerName}` : null,
      customerPhone ? `Teléfono: ${customerPhone}` : null,
      `Entrega: ${deliveryMethod === 'delivery' ? 'Delivery a domicilio' : 'Retiro en tienda'}`,
    ].filter((l): l is string => l !== null);
    // El enlace lo arma el helper compartido: aquí se repetía la normalización
    const waUrl = storeWhatsAppUrl(storeInfo?.whatsapp, messageLines.join('\n'));
    const waTel = toTelHref(storeWhatsAppNumber(storeInfo?.whatsapp));

    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        {/* Icono animado */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center">
            <CreditCard className="w-9 h-9 text-brand-300" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-accent-400 items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </span>
          </span>
        </div>

        {/* Título */}
        <h3 className="text-lg font-bold text-ink mb-2">
          Pagos en línea próximamente
        </h3>

        {/* Descripción */}
        <p className="text-sm text-sand-600 max-w-xs leading-relaxed mb-6">
          Estamos configurando los métodos de pago para ofrecerte la mejor experiencia.
          Por ahora, contáctanos directamente para completar tu pedido.
        </p>

        {/* Divider con etiqueta */}
        <div className="w-full max-w-xs flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-sand-200" />
          <span className="text-xs text-sand-500 font-medium">MIENTRAS TANTO</span>
          <div className="flex-1 h-px bg-sand-200" />
        </div>

        {/* Opciones de contacto */}
        <div className="w-full max-w-xs space-y-3">
          {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-4 py-3 bg-success-500 hover:bg-success-600 active:bg-success-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.134.558 4.133 1.535 5.865L.057 23.604a.75.75 0 00.92.92l5.739-1.478A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.951 9.951 0 01-5.03-1.36l-.362-.214-3.732.96.977-3.61-.235-.373A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
            </svg>
            <span>Escribir por WhatsApp</span>
          </a>
          )}

          {waTel && (
          <a
            href={waTel}
            className="flex items-center gap-3 w-full px-4 py-3 bg-white hover:bg-sand-50 active:bg-sand-100 text-sand-700 font-medium rounded-xl border border-sand-300 transition-colors"
          >
            <svg className="w-5 h-5 flex-shrink-0 text-sand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Llamar ahora</span>
          </a>
          )}

          {/* Sin WhatsApp configurado el bloque quedaba vacío: la pantalla pedía
              escribir a la tienda y no ofrecía por dónde. */}
          {!waUrl && storeInfo?.phone && (
            <PhoneLink
              phone={storeInfo.phone}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-sand-300 bg-white px-4 py-3 font-medium text-sand-700 transition-colors hover:bg-sand-50"
            >
              {t('callStore', { phone: storeInfo.phone })}
            </PhoneLink>
          )}
          {!waUrl && storeInfo?.email && (
            <a
              href={`mailto:${storeInfo.email}`}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-sand-300 bg-white px-4 py-3 font-medium text-sand-700 transition-colors hover:bg-sand-50"
            >
              {t('emailStore', { email: storeInfo.email })}
            </a>
          )}
        </div>

        {/* Nota final */}
        <p className="text-xs text-sand-500 mt-6 max-w-xs">
          Tu carrito se mantendrá guardado mientras tanto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-ink">
          <CreditCard className="w-5 h-5 text-brand-600" />
          {t('paymentMethod')}
        </h2>
        <p className="text-sm text-sand-700">
          {t('paymentDescription', { defaultValue: 'Selecciona tu método de pago y completa la información' })}
        </p>
      </div>

      {/* Selector de Método de Pago */}
      <div className="chip-row -mx-4 px-4 md:mx-0 md:px-0">
        {paymentMethods.map((method) => {
          const isSelected = paymentMethod === method.type;
          return (
            <button
              key={method.uuid}
              type="button"
              onClick={() => onPaymentMethodChange(method.type as PaymentMethod)}
              aria-pressed={isSelected}
              className={`flex min-h-11 flex-none items-center gap-2 whitespace-nowrap rounded-full px-4 text-[12.5px] transition-colors ${
                isSelected
                  ? 'bg-ink font-bold text-white'
                  : 'border border-sand-300 bg-white font-semibold text-sand-700 hover:border-sand-400'
              }`}
            >
              {method.icon && <span aria-hidden="true">{method.icon}</span>}
              {method.name}
            </button>
          );
        })}
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

      {/* Plazo de verificación del pago */}
      <div className="flex items-start gap-2.5 rounded-xl bg-accent-50 p-3">
        <Clock className="mt-0.5 h-4 w-4 flex-none text-accent-700" strokeWidth={1.9} />
        <p className="text-[11.5px] font-medium leading-[1.45] text-sand-700">
          Verificamos el pago en menos de 2 horas hábiles y te avisamos por WhatsApp.
        </p>
      </div>

    </div>
  );
}
