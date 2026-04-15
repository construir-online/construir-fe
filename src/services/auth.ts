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

  async verifyEmail(token: string): Promise<{ message: string }> {
    return apiClient.get<{ message: string }>(`/users/verify-email?token=${encodeURIComponent(token)}`);
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
