"use client";

import { useState, useEffect } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import CheckComponente from "@/app/components/CheckComponente";

export interface PaginaFormData {
  id?: string;
  nombre: string;
  titulo: string;
  path: string;
  activo: boolean;
}

interface PaginaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaginaFormData) => Promise<void>;
  initialData?: PaginaFormData | null;
  title: string;
}

export default function PaginaModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
}: PaginaModalProps) {
  const [formData, setFormData] = useState<PaginaFormData>({
    nombre: "",
    titulo: "",
    path: "",
    activo: true,
  });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        nombre: "",
        titulo: "",
        path: "",
        activo: true,
      });
    }
    if (isOpen) {
      setShow(true);
    } else {
      const t = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(t);
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.nombre.trim() ||
      !formData.titulo.trim() ||
      !formData.path.trim()
    ) {
      alert("Nombre, título y ruta son requeridos");
      return;
    }
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`absolute inset-0 transition-all duration-200 ${
          isOpen ? "bg-black/30 backdrop-blur-sm" : "bg-black/0 backdrop-blur-0"
        }`}
        aria-hidden="true"
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-xl transform transition-all duration-200 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        } flex flex-col max-h-[85vh] border-t-4`}
        style={{ borderTopColor: "#0B4F9E" }}
      >
        <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
            type="button"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-8 py-4 overflow-y-auto flex-1 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              placeholder="Ej: denuncias, usuarios..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ "--tw-ring-color": "#0085CA" } as React.CSSProperties}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Identificador único (sin espacios)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              placeholder="Ej: Gestión de Denuncias..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ "--tw-ring-color": "#0085CA" } as React.CSSProperties}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Nombre descriptivo para mostrar
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ruta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.path}
              onChange={(e) =>
                setFormData({ ...formData, path: e.target.value })
              }
              placeholder="Ej: /portal/denuncias"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ "--tw-ring-color": "#0085CA" } as React.CSSProperties}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Ruta completa dentro del portal
            </p>
          </div>

          <div className="pt-2">
            <CheckComponente
              checked={formData.activo}
              onChange={(checked) =>
                setFormData({ ...formData, activo: checked })
              }
              label="Página Activa"
              size="md"
            />
          </div>
        </form>

        <div className="px-8 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-2xl">
          <ButtonComponent
            accion="secundario"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </ButtonComponent>
          <ButtonComponent
            accion="agregar"
            onClick={handleSubmit}
            disabled={
              loading ||
              !formData.nombre.trim() ||
              !formData.titulo.trim() ||
              !formData.path.trim()
            }
          >
            {loading
              ? "Guardando..."
              : initialData?.id
              ? "Actualizar"
              : "Crear"}
          </ButtonComponent>
        </div>
      </div>
    </div>
  );
}
