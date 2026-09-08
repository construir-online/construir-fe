'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { apiKeysService } from '@/services/apiKeys';
import { ApiKeySecretModal } from '@/components/admin/ApiKeySecretModal';
import { useToast } from '@/context/ToastContext';
import type { CreateApiKeyDto, CreateApiKeyResponse, ApiKeyPermission } from '@/types';

export default function NewApiKeyPage() {
  const t = useTranslations('apiKeys');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const toast = useToast();

  const [formData, setFormData] = useState<CreateApiKeyDto>({
    description: '',
    permissions: 'read_write' as ApiKeyPermission,
  });
  const [errors, setErrors] = useState<{ description?: string }>({});
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(
    null
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error del campo al cambiar
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: { description?: string } = {};

    if (!formData.description || formData.description.trim().length < 3) {
      newErrors.description = t('minLength', { min: 3 });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setCreating(true);
      const response = await apiKeysService.create(formData);
      setCreatedKey(response);
      toast.success(t('createSuccess'));
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error(t('createError'));
    } finally {
      setCreating(false);
    }
  };

  const handleModalClose = () => {
    setCreatedKey(null);
    router.push('/admin/dashboard/api-keys');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/dashboard/api-keys"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{t('createTitle')}</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t('descriptionLabel')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder={t('descriptionPlaceholder')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">{t('descriptionHelp')}</p>
          </div>

          {/* Permissions */}
          <div>
            <label
              htmlFor="permissions"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t('permissionsLabel')} <span className="text-red-500">*</span>
            </label>
            <select
              id="permissions"
              name="permissions"
              value={formData.permissions}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="read">{t('permissionRead')}</option>
              <option value="write">{t('permissionWrite')}</option>
              <option value="read_write">{t('permissionReadWrite')}</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">{t('permissionsHelp')}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Link
              href="/admin/dashboard/api-keys"
              className="flex-1 px-4 py-2 text-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('cancel')}
            </Link>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? t('creating') : t('create')}
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          {t('secretModalWarningStrong')}
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>El Consumer Secret solo se mostrará una vez después de crear la clave</li>
          <li>Asegúrate de copiar y guardar ambas credenciales en un lugar seguro</li>
          <li>Si pierdes el Consumer Secret, deberás crear una nueva clave API</li>
        </ul>
      </div>

      {/* Secret Modal */}
      <ApiKeySecretModal
        isOpen={!!createdKey}
        consumerKey={createdKey?.apiKey.consumerKey || ''}
        consumerSecret={createdKey?.consumerSecret || ''}
        onClose={handleModalClose}
      />
    </div>
  );
}
