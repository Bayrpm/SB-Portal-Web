"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import ButtonComponent from "@/app/components/ButtonComponent";
import { useRouter } from "next/navigation";
import AsignarPrioridadDropdown from "./components/AsignarPrioridadDropdown";
import AsignarInspectorDropdown from "./components/AsignarInspectorDropdown";
import AsignarAcompanantesDropdown from "./components/AsignarAcompanantesDropdown";
import HistorialTimeline from "./components/HistorialTimeline";
import { Pencil } from "lucide-react";

interface DenunciaDetalle {
  folio: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  estado: string;
  ubicacion_texto: string;
  inspector_asignado: string;
  inspector_id: string | null;
  prioridad: string;
  fecha_creacion: string;
  ciudadano_nombre: string;
  ciudadano_telefono: string;
}

interface Evidencia {
  id: string;
  tipo: "FOTO" | "VIDEO";
  url: string | null;
  orden: number;
  fecha_subida: string;
  subido_por: string;
  tipo_usuario: string;
}

interface Observacion {
  id: string;
  tipo: string;
  contenido: string;
  fecha: string;
  creado_por: string;
  cargo: string;
}

interface HistorialItem {
  id: string;
  evento: string;
  descripcion: string;
  detallesLeibles: Record<string, unknown>;
  detalle: Record<string, unknown> | null;
  fecha: string;
  autor: string;
  icono: string;
  tipo: string;
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
  const [inspectorAsignadoId, setInspectorAsignadoId] = useState<string | null>(
    null
  );
  const [acompanantes, setAcompanantes] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [editandoAcompanantes, setEditandoAcompanantes] = useState(false);

