"use client";

import React, { useEffect, useState, useRef } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import Swal from "sweetalert2";

interface Inspector {
  id: string;
  nombre: string;
}

interface AsignarAcompanantesDropdownProps {
  folio: string;
  inspectorPrincipalId: string | null;
  onAsignar: (acompanantes: Inspector[]) => void;
}

export default function AsignarAcompanantesDropdown({
  folio,
  inspectorPrincipalId,
  onAsignar,
}: AsignarAcompanantesDropdownProps) {
  const [open, setOpen] = useState(false);
  const [opciones, setOpciones] = useState<Inspector[]>([]);
  const [seleccionados, setSeleccionados] = useState<Inspector[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Cargar opciones desde la API de inspectores
  useEffect(() => {
    const cargarInspectores = async () => {
      try {
        const res = await fetch("/api/inspectors/derivations");
        if (!res.ok) {
          throw new Error(`Error al cargar inspectores: ${res.status}`);
        }
        const data = await res.json();
        setOpciones(data.inspectores || []);
      } catch (error) {
        console.error("Error cargando inspectores:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los inspectores disponibles",
          confirmButtonColor: "#003C96",
        });
      }
    };
    cargarInspectores();
  }, []);

  // Filtrar para no mostrar el inspector principal
  const opcionesFiltradas = opciones.filter(
    (i) => i.id !== inspectorPrincipalId
  );

  // Al cambiar el inspector principal, limpiar de seleccionados si estaba
  useEffect(() => {
    if (inspectorPrincipalId) {
      setSeleccionados((prev) =>
        prev.filter((i) => i.id !== inspectorPrincipalId)
      );
    }
  }, [inspectorPrincipalId]);

  function toggleSeleccion(inspector: Inspector) {
    setSeleccionados((prev) => {
      if (prev.some((i) => i.id === inspector.id)) {
        return prev.filter((i) => i.id !== inspector.id);
      } else {
        return [...prev, inspector];
      }
    });
  }

  async function asignarAcompanantes() {
    // Guardar solo acompañantes, no reenviar inspector principal
    if (!inspectorPrincipalId) return;

    const acompanantesIds = seleccionados.map((a) => a.id);
    if (acompanantesIds.length === 0) return;

    try {
      const res = await fetch(`/api/denuncias/${folio}/inspector`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acompanantes_ids: acompanantesIds,
          // No enviar inspector_id
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error en la solicitud: ${res.status}`);
      }

      await Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Acompañantes asignados correctamente",
        confirmButtonColor: "#003C96",
        timer: 2000,
      });

      onAsignar(seleccionados);
      setOpen(false);
    } catch (error) {
      console.error("Error asignando acompañantes:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "No se pudieron asignar los acompañantes",
        confirmButtonColor: "#003C96",
      });
    }
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <ButtonComponent
        accion="fantasma"
        size="sm"
        className="!px-2 !py-1 text-xs border border-gray-300 bg-white hover:bg-blue-50 shadow-sm"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        Asignar acompañantes
      </ButtonComponent>
      {open && (
        <div className="absolute left-0 mt-0.5 w-56 bg-white border border-gray-200 rounded-lg shadow-2xl py-2 animate-fade-in z-50">
          <ul className="max-h-60 overflow-y-auto" role="listbox">
            {opcionesFiltradas.map((p) => (
              <li
                key={p.id}
                role="option"
                aria-selected={seleccionados.some((i) => i.id === p.id)}
                className={`px-4 py-2 text-xs text-gray-800 cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                  seleccionados.some((i) => i.id === p.id) ? "bg-blue-50" : ""
                }`}
                onClick={() => toggleSeleccion(p)}
              >
                <input
                  type="checkbox"
                  checked={seleccionados.some((i) => i.id === p.id)}
                  readOnly
                  className="accent-blue-600"
                />
                {p.nombre}
              </li>
            ))}
          </ul>
          <div className="flex justify-end gap-2 mt-2 px-2">
            <ButtonComponent
              accion="secundario"
              size="sm"
              className="!px-2 !py-1 text-xs"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </ButtonComponent>
            <ButtonComponent
              accion="primario"
              size="sm"
              className="!px-2 !py-1 text-xs"
              onClick={asignarAcompanantes}
              disabled={seleccionados.length === 0}
            >
              Asignar
            </ButtonComponent>
          </div>
        </div>
      )}
    </div>
  );
}
