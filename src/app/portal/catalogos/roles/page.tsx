"use client";

import { useState, useEffect } from "react";
import { Users, FileText, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";
import ButtonComponent from "@/app/components/ButtonComponent";
import TableComponent, { Column } from "@/app/components/TableComponent";
import SearchComponent from "@/app/components/SearchComponent";
import Loader from "@/app/components/Loader";
import PageAccessValidator from "@/app/components/PageAccessValidator";
import GestionarUsuariosModal from "./components/GestionarUsuariosModal";
import GestionarPaginasModal from "./components/GestionarPaginasModal";
import RolModal, { RolFormData } from "./components/RolModal";

interface Pagina {
  id: string;
  nombre: string;
  titulo: string;
  path: string;
  activo: boolean;
}

interface Usuario {
  usuario_id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  activo: boolean;
  perfiles_ciudadanos?: {
    nombre?: string;
    apellido?: string;
    email?: string;
  };
}

interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  usuarios: Usuario[];
  paginas: Pagina[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
  const [modalUsuariosAbierto, setModalUsuariosAbierto] = useState(false);
  const [modalPaginasAbierto, setModalPaginasAbierto] = useState(false);
  const [rolModalAbierto, setRolModalAbierto] = useState(false);
  const [rolParaEditar, setRolParaEditar] = useState<RolFormData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    cargarRoles();
  }, []);

  const cargarRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/roles");
      const data = await response.json();

      if (response.ok) {
        setRoles(data.roles || []);
      } else {
        throw new Error(data.error || "Error al cargar roles");
      }
    } catch (error) {
      console.error("Error cargando roles:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los roles",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCrearRol = () => {
    setRolParaEditar(null);
    setRolModalAbierto(true);
  };

  const handleEditarRol = (rol: Rol) => {
    setRolParaEditar({
      id: rol.id,
      nombre: rol.nombre,
      descripcion: rol.descripcion || "",
    });
    setRolModalAbierto(true);
  };

  const handleSubmitRol = async (formData: RolFormData) => {
    try {
      const isCreating = !formData.id;
      const response = await fetch("/api/roles", {
        method: isCreating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: isCreating ? "Rol Creado" : "Rol Actualizado",
          text: `El rol "${formData.nombre}" ha sido ${
            isCreating ? "creado" : "actualizado"
          } exitosamente`,
          timer: 2000,
          confirmButtonColor: "#003C96",
        });
        cargarRoles();
      } else {
        throw new Error(data.error || "Error en la operación");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Error desconocido",
        confirmButtonColor: "#003C96",
      });
      throw error;
    }
  };

  const handleEliminarRol = async (rol: Rol) => {
    const result = await Swal.fire({
      title: "¿Eliminar Rol?",
      html: `
        <p>¿Estás seguro de que deseas eliminar el rol <strong>"${
          rol.nombre
        }"</strong>?</p>
        ${
          rol.usuarios.length > 0
            ? `<p class="text-red-600 mt-2">Este rol tiene ${rol.usuarios.length} usuarios asignados. No se puede eliminar.</p>`
            : ""
        }
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#9CA3AF",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/roles?id=${rol.id}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Rol Eliminado",
            timer: 2000,
            confirmButtonColor: "#003C96",
          });
          cargarRoles();
        } else {
          throw new Error(data.error || "Error al eliminar el rol");
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error instanceof Error ? error.message : "Error desconocido",
          confirmButtonColor: "#003C96",
        });
      }
    }
  };

  const handleGestionarUsuarios = (rol: Rol) => {
    setSelectedRol(rol);
    setModalUsuariosAbierto(true);
  };

  const handleGestionarPaginas = (rol: Rol) => {
    setSelectedRol(rol);
    setModalPaginasAbierto(true);
  };

  // Filtrado y paginación
  const rolesFiltrados = roles.filter((rol) =>
    rol.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const rolesPaginados = rolesFiltrados.slice(startIndex, endIndex);

  const columns: Column<Rol>[] = [
    {
      key: "nombre",
      header: "Rol",
      sortable: true,
      width: "30%",
      render: (rol) => (
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-blue-600 flex-shrink-0" size={18} />
          <div>
            <div className="font-semibold text-gray-900">{rol.nombre}</div>
            {rol.descripcion && (
              <div className="text-xs text-gray-500">{rol.descripcion}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "usuarios",
      header: "Usuarios",
      align: "center",
      width: "15%",
      render: (rol) => (
        <div className="flex items-center justify-center gap-2">
          <Users className="text-blue-600 flex-shrink-0" size={16} />
          <span className="font-medium text-gray-900">
            {rol.usuarios.length}
          </span>
        </div>
      ),
    },
    {
      key: "paginas",
      header: "Páginas",
      align: "center",
      width: "15%",
      render: (rol) => (
        <div className="flex items-center justify-center gap-2">
          <FileText className="text-green-600 flex-shrink-0" size={16} />
          <span className="font-medium text-gray-900">
            {rol.paginas.filter((p) => p.activo).length}
          </span>
        </div>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      align: "center",
      width: "40%",
      render: (rol) => (
        <div className="flex items-center justify-center gap-2">
          <ButtonComponent
            accion="editar"
            size="sm"
            onClick={() => handleEditarRol(rol)}
          >
            Editar
          </ButtonComponent>
          <ButtonComponent
            accion="ver"
            size="sm"
            onClick={() => handleGestionarUsuarios(rol)}
          >
            Usuarios
          </ButtonComponent>
          <ButtonComponent
            accion="inspeccionar"
            size="sm"
            onClick={() => handleGestionarPaginas(rol)}
          >
            Páginas
          </ButtonComponent>
          <ButtonComponent
            accion="eliminar"
            size="sm"
            confirm
            onClick={() => handleEliminarRol(rol)}
          >
            Eliminar
          </ButtonComponent>
        </div>
      ),
    },
  ];

  if (loading) {
    return <Loader />;
  }

  return (
    <PageAccessValidator pagePath="/portal/catalogos/roles">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#0B4F9E" }}
              >
                <ShieldCheck className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gestión de Roles
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Administra los roles del sistema y sus permisos
                </p>
              </div>
            </div>
            <ButtonComponent accion="agregar" onClick={handleCrearRol}>
              Crear Rol
            </ButtonComponent>
          </div>
        </div>

        {/* Búsqueda y Estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <SearchComponent
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre de rol..."
            />
          </div>
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#E6F4FA" }}
            >
              <ShieldCheck style={{ color: "#0085CA" }} size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total de Roles</p>
              <p className="text-xl font-bold text-gray-900">{roles.length}</p>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <TableComponent
          columns={columns}
          data={rolesPaginados}
          loading={loading}
          emptyMessage="No se encontraron roles"
          page={page}
          pageSize={pageSize}
          total={rolesFiltrados.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />

        {/* Modales */}
        <RolModal
          isOpen={rolModalAbierto}
          onClose={() => setRolModalAbierto(false)}
          initialData={rolParaEditar || undefined}
          onSubmit={handleSubmitRol}
          title={rolParaEditar ? "Editar Rol" : "Crear Nuevo Rol"}
        />

        {selectedRol && (
          <>
            <GestionarUsuariosModal
              isOpen={modalUsuariosAbierto}
              onClose={() => {
                setModalUsuariosAbierto(false);
                setSelectedRol(null);
              }}
              rol={{
                id: selectedRol.id,
                nombre: selectedRol.nombre,
              }}
              onSuccess={cargarRoles}
            />

            <GestionarPaginasModal
              isOpen={modalPaginasAbierto}
              onClose={() => {
                setModalPaginasAbierto(false);
                setSelectedRol(null);
              }}
              rol={selectedRol}
              onSuccess={cargarRoles}
            />
          </>
        )}
      </div>
    </PageAccessValidator>
  );
}