  // Estados para las pestañas
  const [tabActiva, setTabActiva] = useState<
    "resumen" | "evidencias" | "observaciones"
  >("resumen");
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Cargar denuncia y asignaciones en paralelo
    Promise.all([
      fetch(`/api/denuncias/${folio}`).then((res) => res.json()),
      fetch(`/api/denuncias/${folio}/asignaciones`).then((res) => res.json()),
    ])
      .then(([denunciaData, asignacionesData]) => {
        // Setear datos de la denuncia
        setDenuncia(denunciaData.denuncia);

        // Setear inspector y acompañantes desde asignaciones
        if (asignacionesData.inspector_principal) {
          setInspectorAsignadoId(asignacionesData.inspector_principal.id);
        }
        if (
          asignacionesData.acompanantes &&
          asignacionesData.acompanantes.length > 0
        ) {
          setAcompanantes(asignacionesData.acompanantes);
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error al cargar denuncia:", error);
        setLoading(false);
      });
  }, [folio]);

  // Cargar datos según la tab activa
  useEffect(() => {
    if (tabActiva === "resumen") {
      // Cargar historial cuando se abre la tab de resumen
      setLoadingHistorial(true);
      fetch(`/api/denuncias/${folio}/historial`)
        .then((res) => res.json())
        .then((data) => {
          setHistorial(data.historial || []);
          setLoadingHistorial(false);
        })
        .catch(() => setLoadingHistorial(false));
      return;
    }

    setLoadingTab(true);

    if (tabActiva === "evidencias" && evidencias.length === 0) {
      fetch(`/api/denuncias/${folio}/evidencias`)
        .then((res) => res.json())
        .then((data) => {
          setEvidencias(data.evidencias || []);
          setLoadingTab(false);
        })
        .catch(() => setLoadingTab(false));
    } else if (tabActiva === "observaciones" && observaciones.length === 0) {
      fetch(`/api/denuncias/${folio}/observaciones`)
        .then((res) => res.json())
        .then((data) => {
          setObservaciones(data.observaciones || []);
          setLoadingTab(false);
        })
        .catch(() => setLoadingTab(false));
    } else {
      setLoadingTab(false);
    }
  }, [tabActiva, folio, evidencias.length, observaciones.length]);

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
            <button
              onClick={() => setTabActiva("resumen")}
              className={`pb-2 font-medium transition-colors ${
                tabActiva === "resumen"
                  ? "border-b-2 border-[#004F9E] text-[#004F9E]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setTabActiva("evidencias")}
              className={`pb-2 font-medium transition-colors ${
                tabActiva === "evidencias"
                  ? "border-b-2 border-[#004F9E] text-[#004F9E]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Evidencias
            </button>
            <button
              onClick={() => setTabActiva("observaciones")}
              className={`pb-2 font-medium transition-colors ${
                tabActiva === "observaciones"
                  ? "border-b-2 border-[#004F9E] text-[#004F9E]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Observaciones
            </button>
          </nav>
        </div>

        {/* Contenido según tab activa */}
        {tabActiva === "resumen" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Detalles de la denuncia (2/3 del ancho) */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información de la Denuncia
              </h3>
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
                  {/* Columna para asignar inspector */}
                  <tr>
                    <td className="py-3 px-5 font-medium text-gray-700 bg-gray-50 align-top w-56 border-b border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">
                          Inspector Principal
                        </span>
                        <span className="text-xs text-gray-500 mt-0.5">
                          Responsable del caso
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-5 border-b border-gray-100">
                      {editandoInspector ? (
                        <span className="flex items-center gap-2">
                          <AsignarInspectorDropdown
                            folio={denuncia.folio}
                            acompanantesActuales={acompanantes}
                            onAsignar={(
                              inspectorNombre: string,
                              inspectorId: string
                            ) => {
                              setDenuncia((d) =>
                                d
                                  ? {
                                      ...d,
                                      inspector_asignado: inspectorNombre,
                                    }
                                  : d
                              );
                              setInspectorAsignadoId(inspectorId);
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
                      ) : denuncia.inspector_asignado ? (
                        <span className="flex items-center gap-2">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
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
                          <span className="text-xs text-gray-400 ml-1">
                            Sin inspector asignado
                          </span>
                          <button
                            type="button"
                            className="ml-1 bg-blue-100 hover:bg-blue-200 text-blue-700 p-1 rounded-full focus:outline-none border border-blue-200 shadow-sm transition"
                            onClick={() => setEditandoInspector(true)}
                            title="Asignar inspector"
                            aria-label="Asignar inspector"
                          >
                            <Pencil size={16} />
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Columna para asignar acompañantes */}
                  <tr>
                    <td className="py-3 px-5 font-medium text-gray-700 bg-gray-50 align-top w-56 border-b border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">
                          Inspectores Acompañantes
                        </span>
                        <span className="text-xs text-gray-500 mt-0.5">
                          Equipo de apoyo (múltiples)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-5 border-b border-gray-100">
                      {denuncia.inspector_asignado ? (
                        editandoAcompanantes ? (
                          <>
                            <AsignarAcompanantesDropdown
                              folio={denuncia.folio}
                              inspectorPrincipalId={inspectorAsignadoId}
                              onAsignar={(lista) => {
                                setAcompanantes(lista);
                                setEditandoAcompanantes(false);
                              }}
                            />
                            {acompanantes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                <span className="text-xs text-gray-500 mr-2">
                                  Acompañantes seleccionados:
                                </span>
                                {acompanantes.map((a) => (
                                  <span
                                    key={a.id}
                                    className="inline-block px-2 py-0.5 rounded text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200"
                                  >
                                    {a.nombre}
                                  </span>
                                ))}
                              </div>
                            )}
                            <button
                              type="button"
                              className="ml-2 text-gray-500 hover:text-gray-700 text-xs underline mt-2"
                              onClick={() => setEditandoAcompanantes(false)}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : acompanantes.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex flex-wrap gap-1">
                              {acompanantes.map((a) => (
                                <span
                                  key={a.id}
                                  className="inline-block px-2 py-0.5 rounded text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200"
                                >
                                  {a.nombre}
                                </span>
                              ))}
                            </div>
                            <button
                              type="button"
                              className="ml-1 bg-blue-100 hover:bg-blue-200 text-blue-700 p-1 rounded-full focus:outline-none border border-blue-200 shadow-sm transition"
                              onClick={() => setEditandoAcompanantes(true)}
                              title="Editar acompañantes"
                              aria-label="Editar acompañantes"
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 ml-1">
                              Sin acompañantes
                            </span>
                            <button
                              type="button"
                              className="ml-1 bg-blue-100 hover:bg-blue-200 text-blue-700 p-1 rounded-full focus:outline-none border border-blue-200 shadow-sm transition"
                              onClick={() => setEditandoAcompanantes(true)}
                              title="Asignar acompañantes"
                              aria-label="Asignar acompañantes"
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-gray-400 ml-1">
                          Primero asigne un inspector
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
                              setDenuncia((d) =>
                                d ? { ...d, prioridad: p } : d
                              );
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
                        if (isNaN(date.getTime()))
                          return denuncia.fecha_creacion;
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

            {/* Columna derecha: Historial (1/3 del ancho) */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Historial Reciente
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto border border-gray-200">
                  <HistorialTimeline
                    historial={historial}
                    loading={loadingHistorial}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Evidencias */}
        {tabActiva === "evidencias" && (
          <div>
            {loadingTab ? (
              <p className="text-center text-gray-500 py-8">
                Cargando evidencias...
              </p>
            ) : evidencias.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay evidencias para esta denuncia
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {evidencias.map((evidencia) => (
                  <div
                    key={evidencia.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {evidencia.tipo === "FOTO" ? (
                      evidencia.url ? (
                        <Image
                          src={evidencia.url}
                          alt="Evidencia"
                          width={400}
                          height={192}
                          className="w-full h-48 object-cover rounded-md mb-3"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                          <span className="text-gray-400">
                            Imagen no disponible
                          </span>
                        </div>
                      )
                    ) : evidencia.url ? (
                      <video
                        src={evidencia.url}
                        controls
                        className="w-full h-48 rounded-md mb-3"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                        <span className="text-gray-400">
                          Video no disponible
                        </span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold">Tipo:</span>{" "}
                        {evidencia.tipo === "FOTO" ? "Fotografía" : "Video"}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold">Subido por:</span>{" "}
                        {evidencia.subido_por}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold">Rol:</span>{" "}
                        {evidencia.tipo_usuario === "ciudadano"
                          ? "Ciudadano"
                          : "Inspector/Operador"}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold">Fecha:</span>{" "}
                        {new Date(evidencia.fecha_subida).toLocaleString(
                          "es-CL",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Observaciones */}
        {tabActiva === "observaciones" && (
          <div>
            {loadingTab ? (
              <p className="text-center text-gray-500 py-8">
                Cargando observaciones...
              </p>
            ) : observaciones.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay observaciones para esta denuncia
              </p>
            ) : (
              <div className="space-y-4">
                {observaciones.map((obs) => (
                  <div
                    key={obs.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            obs.tipo === "TERRENO"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {obs.cargo}
                        </span>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {obs.creado_por}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(obs.fecha).toLocaleString("es-CL", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 mt-3">
                      {obs.contenido}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Historial REMOVIDO - Ahora integrado en resumen */}
      </div>
    </div>
  );
}
