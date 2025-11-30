"use client";

import React, { useEffect, useState, useRef } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import Swal from "sweetalert2";

interface AsignarPrioridadDropdownProps {
  folio: string;
  onAsignar: (prioridad: string) => void;
  onCancelar?: () => void;
  forceOpen?: boolean;
  prioridadActual?: string;
}

export default function AsignarPrioridadDropdown({
  folio,
  onAsignar,
  onCancelar,
  forceOpen = false,
  prioridadActual = "",
}: AsignarPrioridadDropdownProps) {
  const [open, setOpen] = useState(forceOpen);
  const [opciones, setOpciones] = useState<{ id: number; nombre: string }[]>(
    []
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(forceOpen);
  }, [forceOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Cargar opciones desde la API de prioridades
  useEffect(() => {
    fetch("/api/prioridades")
      .then((res) => res.json())
      .then((data) => setOpciones(data.prioridades || []));
  }, []);

  async function asignarPrioridad(
    prioridadId: number,
    prioridadNombre: string
  ) {
    const result = await Swal.fire({
      title: "¿Cambiar prioridad?",
      html: `<p>¿Confirmar cambio de prioridad a <strong>${prioridadNombre}</strong>?</p>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#003C96",
      cancelButtonColor: "#6B7280",
    });

    if (!result.isConfirmed) {
      setOpen(false);
      onCancelar?.();
      return;
    }

    try {
      const response = await fetch(`/api/denuncias/${folio}/prioridad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prioridad_id: prioridadId }),
      });

      if (response.ok) {
        onAsignar(prioridadNombre);
        setOpen(false);
        await Swal.fire({
          title: "¡Éxito!",
          text: "Prioridad actualizada correctamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await Swal.fire({
          title: "Error",
          text: "No se pudo actualizar la prioridad",
          icon: "error",
        });
      }
    } catch (error) {
      await Swal.fire({
        title: "Error",
        text: "Ocurrió un error al actualizar la prioridad",
        icon: "error",
      });
      setOpen(false);
      onCancelar?.();
    }
  }

  return (
    <div className="relative inline-block" ref={ref}>
      {forceOpen && prioridadActual ? (
        <div className="inline-block px-3 py-1 rounded text-xs font-semibold border bg-gray-100 text-gray-700 border-gray-200">
          {prioridadActual}
        </div>
      ) : (
        <ButtonComponent
          accion="fantasma"
          size="sm"
          className="!px-2 !py-1 text-xs border border-gray-300 bg-white hover:bg-blue-50 shadow-sm"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          Asignar prioridad
        </ButtonComponent>
      )}
      {open && (
        <ul
          className="absolute left-0 mt-0.5 w-36 bg-white border border-gray-200 rounded-lg shadow-2xl py-1 animate-fade-in z-50"
          role="listbox"
        >
          {opciones.map((p) => (
            <li
              key={p.id}
              role="option"
              aria-selected={p.nombre === prioridadActual}
              className={`px-4 py-2 text-xs text-gray-800 cursor-pointer hover:bg-blue-50 transition-colors ${
                p.nombre === prioridadActual
                  ? "bg-blue-50 font-semibold border-l-4 border-l-blue-600"
                  : ""
              }`}
              onClick={() => asignarPrioridad(p.id, p.nombre)}
            >
              {p.nombre}
              {p.nombre === prioridadActual && " ✓"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
