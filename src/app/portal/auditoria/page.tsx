"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Shield,
  Eye,
  Download,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";
import TableComponent from "@/app/components/TableComponent";
import SearchComponent from "@/app/components/SearchComponent";
import SelectComponent from "@/app/components/SelectComponent";
import ButtonComponent from "@/app/components/ButtonComponent";
import AuditoriaDetalleModal from "./components/AuditoriaDetalleModal";
import * as XLSX from "xlsx";

interface AuditoriaRegistro {
  id: number;
  ts: string;
  actor_user_id: string | null;
  actor_email: string;
  actor_nombre: string;
  actor_es_portal: boolean;
  actor_es_admin: boolean;
  tabla: string;
  operacion: string;
  fila_id_text: string;
  old_row: Record<string, unknown> | null;
  new_row: Record<string, unknown> | null;
}

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState<AuditoriaRegistro[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);

  // Filtros
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedTabla, setSelectedTabla] = useState("");
  const [selectedOperacion, setSelectedOperacion] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Tablas disponibles
  const [tablas, setTablas] = useState<string[]>([]);

  // Modal
  const [selectedRegistro, setSelectedRegistro] =
    useState<AuditoriaRegistro | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchRegistros = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchEmail) params.append("actorEmail", searchEmail);
      if (selectedTabla) params.append("tabla", selectedTabla);
      if (selectedOperacion) params.append("operacion", selectedOperacion);
      if (fechaDesde) params.append("fechaDesde", fechaDesde);
      if (fechaHasta) params.append("fechaHasta", fechaHasta);

      const res = await fetch(`/api/auditoria?${params.toString()}`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al obtener auditoría");
      }

      const data = await res.json();
      setRegistros(data.registros || []);
      setTotal(data.total || 0);
      setTablas(data.tablas || []);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los registros de auditoría",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    searchEmail,
    selectedTabla,
    selectedOperacion,
    fechaDesde,
    fechaHasta,
  ]);

  useEffect(() => {
    fetchRegistros();
  }, [fetchRegistros]);

  const handleVerDetalle = (id: number) => {
    const registro = registros.find((r) => r.id === id);
    if (registro) {
      setSelectedRegistro(registro);
      setModalOpen(true);
    }
  };

  const handleLimpiarFiltros = () => {
    setSearchEmail("");
    setSelectedTabla("");
    setSelectedOperacion("");
    setFechaDesde("");
    setFechaHasta("");
    setPage(1);
  };

  const handleExportarExcel = () => {
    if (registros.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin datos",
        text: "No hay registros para exportar",
        confirmButtonColor: "#003C96",
      });
      return;
    }

    try {
      const exportData = registros.map((reg) => {
        const operacionMap: Record<string, string> = {
          INSERT: "Creado",
          UPDATE: "Modificado",
          DELETE: "Eliminado",
        };

        return {
          ID: reg.id,
          Fecha: new Date(reg.ts).toLocaleString("es-CL"),
          Usuario: reg.actor_nombre || reg.actor_email,
          Email: reg.actor_email,
          "Es Admin": reg.actor_es_admin ? "Sí" : "No",
          "Es Portal": reg.actor_es_portal ? "Sí" : "No",
          Tabla: reg.tabla,
          Operación: operacionMap[reg.operacion] || reg.operacion,
          "ID Fila": reg.fila_id_text,
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Auditoría");

      const fileName = `auditoria_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(wb, fileName);

      Swal.fire({
        icon: "success",
        title: "Exportado",
        text: "El archivo se descargó correctamente",
        confirmButtonColor: "#003C96",
        timer: 2000,
      });
    } catch (error) {
      console.error("Error al exportar:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo exportar el archivo",
        confirmButtonColor: "#003C96",
      });
    }
  };

  const getOperacionBadge = (operacion: string) => {
    const operacionMap: Record<
      string,
      { traduccion: string; bg: string; text: string }
    > = {
      INSERT: {
        traduccion: "Creado",
        bg: "bg-green-100",
        text: "text-green-800",
      },
      UPDATE: {
        traduccion: "Modificado",
        bg: "bg-blue-100",
        text: "text-blue-800",
      },
      DELETE: {
        traduccion: "Eliminado",
        bg: "bg-red-100",
        text: "text-red-800",
      },
    };

    const operacionInfo = operacionMap[operacion] || {
      traduccion: operacion,
      bg: "bg-gray-100",
      text: "text-gray-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${operacionInfo.bg} ${operacionInfo.text}`}
      >
        {operacionInfo.traduccion}
      </span>
    );
  };

  const getResumenCambios = (row: AuditoriaRegistro) => {
    if (row.operacion === "INSERT" && row.new_row) {
      const count = Object.keys(row.new_row).length;
      return (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
              ✓ {count} campo{count !== 1 ? "s" : ""} creado
              {count !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            {Object.keys(row.new_row)
              .slice(0, 2)
              .map((key) => key)
              .join(", ")}
            {Object.keys(row.new_row).length > 2 && "..."}
          </div>
        </div>
      );
    }

    if (row.operacion === "DELETE" && row.old_row) {
      const count = Object.keys(row.old_row).length;
      return (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
              ✗ {count} campo{count !== 1 ? "s" : ""} eliminado
              {count !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            {Object.keys(row.old_row)
              .slice(0, 2)
              .map((key) => key)
              .join(", ")}
            {Object.keys(row.old_row).length > 2 && "..."}
          </div>
        </div>
      );
    }

    if (row.operacion === "UPDATE" && row.old_row && row.new_row) {
      const changedKeys = Object.keys(row.new_row).filter(
        (key) =>
          JSON.stringify(row.old_row?.[key]) !==
          JSON.stringify(row.new_row?.[key])
      );
      return (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
              ↻ {changedKeys.length} campo{changedKeys.length !== 1 ? "s" : ""}{" "}
              modificado{changedKeys.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            {changedKeys.slice(0, 2).join(", ")}
            {changedKeys.length > 2 && "..."}
          </div>
        </div>
      );
    }

    return <span className="text-sm text-gray-500">N/A</span>;
  };

  const getDescripcionRegistro = (row: AuditoriaRegistro) => {
    const data = row.new_row || row.old_row;
    if (!data) return "N/A";

    // Para denuncias, mostrar el folio
    if (row.tabla === "denuncias" && (data.folio || data.id)) {
      return `Denuncia ${data.folio || `#${data.id}`}`;
    }

    // Para usuarios_portal, mostrar el email
    if (row.tabla === "usuarios_portal" && data.email) {
      return `Usuario: ${data.email}`;
    }

    // Para inspectores, mostrar el usuario_id
    if (row.tabla === "inspectores" && data.usuario_id) {
      return `Inspector: ${data.usuario_id}`;
    }

    // Para perfiles_ciudadanos, mostrar el nombre
    if (row.tabla === "perfiles_ciudadanos" && (data.nombre || data.apellido)) {
      return `${data.nombre || ""} ${data.apellido || ""}`.trim();
    }

    // Para categorias_publicas, mostrar el nombre
    if (row.tabla === "categorias_publicas" && data.nombre) {
      return `Categoría: ${data.nombre}`;
    }

    // Para estados_denuncia, mostrar el nombre
    if (row.tabla === "estados_denuncia" && data.nombre) {
      return `Estado: ${data.nombre}`;
    }

    // Para turnos, mostrar la fecha
    if (row.tabla === "turnos" && data.fecha) {
      return `Turno: ${new Date(data.fecha as string).toLocaleDateString(
        "es-CL"
      )}`;
    }

    // Para moviles, mostrar la patente
    if (row.tabla === "moviles" && data.patente) {
      return `Móvil: ${data.patente}`;
    }

    // Fallback: usar el primer valor disponible
    const firstValue = Object.values(data)[0];
    if (typeof firstValue === "string" && firstValue.length < 50) {
      return firstValue;
    }

    return `ID: ${row.fila_id_text || "desconocido"}`;
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Registro completo de cambios en el sistema
                </p>
              </div>
            </div>
            <ButtonComponent
              accion="descargar"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportarExcel}
            >
              Exportar Excel
            </ButtonComponent>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Búsqueda por email */}
            <SearchComponent
              value={searchEmail}
              onChange={(e) => {
                setSearchEmail(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por email..."
            />

            {/* Filtro por tabla */}
            <SelectComponent
              value={selectedTabla}
              onChange={(e) => {
                setSelectedTabla(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas las tablas</option>
              {tablas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectComponent>

            {/* Filtro por operación */}
            <SelectComponent
              value={selectedOperacion}
              onChange={(e) => {
                setSelectedOperacion(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas las operaciones</option>
              <option value="INSERT">Creado</option>
              <option value="UPDATE">Modificado</option>
              <option value="DELETE">Eliminado</option>
            </SelectComponent>

            {/* Fecha desde */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Desde"
              />
            </div>

            {/* Fecha hasta */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Hasta"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLimpiarFiltros}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Limpiar Filtros
              </button>
              <div className="text-sm text-gray-600">
                Mostrando {registros.length} de {total.toLocaleString()}{" "}
                registros
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 font-medium">
                Registros por página:
              </label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setPage(1);
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <TableComponent
            data={registros}
            columns={[
              {
                key: "id",
                header: "ID",
                width: "80px",
                align: "center",
                render: (row) => (
                  <span className="text-sm text-gray-600">#{row.id}</span>
                ),
              },
              {
                key: "ts",
                header: "Fecha y Hora",
                width: "180px",
                render: (row) => (
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {new Date(row.ts).toLocaleDateString("es-CL")}
                    </div>
                    <div className="text-gray-500">
                      {new Date(row.ts).toLocaleTimeString("es-CL")}
                    </div>
                  </div>
                ),
              },
              {
                key: "actor_email",
                header: "Usuario",
                width: "200px",
                render: (row) => (
                  <div className="text-sm">
                    {row.actor_nombre && row.actor_nombre !== "Desconocido" ? (
                      <>
                        <div className="font-medium text-gray-900">
                          {row.actor_nombre}
                        </div>
                        <div className="text-xs text-gray-500">
                          {row.actor_email}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {row.actor_es_admin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Admin
                            </span>
                          )}
                          {row.actor_es_portal && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Portal
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="font-medium text-gray-900">
                          {row.actor_email}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {row.actor_es_admin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Admin
                            </span>
                          )}
                          {row.actor_es_portal && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Portal
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: "tabla",
                header: "Tabla",
                width: "150px",
                render: (row) => (
                  <span className="text-sm font-mono text-gray-700">
                    {row.tabla}
                  </span>
                ),
              },
              {
                key: "operacion",
                header: "Operación",
                width: "120px",
                align: "center",
                render: (row) => getOperacionBadge(row.operacion),
              },
              {
                key: "fila_id_text",
                header: "Resumen",
                width: "250px",
                render: (row) => getResumenCambios(row),
              },
              {
                key: "descripcion",
                header: "Descripción del Registro",
                width: "200px",
                render: (row) => (
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {getDescripcionRegistro(row)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {row.tabla}
                    </div>
                  </div>
                ),
              },
              {
                key: "actions",
                header: "Acciones",
                width: "80px",
                align: "center",
                render: (row) => (
                  <button
                    onClick={() => handleVerDetalle(row.id)}
                    className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                    title="Ver detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                ),
              },
            ]}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            loading={loading}
          />

          {/* Paginación */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Página <span className="font-semibold">{page}</span> de{" "}
              <span className="font-semibold">
                {Math.ceil(total / pageSize) || 1}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                ← Anterior
              </button>

              <div className="flex items-center gap-1">
                {Array.from(
                  {
                    length: Math.min(5, Math.ceil(total / pageSize) || 1),
                  },
                  (_, i) => {
                    const maxPages = Math.ceil(total / pageSize) || 1;
                    let pageNum: number;

                    if (maxPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= maxPages - 2) {
                      pageNum = maxPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-2.5 py-1 text-sm rounded-lg transition-colors ${
                          page === pageNum
                            ? "bg-blue-600 text-white font-semibold"
                            : "border border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() =>
                  setPage(Math.min(Math.ceil(total / pageSize) || 1, page + 1))
                }
                disabled={page >= Math.ceil(total / pageSize) || total === 0}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalle */}
      <AuditoriaDetalleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRegistro(null);
        }}
        registro={selectedRegistro}
      />
    </div>
  );
}
