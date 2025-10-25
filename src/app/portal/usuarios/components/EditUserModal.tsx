"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import { User, Phone, Edit } from "lucide-react";

interface EditUserFormData {
  nombre: string;
  apellido: string;
  telefono: string;
  rol_id: number;
}

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EditUserFormData) => void;
  initialData: EditUserFormData;
  email: string; // Para mostrarlo pero no editarlo
}

export default function EditUserModal({
  open,
  onClose,
  onSubmit,
  initialData,
  email,
}: EditUserModalProps) {
  const [form, setForm] = useState<EditUserFormData>(initialData);

  // Estado para animación
  const [show, setShow] = useState(open);

  // Estado para roles dinámicos
  const [roles, setRoles] = useState<{ id: number; nombre: string }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    if (open) {
      setShow(true);
      setForm(initialData);
      setLoadingRoles(true);
      fetch("/api/roles")
        .then((res) => res.json())
        .then((data) => {
          setRoles(
            Array.isArray(data.roles)
              ? data.roles.map((role: { id: number; nombre: string }) => ({
                  id: role.id,
                  nombre: role.nombre,
                }))
              : []
          );
        })
        .finally(() => setLoadingRoles(false));
    } else {
      const timeout = setTimeout(() => setShow(false), 250);
      return () => clearTimeout(timeout);
    }
  }, [open, initialData]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const newValue = name === "rol_id" ? Number(value) : value;
      return { ...prev, [name as keyof EditUserFormData]: newValue };
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300
        ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    >
      {/* Fondo desenfocado y oscurecido con animación */}
      <div
        className={`
          absolute inset-0
          transition-all duration-300
          ${
            open ? "bg-black/20 backdrop-blur-sm" : "bg-black/0 backdrop-blur-0"
          }
        `}
        aria-hidden="true"
      />
      {/* Modal */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl p-0 w-full max-w-xl transform transition-all duration-300
        ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-2">
          <div className="flex items-center gap-3">
            <Edit className="text-blue-700 w-6 h-6" />
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Editar Usuario
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Actualiza la información del usuario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
            aria-label="Cerrar"
            type="button"
          >
            ×
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pt-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-9 py-2 focus:ring-2 focus:ring-blue-200"
                  placeholder="Juan"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Apellido</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-9 py-2 focus:ring-2 focus:ring-blue-200"
                  placeholder="Pérez"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Email (no editable)
              </label>
              <input
                type="email"
                value={email}
                disabled
                readOnly
                className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="+56 9 1234 5678"
                  className="w-full border rounded-lg px-9 py-2 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Rol</label>
              <div className="relative">
                <select
                  name="rol_id"
                  value={form.rol_id}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200"
                  disabled={loadingRoles}
                  required
                >
                  {loadingRoles && <option value="">Cargando roles...</option>}
                  {!loadingRoles && roles.length === 0 && (
                    <option value="">Sin roles</option>
                  )}
                  {!loadingRoles &&
                    roles.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-8">
            <ButtonComponent accion="cancelar" type="button" onClick={onClose}>
              Cancelar
            </ButtonComponent>
            <ButtonComponent accion="editar" type="submit">
              Actualizar Usuario
            </ButtonComponent>
          </div>
        </form>
      </div>
    </div>
  );
}
