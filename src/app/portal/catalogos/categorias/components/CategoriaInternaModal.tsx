"use client";

import { useState, useEffect } from "react";
import CheckComponente from "@/app/components/CheckComponente";
// Removed unused X icon after redesign
import ButtonComponent from "@/app/components/ButtonComponent";

export interface CategoriaInternaFormData {
  id?: number;
  nombre: string;
  activo: boolean;
  familia_id?: number;
  grupo_id?: number;
  subgrupo_id?: number;
  prioridad?: number;
}

interface CategoriaInternaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoriaInternaFormData) => Promise<void>;
  initialData?: CategoriaInternaFormData | null;
  title: string;
  type: "familia" | "grupo" | "subgrupo" | "requerimiento";
  familias?: Array<{ id: number; nombre: string }>;
  grupos?: Array<{ id: number; nombre: string; familia_id: number }>;
  subgrupos?: Array<{ id: number; nombre: string; grupo_id: number }>;
  selectedFamiliaId?: number;
  selectedGrupoId?: number;
}

export default function CategoriaInternaModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  type,
  familias = [],
  grupos = [],
  subgrupos = [],
  selectedFamiliaId,
  selectedGrupoId,
}: CategoriaInternaModalProps) {
  const [formData, setFormData] = useState<CategoriaInternaFormData>({
    nombre: "",
    activo: true,
  });
  const [loading, setLoading] = useState(false);
  const [prioridades, setPrioridades] = useState<
    Array<{ id: number; nombre: string }>
  >([]);
  const [loadingPrioridades, setLoadingPrioridades] = useState(false);
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const newData: CategoriaInternaFormData = {
        nombre: "",
        activo: true,
      };

      if (type === "grupo" && selectedFamiliaId) {
        newData.familia_id = selectedFamiliaId;
      }
      if (type === "subgrupo" && selectedGrupoId) {
        newData.grupo_id = selectedGrupoId;
      }
      if (type === "requerimiento" && selectedGrupoId) {
        newData.grupo_id = selectedGrupoId;
      }

      setFormData(newData);
    }
    // Cargar prioridades solo cuando el tipo es requerimiento y el modal está abierto
    if (isOpen && type === "requerimiento") {
      fetchPrioridades();
    }
    if (isOpen) {
      setShow(true);
    } else {
      const timeout = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [initialData, isOpen, type, selectedFamiliaId, selectedGrupoId]);

  const fetchPrioridades = async () => {
    try {
      setLoadingPrioridades(true);
      const res = await fetch("/api/prioridades");
      if (!res.ok) throw new Error("Error al obtener prioridades");
      const data = await res.json();
      setPrioridades(data.prioridades || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoadingPrioridades(false);
    }
  };

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

  const filteredGrupos = formData.familia_id
    ? grupos.filter((g) => g.familia_id === formData.familia_id)
    : grupos;

  const filteredSubgrupos = formData.grupo_id
    ? subgrupos.filter((s) => s.grupo_id === formData.grupo_id)
    : subgrupos;

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
          {type === "grupo" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Familia <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.familia_id || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    familia_id: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccione una familia</option>
                {familias.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === "subgrupo" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Familia <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.familia_id || ""}
                  onChange={(e) => {
                    const familiaId = parseInt(e.target.value);
                    setFormData({
                      ...formData,
                      familia_id: familiaId,
                      grupo_id: undefined,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccione una familia</option>
                  {familias.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grupo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.grupo_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      grupo_id: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!formData.familia_id}
                >
                  <option value="">Seleccione un grupo</option>
                  {filteredGrupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {type === "requerimiento" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Familia <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.familia_id || ""}
                  onChange={(e) => {
                    const familiaId = parseInt(e.target.value);
                    setFormData({
                      ...formData,
                      familia_id: familiaId,
                      grupo_id: undefined,
                      subgrupo_id: undefined,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccione una familia</option>
                  {familias.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grupo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.grupo_id || ""}
                  onChange={(e) => {
                    const grupoId = parseInt(e.target.value);
                    setFormData({
                      ...formData,
                      grupo_id: grupoId,
                      subgrupo_id: undefined,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!formData.familia_id}
                >
                  <option value="">Seleccione un grupo</option>
                  {filteredGrupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subgrupo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.subgrupo_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subgrupo_id: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!formData.grupo_id}
                >
                  <option value="">Seleccione un subgrupo</option>
                  {filteredSubgrupos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <select
                  value={
                    formData.prioridad !== undefined ? formData.prioridad : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prioridad: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccione una prioridad</option>
                  {loadingPrioridades && (
                    <option value="" disabled>
                      Cargando...
                    </option>
                  )}
                  {!loadingPrioridades &&
                    prioridades.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}

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
              required
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
