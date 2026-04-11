import type { Bank, PaymentMethodEntity } from '@/types';

export function resolvePaymentMethod(method: string | PaymentMethodEntity | undefined): string {
  if (!method) return '';
  if (typeof method === 'object') return method.type || method.code || '';
  return method;
}

export function resolveBankName(bank: string | Bank | undefined): string {
  if (!bank) return '';
  if (typeof bank === 'object') return bank.name;
  return bank;
}

export function resolveBankCode(
  bank: string | Bank | undefined,
  bankCode: string | undefined,
): string {
  if (bankCode) return bankCode;
  if (bank && typeof bank === 'object') return bank.code;
  return '';
}
