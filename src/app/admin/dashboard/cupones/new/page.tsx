'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { discountsService } from '@/services/discounts';
import type { CreateDiscountDto } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function NewDiscountPage() {
  const t = useTranslations('discounts');
  const router = useRouter();
  const toast = useToast();
  const [formData, setFormData] = useState<CreateDiscountDto>({
    code: '',
    description: '',
    type: 'percentage',
    value: 0,
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'value' || name === 'minPurchaseAmount' || name === 'maxDiscountAmount' || name === 'maxUses') {
      setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
    } else if (name === 'code') {
      const sanitizedCode = value.toUpperCase().replace(/[^A-Z0-9-_]/g, '');
      setFormData(prev => ({ ...prev, code: sanitizedCode }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value || undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Ya no se comprueba `localStorage.getItem('token')` antes de llamar:
      // el token está en una cookie `httpOnly` y este código no lo ve. La
      // autorización la resuelven el `middleware.ts` (que sí lee la cookie,
      // en el servidor) y el propio backend, que responde 401.
      const dataToSend = {
        ...formData,
      };

      await discountsService.create(dataToSend);
      toast.success(t('createSuccess'));
      router.push('/admin/dashboard/cupones');
    } catch (error) {
      console.error('Error creating discount:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t('createError'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard/cupones" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{t('createTitle')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Código */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              {t('codeLabel')} *
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder={t('codePlaceholder')}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">El código será convertido a mayúsculas automáticamente</p>
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              {t('descriptionLabel')}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Tipo */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              {t('typeLabel')} *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="percentage">{t('percentage')}</option>
              <option value="fixed">{t('fixed')}</option>
            </select>
          </div>

          {/* Valor */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700">
              {t('valueLabel')} *
            </label>
            <input
              type="number"
              id="value"
              name="value"
              value={formData.value}
              onChange={handleChange}
              placeholder={t('valuePlaceholder')}
              min="0"
              step={formData.type === 'percentage' ? '1' : '0.01'}
              max={formData.type === 'percentage' ? '100' : undefined}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.type === 'percentage' ? 'Porcentaje de descuento (0-100)' : 'Monto fijo de descuento'}
            </p>
          </div>

          {/* Monto mínimo de compra */}
          <div>
            <label htmlFor="minPurchaseAmount" className="block text-sm font-medium text-gray-700">
              {t('minPurchaseLabel')}
            </label>
            <input
              type="number"
              id="minPurchaseAmount"
              name="minPurchaseAmount"
              value={formData.minPurchaseAmount || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Opcional: Monto mínimo de compra para usar el cupón</p>
          </div>

          {/* Descuento máximo (solo para porcentaje) */}
          {formData.type === 'percentage' && (
            <div>
              <label htmlFor="maxDiscountAmount" className="block text-sm font-medium text-gray-700">
                {t('maxDiscountLabel')}
              </label>
              <input
                type="number"
                id="maxDiscountAmount"
                name="maxDiscountAmount"
                value={formData.maxDiscountAmount || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Opcional: Monto máximo que se puede descontar</p>
            </div>
          )}

          {/* Fecha de inicio */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              {t('startDateLabel')}
            </label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={formData.startDate || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Opcional: Fecha desde la cual es válido el cupón</p>
          </div>

          {/* Fecha de fin */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              {t('endDateLabel')}
            </label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              value={formData.endDate || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Opcional: Fecha hasta la cual es válido el cupón</p>
          </div>

          {/* Usos máximos */}
          <div>
            <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700">
              {t('maxUsesLabel')}
            </label>
            <input
              type="number"
              id="maxUses"
              name="maxUses"
              value={formData.maxUses || ''}
              onChange={handleChange}
              min="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Opcional: Número máximo de veces que se puede usar el cupón</p>
          </div>

          {/* Activo */}
          <div className="flex items-center">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              {t('isActiveLabel')}
            </label>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
          <Link
            href="/admin/dashboard/cupones"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-5 h-5" />
            {isSaving ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
