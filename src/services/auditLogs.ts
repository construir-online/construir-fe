import { apiClient } from '@/lib/api';
import type { AuditLogsResponse, AuditLogFilters } from '@/types';

export const auditLogsService = {
  async getLogs(filters: AuditLogFilters = {}): Promise<AuditLogsResponse> {
    const params = new URLSearchParams();
    if (filters.resource) params.set('resource', filters.resource);
    if (filters.action) params.set('action', filters.action);
    if (filters.userId !== undefined) params.set('userId', String(filters.userId));
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.limit !== undefined) params.set('limit', String(filters.limit));
    if (filters.offset !== undefined) params.set('offset', String(filters.offset));

    const query = params.toString();
    return apiClient.get<AuditLogsResponse>(`/admin/audit-logs${query ? `?${query}` : ''}`);
  },
};
