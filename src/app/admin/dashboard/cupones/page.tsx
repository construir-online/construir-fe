'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { discountsService } from '@/services/discounts';
import type { Discount, DiscountStats } from '@/types';
import { PlusCircle, Percent, DollarSign, Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function CuponesPage() {
  const t = useTranslations('discounts');
  const tCommon = useTranslations('common');
  const toast = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [stats, setStats] = useState<DiscountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; uuid: string | null }>({
    isOpen: false,
    uuid: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [discountsData, statsData] = await Promise.all([
        discountsService.getAll(),
        discountsService.getStats(),
      ]);
      setDiscounts(discountsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading discounts:', error);
      toast.error(tCommon('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (uuid: string) => {
    setDeleteModal({ isOpen: true, uuid });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.uuid) return;

    try {
      // Ya no se comprueba `localStorage.getItem('token')` antes de llamar:
      // el token está en una cookie `httpOnly` y este código no lo ve. La
      // autorización la resuelven el `middleware.ts` (que sí lee la cookie,
      // en el servidor) y el propio backend, que responde 401.
      await discountsService.delete(deleteModal.uuid);
      toast.success(t('deleteSuccess'));
      setDeleteModal({ isOpen: false, uuid: null });
      loadData();
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast.error(t('deleteError'));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, uuid: null });
  };

  const isExpired = (discount: Discount) => {
    if (!discount.endDate) return false;
    return new Date(discount.endDate) < new Date();
  };

  const isMaxedOut = (discount: Discount) => {
    if (!discount.maxUses) return false;
    return discount.currentUses >= discount.maxUses;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <Link
          href="/admin/dashboard/cupones/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          {t('newDiscount')}
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('total')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Percent className="w-10 h-10 text-blue-600" />
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('active')}</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('inactive')}</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('expired')}</p>
              <p className="text-2xl font-bold text-orange-600">{stats.expired}</p>
            </div>
            <Calendar className="w-10 h-10 text-orange-600" />
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('maxedOut')}</p>
              <p className="text-2xl font-bold text-purple-600">{stats.maxedOut}</p>
            </div>
            <Users className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      )}

      {/* Discounts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">{t('loading')}</div>
        ) : discounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('noDiscounts')}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('code')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('type')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('value')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('usage')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('validity')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discounts.map((discount) => (
                <tr key={discount.uuid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-gray-900">{discount.code}</span>
                    </div>
                    {discount.description && (
                      <p className="text-xs text-gray-500 mt-1">{discount.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {discount.type === 'percentage' ? (
                        <><Percent className="w-4 h-4 text-blue-600" /><span className="text-sm text-gray-900">{t('percentage')}</span></>
                      ) : (
                        <><DollarSign className="w-4 h-4 text-green-600" /><span className="text-sm text-gray-900">{t('fixed')}</span></>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {discount.maxUses ? `${discount.currentUses}/${discount.maxUses}` : discount.currentUses}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {formatDate(discount.startDate)} - {formatDate(discount.endDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isExpired(discount) ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {t('expiredStatus')}
                      </span>
                    ) : isMaxedOut(discount) ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {t('maxedOutStatus')}
                      </span>
                    ) : discount.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {t('activeStatus')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {t('inactiveStatus')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <Link
                      href={`/admin/dashboard/cupones/${discount.uuid}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {t('edit')}
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(discount.uuid)}
                      className="text-red-600 hover:text-red-800"
                    >
                      {t('delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={t('delete')}
        message={t('deleteConfirm')}
        confirmText={t('delete')}
        cancelText={tCommon('cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />
    </div>
  );
}
