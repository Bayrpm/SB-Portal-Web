"use client";

import { useState, useEffect } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import TableComponent from "@/app/components/TableComponent";
import { User } from "lucide-react";
import UserModal from "./components/UserModal";
import Swal from "sweetalert2";

const rolColor: Record<string, string> = {
  Administrador: "bg-red-100 text-red-700",
  Operador: "bg-blue-100 text-blue-700",
};

interface Employee {
  id: string;
  name: string;
  email: string;
  rol_id: number;
  activo: boolean;
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

export default function UsuariosPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar funcionarios al montar el componente
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Función para cargar funcionarios desde el BFF
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employees");

      if (!res.ok) {
        throw new Error("Error al obtener funcionarios");
      }

      const data = await res.json();
      setEmployees(data.employees || []);
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
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
        >
          Nuevo Usuario
        </ButtonComponent>
        <UserModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAddUser}
        />
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl border border-gray-200 shadow p-2">
        <TableComponent
          columns={[
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
              width: "15%",
              align: "center",
              render: (row) => (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    row.activo
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {row.activo ? "Activo" : "Inactivo"}
                </span>
              ),
            },
            {
              key: "acciones",
              header: "Acciones",
              width: "15%",
              align: "center",
              render: () => (
                <div className="flex gap-2 justify-center">
                  <ButtonComponent
                    accion="editar"
                    className="flex items-center gap-1 bg-[#003C96] hover:bg-[#0085CA] px-3 py-1 text-xs"
                  >
                    Editar
                  </ButtonComponent>
                  <ButtonComponent
                    accion="eliminar"
                    className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 text-xs"
                  >
                    Eliminar
                  </ButtonComponent>
                </div>
              ),
            },
          ]}
          data={employees}
          page={page}
          pageSize={pageSize}
          total={employees.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          emptyMessage={
            loading ? "Cargando usuarios..." : "No hay usuarios registrados"
          }
        />
      </div>
    </div>
  );
}
