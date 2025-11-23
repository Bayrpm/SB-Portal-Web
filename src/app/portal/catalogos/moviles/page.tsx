"use client";

import { useState, useEffect } from "react";
import { Car, Tags, Plus, Edit2 } from "lucide-react";
import ButtonComponent from "@/app/components/ButtonComponent";
import TableComponent from "@/app/components/TableComponent";
import ToggleSwitch from "@/app/components/ToggleSwitchComponent";
import SearchComponent from "@/app/components/SearchComponent";
import { withPageProtection } from "@/lib/security/withPageProtection";
import MovilModal, { MovilFormData } from "./components/MovilModal";
import TipoMovilModal, { TipoMovilFormData } from "./components/TipoMovilModal";
import Swal from "sweetalert2";

interface Movil {
  id: number;
  patente: string;
  tipo_id: number;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje_actual: number;
  estado: string;
  activo: boolean;
  tipo?: { id: number; nombre: string };
}

interface TipoMovil {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

function MovilesPage() {
  const [pageMoviles, setPageMoviles] = useState(1);
  const [pageSizeMoviles, setPageSizeMoviles] = useState(10);
  const [searchTermMoviles, setSearchTermMoviles] = useState("");

  const [pageTipos, setPageTipos] = useState(1);
  const [pageSizeTipos, setPageSizeTipos] = useState(5);
  const [searchTermTipos, setSearchTermTipos] = useState("");

  // Estados para móviles
  const [moviles, setMoviles] = useState<Movil[]>([]);
  const [modalMovilOpen, setModalMovilOpen] = useState(false);
  const [selectedMovil, setSelectedMovil] = useState<Movil | null>(null);
  const [loadingMoviles, setLoadingMoviles] = useState(false);

  // Estados para tipos de móviles
  const [tipos, setTipos] = useState<TipoMovil[]>([]);
  const [modalTipoOpen, setModalTipoOpen] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoMovil | null>(null);
  const [loadingTipos, setLoadingTipos] = useState(false);

  useEffect(() => {
    fetchMoviles();
    fetchTipos();
  }, []);

  // Fetch móviles
  const fetchMoviles = async () => {
    try {
      setLoadingMoviles(true);
      const res = await fetch("/api/moviles");
      if (!res.ok) throw new Error("Error al obtener móviles");
      const data = await res.json();
      setMoviles(data.moviles || []);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los móviles",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setLoadingMoviles(false);
    }
  };

  // Fetch tipos de móviles
  const fetchTipos = async () => {
    try {
      setLoadingTipos(true);
      const res = await fetch("/api/moviles/tipos");
      if (!res.ok) throw new Error("Error al obtener tipos de móviles");
      const data = await res.json();
      setTipos(data.tipos || []);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los tipos de móviles",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setLoadingTipos(false);
    }
  };

  // Handlers para móviles
  const handleCreateMovil = () => {
    setSelectedMovil(null);
    setModalMovilOpen(true);
  };

  const handleEditMovil = (id: number) => {
    const movil = moviles.find((m) => m.id === id);
    if (movil) {
      setSelectedMovil(movil);
      setModalMovilOpen(true);
    }
  };

  const handleSubmitMovil = async (data: MovilFormData) => {
    try {
      const url = "/api/moviles";
      const method = data.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al guardar móvil");
      }

      await Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `Móvil ${data.id ? "actualizado" : "creado"} correctamente`,
        confirmButtonColor: "#003C96",
        timer: 2000,
      });

