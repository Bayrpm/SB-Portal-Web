"use client";

import { useState, useEffect } from "react";
import { FileText, Globe, Check, X } from "lucide-react";
import Swal from "sweetalert2";
import ButtonComponent from "@/app/components/ButtonComponent";
import TableComponent, { Column } from "@/app/components/TableComponent";
import SearchComponent from "@/app/components/SearchComponent";
import Loader from "@/app/components/Loader";
import PageAccessValidator from "@/app/components/PageAccessValidator";
import PaginaModal from "./components/PaginaModal";

interface Pagina {
  id: string;
  nombre: string;
  titulo: string;
  path: string;
  activo: boolean;
  created_at?: string;
}

interface PaginaFormData {
  id?: string;
  nombre: string;
  titulo: string;
  path: string;
  activo: boolean;
}

export default function PaginasPage() {
  const [paginas, setPaginas] = useState<Pagina[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginaModalAbierto, setPaginaModalAbierto] = useState(false);
  const [paginaParaEditar, setPaginaParaEditar] =
    useState<PaginaFormData | null>(null);

  useEffect(() => {
    cargarPaginas();
  }, []);

  const cargarPaginas = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pages");
      const data = await response.json();

      if (response.ok) {
        setPaginas(data.paginas || []);
      } else {
        throw new Error(data.error || "Error al cargar páginas");
      }
    } catch (error) {
      console.error("Error cargando páginas:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las páginas",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCrearPagina = () => {
    setPaginaParaEditar(null);
    setPaginaModalAbierto(true);
  };

  const handleEditarPagina = (pagina: Pagina) => {
    setPaginaParaEditar({
      id: pagina.id,
      nombre: pagina.nombre,
      titulo: pagina.titulo,
      path: pagina.path,
      activo: pagina.activo,
    });
    setPaginaModalAbierto(true);
  };

  const handleSubmitPagina = async (formData: PaginaFormData) => {
    try {
      const isCreating = !formData.id;
      const response = await fetch("/api/pages", {
        method: isCreating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: isCreating ? "Página Creada" : "Página Actualizada",
          text: `La página "${formData.titulo}" ha sido ${
            isCreating ? "creada" : "actualizada"
          } exitosamente`,
          timer: 2000,
          confirmButtonColor: "#003C96",
        });
        cargarPaginas();
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

  const handleEliminarPagina = async (pagina: Pagina) => {
    const result = await Swal.fire({
      title: "¿Eliminar Página?",
      html: `<p>¿Estás seguro de que deseas eliminar la página <strong>"${pagina.titulo}"</strong>?</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#9CA3AF",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/pages?id=${pagina.id}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Página Eliminada",
            timer: 2000,
            confirmButtonColor: "#003C96",
          });
          cargarPaginas();
        } else {
          throw new Error(data.error || "Error al eliminar la página");
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

  // Filtrado y paginación
  const paginasFiltradas = paginas.filter(
    (pagina) =>
      pagina.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pagina.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pagina.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginasPaginadas = paginasFiltradas.slice(startIndex, endIndex);

  const columns: Column<Pagina>[] = [
    {
      key: "nombre",
      header: "Nombre",
      sortable: true,
      width: "20%",
      render: (pagina) => (
        <div className="flex items-center gap-2">
          <FileText className="text-blue-600 flex-shrink-0" size={18} />
          <span className="font-semibold text-gray-900">{pagina.nombre}</span>
        </div>
      ),
    },
    {
      key: "titulo",
      header: "Título",
      sortable: true,
      width: "25%",
      render: (pagina) => (
        <span className="text-gray-700">{pagina.titulo}</span>
      ),
    },
    {
      key: "path",
      header: "Ruta",
      sortable: true,
      width: "25%",
      render: (pagina) => (
        <div className="flex items-center gap-2">
          <Globe className="text-gray-400 flex-shrink-0" size={16} />
          <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
            {pagina.path}
          </code>
        </div>
      ),
    },
    {
      key: "activo",
      header: "Estado",
      align: "center",
      sortable: true,
      width: "15%",
      render: (pagina) => (
        <div className="flex items-center justify-center">
          {pagina.activo ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
              <Check size={14} />
              Activa
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
              <X size={14} />
              Inactiva
            </span>
          )}
        </div>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      align: "center",
      width: "15%",
      render: (pagina) => (
        <div className="flex items-center justify-center gap-2">
          <ButtonComponent
            accion="editar"
            size="sm"
            onClick={() => handleEditarPagina(pagina)}
          >
            Editar
          </ButtonComponent>
          <ButtonComponent
            accion="eliminar"
            size="sm"
            confirm
            onClick={() => handleEliminarPagina(pagina)}
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
    <PageAccessValidator pagePath="/portal/catalogos/paginas">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#0B4F9E" }}
              >
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Catálogo de Páginas
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Administra las páginas disponibles en el sistema
                </p>
              </div>
            </div>
            <ButtonComponent accion="agregar" onClick={handleCrearPagina}>
              Crear Página
            </ButtonComponent>
          </div>
        </div>

        {/* Búsqueda y Estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <SearchComponent
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, título o ruta..."
            />
          </div>
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#E6F4FA" }}
            >
              <FileText style={{ color: "#0085CA" }} size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total de Páginas</p>
              <p className="text-xl font-bold text-gray-900">
                {paginas.length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#DCFCE7" }}
            >
              <Check style={{ color: "#16A34A" }} size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600">Páginas Activas</p>
              <p className="text-xl font-bold text-gray-900">
                {paginas.filter((p) => p.activo).length}
              </p>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <TableComponent
          columns={columns}
          data={paginasPaginadas}
          loading={loading}
          emptyMessage="No se encontraron páginas"
          page={page}
          pageSize={pageSize}
          total={paginasFiltradas.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />

        {/* Modal */}
        <PaginaModal
          isOpen={paginaModalAbierto}
          onClose={() => setPaginaModalAbierto(false)}
          initialData={paginaParaEditar || undefined}
          onSubmit={handleSubmitPagina}
          title={paginaParaEditar ? "Editar Página" : "Crear Nueva Página"}
        />
      </div>
    </PageAccessValidator>
  );
}
