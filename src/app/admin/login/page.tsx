'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { authService } from '@/services/auth';
import { loginErrorKey } from '@/lib/auth-errors';
import { getDefaultAdminPath } from '@/lib/permissions';

export default function AdminLoginPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });

      // Store token in localStorage and cookie
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Set cookie for middleware with proper attributes for production
      const isProduction = window.location.protocol === 'https:';
      const cookieAttributes = [
        `token=${response.access_token}`,
        'path=/',
        `max-age=${60 * 60 * 24 * 7}`, // 7 days
        'SameSite=Lax',
        isProduction ? 'Secure' : ''
      ].filter(Boolean).join('; ');

      document.cookie = cookieAttributes;

      // Smart redirect based on user role
      // ADMIN → /admin/dashboard
      // ORDER_ADMIN → /admin/dashboard/ordenes
      // USER → /
      const redirectPath = getDefaultAdminPath(response.user.role);
      router.push(redirectPath);
    } catch (err: unknown) {
      // Mismo criterio que la pantalla de la tienda: nunca el `err.message`
      // crudo del backend, que llega en inglés y con redacción de log.
      setError(t(`loginErrors.${loginErrorKey(err)}`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/construir-logo.png"
            alt="Construir Logo"
            width={200}
            height={60}
            priority
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Panel de Administración
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Ingresa tus credenciales para continuar
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin@construir.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
