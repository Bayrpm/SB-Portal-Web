"use client";

import { useState, useEffect } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import CheckComponente from "@/app/components/CheckComponente";

export interface TipoMovilFormData {
  id?: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

interface TipoMovilModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TipoMovilFormData) => Promise<void>;
  initialData?: TipoMovilFormData | null;
  title: string;
}

export default function TipoMovilModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
}: TipoMovilModalProps) {
  const [formData, setFormData] = useState<TipoMovilFormData>({
    nombre: "",
    descripcion: "",
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
        descripcion: "",
        activo: true,
      });
    }
    if (isOpen) {
      setShow(true);
    } else {
      const timeout = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        } flex flex-col max-h-[85vh]`}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Camioneta, Automóvil, Motocicleta, etc."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción del tipo de vehículo..."
            />
          </div>

          <CheckComponente
            checked={formData.activo}
            onChange={(val) => setFormData({ ...formData, activo: val })}
            label="Activo"
          />

          <div className="flex justify-end gap-3 pt-2 pb-6">
            <ButtonComponent type="button" onClick={onClose} accion="cancelar">
              Cancelar
            </ButtonComponent>
            <ButtonComponent
              type="submit"
              accion={initialData ? "actualizar" : "agregar"}
              loading={loading}
            >
              {initialData ? "Actualizar" : "Crear"}
            </ButtonComponent>
          </div>
        </form>
      </div>
    </div>
  );
}
