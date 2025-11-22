"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ButtonComponent from "@/app/components/ButtonComponent";
import StatsCard from "@/app/components/StatsCard";
import PageAccessValidator from "@/app/components/PageAccessValidator";
import { useRealtimeDerivaciones } from "@/hooks/useRealtimeDerivaciones";
import {
  Users,
  AlertTriangle,
  Clock,
  UserCheck,
  CheckSquare,
  Square,
} from "lucide-react";

type VistaFiltro = "sin_asignar" | "pendiente_acompanantes" | "todas";

export default function DerivacionesPage() {
  const router = useRouter();
  const [vistaActual, setVistaActual] = useState<VistaFiltro>("sin_asignar");
  const { denuncias, stats, loading } = useRealtimeDerivaciones(vistaActual);
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());

  const toggleSeleccion = (folio: string) => {
    const nuevasSeleccionadas = new Set(seleccionadas);
    if (nuevasSeleccionadas.has(folio)) {
      nuevasSeleccionadas.delete(folio);
    } else {
      nuevasSeleccionadas.add(folio);
    }
    setSeleccionadas(nuevasSeleccionadas);
  };

  const seleccionarTodas = () => {
    if (seleccionadas.size === denuncias.length && denuncias.length > 0) {
      setSeleccionadas(new Set());
    } else {
      setSeleccionadas(new Set(denuncias.map((d) => d.folio)));
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    const colores: Record<string, string> = {
      Baja: "bg-green-100 text-green-800 border-green-200",
      Media: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Alta: "bg-orange-100 text-orange-800 border-orange-200",
      Urgente: "bg-red-100 text-red-800 border-red-200",
    };
    return colores[prioridad] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getSLAColor = (horas: number) => {
    if (horas < 24) return "text-green-600";
    if (horas < 48) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <PageAccessValidator pagePath="/portal/derivaciones">
      <div className="p-6 w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Derivaciones
          </h1>
          <p className="text-gray-600">
            Gestiona la asignación de inspectores y acompañantes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Sin Asignar"
            value={stats.sin_asignar}
            icon={<Users className="w-6 h-6" />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            isActive={vistaActual === "sin_asignar"}
            onClick={() => setVistaActual("sin_asignar")}
            activeBorderColor="border-blue-500 ring-2 ring-blue-200"
            hoverBorderColor="hover:border-blue-300"
          />

          <StatsCard
            title="Pendiente Acompañantes"
            value={stats.pendiente_acompanantes}
            icon={<UserCheck className="w-6 h-6" />}
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
            isActive={vistaActual === "pendiente_acompanantes"}
            onClick={() => setVistaActual("pendiente_acompanantes")}
            activeBorderColor="border-yellow-500 ring-2 ring-yellow-200"
            hoverBorderColor="hover:border-yellow-300"
          />

          <StatsCard
            title="SLA Vencido (>48h)"
            value={stats.vencidas_sla}
            icon={<AlertTriangle className="w-6 h-6" />}
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
          />
        </div>

        {/* Acciones masivas */}
        {seleccionadas.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {seleccionadas.size} denuncia
                {seleccionadas.size !== 1 ? "s" : ""} seleccionada
                {seleccionadas.size !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex gap-2">
              <ButtonComponent
                accion="primario"
                onClick={() =>
                  router.push(
                    `/portal/derivaciones/asignar-masivo?folios=${Array.from(
                      seleccionadas
                    ).join(",")}`
                  )
                }
              >
                Asignar Inspector
              </ButtonComponent>
              <ButtonComponent
                accion="secundario"
                onClick={() => setSeleccionadas(new Set())}
              >
                Cancelar
              </ButtonComponent>
            </div>
          </div>
        )}

        {/* Tabla de denuncias */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={seleccionarTodas}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {seleccionadas.size === denuncias.length &&
                      denuncias.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Folio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tiempo sin asignar
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Cargando denuncias...
                    </td>
                  </tr>
                ) : denuncias.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No hay denuncias en esta vista
                    </td>
                  </tr>
                ) : (
                  denuncias.map((denuncia) => (
                    <tr
                      key={denuncia.folio}
                      className={`hover:bg-gray-50 transition-colors ${
                        seleccionadas.has(denuncia.folio) ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSeleccion(denuncia.folio)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {seleccionadas.has(denuncia.folio) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-blue-600 font-medium">
                          {denuncia.folio}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">
                          {denuncia.titulo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {denuncia.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPrioridadColor(
                            denuncia.prioridad
                          )}`}
                        >
                          {denuncia.prioridad}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Clock
                            className={`w-4 h-4 ${getSLAColor(
                              denuncia.horas_sin_asignar
                            )}`}
                          />
                          <span
                            className={`text-sm font-medium ${getSLAColor(
                              denuncia.horas_sin_asignar
                            )}`}
                          >
                            {denuncia.horas_sin_asignar}h
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/portal/denuncias/${denuncia.folio}`}>
                          <ButtonComponent
                            accion="ver"
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            Ver denuncia
                          </ButtonComponent>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageAccessValidator>
  );
}
