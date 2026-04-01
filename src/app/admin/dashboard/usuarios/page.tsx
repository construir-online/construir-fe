'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usersService } from '@/services/users';
import type { User, UserStats, UserRole } from '@/types';
import { PlusCircle, Search, Users as UsersIcon, UserCheck, UserX, Trash2, RefreshCw, Mail } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function UsersPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const tRoles = useTranslations('roles');
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<boolean | 'all'>('all');
  const [showDeleted, setShowDeleted] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;

  // Modal state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; userUuid: string | null }>({
    isOpen: false,
    userUuid: null,
  });

  useEffect(() => {
    // Load current user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [page, search, roleFilter, statusFilter, showDeleted]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        usersService.getAll({
          page,
          limit,
          search: search || undefined,
          role: roleFilter,
          isActive: statusFilter,
          includeDeleted: showDeleted,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        }),
        usersService.getStats().catch(() => null), // Stats might not exist in backend
      ]);

      setUsers(usersData.data);
      setTotalPages(usersData.lastPage);
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(tCommon('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    try {
      await usersService.delete(uuid);
      toast.success(t('deleteSuccess'));
      setDeleteModal({ isOpen: false, userUuid: null });
      await loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(t('deleteError'));
    }
  };

  const handleToggleActive = async (uuid: string, currentlyActive: boolean) => {
    try {
      await usersService.toggleActive(uuid);
      toast.success(currentlyActive ? t('deactivateSuccess') : t('activateSuccess'));
      await loadData();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(currentlyActive ? t('deactivateError') : t('activateError'));
    }
  };

  const handleRestore = async (uuid: string) => {
    try {
      await usersService.restore(uuid);
      toast.success(t('restoreSuccess'));
      await loadData();
    } catch (error) {
      console.error('Error restoring user:', error);
      toast.error(t('restoreError'));
    }
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

  const getStatusBadgeColor = (isActive: boolean, deletedAt: string | null) => {
    if (deletedAt) return 'bg-red-100 text-red-800';
    return isActive ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  };

  const getStatusText = (isActive: boolean, deletedAt: string | null) => {
    if (deletedAt) return t('deleted');
    return isActive ? t('active') : t('inactive');
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const isCurrentUser = (uuid: string) => currentUser?.uuid === uuid;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard/invitaciones"
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Mail className="w-5 h-5" />
            Invitaciones
          </Link>
          <Link
            href="/admin/dashboard/usuarios/nuevo"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            {t('newUser')}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">{t('total')}</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">{t('activeCount')}</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-lg">
                <UserX className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">{t('inactiveCount')}</p>
                <p className="text-3xl font-bold text-orange-600">{stats.inactive}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">{t('deletedCount')}</p>
                <p className="text-3xl font-bold text-red-600">{stats.deleted}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('filters')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as UserRole | 'all');
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('all')}</option>
            <option value="admin">{tRoles('admin')}</option>
            <option value="order_admin">{tRoles('order_admin')}</option>
            <option value="customer">{tRoles('customer')}</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter === 'all' ? 'all' : statusFilter ? 'active' : 'inactive'}
            onChange={(e) => {
              const value = e.target.value;
              setStatusFilter(value === 'all' ? 'all' : value === 'active');
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('all')}</option>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>

          {/* Show Deleted Toggle */}
          <button
            onClick={() => {
              setShowDeleted(!showDeleted);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showDeleted
                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showDeleted ? t('hideDeleted') : t('showDeleted')}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">{t('loading')}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('noUsers')}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Usuario</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{t('email')}</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{t('role')}</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{t('status')}</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{t('createdAt')}</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.uuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                            {getInitials(user.firstName, user.lastName)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {tRoles(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(
                            user.isActive,
                            user.deletedAt
                          )}`}
                        >
                          {getStatusText(user.isActive, user.deletedAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.deletedAt ? (
                            <button
                              onClick={() => handleRestore(user.uuid)}
                              className="text-green-600 hover:text-green-800 font-medium text-sm"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          ) : (
                            <>
                              <Link
                                href={`/admin/dashboard/usuarios/${user.uuid}`}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                              >
                                {t('edit')}
                              </Link>
                              {!isCurrentUser(user.uuid) && (
                                <>
                                  <button
                                    onClick={() => handleToggleActive(user.uuid, user.isActive)}
                                    className={`font-medium text-sm ${
                                      user.isActive
                                        ? 'text-orange-600 hover:text-orange-800'
                                        : 'text-green-600 hover:text-green-800'
                                    }`}
                                  >
                                    {user.isActive ? t('deactivate') : t('activate')}
                                  </button>
                                  <button
                                    onClick={() => setDeleteModal({ isOpen: true, userUuid: user.uuid })}
                                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                                  >
                                    {t('softDelete')}
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tCommon('back')}
                </button>
                <span className="text-sm text-gray-700">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('confirmDelete')}</h3>
            <p className="text-gray-700 mb-6">{t('confirmDeleteMessage')}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ isOpen: false, userUuid: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={() => deleteModal.userUuid && handleDelete(deleteModal.userUuid)}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                {tCommon('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
