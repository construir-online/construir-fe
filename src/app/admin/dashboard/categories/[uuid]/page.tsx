'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { categoriesService } from '@/services/categories';
import type { Category } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Upload, Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { Toggle } from '@/components/ui/Toggle';
import { ConfirmModal } from '@/components/ConfirmModal';
import { FeaturedImageModal } from '@/components/admin/FeaturedImageModal';

interface CategoryFormData {
  name: string;
  customName: string;
  slug: string;
  description: string;
  parentUuid: string;
  visible: boolean;
  isFeatured: boolean;
}

export default function EditCategoryPage() {
  const t = useTranslations('categories');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const uuid = params.uuid as string;
  const toast = useToast();

  const [category, setCategory] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [initialParentUuid, setInitialParentUuid] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [deleteImageModal, setDeleteImageModal] = useState<{
    isOpen: boolean;
    requiresConfirmation: boolean;
    message?: string;
  }>({
    isOpen: false,
    requiresConfirmation: false,
  });
  const [featuredImageModal, setFeaturedImageModal] = useState({
    isOpen: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isSubmitting },
    watch,
    setValue
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

  const parentUuidValue = watch('parentUuid');
  const isFeaturedValue = watch('isFeatured');

  useEffect(() => {
    if (uuid) {
      loadCategory();
      loadParentCategories();
    }
  }, [uuid]);

  const loadCategory = async () => {
    try {
      setIsLoading(true);
      const data = await categoriesService.getByUuid(uuid);
      setCategory(data);

      // Reset form with loaded data
      const parentUuid = data.parent?.uuid || '';
      setInitialParentUuid(parentUuid);

      reset({
        name: data.name,
        customName: data.customName ?? '',
        slug: data.slug,
        description: data.description || '',
        parentUuid: parentUuid,
        visible: data.visible,
        isFeatured: data.isFeatured,
      });
    } catch (error) {
      console.error('Error loading category:', error);
      toast.error(tCommon('error'));
      router.push('/admin/dashboard/categories');
    } finally {
      setIsLoading(false);
    }
  };

  const loadParentCategories = async () => {
    try {
      const parents = await categoriesService.getParents();
      // Filter out the current category to prevent self-assignment
      const availableParents = parents.filter(p => p.uuid !== uuid);
      setParentCategories(availableParents);
    } catch (error) {
      console.error('Error loading parent categories:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleUploadImage = async () => {
    if (!imageFile) {
      toast.error('Por favor selecciona una imagen');
      return;
    }

    try {
      setIsUploadingImage(true);
      const updatedCategory = await categoriesService.uploadImage(uuid, imageFile);
      setCategory(updatedCategory);
      setImageFile(null);
      toast.success(t('imageUploadSuccess'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('imageUploadError'));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImageClick = async () => {
    try {
      setIsDeletingImage(true);
      // Primera llamada sin confirmación
      const response = await categoriesService.deleteImage(uuid, false);

      if (response.requiresConfirmation) {
        // Mostrar modal de confirmación
        setDeleteImageModal({
          isOpen: true,
          requiresConfirmation: true,
          message: response.message,
        });
      } else {
        // Eliminación exitosa sin confirmación (categoría no destacada)
        if (response.category) {
          setCategory(response.category);
        }
        toast.success(t('imageDeleteSuccess'));
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(t('imageDeleteError'));
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleDeleteImageConfirm = async () => {
    try {
      setIsDeletingImage(true);
      // Segunda llamada con confirmación
      const response = await categoriesService.deleteImage(uuid, true);

      if (response.category) {
        setCategory(response.category);
        // Actualizar el formulario para reflejar que ya no es destacada
        reset({
          name: response.category.name,
          customName: response.category.customName ?? '',
          slug: response.category.slug,
          description: response.category.description || '',
          parentUuid: response.category.parent?.uuid || '',
          visible: response.category.visible,
          isFeatured: response.category.isFeatured,
        });
      }

      setDeleteImageModal({ isOpen: false, requiresConfirmation: false });
      toast.success(t('imageDeleteSuccess'));
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(t('imageDeleteError'));
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleFeaturedToggle = (checked: boolean, fieldOnChange: (value: boolean) => void) => {
    // Si se está desmarcando, siempre permitir
    if (!checked) {
      fieldOnChange(false);
      return;
    }

    // Si se está marcando Y ya tiene imagen, permitir
    if (category?.image || imageFile) {
      fieldOnChange(true);
      return;
    }

    // Si se está marcando SIN imagen, abrir modal
    setFeaturedImageModal({ isOpen: true });
  };

  const handleFeaturedImageUpload = async (file: File) => {
    try {
      setIsUploadingImage(true);

      // Usar update() que envía AMBOS: imagen + isFeatured al backend
      const updatedCategory = await categoriesService.update(
        uuid,
        { isFeatured: true },
        file
      );

      setCategory(updatedCategory);
      setValue('isFeatured', true);
      setFeaturedImageModal({ isOpen: false });

      toast.success(t('imageUploadedAndFeatured'));
    } catch (error) {
      console.error('Error uploading image for featured category:', error);
      toast.error(t('imageUploadError'));
      throw error; // Re-throw para que el modal maneje el estado
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    if (!category) return;
    try {
      // Validación: no se puede marcar como destacada si no tiene imagen y no se está subiendo una
      if (data.isFeatured && !category.image && !imageFile) {
        setError('isFeatured', {
          type: 'manual',
          message: t('imageRequiredForFeatured')
        });
        toast.error(t('imageRequiredForFeatured'));
        return;
      }

      // Update category data
      await categoriesService.update(uuid, {
        // name bloqueado si viene del ERP (externalCode !== null)
        ...(category.externalCode == null ? { name: data.name } : {}),
        customName: data.customName || null,
        slug: data.slug,
        description: data.description || undefined,
        visible: data.visible,
        isFeatured: data.isFeatured,
      }, imageFile || undefined);

      // If parent has changed, update it
      if (data.parentUuid !== initialParentUuid) {
        await categoriesService.assignParent(uuid, {
          parentUuid: data.parentUuid || null
        });
      }

      toast.success(t('updateSuccess'));
      router.push('/admin/dashboard/categories');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(t('updateError'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return <div className="p-8 text-center text-gray-500">{t('noCategories')}</div>;
  }

  const hasChildren = category.childrens && category.childrens.length > 0;

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-0">
      <div className="flex items-center gap-3 md:gap-4">
        <Link href="/admin/dashboard/categories" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('editTitle')}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              {t('nameLabel')} <span className="text-red-500">*</span>
            </label>
            {category.externalCode != null ? (
              <>
                <input
                  type="text"
                  id="name"
                  value={category.name}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <span>⚠</span> Este nombre viene del ERP y no puede modificarse. Usa &ldquo;Nombre en tienda&rdquo; para personalizarlo.
                </p>
              </>
            ) : (
              <>
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
              </>
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
          </div>

          {/* Parent Category */}
          <div>
            <label htmlFor="parentUuid" className="block text-sm font-medium text-gray-700">
              {t('parentCategoryLabel')}
            </label>
            {hasChildren ? (
              <div className="mt-1">
                <div className="px-3 py-2 border border-amber-300 rounded-md bg-amber-50 text-amber-800 text-sm">
                  {t('cannotChangeParentHasChildren', { count: category.childrens?.length || 0 })}
                </div>
                <p className="mt-1 text-sm text-gray-500">{t('removeChildrenFirst')}</p>
              </div>
            ) : (
              <>
                <select
                  id="parentUuid"
                  {...register('parentUuid')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('noParent')}</option>
                  {parentCategories.map((cat) => (
                    <option key={cat.uuid} value={cat.uuid}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">{t('parentCategoryHelp')}</p>
                {parentUuidValue !== initialParentUuid && (
                  <p className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                    <span className="text-xs">ℹ</span>
                    {parentUuidValue ? 'Se asignará una categoría padre' : 'Se convertirá en categoría principal'}
                  </p>
                )}
              </>
            )}
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
              {isFeaturedValue && !category.image && <span className="text-red-500 ml-1">*</span>}
            </label>
            {isFeaturedValue && !category.image && (
              <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
                <span className="text-xs">⚠</span>
                {t('imageRequiredWarning')}
              </p>
            )}

            {/* Current Image Display */}
            {category.image && (
              <div className="mt-2 mb-4">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{t('currentImage')}</p>
                <button
                  type="button"
                  onClick={handleDeleteImageClick}
                  disabled={isDeletingImage}
                  className="mt-2 flex items-center gap-2 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeletingImage ? 'Eliminando...' : t('deleteImage')}
                </button>
              </div>
            )}

            {/* File Input */}
            <input
              type="file"
              id="image"
              name="image"
              onChange={handleFileChange}
              accept="image/jpeg, image/png, image/webp"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
            />

            {/* New Image Preview and Upload */}
            {imageFile && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  {t('newImageSelected', { filename: imageFile.name })}
                </p>
                <button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={isUploadingImage}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingImage ? 'Subiendo...' : (category.image ? t('replaceImage') : t('uploadImage'))}
                </button>
              </div>
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
                  onChange={(checked) => handleFeaturedToggle(checked, field.onChange)}
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

      {/* Delete Image Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteImageModal.isOpen}
        title={t('deleteImage')}
        message={deleteImageModal.message || t('deleteImageConfirm')}
        confirmText={t('deleteImage')}
        cancelText="Cancelar"
        onConfirm={handleDeleteImageConfirm}
        onCancel={() => setDeleteImageModal({ isOpen: false, requiresConfirmation: false })}
      />

      {/* Featured Image Upload Modal */}
      <FeaturedImageModal
        isOpen={featuredImageModal.isOpen}
        onUpload={handleFeaturedImageUpload}
        onCancel={() => setFeaturedImageModal({ isOpen: false })}
        isUploading={isUploadingImage}
      />
    </div>
  );
}
