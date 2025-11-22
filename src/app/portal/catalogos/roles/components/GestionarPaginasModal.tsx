"use client";

import { useState, useEffect } from "react";
import { X, Search, FileText } from "lucide-react";
import Swal from "sweetalert2";
import CheckComponente from "@/app/components/CheckComponente";
import ButtonComponent from "@/app/components/ButtonComponent";

interface Pagina {
  id: string;
  nombre: string;
  titulo: string;
  path: string;
  activo: boolean;
}

interface GestionarPaginasModalProps {
  isOpen: boolean;
  onClose: () => void;
  rol: {
    id: number;
    nombre: string;
    paginas: Pagina[];
  };
  onSuccess: () => void;
}

export default function GestionarPaginasModal({
  isOpen,
  onClose,
  rol,
  onSuccess,
}: GestionarPaginasModalProps) {
  const [todasPaginas, setTodasPaginas] = useState<Pagina[]>([]);
  const [paginasSeleccionadas, setPaginasSeleccionadas] = useState<Set<string>>(
    new Set()
  );
  const [paginasOriginales, setPaginasOriginales] = useState<Set<string>>(
    new Set()
  );
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarPaginas();
      const paginasInicialesSet = new Set(rol.paginas.map((p) => p.id));
      setPaginasSeleccionadas(paginasInicialesSet);
      setPaginasOriginales(paginasInicialesSet);
    }
  }, [isOpen, rol.paginas]);

  const cargarPaginas = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pages");
      const data = await response.json();

      if (response.ok) {
        setTodasPaginas(data.paginas || []);
      } else {
        throw new Error(data.error || "Error al cargar páginas");
      }
    } catch (error) {
      console.error("Error cargando páginas:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las páginas",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePagina = (paginaId: string) => {
    const nuevasSeleccionadas = new Set(paginasSeleccionadas);
    if (nuevasSeleccionadas.has(paginaId)) {
      nuevasSeleccionadas.delete(paginaId);
    } else {
      nuevasSeleccionadas.add(paginaId);
    }
    setPaginasSeleccionadas(nuevasSeleccionadas);
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);

      // Páginas a agregar (en nuevasSeleccionadas pero no en originales)
      const paginasParaAgregar = Array.from(paginasSeleccionadas).filter(
        (id) => !paginasOriginales.has(id)
      );

      // Páginas a quitar (en originales pero no en nuevasSeleccionadas)
      const paginasParaQuitar = Array.from(paginasOriginales).filter(
        (id) => !paginasSeleccionadas.has(id)
      );

      // Agregar páginas
      for (const paginaId of paginasParaAgregar) {
        const response = await fetch("/api/roles/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rol_id: rol.id,
            pagina_id: paginaId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Error al agregar página");
        }
      }

      // Quitar páginas
      for (const paginaId of paginasParaQuitar) {
        const response = await fetch(
          `/api/roles/pages?rol_id=${rol.id}&pagina_id=${paginaId}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Error al quitar página");
        }
      }

      Swal.fire({
        icon: "success",
        title: "Cambios guardados",
        text: `Se actualizaron ${
          paginasParaAgregar.length + paginasParaQuitar.length
        } página(s)`,
        timer: 2000,
        confirmButtonColor: "#003C96",
      });

      setPaginasOriginales(paginasSeleccionadas);
      onSuccess();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Error desconocido",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setGuardando(false);
    }
  };

  const paginasFiltradas = todasPaginas.filter((pagina) => {
    const termino = busqueda.toLowerCase();
    return (
      pagina.nombre.toLowerCase().includes(termino) ||
      pagina.titulo.toLowerCase().includes(termino) ||
      pagina.path.toLowerCase().includes(termino)
    );
  });

  const haysCambios =
    paginasSeleccionadas.size !== paginasOriginales.size ||
    Array.from(paginasSeleccionadas).some((id) => !paginasOriginales.has(id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200"
        style={{ borderColor: "#0085CA" }}
      >
        {/* Header */}
        <div
          className="text-white p-6 flex justify-between items-center"
          style={{ backgroundColor: "#0B4F9E" }}
        >
          <div>
            <h2 className="text-2xl font-bold">Gestionar Páginas</h2>
            <p className="text-blue-100 mt-1">Rol: {rol.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Búsqueda */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar por nombre, título o ruta..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ "--tw-ring-color": "#0085CA" } as React.CSSProperties}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Selecciona o deselecciona múltiples páginas. Los cambios se
            guardarán al hacer clic en &quot;Guardar&quot;.
          </p>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Cargando páginas...</p>
            </div>
          ) : paginasFiltradas.length === 0 ? (
            <p className="text-center text-gray-500">
              {busqueda
                ? "No se encontraron páginas con ese término"
                : "No hay páginas disponibles"}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginasFiltradas.map((pagina) => (
                <div
                  key={pagina.id}
                  className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <CheckComponente
                    checked={paginasSeleccionadas.has(pagina.id)}
                    onChange={() => handleTogglePagina(pagina.id)}
                    disabled={loading}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <FileText
                        className="text-blue-600 flex-shrink-0 mt-0.5"
                        size={16}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {pagina.titulo}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {pagina.path}
                        </p>
                        {!pagina.activo && (
                          <span className="inline-block text-xs text-red-600 mt-1">
                            Inactiva
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <ButtonComponent accion="secundario" onClick={onClose}>
            Cancelar
          </ButtonComponent>
          <ButtonComponent
            accion="agregar"
            onClick={handleGuardar}
            disabled={!haysCambios || guardando}
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </ButtonComponent>
        </div>
      </div>
    </div>
  );
}
