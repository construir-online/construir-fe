'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { categoriesService } from '@/services/categories';
import type { CreateCategoryDto, Category } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { Toggle } from '@/components/ui/Toggle';

interface CategoryFormData {
  name: string;
  customName: string;
  slug: string;
  description: string;
  parentUuid: string;
  visible: boolean;
  isFeatured: boolean;
}

export default function NewCategoryPage() {
  const t = useTranslations('categories');
  const router = useRouter();
  const toast = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      customName: '',
      slug: '',
      description: '',
      parentUuid: '',
      visible: true,
      isFeatured: false,
    },
  });

  const nameValue = watch('name');
  const slugValue = watch('slug');
  const isFeaturedValue = watch('isFeatured');

  useEffect(() => {
    loadParentCategories();
  }, []);

  // Auto-generate slug from name when name changes and slug is empty
  useEffect(() => {
    if (nameValue && !slugValue) {
      const newSlug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', newSlug);
    }
  }, [nameValue, slugValue, setValue]);

  const loadParentCategories = async () => {
    try {
      const parents = await categoriesService.getParents();
      setParentCategories(parents);
    } catch (error) {
      console.error('Error loading parent categories:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      // Validación: categorías destacadas requieren imagen
      if (data.isFeatured && !imageFile) {
        setError('isFeatured', {
          type: 'manual',
          message: t('imageRequiredForFeatured')
        });
        toast.error(t('imageRequiredForFeatured'));
        return;
      }

      const createData: CreateCategoryDto = {
        name: data.name,
        customName: data.customName || undefined,
        slug: data.slug,
        description: data.description || undefined,
        visible: data.visible,
        isFeatured: data.isFeatured,
      };

      // First, create the category
      const newCategory = await categoriesService.create(createData, imageFile || undefined);

      // If a parent was selected, assign it
      if (data.parentUuid) {
        await categoriesService.assignParent(newCategory.uuid, { parentUuid: data.parentUuid });
      }

      toast.success(t('createSuccess'));
      router.push('/admin/dashboard/categories');
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error(t('createError'));
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-0">
      <div className="flex items-center gap-3 md:gap-4">
        <Link href="/admin/dashboard/categories" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('createTitle')}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              {t('nameLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              {...register('name', {
                required: 'El nombre es requerido',
                minLength: { value: 2, message: 'El nombre debe tener al menos 2 caracteres' },
                maxLength: { value: 100, message: 'El nombre no puede exceder 100 caracteres' },
              })}
              placeholder={t('namePlaceholder')}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                errors.name
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <span className="text-xs">⚠</span> {errors.name.message}
              </p>
            )}
          </div>

          {/* Custom Name */}
          <div>
            <label htmlFor="customName" className="block text-sm font-medium text-gray-700">
              Nombre en tienda
              <span className="ml-1 text-gray-400 font-normal text-xs">(opcional)</span>
            </label>
            <input
              type="text"
              id="customName"
              {...register('customName')}
              placeholder="Nombre visible para los clientes"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Si se deja vacío, se usará el nombre oficial.</p>
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              {t('slugLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="slug"
              {...register('slug', {
                required: 'El slug es requerido',
                pattern: {
                  value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                  message: 'El slug solo puede contener letras minúsculas, números y guiones',
                },
              })}
              placeholder={t('slugPlaceholder')}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                errors.slug
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <span className="text-xs">⚠</span> {errors.slug.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Se genera automáticamente desde el nombre. Puedes editarlo si lo deseas.
            </p>
          </div>

          {/* Parent Category */}
          <div>
            <label htmlFor="parentUuid" className="block text-sm font-medium text-gray-700">
              {t('parentCategoryLabel')}
            </label>
            <select
              id="parentUuid"
              {...register('parentUuid')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t('noParent')}</option>
              {parentCategories.map((category) => (
                <option key={category.uuid} value={category.uuid}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">{t('parentCategoryHelp')}</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              {t('descriptionLabel')}
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              placeholder="Descripción opcional de la categoría..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Image File */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              {t('imageLabel')}
              {isFeaturedValue && <span className="text-red-500 ml-1">*</span>}
            </label>
            {isFeaturedValue && (
              <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
                <span className="text-xs">⚠</span>
                {t('imageRequiredWarning')}
              </p>
            )}
            <input
              type="file"
              id="image"
              name="image"
              onChange={handleFileChange}
              accept="image/jpeg, image/png, image/webp"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
            />
            {imageFile && (
              <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                <span className="text-green-600">✓</span>
                {t('fileSelected', { filename: imageFile.name })}
              </p>
            )}
          </div>

          {/* Status and Visibility Section */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Estado y Visibilidad</h3>

            <Controller
              name="visible"
              control={control}
              render={({ field }) => (
                <Toggle
                  id="visible"
                  label={t('visibleLabel')}
                  description="La categoría estará visible para los usuarios en la tienda"
                  checked={field.value}
                  onChange={field.onChange}
                  color="green"
                />
              )}
            />

            <Controller
              name="isFeatured"
              control={control}
              render={({ field }) => (
                <Toggle
                  id="isFeatured"
                  label={t('isFeaturedLabel')}
                  description="La categoría aparecerá en la sección de categorías destacadas"
                  checked={field.value}
                  onChange={field.onChange}
                  color="yellow"
                />
              )}
            />
          </div>
        </div>

        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Link
            href="/admin/dashboard/categories"
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
