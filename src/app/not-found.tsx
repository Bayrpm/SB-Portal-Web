import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#0085CA" }}
    >
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src={"/Logotipo vertical blanco.png"}
            alt="Municipalidad"
            width={220}
            height={220}
            priority
          />
        </div>

        <p className="text-sm font-semibold text-white">Error 404</p>
        <h1 className="mt-2 text-3xl font-bold text-white">
          Página no encontrada
        </h1>
        <p className="mt-4 text-white/90">
          La ruta que intentas abrir no existe o fue movida.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-white text-[#0085CA] px-4 py-2 hover:bg-gray-100 font-medium"
          >
            Volver al inicio
          </Link>
          <Link
            href="/portal/denuncias"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-white text-white px-4 py-2 hover:bg-white/10 font-medium"
          >
            Ir al portal
          </Link>
        </div>
      </div>
    </main>
  );
}
