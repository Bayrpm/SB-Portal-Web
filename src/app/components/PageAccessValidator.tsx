"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

interface PageAccessValidatorProps {
  pagePath: string;
  children: React.ReactNode;
}

/**
 * Componente que valida si el usuario tiene acceso a una página
 * Si no tiene acceso, muestra una pantalla de "Acceso Denegado" y redirige
 */
export default function PageAccessValidator({
  pagePath,
  children,
}: PageAccessValidatorProps) {
  const router = useRouter();
  const { isPageAllowed } = useUser();
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!isPageAllowed(pagePath)) {
      console.warn(`Usuario no tiene acceso a ${pagePath}`);
      setAccessDenied(true);

      // Redirigir después de 2 segundos
      const timer = setTimeout(() => {
        router.push("/portal");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isPageAllowed, pagePath, router]);

  if (accessDenied) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">
            Acceso Denegado
          </h1>
          <p className="text-gray-600 mb-6">
            No tienes permiso para acceder a esta página.
          </p>
          <p className="text-sm text-gray-500">
            Serás redirigido al portal en unos momentos...
          </p>
          <button
            onClick={() => router.push("/portal")}
            className="mt-6 px-6 py-2 bg-[#003C96] text-white rounded-lg hover:bg-[#0085CA] transition-colors"
          >
            Ir al Portal
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
