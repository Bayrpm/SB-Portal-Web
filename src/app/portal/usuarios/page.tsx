"use client";

import { useState } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import TableComponent from "@/app/components/TableComponent";
import { User } from "lucide-react";

const usuarios = [
  {
    id: 1,
    nombre: "María González",
    email: "admin@demo.cl",
    rol: "Administrador",
  },
  {
    id: 2,
    nombre: "Carlos Rodríguez",
    email: "operador@demo.cl",
    rol: "Operador",
  },
];

const resumen = [
  { label: "Total Usuarios", value: 2 },
  { label: "Administradores", value: 1 },
  { label: "Operadores", value: 1 },
];

const rolColor: Record<string, string> = {
  Administrador: "bg-red-100 text-red-700",
  Operador: "bg-blue-100 text-blue-700",
};

export default function UsuariosPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
        >
          Nuevo Usuario
        </ButtonComponent>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {resumen.map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center"
          >
            <span className="text-3xl font-bold text-gray-900">
              {item.value}
            </span>
            <span className="text-sm text-gray-600 mt-2">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl border border-gray-200 shadow p-2">
        <TableComponent
          columns={[
            {
              key: "id",
              header: "ID",
              width: "60px",
              align: "center",
            },
            {
              key: "nombre",
              header: "Nombre",
              render: (row) => (
                <span className="flex items-center gap-2 font-medium text-gray-900">
                  <User className="w-4 h-4 text-gray-400" />
                  {row.nombre}
                </span>
              ),
            },
            {
              key: "email",
              header: "Email",
            },
            {
              key: "rol",
              header: "Rol",
              render: (row) => (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    rolColor[row.rol]
                  } border-transparent`}
                >
                  {row.rol}
                </span>
              ),
            },
            {
              key: "acciones",
              header: "Acciones",
              align: "center",
              render: () => (
                <div className="flex gap-2">
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
          data={usuarios}
          page={page}
          pageSize={pageSize}
          total={usuarios.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          emptyMessage="No hay usuarios registrados"
        />
      </div>
    </div>
  );
}