      fetchMoviles();
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Error al guardar móvil",
        confirmButtonColor: "#003C96",
      });
      throw error;
    }
  };

  const handleToggleMovil = async (id: number, newStatus: boolean) => {
    try {
      const movil = moviles.find((m) => m.id === id);
      if (!movil) return;

      const res = await fetch("/api/moviles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...movil, activo: newStatus }),
      });

      if (!res.ok) throw new Error("Error al actualizar estado");

      setMoviles((prev) =>
        prev.map((m) => (m.id === id ? { ...m, activo: newStatus } : m))
      );
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el estado",
        confirmButtonColor: "#003C96",
      });
    }
  };

  // Handlers para tipos
  const handleCreateTipo = () => {
    setSelectedTipo(null);
    setModalTipoOpen(true);
  };

  const handleEditTipo = (id: number) => {
    const tipo = tipos.find((t) => t.id === id);
    if (tipo) {
      setSelectedTipo(tipo);
      setModalTipoOpen(true);
    }
  };

  const handleSubmitTipo = async (data: TipoMovilFormData) => {
    try {
      const url = "/api/moviles/tipos";
      const method = data.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al guardar tipo");
      }

      await Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `Tipo de móvil ${
          data.id ? "actualizado" : "creado"
        } correctamente`,
        confirmButtonColor: "#003C96",
        timer: 2000,
      });

      fetchTipos();
      fetchMoviles(); // Refrescar móviles para actualizar relaciones
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Error al guardar tipo",
        confirmButtonColor: "#003C96",
      });
      throw error;
    }
  };

  const handleToggleTipo = async (id: number, newStatus: boolean) => {
    try {
      const tipo = tipos.find((t) => t.id === id);
      if (!tipo) return;

      const res = await fetch("/api/moviles/tipos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tipo, activo: newStatus }),
      });

      if (!res.ok) throw new Error("Error al actualizar estado");

      setTipos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, activo: newStatus } : t))
      );
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el estado",
        confirmButtonColor: "#003C96",
      });
    }
  };

  // Filtrar datos
  const filteredMoviles = moviles.filter(
    (movil) =>
      movil.patente.toLowerCase().includes(searchTermMoviles.toLowerCase()) ||
      movil.marca.toLowerCase().includes(searchTermMoviles.toLowerCase()) ||
      movil.modelo.toLowerCase().includes(searchTermMoviles.toLowerCase()) ||
      movil.tipo?.nombre.toLowerCase().includes(searchTermMoviles.toLowerCase())
  );

  const filteredTipos = tipos.filter((tipo) =>
    tipo.nombre.toLowerCase().includes(searchTermTipos.toLowerCase())
  );

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      DISPONIBLE: { bg: "bg-green-100", text: "text-green-800" },
      ASIGNADO: { bg: "bg-blue-100", text: "text-blue-800" },
      EN_MANTENIMIENTO: { bg: "bg-yellow-100", text: "text-yellow-800" },
      FUERA_DE_SERVICIO: { bg: "bg-red-100", text: "text-red-800" },
    };

    const badge = badges[estado] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {estado.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Móviles
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Administra los vehículos y tipos disponibles
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 p-6">
        <div className="flex gap-4 h-full">
          {/* Sección Móviles - 60% */}
          <div className="w-[60%] bg-white rounded-lg shadow-sm flex flex-col">
            {/* Header con título e icono */}
            <div className="px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Móviles</h2>
              </div>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <SearchComponent
                  value={searchTermMoviles}
                  onChange={(e) => setSearchTermMoviles(e.target.value)}
                  placeholder="Buscar por patente, marca, modelo o tipo..."
                  className="flex-1 max-w-md"
                />
                <ButtonComponent
                  accion="agregar"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={handleCreateMovil}
                >
                  Nuevo Móvil
                </ButtonComponent>
              </div>
            </div>

            {/* Tabla Móviles */}
            <div className="flex-1 overflow-hidden">
              <TableComponent
                data={filteredMoviles}
                columns={[
                  {
                    key: "patente",
                    header: "Patente",
                    width: "100px",
                    render: (row) => (
                      <span className="font-mono font-bold text-gray-900">
                        {row.patente}
                      </span>
                    ),
                  },
                  {
                    key: "tipo",
                    header: "Tipo",
                    render: (row) => (
                      <span className="text-sm text-gray-700">
                        {row.tipo?.nombre || "-"}
                      </span>
                    ),
                  },
                  {
                    key: "vehiculo",
                    header: "Vehículo",
                    render: (row) => (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {row.marca} {row.modelo}
                        </div>
                        <div className="text-gray-500">Año {row.anio}</div>
                      </div>
                    ),
                  },
                  {
                    key: "kilometraje_actual",
                    header: "Kilometraje",
                    align: "right",
                    render: (row) => (
                      <span className="text-sm text-gray-700">
                        {row.kilometraje_actual.toLocaleString()} km
                      </span>
                    ),
                  },
                  {
                    key: "estado",
                    header: "Estado",
                    align: "center",
                    width: "180px",
                    render: (row) => getEstadoBadge(row.estado),
                  },
                  {
                    key: "activo",
                    header: "Activo",
                    width: "100px",
                    align: "center",
                    render: (row) => (
                      <ToggleSwitch
                        isActive={row.activo}
                        onChange={(enabled) =>
                          handleToggleMovil(row.id, enabled)
                        }
                      />
                    ),
                  },
                  {
                    key: "actions",
                    header: "Acciones",
                    width: "100px",
                    align: "center",
                    render: (row) => (
                      <button
                        onClick={() => handleEditMovil(row.id)}
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    ),
                  },
                ]}
                page={pageMoviles}
                pageSize={pageSizeMoviles}
                onPageChange={setPageMoviles}
                onPageSizeChange={setPageSizeMoviles}
                loading={loadingMoviles}
              />
            </div>
          </div>

          {/* Sección Tipos de Móviles - 40% */}
          <div className="w-[40%] bg-white rounded-lg shadow-sm flex flex-col">
            {/* Header con título e icono */}
            <div className="px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex items-center gap-2">
                <Tags className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Tipos de Móviles
                </h2>
              </div>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <SearchComponent
                  value={searchTermTipos}
                  onChange={(e) => setSearchTermTipos(e.target.value)}
                  placeholder="Buscar tipos..."
                  className="flex-1"
                />
                <ButtonComponent
                  accion="agregar"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={handleCreateTipo}
                >
                  Nuevo Tipo
                </ButtonComponent>
              </div>
            </div>

            {/* Tabla Tipos */}
            <div className="flex-1 overflow-hidden">
              <TableComponent
                data={filteredTipos}
                columns={[
                  {
                    key: "nombre",
                    header: "Nombre",
                    render: (row) => (
                      <div>
                        <div className="font-medium text-gray-900">
                          {row.nombre}
                        </div>
                        {row.descripcion && (
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {row.descripcion}
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "activo",
                    header: "Estado",
                    width: "100px",
                    align: "center",
                    render: (row) => (
                      <ToggleSwitch
                        isActive={row.activo}
                        onChange={(enabled) =>
                          handleToggleTipo(row.id, enabled)
                        }
                      />
                    ),
                  },
                  {
                    key: "actions",
                    header: "Acciones",
                    width: "100px",
                    align: "center",
                    render: (row) => (
                      <button
                        onClick={() => handleEditTipo(row.id)}
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    ),
                  },
                ]}
                page={pageTipos}
                pageSize={pageSizeTipos}
                onPageChange={setPageTipos}
                onPageSizeChange={setPageSizeTipos}
                loading={loadingTipos}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <MovilModal
        isOpen={modalMovilOpen}
        onClose={() => {
          setModalMovilOpen(false);
          setSelectedMovil(null);
        }}
        onSubmit={handleSubmitMovil}
        initialData={selectedMovil}
        title={selectedMovil ? "Editar Móvil" : "Nuevo Móvil"}
        tipos={tipos.filter((t) => t.activo)}
      />

      <TipoMovilModal
        isOpen={modalTipoOpen}
        onClose={() => {
          setModalTipoOpen(false);
          setSelectedTipo(null);
        }}
        onSubmit={handleSubmitTipo}
        initialData={selectedTipo}
        title={selectedTipo ? "Editar Tipo de Móvil" : "Nuevo Tipo de Móvil"}
      />
    </div>
  );
}

export default withPageProtection(MovilesPage);
