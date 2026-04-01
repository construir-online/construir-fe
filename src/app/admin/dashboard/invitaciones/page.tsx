'use client';

import { useState, useEffect } from 'react';
import { Mail, Search, PlusCircle, X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { invitationsService } from '@/services/invitations';
import type { Invitation } from '@/types';
import { useToast } from '@/context/ToastContext';

type StatusFilter = 'all' | 'pending' | 'used' | 'expired';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  used: 'Usada',
  expired: 'Expirada',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  used: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  order_admin: 'Gestor de Pedidos',
  customer: 'Cliente',
  user: 'Usuario',
};

function getInvitationStatus(inv: Invitation): string {
  if (inv.usedAt) return 'used';
  if (new Date(inv.expiresAt) < new Date()) return 'expired';
  return 'pending';
}

export default function InvitacionesPage() {
  const toast = useToast();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [emailSearch, setEmailSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Stats from current full load
  const [stats, setStats] = useState({ pending: 0, used: 0, expired: 0 });

  // Invite modal
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'customer', firstName: '', lastName: '' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Revoke modal
  const [revokeModal, setRevokeModal] = useState<{ open: boolean; uuid: string; email: string }>({
    open: false, uuid: '', email: '',
  });
  const [revokeLoading, setRevokeLoading] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, [page, statusFilter, emailSearch]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const res = await invitationsService.getAll({
        status: statusFilter,
        email: emailSearch || undefined,
        page,
        limit: 15,
      });
      setInvitations(res.data);
      setLastPage(res.lastPage);
      setTotal(res.total);

      // Load stats (all statuses for counts)
      const [p, u, e] = await Promise.all([
        invitationsService.getAll({ status: 'pending', limit: 1 }),
        invitationsService.getAll({ status: 'used', limit: 1 }),
        invitationsService.getAll({ status: 'expired', limit: 1 }),
      ]);
      setStats({ pending: p.total, used: u.total, expired: e.total });
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar invitaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);
    try {
      await invitationsService.invite({
        email: inviteForm.email,
        role: inviteForm.role || undefined,
        firstName: inviteForm.firstName || undefined,
        lastName: inviteForm.lastName || undefined,
      });
      toast.success('Invitación enviada correctamente');
      setInviteModal(false);
      setInviteForm({ email: '', role: 'customer', firstName: '', lastName: '' });
      setPage(1);
      await loadInvitations();
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Error al enviar la invitación');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevoke = async () => {
    setRevokeLoading(true);
    try {
      await invitationsService.revoke(revokeModal.uuid);
      toast.success('Invitación revocada');
      setRevokeModal({ open: false, uuid: '', email: '' });
      await loadInvitations();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al revocar');
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Invitaciones</h1>
        <button
          onClick={() => { setInviteError(''); setInviteModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          Invitar Usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="p-3 bg-yellow-50 rounded-lg"><Clock className="w-6 h-6 text-yellow-600" /></div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Usadas</p>
            <p className="text-2xl font-bold text-green-600">{stats.used}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-lg"><AlertCircle className="w-6 h-6 text-red-600" /></div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Expiradas</p>
            <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="used">Usadas</option>
            <option value="expired">Expiradas</option>
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por email..."
              value={emailSearch}
              onChange={(e) => { setEmailSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando invitaciones...</div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="mx-auto w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500">No hay invitaciones{statusFilter !== 'all' ? ` ${STATUS_LABELS[statusFilter]?.toLowerCase()}s` : ''}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Expira</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invitations.map((inv) => {
                    const status = getInvitationStatus(inv);
                    return (
                      <tr key={inv.uuid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{inv.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {inv.firstName || inv.lastName
                            ? `${inv.firstName ?? ''} ${inv.lastName ?? ''}`.trim()
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                            {ROLE_LABELS[inv.role] ?? inv.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}`}>
                            {STATUS_LABELS[status] ?? status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {status === 'pending' ? (
                            <button
                              onClick={() => setRevokeModal({ open: true, uuid: inv.uuid, email: inv.email })}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Revocar
                            </button>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">Página {page} de {lastPage} · {total} total</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === lastPage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Invite Modal ── */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Invitar Usuario</h2>
              <button onClick={() => setInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-5 space-y-4">
              {inviteError && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{inviteError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="customer">Cliente</option>
                  <option value="order_admin">Gestor de Pedidos</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-gray-400 text-xs">(opcional)</span></label>
                  <input
                    type="text"
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido <span className="text-gray-400 text-xs">(opcional)</span></label>
                  <input
                    type="text"
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {inviteLoading ? 'Enviando...' : 'Enviar Invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Revoke Modal ── */}
      {revokeModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Revocar invitación</h3>
            <p className="text-gray-600 mb-6">
              ¿Confirmas que quieres revocar la invitación de <strong>{revokeModal.email}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRevokeModal({ open: false, uuid: '', email: '' })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleRevoke}
                disabled={revokeLoading}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {revokeLoading ? 'Revocando...' : 'Revocar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
