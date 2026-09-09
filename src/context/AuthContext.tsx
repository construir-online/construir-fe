"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { authService } from "@/services/auth";
import type { User, LoginDto, RegisterDto, UserRole } from "@/types";
import type { Permission } from "@/lib/permissions";
import { hasPermission as checkPermission, isAdmin as checkIsAdmin } from "@/lib/permissions";

interface AuthContextType {
  user: User | null;
  /**
   * Reemplaza al antiguo `token`.
   *
   * El token ya no está al alcance de este código: vive en una cookie
   * `httpOnly` que pone el backend. Lo único que el navegador puede saber es
   * si esa cookie sirve, y eso lo contesta `GET /auth/profile`.
   */
  isAuthenticated: boolean;
  loading: boolean;
  userRole: UserRole | null;
  hasPermission: (permission: Permission) => boolean;
  isAdmin: boolean;
  login: (data: LoginDto) => Promise<User>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Computed values based on user role
  const userRole = user?.role ?? null;
  const isAdmin = checkIsAdmin(userRole);

  const hasPermission = useCallback(
    (permission: Permission) => {
      return checkPermission(userRole, permission);
    },
    [userRole]
  );

  useEffect(() => {
    // Antes esto miraba `localStorage.getItem("token")` y sólo preguntaba al
    // servidor si había algo guardado. Con la cookie `httpOnly` no hay nada que
    // mirar, así que se pregunta siempre: la respuesta de `/auth/profile` es la
    // que dice si hay sesión.
    //
    // `loading` arranca en `true` y no baja hasta que el servidor conteste. Es
    // deliberado: quien pinte según la sesión tiene que esperar acá, o la app
    // parpadearía de "invitado" a "con sesión" en cada carga — y el carrito,
    // que reacciona a esto, mostraría el carrito de invitado por un instante a
    // alguien que ya tiene el suyo en el servidor.
    let vigente = true;

    authService
      .getProfile()
      .then((userData) => {
        if (vigente) setUser(userData);
      })
      .catch(() => {
        // 401 (sin cookie o vencida) o la API caída: en ambos casos, invitado.
        if (vigente) setUser(null);
      })
      .finally(() => {
        if (vigente) setLoading(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  const login = async (data: LoginDto): Promise<User> => {
    // El backend responde con `Set-Cookie: token=…; HttpOnly`. Acá no se
    // guarda nada: ni `localStorage`, ni `document.cookie`. El `access_token`
    // que sigue viniendo en el cuerpo se ignora a propósito — guardarlo en
    // algún lado sería volver a abrir el hueco que se está cerrando.
    const response = await authService.login(data);
    setUser(response.user);
    return response.user;
  };

  const register = async (data: RegisterDto) => {
    // Register the user — email verification is required before login
    await authService.register(data);
  };

  const logout = useCallback(async () => {
    // La cookie es `httpOnly`: el JavaScript del cliente NO puede borrarla.
    // Sólo el servidor, con un `Set-Cookie` vencido, cierra la sesión de
    // verdad. Antes bastaba con un `document.cookie` acá.
    try {
      await authService.logout();
    } catch {
      // Si la API no responde igual se limpia la vista; la cookie seguiría viva
      // hasta caducar, pero dejar al usuario "adentro" en pantalla es peor.
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        userRole,
        hasPermission,
        isAdmin,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
