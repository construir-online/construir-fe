'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { categoriesService } from '@/services/categories';
import type { Category, CategoryStats } from '@/types';
import { PlusCircle, ListTree, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { CategoriesTable } from '@/components/admin/CategoriesTable';
import { FeaturedImageModal } from '@/components/admin/FeaturedImageModal';

const LIMIT = 15;

export default function CategoriesPage() {
  const t = useTranslations('categories');
  const tCommon = useTranslations('common');
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [featuredImageModal, setFeaturedImageModal] = useState<{
    isOpen: boolean;
    categoryUuid: string | null;
  }>({
    isOpen: false,
    categoryUuid: null,
  });
  const [isUploadingFeaturedImage, setIsUploadingFeaturedImage] = useState(false);

  const lastPage = Math.max(1, Math.ceil(total / LIMIT));

  const loadCategories = useCallback(async (q: string, p: number) => {
    try {
      setLoading(true);
      const res = await categoriesService.searchPaginated({ search: q || undefined, page: p, limit: LIMIT });
      setCategories(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(tCommon('error'));
    } finally {
      setLoading(false);
    }
  }, [toast, tCommon]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await categoriesService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadCategories(search, page);
  }, [search, page, loadCategories]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (uuid: string) => {
    try {
      await categoriesService.delete(uuid);
      toast.success(t('deleteSuccess'));
      await loadCategories(search, page);
      await loadStats();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(t('deleteError'));
    }
  };

  const handleToggleFeatured = async (uuid: string, currentValue: boolean) => {
    // Si se está desmarcando, permitir siempre
    if (currentValue) {
      try {
        await categoriesService.update(uuid, { isFeatured: false });
        toast.success(t('updateSuccess'));
        await loadCategories(search, page);
      } catch (error) {
        console.error('Error updating category:', error);
        toast.error(t('updateError'));
      }
      return;
    }

    // Si se está marcando, validar que tenga imagen
    const category = categories.find(cat => cat.uuid === uuid);

    if (category?.image) {
      // Tiene imagen, permitir marcar directamente
      try {
        await categoriesService.update(uuid, { isFeatured: true });
        toast.success(t('updateSuccess'));
        await loadCategories(search, page);
      } catch (error) {
        console.error('Error updating category:', error);
        toast.error(t('updateError'));
      }
    } else {
      // NO tiene imagen, abrir modal para que suba una
      setFeaturedImageModal({
        isOpen: true,
        categoryUuid: uuid,
      });
    }
  };

  const handleFeaturedImageUploadFromList = async (file: File) => {
    if (!featuredImageModal.categoryUuid) return;

    try {
      setIsUploadingFeaturedImage(true);

      // Usar update() que envía AMBOS: imagen + isFeatured al backend
      await categoriesService.update(
        featuredImageModal.categoryUuid,
        { isFeatured: true },
        file
      );

      setFeaturedImageModal({ isOpen: false, categoryUuid: null });
      toast.success(t('imageUploadedAndFeatured'));
      await loadCategories(search, page);
    } catch (error) {
      console.error('Error uploading image for featured category:', error);
      toast.error(t('imageUploadError'));
      throw error;
    } finally {
      setIsUploadingFeaturedImage(false);
    }
  };

  return (
    <div className="w-full max-w-full space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('title')}</h1>
        <Link
          href="/admin/dashboard/categories/new"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          <span>{t('newCategory')}</span>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <div className="bg-white rounded-lg shadow p-4 md:p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('total')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <ListTree className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
          </div>
          <div className="bg-white rounded-lg shadow p-4 md:p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('visible')}</p>
              <p className="text-2xl font-bold text-green-600">{stats.visible}</p>
            </div>
            <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
          </div>
          <div className="bg-white rounded-lg shadow p-4 md:p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('hidden')}</p>
              <p className="text-2xl font-bold text-red-600">{stats.hidden}</p>
            </div>
            <XCircle className="w-8 h-8 md:w-10 md:h-10 text-red-600" />
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar categoría..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Categories Table/Cards */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 md:p-12 text-center w-full">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      ) : (
        <CategoriesTable
          categories={categories}
          onDelete={handleDelete}
          onToggleFeatured={handleToggleFeatured}
        />
      )}

      {/* Paginación */}
      {!loading && total > LIMIT && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow px-4 py-3">
          <p className="text-sm text-gray-500">
            {total} categorías — página {page} de {lastPage}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: lastPage }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === lastPage || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === item
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Featured Image Upload Modal */}
      <FeaturedImageModal
        isOpen={featuredImageModal.isOpen}
        onUpload={handleFeaturedImageUploadFromList}
        onCancel={() => setFeaturedImageModal({ isOpen: false, categoryUuid: null })}
        isUploading={isUploadingFeaturedImage}
      />
    </div>
  );
}
