'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Category } from '@/types';
import { Star, Edit, Trash2, FolderTree, CornerDownRight, Tag } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';

interface CategoriesTableProps {
  categories: Category[];
  onDelete: (uuid: string) => Promise<void>;
  onToggleFeatured: (uuid: string, currentValue: boolean) => Promise<void>;
}

function TypeIcon({ isChild, hasChildren }: { isChild: boolean; hasChildren: boolean }) {
  if (isChild) {
    return (
      <span title="Subcategoría" className="flex-shrink-0">
        <CornerDownRight className="w-4 h-4 text-purple-400" />
      </span>
    );
  }
  if (hasChildren) {
    return (
      <span title="Categoría padre" className="flex-shrink-0">
        <FolderTree className="w-4 h-4 text-blue-500" />
      </span>
    );
  }
  return (
    <span title="Independiente" className="flex-shrink-0">
      <Tag className="w-4 h-4 text-gray-400" />
    </span>
  );
}

export function CategoriesTable({ categories, onDelete, onToggleFeatured }: CategoriesTableProps) {
  const t = useTranslations('categories');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; uuid: string | null }>({
    isOpen: false,
    uuid: null,
  });

  const handleDeleteClick = (uuid: string) => {
    setDeleteModal({ isOpen: true, uuid });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.uuid) {
      await onDelete(deleteModal.uuid);
      setDeleteModal({ isOpen: false, uuid: null });
    }
  };

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500">{t('noCategories')}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('featured')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => {
              const isChild = !!category.parent;
              const hasChildren = !!(category.childrens && category.childrens.length > 0);

              return (
                <tr
                  key={category.uuid}
                  className={`hover:bg-gray-50 transition-colors ${isChild ? 'bg-gray-50/50' : ''}`}
                >
                  {/* Nombre + slug + ícono tipo */}
                  <td className="px-6 py-4 text-sm">
                    <div className={`flex items-start gap-2 ${isChild ? 'ml-4' : ''}`}>
                      <TypeIcon isChild={isChild} hasChildren={hasChildren} />
                      <div>
                        <p className={`font-medium ${isChild ? 'text-gray-700' : 'text-gray-900'}`}>
                          {category.customName ?? category.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{category.slug}</p>
                      </div>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.visible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {category.visible ? t('visibleStatus') : t('hiddenStatus')}
                    </span>
                  </td>

                  {/* Destacado */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => onToggleFeatured(category.uuid, category.isFeatured)}
                      className="inline-flex items-center justify-center transition-colors"
                      title={category.isFeatured ? t('unmarkFeatured') : t('markFeatured')}
                    >
                      <Star
                        className={`w-5 h-5 transition-all ${
                          category.isFeatured
                            ? 'fill-yellow-400 text-yellow-400 hover:fill-yellow-500 hover:text-yellow-500'
                            : 'text-gray-400 hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/dashboard/categories/${category.uuid}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('edit')}
                      >
                        <Edit className="w-4 h-4" />
                        <span>{t('edit')}</span>
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(category.uuid)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{t('delete')}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {categories.map((category) => {
          const isChild = !!category.parent;
          const hasChildren = !!(category.childrens && category.childrens.length > 0);

          return (
            <div
              key={category.uuid}
              className={`bg-white rounded-lg shadow p-4 ${isChild ? 'ml-4 border-l-4 border-purple-200' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2 flex-1">
                  <TypeIcon isChild={isChild} hasChildren={hasChildren} />
                  <div>
                    <h3 className={`font-semibold ${isChild ? 'text-gray-700' : 'text-gray-900'}`}>
                      {category.customName ?? category.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{category.slug}</p>
                  </div>
                </div>
                <button
                  onClick={() => onToggleFeatured(category.uuid, category.isFeatured)}
                  className="p-2 flex-shrink-0"
                  title={category.isFeatured ? t('unmarkFeatured') : t('markFeatured')}
                >
                  <Star
                    className={`w-5 h-5 transition-all ${
                      category.isFeatured
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-400'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    category.visible
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {category.visible ? t('visibleStatus') : t('hiddenStatus')}
                </span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <Link
                  href={`/admin/dashboard/categories/${category.uuid}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('edit')}</span>
                </Link>
                <button
                  onClick={() => handleDeleteClick(category.uuid)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('delete')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={t('delete')}
        message={t('deleteConfirm')}
        confirmText={t('delete')}
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, uuid: null })}
      />
    </div>
  );
}
