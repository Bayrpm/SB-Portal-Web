"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Loader from "@/app/components/Loader";

/**
 * HOC (Higher Order Component) para proteger rutas que requieren permisos específicos
 * Uso: envolver el componente de página que requiere protección
 */
export function withPageProtection<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ProtectedPage(props: P) {
    const router = useRouter();
    const pathname = usePathname();
    const { role, isPageAllowed } = useUser();
    const isLoading = role === null;

    useEffect(() => {
      // Si no hay rol cargado aún, esperar
      if (isLoading) return;

      // Si no está autenticado, redirigir al login
      if (role === null) {
        router.push("/");
        return;
      }

      // Si es el dashboard, siempre permitir
      if (pathname === "/portal/dashboard") {
        return;
      }

      // Verificar si la página está permitida
      if (!isPageAllowed(pathname)) {
        router.push("/unauthorized");
        return;
      }
    }, [role, pathname, isLoading, isPageAllowed, router]);

    // Mostrar loader mientras se verifica
    if (isLoading) {
      return <Loader text="Verificando permisos..." />;
    }

    // Si no está autenticado, no renderizar nada (está redirigiendo)
    if (role === null) {
      return null;
    }

    // Si es dashboard o tiene permiso, renderizar el componente
    if (pathname === "/portal/dashboard" || isPageAllowed(pathname)) {
      return <Component {...props} />;
    }

    // Si no tiene permiso, no renderizar (está redirigiendo)
    return null;
  };
}
