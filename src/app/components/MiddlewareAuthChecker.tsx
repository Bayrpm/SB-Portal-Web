"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Swal from "sweetalert2";

export default function MiddlewareAuthChecker() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Interceptar la navegación para detectar headers del middleware
    const checkAuth = async () => {
      try {
        const response = await fetch(pathname, { method: "HEAD" });
        const unauthorized = response.headers.get("x-middleware-unauthorized");
        const message = response.headers.get("x-middleware-message");

        if (unauthorized === "true") {
          await Swal.fire({
            icon: "error",
            title: "Acceso Denegado",
            text: message || "No tienes permisos para acceder a esta página",
            confirmButtonColor: "#004F9E",
            confirmButtonText: "Entendido",
          });

          // Volver a la página anterior
          router.back();
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
      }
    };

    checkAuth();
  }, [pathname, router]);

  return null;
}
