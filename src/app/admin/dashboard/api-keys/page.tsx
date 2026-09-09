'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Key, Copy, Check, Trash2, Power, PowerOff } from 'lucide-react';
import { apiKeysService } from '@/services/apiKeys';
import { copyToClipboard } from '@/lib/clipboard';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast } from '@/context/ToastContext';
import type { ApiKey, ApiKeyPermission } from '@/types';

export default function ApiKeysPage() {
  const t = useTranslations('apiKeys');
  const tCommon = useTranslations('common');
  const toast = useToast();

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    key: ApiKey | null;
  }>({ isOpen: false, key: null });

  useEffect(() => {
    // Ya no se comprueba `localStorage.getItem('token')`: el token está en una
    // cookie `httpOnly` invisible para este código. Quien atajaba de verdad al
    // no autenticado era el `middleware.ts`, que lee la cookie en el servidor;
    // esto sólo duplicaba la comprobación con el dato equivocado.
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const keys = await apiKeysService.getAll();
      setApiKeys(keys);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, uuid: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(uuid);
      toast.success(t('copied'));
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error(t('copyError'));
    }
  };

  const handleToggleStatus = async (apiKey: ApiKey) => {
    const action = apiKey.active ? 'revoke' : 'activate';
    const confirmMessage = apiKey.active
      ? t('confirmRevoke')
      : t('confirmActivate');

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await apiKeysService.revoke(apiKey.uuid);
      toast.success(
        apiKey.active ? t('revokeSuccess') : t('activateSuccess')
      );
      await loadApiKeys();
    } catch (error) {
      console.error(`Error ${action}ing API key:`, error);
      toast.error(apiKey.active ? t('revokeError') : t('activateError'));
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.key) return;

    try {
      await apiKeysService.delete(deleteModal.key.uuid);
      toast.success(t('deleteSuccess'));
      setDeleteModal({ isOpen: false, key: null });
      await loadApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error(t('deleteError'));
    }
  };

  const getPermissionBadge = (permission: ApiKeyPermission) => {
    const colors = {
      read: 'bg-blue-100 text-blue-800',
      write: 'bg-orange-100 text-orange-800',
      read_write: 'bg-green-100 text-green-800',
    };

    const labels = {
      read: t('permissionRead'),
      write: t('permissionWrite'),
      read_write: t('permissionReadWrite'),
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${colors[permission]}`}
      >
        {labels[permission]}
      </span>
    );
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return t('neverUsed');
    return new Date(date).toLocaleString('es-VE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <Link
          href="/admin/dashboard/api-keys/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Key className="w-4 h-4" />
          {t('newKey')}
        </Link>
      </div>

      {/* Empty State */}
      {apiKeys.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Key className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 mb-4">{t('noKeys')}</p>
          <Link
            href="/admin/dashboard/api-keys/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Key className="w-4 h-4" />
            {t('createFirst')}
          </Link>
        </div>
      ) : (
        /* Table */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('description')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('consumerKey')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('permissions')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('lastUsed')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {apiKey.description}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(apiKey.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {apiKey.consumerKey}
                        </code>
                        <button
                          onClick={() =>
                            handleCopy(apiKey.consumerKey, apiKey.uuid)
                          }
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title={t('copyKey')}
                        >
                          {copiedId === apiKey.uuid ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getPermissionBadge(apiKey.permissions)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          apiKey.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {apiKey.active ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(apiKey.lastUsedAt)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleToggleStatus(apiKey)}
                        className={`inline-flex items-center gap-1 ${
                          apiKey.active
                            ? 'text-orange-600 hover:text-orange-800'
                            : 'text-green-600 hover:text-green-800'
                        } transition-colors`}
                        title={apiKey.active ? t('revoke') : t('activate')}
                      >
                        {apiKey.active ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                        <span className="hidden lg:inline">
                          {apiKey.active ? t('revoke') : t('activate')}
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          setDeleteModal({ isOpen: true, key: apiKey })
                        }
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden lg:inline">{t('delete')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={t('deleteTitle')}
        message={t('deleteMessage')}
        confirmText={tCommon('delete')}
        cancelText={tCommon('cancel')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, key: null })}
        type="danger"
      />
    </div>
  );
}
