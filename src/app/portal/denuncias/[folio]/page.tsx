"use client";

import React, { useEffect, useState } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import { useRouter } from "next/navigation";
import AsignarPrioridadDropdown from "./components/AsignarPrioridadDropdown";

interface DenunciaDetalle {
  folio: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  estado: string;
  ubicacion_texto: string;
  inspector_asignado: string;
  prioridad: string;
  fecha_creacion: string;
}

const estadoColor: Record<string, string> = {
  Pendiente: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  Resuelta: "bg-green-100 text-green-800 border border-green-200",
  Cerrada: "bg-gray-100 text-gray-700 border border-gray-200",
};

const prioridadColor: Record<string, string> = {
  Alta: "bg-red-100 text-red-700 border border-red-200",
  Media: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  Baja: "bg-green-100 text-green-800 border border-green-200",
};

export default function DenunciaDetallePage({
  params,
}: {
  params: { folio: string };
}) {
  const router = useRouter();
  const [denuncia, setDenuncia] = useState<DenunciaDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/denuncias/${params.folio}`)
      .then((res) => res.json())
      .then((data) => {
        setDenuncia(data.denuncia);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.folio]);

  if (!denuncia && !loading) {
    // Show friendly 404 message if denuncia not found
    return (
      <div className="p-8 text-center text-red-500">
        No se encontró la denuncia
        <br />
        <ButtonComponent
          accion="volver"
          className="mt-4 rounded-full border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
        >
          Volver
        </ButtonComponent>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center">Cargando denuncia...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        {/* Botón de volver reutilizando ButtonComponent */}
        <ButtonComponent accion="volver" onClick={() => router.back()}>
          Volver
        </ButtonComponent>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#004F9E]">
            {denuncia.folio}
          </h1>
          <p className="text-gray-500 text-sm">Detalle de la denuncia</p>
        </div>
        <div className="ml-auto">
          <button className="bg-[#004F9E] text-white px-5 py-2 rounded-full font-medium shadow hover:bg-blue-900 transition flex items-center gap-2">
            <span className="inline-block">⚡</span> Asignar Inspector
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 mt-2">
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex gap-8">
            <span className="border-b-2 border-[#004F9E] text-[#004F9E] font-medium pb-2">
              Resumen
            </span>
            <span className="text-gray-400 pb-2 cursor-not-allowed">
              Evidencias
            </span>
            <span className="text-gray-400 pb-2 cursor-not-allowed">
              Observaciones
            </span>
            <span className="text-gray-400 pb-2 cursor-not-allowed">
              Historial
            </span>
          </nav>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm rounded-xl overflow-hidden">
            <tbody>
              <tr>
                <td className="py-3 px-5 font-medium text-gray-700 bg-gray-50 align-top w-56 border-b border-gray-100">
                  Título
                </td>
                <td className="py-3 px-5 border-b border-gray-100">
                  {denuncia.titulo}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-5 font-medium text-gray-700 bg-gray-50 align-top w-56 border-b border-gray-100">
                  Descripción
                </td>
                <td className="py-3 px-5 border-b border-gray-100">
                  {denuncia.descripcion}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-5 font-medium text-gray-700 bg-gray-50 align-top w-56 border-b border-gray-100">
                  Categoría
                </td>
                <td className="py-3 px-5 border-b border-gray-100">
                  {denuncia.categoria}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-5 font-medium text-gray-700 bg-gray-50 align-top w-56 border-b border-gray-100">
                  Estado
                </td>
                <td className="py-3 px-5 border-b border-gray-100">
                  <span
                    className={`inline-block px-3 py-1 rounded text-xs font-semibold border ${
                      estadoColor[denuncia.estado] ||
                      "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                  >
                    {denuncia.estado}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-5 font-medium text-gray-700 bg-gray-50 align-top w-56 border-b border-gray-100">
                  Ubicación
                </td>
                <td className="py-3 px-5 border-b border-gray-100">
                  {denuncia.ubicacion_texto}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-5 font-medium text-gray-700 bg-gray-50 align-top w-56 border-b border-gray-100">
                  Inspector Asignado
                </td>
                <td className="py-3 px-5 border-b border-gray-100">
                  {denuncia.inspector_asignado ? (
                    denuncia.inspector_asignado
                  ) : (
                    <ButtonComponent
                      accion="fantasma"
                      size="sm"
                      className="!px-2 !py-1 text-xs"
                    >
                      Asignar un inspector
                    </ButtonComponent>
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-5 font-medium text-gray-700 bg-gray-50 align-top w-56 border-b border-gray-100">
                  Prioridad
                </td>
                <td className="py-3 px-5 border-b border-gray-100">
                  {denuncia.prioridad ? (
                    <span
                      className={`inline-block px-3 py-1 rounded text-xs font-semibold border ${
                        prioridadColor[denuncia.prioridad] ||
                        "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {denuncia.prioridad}
                    </span>
                  ) : (
                    <AsignarPrioridadDropdown
                      folio={denuncia.folio}
                      onAsignar={(p: string) =>
                        setDenuncia((d) => (d ? { ...d, prioridad: p } : d))
                      }
                    />
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-5 font-medium text-gray-700 bg-gray-50 align-top w-56">
                  Fecha Creación
                </td>
                <td className="py-3 px-5">{denuncia.fecha_creacion}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
