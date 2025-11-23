"use client";

import { useState, useEffect } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import TableComponent from "@/app/components/TableComponent";
import ToggleSwitch from "@/app/components/ToggleSwitchComponent";
import SearchComponent from "@/app/components/SearchComponent";
import SelectComponent from "@/app/components/SelectComponent";
import { User } from "lucide-react";
import UserModal from "./components/UserModal";
import EditUserModal from "./components/EditUserModal";
import Swal from "sweetalert2";
import { withPageProtection } from "@/lib/security/withPageProtection";

const rolColor: Record<string, string> = {
  Administrador: "bg-red-100 text-red-700",
  Operador: "bg-blue-100 text-blue-700",
};

interface Employee {
  id: string;
  numero: number;
  name: string;
  email: string;
  rol_id: number;
  activo: boolean;
  telefono?: string;
  apellido?: string;
}

const rolMap: Record<number, string> = {
  1: "Administrador",
  2: "Operador",
};

interface UserForm {
  nombre: string;
  email: string;
  rol?: string;
  password?: string;
  apellido?: string;
  telefono?: string;
  rol_id?: number;
}

function UsuariosPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRol, setSelectedRol] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [roles, setRoles] = useState<{ id: number; nombre: string }[]>([]);

  // Cargar funcionarios al montar el componente
  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, []);

  // Función para cargar roles disponibles
  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      if (!res.ok) throw new Error("Error al obtener roles");
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (error) {
      console.error("Error cargando roles:", error);
    }
  };

  // Función para cargar funcionarios desde el BFF
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employees");

      if (!res.ok) {
        throw new Error("Error al obtener funcionarios");
      }

      const data = await res.json();
      const employeesWithNumber = (data.employees || []).map(
        (emp: Employee, index: number) => ({
          ...emp,
          numero: index + 1,
        })
      );
      setEmployees(employeesWithNumber);
    } catch (error) {
      console.error("Error cargando funcionarios:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los funcionarios",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (formData: UserForm) => {
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        name: formData.nombre,
        last_name: formData.apellido,
        phone: formData.telefono,
        rol_id: formData.rol_id,
      };

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        console.error("Error registering user:", result);
        Swal.fire({
          icon: "error",
          title: "Error al crear usuario",
          text:
            result?.error || result?.message || "No se pudo crear el usuario",
          confirmButtonColor: "#003C96",
        });
        return;
      }

      // Mostrar mensaje de éxito
      Swal.fire({
        icon: "success",
        title: "Usuario registrado",
        text: "El usuario ha sido registrado exitosamente",
        timer: 2000,
        confirmButtonColor: "#003C96",
      });

      // Cerrar modal y actualizar lista
      setModalOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error("Error registering user:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error ? error.message : "Error al registrar usuario",
        confirmButtonColor: "#003C96",
      });
    }
  };

  // Función para abrir modal de edición
  const handleEdit = (id: string) => {
    const user = employees.find((emp) => emp.id === id);
    if (user) {
      setSelectedUser(user);
      setEditModalOpen(true);
    }
  };

  // Función para actualizar usuario
  const handleUpdateUser = async (formData: {
    nombre: string;
    apellido: string;
    telefono: string;
    rol_id: number;
  }) => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          name: formData.nombre,
          last_name: formData.apellido,
          phone: formData.telefono,
          rol_id: formData.rol_id,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar usuario");
      }

      Swal.fire({
        icon: "success",
        title: "Usuario actualizado",
        text: "Los datos del usuario han sido actualizados exitosamente",
        timer: 2000,
        confirmButtonColor: "#003C96",
      });

      setEditModalOpen(false);
      setSelectedUser(null);
      fetchEmployees();
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Error al actualizar usuario",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar usuario
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar usuario");
      }

      Swal.fire({
        icon: "success",
        title: "Usuario eliminado",
        text: "El usuario ha sido eliminado exitosamente",
        timer: 2000,
        confirmButtonColor: "#003C96",
      });

      fetchEmployees();
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error ? error.message : "Error al eliminar usuario",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar el estado activo/inactivo
  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          activo: newStatus,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al cambiar estado");
      }

      // Actualizar el estado localmente
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? { ...emp, activo: newStatus } : emp))
      );

      Swal.fire({
        icon: "success",
        title: "Estado actualizado",
        text: `Usuario ${newStatus ? "activado" : "desactivado"} exitosamente`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error cambiando estado:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error ? error.message : "Error al cambiar estado",
        confirmButtonColor: "#003C96",
      });
    }
  };

  // Filtrar usuarios según búsqueda y filtros
  const filteredEmployees = employees.filter((employee) => {
    // Filtro de búsqueda (nombre o email)
    const matchesSearch =
      searchTerm === "" ||
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de rol
    const matchesRol =
      selectedRol === "" || employee.rol_id.toString() === selectedRol;

    // Filtro de estado
    const matchesEstado =
      selectedEstado === "" ||
      (selectedEstado === "activo" && employee.activo) ||
      (selectedEstado === "inactivo" && !employee.activo);

    return matchesSearch && matchesRol && matchesEstado;
  });

  return (
    <div className="w-full py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-gray-600">
            Administración de usuarios del portal (Administradores y Operadores)
          </p>
        </div>
        <ButtonComponent
          accion="agregar"
          className="flex items-center gap-2 bg-[#003C96] hover:bg-[#0085CA]"
          onClick={() => setModalOpen(true)}
          disabled={loading}
        >
          Nuevo Usuario
        </ButtonComponent>
      </div>

      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddUser}
      />

      {selectedUser && (
        <EditUserModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSubmit={handleUpdateUser}
          initialData={{
            nombre: selectedUser.name,
            apellido: selectedUser.apellido || "",
            telefono: selectedUser.telefono || "",
            rol_id: selectedUser.rol_id,
          }}
          email={selectedUser.email}
        />
      )}

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow p-4 flex flex-col items-start">
          <span className="text-2xl font-bold text-gray-900">
            {employees.length}
          </span>
          <span className="text-sm text-gray-600 mt-1">Total Usuarios</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow p-4 flex flex-col items-start">
          <span className="text-2xl font-bold text-green-600">
            {employees.filter((u) => u.activo).length}
          </span>
          <span className="text-sm text-gray-600 mt-1">Activos</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow p-4 flex flex-col items-start">
          <span className="text-2xl font-bold text-red-600">
            {employees.filter((u) => !u.activo).length}
          </span>
          <span className="text-sm text-gray-600 mt-1">Inactivos</span>
        </div>
      </div>

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

          {/* Filtro por Rol */}
          <SelectComponent
            placeholder="Todos los roles"
            value={selectedRol}
            onChange={(e) => setSelectedRol(e.target.value)}
          >
            <option value="">Todos los roles</option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id.toString()}>
                {rol.nombre}
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
        {(searchTerm || selectedRol || selectedEstado) && (
          <div className="mt-3 text-sm text-gray-600">
            Mostrando {filteredEmployees.length} de {employees.length} usuarios
          </div>
        )}
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl border border-gray-200 shadow p-2">
        <TableComponent<Employee>
          columns={[
            {
              key: "numero",
              header: "N°",
              width: "5%",
              align: "center",
              render: (row) => (
                <span className="font-semibold text-gray-700">
                  {row.numero}
                </span>
              ),
            },
            {
              key: "name",
              header: "Nombre",
              width: "25%",
              render: (row) => (
                <span className="flex items-center gap-2 font-medium text-gray-900">
                  <User className="w-4 h-4 text-gray-400" />
                  {row.name}
                </span>
              ),
            },
            {
              key: "email",
              header: "Email",
              width: "30%",
              render: (row) => (
                <span className="text-gray-700">{row.email}</span>
              ),
            },
            {
              key: "rol_id",
              header: "Rol",
              width: "15%",
              align: "center",
              render: (row) => (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    rolColor[rolMap[row.rol_id] || "Sin rol"]
                  }`}
                >
                  {rolMap[row.rol_id] || "Sin rol"}
                </span>
              ),
            },
            {
              key: "activo",
              header: "Estado",
              width: "10%",
              align: "center",
              render: (row) => (
                <div className="flex flex-col items-center gap-2">
                  <ToggleSwitch
                    isActive={row.activo}
                    onChange={(newStatus) =>
                      handleToggleStatus(row.id, newStatus)
                    }
                    size="md"
                  />
                  <span
                    className={`text-xs font-semibold ${
                      row.activo ? "text-[#003C96]" : "text-gray-500"
                    }`}
                  >
                    {row.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              ),
            },
            {
              key: "acciones",
              header: "Acciones",
              width: "15%",
              align: "center",
              render: (row) => (
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
          data={filteredEmployees}
          page={page}
          pageSize={pageSize}
          total={filteredEmployees.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          emptyMessage={
            loading
              ? "Cargando usuarios..."
              : searchTerm || selectedRol || selectedEstado
              ? "No se encontraron usuarios con los filtros aplicados"
              : "No hay usuarios registrados"
          }
        />
      </div>
    </div>
  );
}

export default withPageProtection(UsuariosPage);
