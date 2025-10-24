"use client";

import { useState } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import TableComponent from "@/app/components/TableComponent";
import ToggleSwitch from "@/app/components/ToggleSwitchComponent";
import { User } from "lucide-react";

interface Inspector {
  id: string;
  numero: number;
  name: string;
  telefono: string;
  email: string;
  activo: boolean;
}

export default function InspectoresPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Datos de ejemplo (temporal)
  const [inspectors, setInspectors] = useState<Inspector[]>([
    {
      id: "1",
      numero: 1,
      name: "Carlos Martínez González",
      telefono: "+56 9 8765 4321",
      email: "cmartinez@sanbernardo.cl",
      activo: true,
    },
    {
      id: "2",
      numero: 2,
      name: "María Fernanda Rojas",
      telefono: "+56 9 7654 3210",
      email: "mrojas@sanbernardo.cl",
      activo: false,
    },
  ]);

  const handleToggleStatus = (id: string, newStatus: boolean) => {
    setInspectors((prev) =>
      prev.map((inspector) =>
        inspector.id === id ? { ...inspector, activo: newStatus } : inspector
      )
    );
    // TODO: Aquí irá la lógica para actualizar en el backend
    console.log(`Inspector ${id} cambió a estado: ${newStatus}`);
  };

  const handleEdit = (id: string) => {
    // TODO: Implementar lógica de edición
    console.log(`Editar inspector ${id}`);
  };

  const handleDelete = (id: string) => {
    // TODO: Implementar lógica de eliminación
    console.log(`Eliminar inspector ${id}`);
  };

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
          onClick={() => console.log("Agregar inspector")}
        >
          Nuevo Inspector
        </ButtonComponent>
      </div>

      {/* Tabla de inspectores */}
      <div className="bg-white rounded-xl border border-gray-200 shadow p-2">
        <TableComponent
          columns={[
            {
              key: "numero",
              header: "N°",
              width: "60px",
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
              key: "telefono",
              header: "Teléfono",
              width: "15%",
              render: (row) => (
                <span className="text-gray-700">{row.telefono}</span>
              ),
            },
            {
              key: "email",
              header: "Email",
              width: "25%",
              render: (row) => (
                <span className="text-gray-700">{row.email}</span>
              ),
            },
            {
              key: "activo",
              header: "Estado",
              width: "15%",
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
          data={inspectors}
          page={page}
          pageSize={pageSize}
          total={inspectors.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          emptyMessage="No hay inspectores registrados"
        />
      </div>
    </div>
  );
}
