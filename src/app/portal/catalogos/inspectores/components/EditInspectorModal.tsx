"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import ToggleSwitch from "@/app/components/ToggleSwitchComponent";
import { User, Phone, UserPlus, Clock } from "lucide-react";
import TurnoSelectorModal, { Turno } from "./TurnoSelectorModal";
import { InspectorFormData } from "./InspectorModal";
import Swal from "sweetalert2";

interface EditInspectorModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InspectorFormData & { activo?: boolean }) => void;
  initialData: {
    name: string;
    telefono: string;
    activo?: boolean;
    turno?: {
      id: number;
      nombre: string;
      hora_inicio: string;
      hora_termino: string;
    };
  };
}

export default function EditInspectorModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: EditInspectorModalProps) {
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

  // Estado para animación
  const [show, setShow] = useState(open);

  // Estado para modal de turnos
  const [turnoModalOpen, setTurnoModalOpen] = useState(false);

  // Estado para activación de cuenta
  const [activo, setActivo] = useState(true);

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (open && initialData) {
      const [nombre, ...apellidoParts] = initialData.name.split(" ");
      const apellido = apellidoParts.join(" ");

      setForm({
        nombre: nombre || "",
        apellido: apellido || "",
        email: "", // No se puede editar
        telefono: initialData.telefono || "",
        turno_id: initialData.turno?.id || 0,
        turno_nombre: initialData.turno?.nombre || "",
        turno_horario: initialData.turno
          ? `${formatTime(initialData.turno.hora_inicio)} - ${formatTime(
              initialData.turno.hora_termino
            )}`
          : "",
        password: "", // No se edita la contraseña
      });
      setActivo(initialData.activo !== false); // Default true si no viene definido
      setShow(true);
    } else {
      const timeout = setTimeout(() => setShow(false), 250);
      return () => clearTimeout(timeout);
    }
  }, [open, initialData]);

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

  const handleToggleActivo = async (nuevoValor: boolean) => {
    const accionTexto = nuevoValor ? "activar" : "desactivar";
    const result = await Swal.fire({
      title: `¿Seguro que deseas ${accionTexto} esta cuenta?`,
      html: `<p>Al ${accionTexto} la cuenta del inspector, ${
        nuevoValor ? "podrá acceder" : "no podrá acceder"
      } al sistema.</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Sí, ${accionTexto}`,
      cancelButtonText: "Cancelar",
      confirmButtonColor: nuevoValor ? "#003C96" : "#dc2626",
      cancelButtonColor: "#6B7280",
    });

    if (result.isConfirmed) {
      setActivo(nuevoValor);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.turno_id === 0) {
      alert("Por favor selecciona un turno");
      return;
    }
    onSubmit({ ...form, activo });
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
                Editar Inspector
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Actualiza la información del inspector municipal
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
          </div>

          {/* Sección de activación/desactivación de cuenta */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Estado de la Cuenta
                </label>
                <p className="text-xs text-gray-600">
                  {activo
                    ? "La cuenta está activa y puede acceder al sistema"
                    : "La cuenta está desactivada y no puede acceder al sistema"}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ToggleSwitch
                  isActive={activo}
                  onChange={handleToggleActivo}
                  size="md"
                />
                <span
                  className={`text-xs font-semibold ${
                    activo ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {activo ? "Activa" : "Desactivada"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-8">
            <ButtonComponent accion="cancelar" type="button" onClick={onClose}>
              Cancelar
            </ButtonComponent>
            <ButtonComponent accion="agregar" type="submit">
              Actualizar Inspector
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
