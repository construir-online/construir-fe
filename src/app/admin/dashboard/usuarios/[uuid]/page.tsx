'use client';

import { authService } from '@/services/auth';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { usersService } from '@/services/users';
import type { User, UpdateUserDto, UserRole } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Save, Shield, Key, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { Toggle } from '@/components/ui/Toggle';

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

export default function EditUserPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const tRoles = useTranslations('roles');
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const uuid = params.uuid as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modal states
  const [changeRoleModal, setChangeRoleModal] = useState<{ isOpen: boolean; newRole: UserRole | null }>({
    isOpen: false,
    newRole: null,
  });
  const [resetPasswordModal, setResetPasswordModal] = useState<{ isOpen: boolean; password: string }>({
    isOpen: false,
    password: '',
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      isActive: true,
    },
  });

  useEffect(() => {
    // Del servidor, por lo mismo que en el listado: leerlo de
    // `localStorage['user']` daba siempre `null`, así que la pantalla nunca
    // reconocía que el administrador se estaba editando a sí mismo.
    let vigente = true;
    authService
      .getProfile()
      .then((perfil) => { if (vigente) setCurrentUser(perfil); })
      .catch(() => { /* el layout ya manda a login si no hay sesión */ });
    loadUser();
    return () => { vigente = false; };
  }, [uuid]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await usersService.getByUuid(uuid);
      setUser(userData);
      reset({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        isActive: userData.isActive,
      });
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      const updateData: UpdateUserDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        isActive: data.isActive,
      };

      await usersService.update(uuid, updateData);
      toast.success(t('updateSuccess'));
      await loadUser();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(t('updateError'));
    }
  };

  const handleChangeRole = async () => {
    if (!changeRoleModal.newRole) return;

    try {
      await usersService.changeRole(uuid, { role: changeRoleModal.newRole });
      toast.success(t('changeRoleSuccess'));
      setChangeRoleModal({ isOpen: false, newRole: null });
      await loadUser();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error(t('changeRoleError'));
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordModal.password || resetPasswordModal.password.length < 6) {
      toast.error(t('passwordMinLength'));
      return;
    }

    try {
      await usersService.resetPassword(uuid, { newPassword: resetPasswordModal.password });
      toast.success(t('resetPasswordSuccess'));
      setResetPasswordModal({ isOpen: false, password: '' });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(t('resetPasswordError'));
    }
  };

  const handleToggleActive = async () => {
    try {
      await usersService.toggleActive(uuid);
      toast.success(user?.isActive ? t('deactivateSuccess') : t('activateSuccess'));
      await loadUser();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(user?.isActive ? t('deactivateError') : t('activateError'));
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'order_admin':
        return 'bg-purple-100 text-purple-800';
      case 'customer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isCurrentUser = currentUser?.uuid === uuid;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">{t('loading')}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">{t('loadError')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/dashboard/usuarios"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToList')}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{t('editUser')}</h1>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl flex-shrink-0">
            {getInitials(user.firstName, user.lastName)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-600 mb-3">{user.email}</p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded ${getRoleBadgeColor(user.role)}`}>
                {tRoles(user.role)}
              </span>
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                }`}
              >
                {user.isActive ? t('active') : t('inactive')}
              </span>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>
                {t('createdOn')}: {new Date(user.createdAt).toLocaleDateString()}
              </p>
              <p>
                {t('updatedOn')}: {new Date(user.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() =>
            isCurrentUser
              ? toast.error(t('cannotEditOwnRole'))
              : setChangeRoleModal({ isOpen: true, newRole: user.role })
          }
          disabled={isCurrentUser}
          className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="p-3 bg-purple-50 rounded-lg">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{t('changeRoleButton')}</h3>
            <p className="text-sm text-gray-600">Modificar permisos</p>
          </div>
        </button>

        <button
          onClick={() => setResetPasswordModal({ isOpen: true, password: '' })}
          className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="p-3 bg-blue-50 rounded-lg">
            <Key className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{t('resetPasswordButton')}</h3>
            <p className="text-sm text-gray-600">Nueva contraseña</p>
          </div>
        </button>

        <button
          onClick={() => (isCurrentUser ? toast.error(t('cannotDeactivateSelf')) : handleToggleActive())}
          disabled={isCurrentUser}
          className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className={`p-3 rounded-lg ${user.isActive ? 'bg-orange-50' : 'bg-green-50'}`}>
            {user.isActive ? (
              <UserX className="w-6 h-6 text-orange-600" />
            ) : (
              <UserCheck className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{user.isActive ? t('deactivate') : t('activate')}</h3>
            <p className="text-sm text-gray-600">{user.isActive ? 'Desactivar acceso' : 'Reactivar acceso'}</p>
          </div>
        </button>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('basicInfo')}</h2>

        <div className="space-y-6">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              {t('firstName')} *
            </label>
            <input
              id="firstName"
              type="text"
              {...register('firstName', {
                required: t('firstNameRequired'),
                minLength: {
                  value: 2,
                  message: 'Mínimo 2 caracteres',
                },
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              {t('lastName')} *
            </label>
            <input
              id="lastName"
              type="text"
              {...register('lastName', {
                required: t('lastNameRequired'),
                minLength: {
                  value: 2,
                  message: 'Mínimo 2 caracteres',
                },
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('email')} *
            </label>
            <input
              id="email"
              type="email"
              {...register('email', {
                required: t('emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('emailInvalid'),
                },
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          {/* Is Active */}
          <div>
            <label className="flex items-center gap-3">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Toggle
                    id="isActive"
                    label=""
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <span className="text-sm font-medium text-gray-700">{t('isActiveLabel')}</span>
            </label>
            <p className="mt-1 text-sm text-gray-500">Los usuarios inactivos no podrán iniciar sesión</p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
          <Link
            href="/admin/dashboard/usuarios"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
          >
            {tCommon('cancel')}
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? t('saving') : t('save')}
          </button>
        </div>
      </form>

      {/* Change Role Modal */}
      {changeRoleModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('changeRoleTitle')}</h3>
            <p className="text-gray-700 mb-4">{t('confirmChangeRole')}</p>
            <div className="mb-6">
              <label htmlFor="newRole" className="block text-sm font-medium text-gray-700 mb-2">
                {t('role')}
              </label>
              <select
                id="newRole"
                value={changeRoleModal.newRole || user.role}
                onChange={(e) =>
                  setChangeRoleModal({ ...changeRoleModal, newRole: e.target.value as UserRole })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="customer">{tRoles('customer')}</option>
                <option value="order_admin">{tRoles('order_admin')}</option>
                <option value="admin">{tRoles('admin')}</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setChangeRoleModal({ isOpen: false, newRole: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={handleChangeRole}
                className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                {t('changeRole')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('resetPasswordTitle')}</h3>
            <p className="text-gray-700 mb-4">{t('confirmResetPassword')}</p>
            <div className="mb-6">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('newPassword')}
              </label>
              <input
                id="newPassword"
                type="password"
                value={resetPasswordModal.password}
                onChange={(e) => setResetPasswordModal({ ...resetPasswordModal, password: e.target.value })}
                placeholder={t('newPasswordPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setResetPasswordModal({ isOpen: false, password: '' })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={handleResetPassword}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {t('resetPassword')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
