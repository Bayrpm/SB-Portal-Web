"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import { User, Mail, Phone, Lock, UserPlus } from "lucide-react";

type UserForm = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol_id: number;
  password: string;
};

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UserForm) => void;
}

export default function UserModal({ open, onClose, onSubmit }: UserModalProps) {
  const [form, setForm] = useState<UserForm>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    rol_id: 1,
    password: "",
  });

  // Estado para animación
  const [show, setShow] = useState(open);

  // Estado para roles dinámicos
  const [roles, setRoles] = useState<{ id: number; nombre: string }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    if (open) {
      setShow(true);
      setLoadingRoles(true);
      fetch("/api/roles")
        .then((res) => res.json())
        .then((data) => {
          setRoles(
            Array.isArray(data.roles)
              ? data.roles.map((nombre: string, idx: number) => ({
                  id: idx + 1,
                  nombre,
                }))
              : []
          );
          setForm((prev) => ({
            ...prev,
            rol_id: 1,
          }));
        })
        .finally(() => setLoadingRoles(false));
    } else {
      const timeout = setTimeout(() => setShow(false), 250);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const newValue = name === "rol_id" ? Number(value) : value;
      return { ...prev, [name as keyof UserForm]: newValue } as UserForm;
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
            <UserPlus className="text-blue-700 w-6 h-6" />
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Nuevo Usuario
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Completa el formulario para crear un nuevo usuario del portal
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
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-9 py-2 focus:ring-2 focus:ring-blue-200"
                  placeholder="usuario@ejemplo.com"
                />
              </div>
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
            <div>
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
            <div>
              <label className="block text-sm font-medium mb-1">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-9 py-2 focus:ring-2 focus:ring-blue-200"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-8">
            <ButtonComponent accion="cancelar" type="button" onClick={onClose}>
              Cancelar
            </ButtonComponent>
            <ButtonComponent accion="agregar" type="submit">
              Crear Usuario
            </ButtonComponent>
          </div>
        </form>
      </div>
    </div>
  );
}
