import { PaymentMethod } from "@/lib/enums";

export interface PaymentMethodDetails {
  // Zelle
  email?: string;
  beneficiary?: string;
  // PagoMóvil
  bank?: string;
  bankCode?: string;
  phone?: string;
  cedula?: string;
  // Transferencia
  accountNumber?: string;
  rif?: string;
}

export interface PaymentMethodConfig {
  type: PaymentMethod;
  enabled: boolean;
  details: PaymentMethodDetails;
}

// Configuración de métodos de pago desde variables de entorno
export const paymentConfig: Record<PaymentMethod, PaymentMethodConfig> = {
  [PaymentMethod.ZELLE]: {
    type: PaymentMethod.ZELLE,
    enabled: process.env.NEXT_PUBLIC_ZELLE_ENABLED === 'true',
    details: {
      email: process.env.NEXT_PUBLIC_ZELLE_EMAIL,
      beneficiary: process.env.NEXT_PUBLIC_ZELLE_BENEFICIARY,
    },
  },
  [PaymentMethod.PAGO_MOVIL]: {
    type: PaymentMethod.PAGO_MOVIL,
    enabled: process.env.NEXT_PUBLIC_PAGOMOVIL_ENABLED === 'true',
    details: {
      bank: process.env.NEXT_PUBLIC_PAGOMOVIL_BANK,
      bankCode: process.env.NEXT_PUBLIC_PAGOMOVIL_BANK_CODE,
      phone: process.env.NEXT_PUBLIC_PAGOMOVIL_PHONE,
      cedula: process.env.NEXT_PUBLIC_PAGOMOVIL_CEDULA,
    },
  },
  [PaymentMethod.TRANSFERENCIA]: {
    type: PaymentMethod.TRANSFERENCIA,
    enabled: process.env.NEXT_PUBLIC_TRANSFERENCIA_ENABLED === 'true',
    details: {
      bank: process.env.NEXT_PUBLIC_TRANSFERENCIA_BANK,
      bankCode: process.env.NEXT_PUBLIC_TRANSFERENCIA_BANK_CODE,
      accountNumber: process.env.NEXT_PUBLIC_TRANSFERENCIA_ACCOUNT_NUMBER,
      rif: process.env.NEXT_PUBLIC_TRANSFERENCIA_RIF,
      beneficiary: process.env.NEXT_PUBLIC_TRANSFERENCIA_BENEFICIARY,
    },
  },
};

/**
 * Obtiene la configuración de un método de pago específico
 */
export function getPaymentMethodConfig(method: PaymentMethod): PaymentMethodConfig {
  return paymentConfig[method];
}

/**
 * Verifica si los detalles de un método tienen al menos un valor real configurado
 */
export function isPaymentMethodConfigured(method: PaymentMethod): boolean {
  const details = paymentConfig[method].details;
  return Object.values(details).some((v) => typeof v === 'string' && v.trim() !== '');
}

/**
 * Obtiene solo los métodos de pago activos y con detalles configurados
 */
export function getActivePaymentMethods(): PaymentMethodConfig[] {
  return Object.values(paymentConfig).filter((config) => config.enabled);
}

/**
 * Obtiene los detalles de un método de pago específico
 */
export function getPaymentMethodDetails(method: PaymentMethod): PaymentMethodDetails {
  return paymentConfig[method].details;
}

/**
 * Verifica si un método de pago está habilitado
 */
export function isPaymentMethodEnabled(method: PaymentMethod): boolean {
  return paymentConfig[method].enabled;
}
