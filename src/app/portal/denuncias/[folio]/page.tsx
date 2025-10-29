"use client";

import React, { useEffect, useState } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import { useRouter } from "next/navigation";
import AsignarPrioridadDropdown from "./components/AsignarPrioridadDropdown";
import AsignarInspectorDropdown from "./components/AsignarInspectorDropdown";
import { Pencil } from "lucide-react";

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
  ciudadano_nombre: string;
  ciudadano_telefono: string;
}

const estadoColor: Record<string, string> = {
  Pendiente: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  Resuelta: "bg-green-100 text-green-800 border border-green-200",
  Cerrada: "bg-gray-100 text-gray-700 border border-gray-200",
};

const prioridadColor: Record<string, string> = {
  Baja: "bg-green-100 text-green-800 border border-green-200", // id 1
  Media: "bg-yellow-200 text-yellow-900 border border-yellow-300", // id 2
  Alta: "bg-orange-300 text-orange-900 border border-orange-400", // id 3
  Urgencia: "bg-red-600 text-white border border-red-700", // id 4
};

export default function DenunciaDetallePage({
  params,
}: {
  params: { folio: string };
}) {
  const router = useRouter();
  const { folio } = params;
  const [denuncia, setDenuncia] = useState<DenunciaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editandoPrioridad, setEditandoPrioridad] = useState(false);
  const [editandoInspector, setEditandoInspector] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/denuncias/${folio}`)
      .then((res) => res.json())
      .then((data) => {
        setDenuncia(data.denuncia);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [folio]);

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

  if (!denuncia) {
    // Este caso ya está cubierto arriba, pero por seguridad
    return null;
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
        <div>
          <table className="min-w-full text-sm rounded-xl">
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
                  Nombre Ciudadano
                </td>
                <td className="py-3 px-5 border-b border-gray-100">
                  {denuncia.ciudadano_nombre || "Sin nombre"}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-5 font-medium text-gray-700 bg-gray-50 align-top w-56 border-b border-gray-100">
                  Teléfono
                </td>
                <td className="py-3 px-5 border-b border-gray-100">
                  {denuncia.ciudadano_telefono || "Sin teléfono"}
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
                  {denuncia.inspector_asignado && !editandoInspector ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block px-3 py-1 rounded text-xs font-semibold border bg-blue-50 text-blue-900 border-blue-200">
                        {denuncia.inspector_asignado}
                      </span>
                      <button
                        type="button"
                        className="ml-1 bg-blue-100 hover:bg-blue-200 text-blue-700 p-1 rounded-full focus:outline-none border border-blue-200 shadow-sm transition"
                        onClick={() => setEditandoInspector(true)}
                        title="Editar inspector"
                        aria-label="Editar inspector"
                      >
                        <Pencil size={16} />
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <AsignarInspectorDropdown
                        folio={denuncia.folio}
                        onAsignar={(nombre: string) => {
                          setDenuncia((d) =>
                            d ? { ...d, inspector_asignado: nombre } : d
                          );
                          setEditandoInspector(false);
                        }}
                      />
                      <button
                        type="button"
                        className="ml-2 text-gray-500 hover:text-gray-700 text-xs underline"
                        onClick={() => setEditandoInspector(false)}
                      >
                        Cancelar
                      </button>
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-5 font-medium text-gray-700 bg-gray-50 align-top w-56 border-b border-gray-100">
                  Prioridad
                </td>
                <td className="py-3 px-5 border-b border-gray-100">
                  {denuncia.prioridad && !editandoPrioridad ? (
                    <span className="flex items-center gap-2">
                      <span
                        className={`inline-block px-3 py-1 rounded text-xs font-semibold border ${
                          prioridadColor[denuncia.prioridad] ||
                          "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {denuncia.prioridad}
                      </span>
                      <button
                        type="button"
                        className="ml-1 bg-blue-100 hover:bg-blue-200 text-blue-700 p-1 rounded-full focus:outline-none border border-blue-200 shadow-sm transition"
                        onClick={() => setEditandoPrioridad(true)}
                        title="Editar prioridad"
                        aria-label="Editar prioridad"
                      >
                        <Pencil size={16} />
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <AsignarPrioridadDropdown
                        folio={denuncia.folio}
                        onAsignar={(p: string) => {
                          setDenuncia((d) => (d ? { ...d, prioridad: p } : d));
                          setEditandoPrioridad(false);
                        }}
                      />
                      <button
                        type="button"
                        className="ml-2 text-gray-500 hover:text-gray-700 text-xs underline"
                        onClick={() => setEditandoPrioridad(false)}
                      >
                        Cancelar
                      </button>
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-5 font-medium text-gray-700 bg-gray-50 align-top w-56">
                  Fecha Creación
                </td>
                <td className="py-3 px-5">
                  {(() => {
                    const date = new Date(denuncia.fecha_creacion);
                    if (isNaN(date.getTime())) return denuncia.fecha_creacion;
                    return date.toLocaleString("es-CL", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    });
                  })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
