import Link from "next/link";
import Image from "next/image";
import { ShieldX } from "lucide-react";

export default function Unauthorized() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#0085CA" }}
    >
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src="/Logotipo vertical blanco.png"
            alt="Municipalidad"
            width={220}
            height={220}
            priority
          />
        </div>

        <div className="flex justify-center mb-4">
          <div className="bg-white/20 rounded-full p-4">
            <ShieldX className="text-white" size={48} />
          </div>
        </div>

        <p className="text-sm font-semibold text-white">Error 403</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Acceso Denegado</h1>
        <p className="mt-4 text-white/90">
          No tienes permisos para acceder a esta página. Si crees que esto es un
          error, contacta al administrador del sistema.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/portal/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-white text-[#0085CA] px-4 py-2 hover:bg-gray-100 font-medium"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-white text-white px-4 py-2 hover:bg-white/10 font-medium"
          >
            Cerrar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
