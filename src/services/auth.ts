import { apiClient } from "@/lib/api";
import type { User, RegisterDto, LoginDto, LoginResponse } from "@/types";

export const authService = {
  async register(data: RegisterDto): Promise<User> {
    return apiClient.post<User>("/users/register", data);
  },

  async login(data: LoginDto): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>("/auth/login", data);
  },

  async getProfile(): Promise<User> {
    return apiClient.get<User>("/auth/profile");
  },

  /**
   * Cierra la sesión en el servidor.
   *
   * Hace falta este viaje porque la cookie de sesión es `httpOnly` y el
   * JavaScript del navegador no puede borrarla: sólo el backend, respondiendo
   * con un `Set-Cookie` vencido, la mata de verdad.
   */
  async logout(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>("/auth/logout");
  },

  /**
   * `alreadyVerified` viene en true cuando el enlace ya se había usado. No es
   * un error: la cuenta quedó activa igual, sólo cambia el texto. Opcional
   * porque un backend anterior a ese cambio no lo manda.
   */
  async verifyEmail(
    token: string,
  ): Promise<{ message: string; alreadyVerified?: boolean }> {
    return apiClient.get<{ message: string; alreadyVerified?: boolean }>(
      `/users/verify-email?token=${encodeURIComponent(token)}`,
    );
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>("/users/resend-verification", { email });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>("/auth/forgot-password", { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>("/auth/reset-password", { token, newPassword });
  },
};
