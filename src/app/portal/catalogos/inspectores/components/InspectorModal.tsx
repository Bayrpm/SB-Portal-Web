"use client";

import { useState, useEffect, ChangeEvent, FormEvent, useRef } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import { User, Mail, Phone, Lock, UserPlus, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateEmailWithSupabase } from "@/lib/emails/inspectors/formatInspectorEmails";
import TurnoSelectorModal, { Turno } from "./TurnoSelectorModal";

export type InspectorFormData = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  turno_id: number;
  turno_nombre?: string;
  turno_horario?: string;
  password: string;
};

interface InspectorModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InspectorFormData) => void;
}

export default function InspectorModal({
  open,
  onClose,
  onSubmit,
}: InspectorModalProps) {
  const [form, setForm] = useState<InspectorFormData>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    turno_id: 0,
    turno_nombre: "",
    turno_horario: "",
    password: "",
  });

  const [generatingEmail, setGeneratingEmail] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Estado para animación
  const [show, setShow] = useState(open);

  // Estado para modal de turnos
  const [turnoModalOpen, setTurnoModalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setShow(true);
    } else {
      const timeout = setTimeout(() => setShow(false), 250);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  useEffect(() => {
    if (!form.nombre || !form.apellido) return;

    setGeneratingEmail(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const email = await generateEmailWithSupabase(
          supabase,
          form.nombre,
          form.apellido,
          { table: "perfiles_ciudadanos", column: "email" }
        );
        console.log("Correo generado:", email); // <-- Depuración
        setForm((prev: InspectorFormData) => ({ ...prev, email }));
      } catch (e) {
        console.error("Error generando correo:", e);
        setForm((prev: InspectorFormData) => ({ ...prev, email: "" }));
      } finally {
        setGeneratingEmail(false);
      }
    }, 3000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.nombre, form.apellido]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev: InspectorFormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Función para formatear hora eliminando segundos (15:00:00 -> 15:00)
  const formatTime = (time: string): string => {
    if (!time) return "";
    // Si el formato es HH:MM:SS, tomar solo HH:MM
    return time.substring(0, 5);
  };

  const handleTurnoSelect = (turno: Turno) => {
    setForm((prev: InspectorFormData) => ({
      ...prev,
      turno_id: turno.id,
      turno_nombre: turno.nombre,
      turno_horario: `${formatTime(turno.hora_inicio)} - ${formatTime(
        turno.hora_termino
      )}`,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.turno_id === 0) {
      alert("Por favor selecciona un turno");
      return;
    }
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
                Nuevo Inspector
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Completa el formulario para crear un nuevo inspector municipal
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
                  disabled
                  readOnly
                  className="w-full border rounded-lg px-9 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                  placeholder="usuario@sanbernardo.cl"
                />
                {generatingEmail && (
                  <span className="absolute right-3 top-2.5 text-xs text-blue-500 animate-pulse">
                    Generando correo...
                  </span>
                )}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Turno <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setTurnoModalOpen(true)}
                className={`w-full border rounded-lg px-4 py-2.5 text-left flex items-center justify-between transition-all
                  ${
                    form.turno_id
                      ? "border-[#003C96] bg-blue-50 text-gray-900"
                      : "border-gray-300 bg-white text-gray-500 hover:border-gray-400"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    {form.turno_nombre ? (
                      <>
                        <p className="font-medium text-gray-900">
                          {form.turno_nombre}
                        </p>
                        <p className="text-xs text-gray-600">
                          {form.turno_horario}
                        </p>
                      </>
                    ) : (
                      <p>Seleccionar turno</p>
                    )}
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            <div className="md:col-span-2">
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
              Crear Inspector
            </ButtonComponent>
          </div>
        </form>
      </div>

      {/* Modal de selección de turno */}
      <TurnoSelectorModal
        open={turnoModalOpen}
        onClose={() => setTurnoModalOpen(false)}
        onSelect={handleTurnoSelect}
        selectedTurnoId={form.turno_id}
      />
    </div>
  );
}
