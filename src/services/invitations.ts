import { apiClient } from "@/lib/api";
import type { Invitation, InvitationTokenInfo, InviteUserDto, CompleteRegistrationDto, User } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export type TokenValidationResult =
  | { status: 'ok'; data: InvitationTokenInfo }
  | { status: 'invalid' }
  | { status: 'used' }
  | { status: 'expired' };

export interface InvitationsPaginatedResponse {
  data: Invitation[];
  total: number;
  page: number;
  lastPage: number;
}

export const invitationsService = {
  // Admin: enviar invitación
  async invite(data: InviteUserDto): Promise<Invitation> {
    return apiClient.post<Invitation>("/users/admin/invite", data);
  },

  // Admin: listar invitaciones
  async getAll(params: {
    status?: string;
    email?: string;
    page?: number;
    limit?: number;
  }): Promise<InvitationsPaginatedResponse> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.email) query.set('email', params.email);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiClient.get<InvitationsPaginatedResponse>(
      `/users/admin/invitations${qs ? `?${qs}` : ''}`
    );
  },

  // Admin: revocar invitación
  async revoke(uuid: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/users/admin/invitations/${uuid}`);
  },

  // Público: validar token (raw fetch para distinguir 404 vs 410)
  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      const res = await fetch(`${API_URL}/users/invitation/${token}`);
      if (res.ok) {
        const data: InvitationTokenInfo = await res.json();
        return { status: 'ok', data };
      }
      if (res.status === 404) return { status: 'invalid' };
      if (res.status === 410) {
        const body = await res.json().catch(() => ({ message: '' }));
        const msg: string = Array.isArray(body.message) ? body.message[0] : body.message ?? '';
        return msg.toLowerCase().includes('usado') || msg.toLowerCase().includes('used')
          ? { status: 'used' }
          : { status: 'expired' };
      }
      return { status: 'invalid' };
    } catch {
      return { status: 'invalid' };
    }
  },

  // Público: completar registro
  async completeRegistration(data: CompleteRegistrationDto): Promise<User> {
    return apiClient.post<User>("/users/register/invitation", data);
  },
};
