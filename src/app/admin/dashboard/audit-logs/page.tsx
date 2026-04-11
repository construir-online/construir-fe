'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ClipboardList, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { auditLogsService } from '@/services/auditLogs';
import { AuditAction, AuditResource } from '@/lib/enums';
import type { AuditLog, AuditLogFilters } from '@/types';

const LIMIT = 50;

const ACTION_COLORS: Record<AuditAction, string> = {
  [AuditAction.CREATE]: 'bg-green-100 text-green-800',
  [AuditAction.UPDATE]: 'bg-blue-100 text-blue-800',
  [AuditAction.DELETE]: 'bg-red-100 text-red-800',
  [AuditAction.BULK]: 'bg-purple-100 text-purple-800',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-VE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AuditLogsPage() {
  const t = useTranslations('auditLogs');

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [resource, setResource] = useState<AuditResource | ''>('');
  const [action, setAction] = useState<AuditAction | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detail modal
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const filters: AuditLogFilters = {
        limit: LIMIT,
        offset: (page - 1) * LIMIT,
      };
      if (resource) filters.resource = resource;
      if (action) filters.action = action;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await auditLogsService.getLogs(filters);
      setLogs(result.logs);
      setTotal(result.total);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, resource, action, startDate, endDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleClearFilters = () => {
    setResource('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / LIMIT);
  const hasFilters = resource || action || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardList className="w-7 h-7 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <span className="ml-auto text-sm text-gray-500">{total} registros</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{t('filters')}</span>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <X className="w-3 h-3" />
              {t('clearFilters')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            value={resource}
            onChange={(e) => { setResource(e.target.value as AuditResource | ''); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('allResources')}</option>
            {Object.values(AuditResource).map((r) => (
              <option key={r} value={r}>{t(`resources.${r}`)}</option>
            ))}
          </select>

          <select
            value={action}
            onChange={(e) => { setAction(e.target.value as AuditAction | ''); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('allActions')}</option>
            {Object.values(AuditAction).map((a) => (
              <option key={a} value={a}>{t(`actions.${a}`)}</option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('startDate')}
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('endDate')}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">{t('noLogs')}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('date')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('action')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('resource')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelected(log)}
                >
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p className="font-medium text-gray-900">{log.userFullName}</p>
                    <p className="text-gray-500 text-xs">{log.userEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}`}>
                      {t(`actions.${log.action}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {t(`resources.${log.resource}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono truncate max-w-[160px]">
                    {log.resourceId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-white border rounded-lg">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-gray-900">{t('detailTitle')}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('date')}</p>
                  <p className="font-medium">{formatDate(selected.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('user')}</p>
                  <p className="font-medium">{selected.userFullName}</p>
                  <p className="text-gray-500 text-xs">{selected.userEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('action')}</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ACTION_COLORS[selected.action] || 'bg-gray-100 text-gray-800'}`}>
                    {t(`actions.${selected.action}`)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('resource')}</p>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    {t(`resources.${selected.resource}`)}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">ID</p>
                <p className="font-mono text-xs bg-gray-50 p-2 rounded break-all">{selected.resourceId}</p>
              </div>
              {selected.ipAddress && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">IP</p>
                  <p className="font-mono text-xs">{selected.ipAddress}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-2">Detalles</p>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64 whitespace-pre-wrap">
                  {JSON.stringify(selected.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
