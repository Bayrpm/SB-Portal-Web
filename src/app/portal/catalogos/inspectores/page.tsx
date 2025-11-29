"use client";

import { useState, useEffect } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import TableComponent from "@/app/components/TableComponent";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { withPageProtection } from "@/lib/security/withPageProtection";
import InspectorModal, { InspectorFormData } from "./components/InspectorModal";
import EditInspectorModal from "./components/EditInspectorModal";
import SearchComponent from "@/app/components/SearchComponent";
import SelectComponent from "@/app/components/SelectComponent";
import Swal from "sweetalert2";

interface Inspector {
  id: string;
  numero: number;
  name: string;
  telefono: string;
  email: string;
  activo: boolean;
  en_turno: boolean;
  turno?: {
    id: number;
    nombre: string;
    hora_inicio: string;
    hora_termino: string;
  };
}

function InspectoresPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState<Inspector | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTurno, setSelectedTurno] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [turnos, setTurnos] = useState<{ id: number; nombre: string }[]>([]);

  // Cargar inspectores al montar el componente
  useEffect(() => {
    fetchInspectors();
    fetchTurnos();
  }, []);

  // Suscripción Realtime para actualizar estado de turno automáticamente
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("inspectores-portal-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "inspectores",
        },
        (payload) => {
          console.log("Inspector actualizado:", payload);

          // Actualizar solo el inspector que cambió
          setInspectors((prev) =>
            prev.map((inspector) => {
              // Buscar por el ID del inspector que cambió
              // El inspector.id del frontend corresponde a usuario_id de la BD
              // El payload.new contiene las columnas de la tabla inspectores
              if (payload.new && inspector.id === (payload.new as { usuario_id: string }).usuario_id) {
                const newData = payload.new as { en_turno?: boolean; activo?: boolean };
                return {
                  ...inspector,
                  en_turno: newData.en_turno ?? inspector.en_turno,
                  activo: newData.activo ?? inspector.activo,
                };
              }
              return inspector;
            })
          );
        }
      )
      .subscribe();

    // Cleanup: desuscribirse al desmontar componente
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Función para cargar turnos disponibles
  const fetchTurnos = async () => {
    try {
      const res = await fetch("/api/shifts/inspector");
      if (!res.ok) throw new Error("Error al obtener turnos");
      const data = await res.json();
      setTurnos(data || []);
    } catch (error) {
      console.error("Error cargando turnos:", error);
    }
  };

  // Función para cargar inspectores desde el BFF
  const fetchInspectors = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inspectors");

      if (!res.ok) {
        throw new Error("Error al obtener inspectores");
      }

      const data = await res.json();
      setInspectors(data.inspectors || []);
    } catch (error) {
      console.error("Error cargando inspectores:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los inspectores",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const inspector = inspectors.find((i) => i.id === id);
    if (inspector) {
      setSelectedInspector(inspector);
      setEditModalOpen(true);
    }
  };

  const handleUpdateInspector = async (
    formData: InspectorFormData & { activo?: boolean }
  ) => {
    if (!selectedInspector) return;

    setLoading(true);
    try {
      // Preparar payload para actualización
      const payload = {
        usuario_id: selectedInspector.id,
        name: formData.nombre,
        last_name: formData.apellido,
        phone: formData.telefono,
        turno_id: formData.turno_id,
        activo: formData.activo,
      };

      console.log("Actualizando inspector:", payload);

      // Llamar al endpoint de actualización
      const res = await fetch("/api/inspectors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("Error actualizando inspector:", result);
        await Swal.fire({
          icon: "error",
          title: "Error al actualizar",
          text:
            result?.error ||
            result?.message ||
            "No se pudo actualizar el inspector",
          confirmButtonColor: "#003C96",
        });
        return;
      }

      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: "success",
        title: "Inspector actualizado",
        text: "El inspector ha sido actualizado exitosamente",
        timer: 2000,
        confirmButtonColor: "#003C96",
      });

      // Cerrar modal
      setEditModalOpen(false);
      setSelectedInspector(null);

      // Recargar lista
      fetchInspectors();
    } catch (error) {
      console.error("Error actualizando inspector:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Error al actualizar inspector",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);

      // Llamar al endpoint de eliminación
      const res = await fetch(`/api/inspectors?usuario_id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error eliminando inspector:", data);
        await Swal.fire({
          icon: "error",
          title: "Error al eliminar",
          text: data?.error || "No se pudo eliminar el inspector",
          confirmButtonColor: "#003C96",
        });
        return;
      }

      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: "success",
        title: "Inspector eliminado",
        text: "El inspector ha sido eliminado exitosamente",
        timer: 2000,
        confirmButtonColor: "#003C96",
      });

      // Recargar lista
      fetchInspectors();
    } catch (error) {
      console.error("Error eliminando inspector:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Error al eliminar inspector",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (formData: InspectorFormData) => {
    setLoading(true);
    try {
      // Preparar payload para el endpoint
      const payload = {
        email: formData.email,
        password: formData.password,
        name: formData.nombre,
        last_name: formData.apellido,
        phone: formData.telefono,
        turno_id: formData.turno_id,
      };

      console.log("Enviando datos del inspector:", payload);

      // Llamar al endpoint de creación de inspector
      const res = await fetch("/api/inspectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("Error registrando inspector:", result);
        await Swal.fire({
          icon: "error",
          title: "Error al crear inspector",
          text:
            result?.error || result?.message || "No se pudo crear el inspector",
          confirmButtonColor: "#003C96",
        });
        return;
      }

      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: "success",
        title: "Inspector creado",
        text: `El inspector ha sido registrado exitosamente con el turno ${formData.turno_nombre}`,
        timer: 2000,
        confirmButtonColor: "#003C96",
      });

      // Cerrar modal
      setModalOpen(false);

      // Recargar lista de inspectores desde el servidor
      fetchInspectors();
    } catch (error) {
      console.error("Error al crear inspector:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Error al registrar inspector",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar inspectores según búsqueda y filtros
  const filteredInspectors = inspectors.filter((inspector) => {
    // Filtro de búsqueda (nombre o email)
    const matchesSearch =
      searchTerm === "" ||
      inspector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspector.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de turno
    const matchesTurno =
      selectedTurno === "" || inspector.turno?.id.toString() === selectedTurno;

    // Filtro de estado
    const matchesEstado =
      selectedEstado === "" ||
      (selectedEstado === "activo" && inspector.activo) ||
      (selectedEstado === "inactivo" && !inspector.activo);

    return matchesSearch && matchesTurno && matchesEstado;
  });

  return (
    <div className="w-full py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Catálogo de Inspectores
          </h1>
          <p className="text-sm text-gray-600">
            Administración de inspectores municipales
          </p>
        </div>
        <ButtonComponent
          accion="agregar"
          className="flex items-center gap-2 bg-[#003C96] hover:bg-[#0085CA]"
          onClick={() => setModalOpen(true)}
          disabled={loading}
        >
          Nuevo Inspector
        </ButtonComponent>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow p-4 flex flex-col items-start">
          <span className="text-2xl font-bold text-gray-900">
            {inspectors.length}
          </span>
          <span className="text-sm text-gray-600 mt-1">Total Inspectores</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow p-4 flex flex-col items-start">
          <span className="text-2xl font-bold text-green-600">
            {inspectors.filter((i) => i.en_turno).length}
          </span>
          <span className="text-sm text-gray-600 mt-1">En turno</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow p-4 flex flex-col items-start">
          <span className="text-2xl font-bold text-red-600">
            {inspectors.filter((i) => !i.en_turno).length}
          </span>
          <span className="text-sm text-gray-600 mt-1">Fuera de turno</span>
        </div>
      </div>

      <InspectorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddUser}
      />

      {selectedInspector && (
        <EditInspectorModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedInspector(null);
          }}
          onSubmit={handleUpdateInspector}
          initialData={{
            name: selectedInspector.name,
            telefono: selectedInspector.telefono,
            activo: selectedInspector.activo,
            turno: selectedInspector.turno,
          }}
        />
      )}

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl border border-gray-200 shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <SearchComponent
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
          />

          {/* Filtro por Turno */}
          <SelectComponent
            placeholder="Todos los turnos"
            value={selectedTurno}
            onChange={(e) => setSelectedTurno(e.target.value)}
          >
            <option value="">Todos los turnos</option>
            {turnos.map((turno) => (
              <option key={turno.id} value={turno.id.toString()}>
                {turno.nombre}
              </option>
            ))}
          </SelectComponent>

          {/* Filtro por Estado */}
          <SelectComponent
            placeholder="Todos los estados"
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </SelectComponent>
        </div>

        {/* Contador de resultados */}
        {(searchTerm || selectedTurno || selectedEstado) && (
          <div className="mt-3 text-sm text-gray-600">
            Mostrando {filteredInspectors.length} de {inspectors.length}{" "}
            inspectores
          </div>
        )}
      </div>

      {/* Tabla de inspectores */}
      <div className="bg-white rounded-xl border border-gray-200 shadow p-2">
        <TableComponent<Inspector>
          columns={[
            {
              key: "numero",
              header: "N°",
              width: "5%",
              align: "center",
              render: (row: Inspector) => (
                <span className="font-semibold text-gray-700">
                  {row.numero}
                </span>
              ),
            },
            {
              key: "name",
              header: "Nombre",
              width: "20%",
              render: (row: Inspector) => (
                <span className="flex items-center gap-2 font-medium text-gray-900">
                  <User className="w-4 h-4 text-gray-400" />
                  {row.name}
                </span>
              ),
            },
            {
              key: "telefono",
              header: "Teléfono",
              width: "13%",
              render: (row: Inspector) => (
                <span className="text-gray-700">{row.telefono}</span>
              ),
            },
            {
              key: "email",
              header: "Email",
              width: "22%",
              render: (row: Inspector) => (
                <span className="text-gray-700">{row.email}</span>
              ),
            },
            {
              key: "turno",
              header: "Turno",
              width: "15%",
              render: (row: Inspector) => (
                <span className="text-gray-700">
                  {row.turno ? (
                    row.turno.nombre
                  ) : (
                    <span className="text-gray-400 italic">Sin turno</span>
                  )}
                </span>
              ),
            },
            {
              key: "en_turno",
              header: "Estado de Turno",
              width: "10%",
              align: "center",
              render: (row: Inspector) => (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    row.en_turno
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}
                >
                  {row.en_turno ? "En turno" : "Fuera de turno"}
                </span>
              ),
            },
            {
              key: "acciones",
              header: "Acciones",
              width: "15%",
              align: "center",
              render: (row: Inspector) => (
                <div className="flex gap-2 justify-center">
                  <ButtonComponent
                    accion="editar"
                    className="flex items-center gap-1 bg-[#003C96] hover:bg-[#0085CA] px-3 py-1 text-xs"
                    onClick={() => handleEdit(row.id)}
                  >
                    Editar
                  </ButtonComponent>
                  <ButtonComponent
                    accion="eliminar"
                    className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 text-xs"
                    onClick={() => handleDelete(row.id)}
                  >
                    Eliminar
                  </ButtonComponent>
                </div>
              ),
            },
          ]}
          data={filteredInspectors}
          page={page}
          pageSize={pageSize}
          total={filteredInspectors.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          emptyMessage={
            loading
              ? "Cargando inspectores..."
              : searchTerm || selectedTurno || selectedEstado
              ? "No se encontraron inspectores con los filtros aplicados"
              : "No hay inspectores registrados"
          }
        />
      </div>
    </div>
  );
}

export default withPageProtection(InspectoresPage);
