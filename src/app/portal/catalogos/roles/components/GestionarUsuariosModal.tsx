"use client";

import { useState, useEffect } from "react";
import { X, Search, UserCheck, UserX } from "lucide-react";
import Swal from "sweetalert2";

interface Usuario {
  usuario_id: string;
  rol_id: number;
  activo: boolean;
  perfiles_ciudadanos?: {
    nombre?: string;
    apellido?: string;
    email?: string;
  };
  roles_portal?: {
    id: number;
    nombre: string;
  };
}

interface GestionarUsuariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  rol: {
    id: number;
    nombre: string;
  };
  onSuccess: () => void;
}

export default function GestionarUsuariosModal({
  isOpen,
  onClose,
  rol,
  onSuccess,
}: GestionarUsuariosModalProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarUsuarios();
    }
  }, [isOpen]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/roles/users");
      const data = await response.json();

      if (response.ok) {
        setUsuarios(data.usuarios || []);
      } else {
        throw new Error(data.error || "Error al cargar usuarios");
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los usuarios",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarRol = async (usuario: Usuario, nuevoRolId: number) => {
    try {
      const response = await fetch("/api/roles/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: usuario.usuario_id,
          rol_id: nuevoRolId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });

        Toast.fire({
          icon: "success",
          title: `Usuario ${
            nuevoRolId === rol.id ? "asignado" : "removido"
          } exitosamente`,
        });

        cargarUsuarios();
        onSuccess();
      } else {
        throw new Error(data.error || "Error al cambiar el rol del usuario");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const perfil = usuario.perfiles_ciudadanos;
    const nombreCompleto = `${perfil?.nombre || ""} ${
      perfil?.apellido || ""
    }`.toLowerCase();
    const email = (perfil?.email || "").toLowerCase();
    const termino = busqueda.toLowerCase();

    return nombreCompleto.includes(termino) || email.includes(termino);
  });

  const usuariosConRol = usuariosFiltrados.filter((u) => u.rol_id === rol.id);
  const usuariosSinRol = usuariosFiltrados.filter((u) => u.rol_id !== rol.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gestionar Usuarios</h2>
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
              placeholder="Buscar por nombre o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Cargando usuarios...</p>
            </div>
          ) : (
            <>
              {/* Usuarios con este rol */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <UserCheck className="text-green-600" size={20} />
                  Usuarios con este rol ({usuariosConRol.length})
                </h3>
                <div className="space-y-2">
                  {usuariosConRol.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">
                      No hay usuarios con este rol
                    </p>
                  ) : (
                    usuariosConRol.map((usuario) => {
                      const perfil = usuario.perfiles_ciudadanos;
                      return (
                        <div
                          key={usuario.usuario_id}
                          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {perfil?.nombre} {perfil?.apellido}
                            </p>
                            <p className="text-sm text-gray-600">
                              {perfil?.email}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              Swal.fire({
                                title: "¿Remover usuario?",
                                text: `¿Deseas remover a ${perfil?.nombre} ${perfil?.apellido} de este rol?`,
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: "Remover",
                                cancelButtonText: "Cancelar",
                                confirmButtonColor: "#dc2626",
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  // Asignar a un rol por defecto (asumimos rol_id 3 como "Usuario")
                                  // Ajustar según tu configuración
                                  handleCambiarRol(usuario, 3);
                                }
                              });
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Usuarios sin este rol */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <UserX className="text-gray-600" size={20} />
                  Otros usuarios ({usuariosSinRol.length})
                </h3>
                <div className="space-y-2">
                  {usuariosSinRol.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">
                      No hay otros usuarios disponibles
                    </p>
                  ) : (
                    usuariosSinRol.map((usuario) => {
                      const perfil = usuario.perfiles_ciudadanos;
                      return (
                        <div
                          key={usuario.usuario_id}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {perfil?.nombre} {perfil?.apellido}
                            </p>
                            <p className="text-sm text-gray-600">
                              {perfil?.email}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Rol actual:{" "}
                              {usuario.roles_portal?.nombre || "Sin rol"}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCambiarRol(usuario, rol.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Asignar
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
