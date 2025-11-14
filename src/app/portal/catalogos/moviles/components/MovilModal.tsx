"use client";

import { useState, useEffect } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import CheckComponente from "@/app/components/CheckComponente";

export interface MovilFormData {
  id?: number;
  patente: string;
  tipo_id: number;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje_actual: number;
  estado: string;
  activo: boolean;
}

interface MovilModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MovilFormData) => Promise<void>;
  initialData?: MovilFormData | null;
  title: string;
  tipos: Array<{ id: number; nombre: string }>;
}

const ESTADOS_MOVIL = [
  "DISPONIBLE",
  "ASIGNADO",
  "EN_MANTENIMIENTO",
  "FUERA_DE_SERVICIO",
];

export default function MovilModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  tipos,
}: MovilModalProps) {
  const [formData, setFormData] = useState<MovilFormData>({
    patente: "",
    tipo_id: 0,
    marca: "",
    modelo: "",
    anio: new Date().getFullYear(),
    kilometraje_actual: 0,
    estado: "DISPONIBLE",
    activo: true,
  });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        patente: "",
        tipo_id: tipos.length > 0 ? tipos[0].id : 0,
        marca: "",
        modelo: "",
        anio: new Date().getFullYear(),
        kilometraje_actual: 0,
        estado: "DISPONIBLE",
        activo: true,
      });
    }
    if (isOpen) {
      setShow(true);
    } else {
      const timeout = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [initialData, isOpen, tipos]);

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
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-200 ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.patente}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    patente: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                placeholder="AB1234"
                maxLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Móvil <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipo_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipo_id: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccione un tipo</option>
                {tipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) =>
                  setFormData({ ...formData, marca: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Toyota, Nissan, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.modelo}
                onChange={(e) =>
                  setFormData({ ...formData, modelo: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Hilux, Frontier, etc."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.anio}
                onChange={(e) =>
                  setFormData({ ...formData, anio: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1900"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kilometraje Actual
              </label>
              <input
                type="number"
                value={formData.kilometraje_actual}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kilometraje_actual: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.estado}
              onChange={(e) =>
                setFormData({ ...formData, estado: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {ESTADOS_MOVIL.map((estado) => (
                <option key={estado} value={estado}>
                  {estado.replace(/_/g, " ")}
                </option>
              ))}
            </select>
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
