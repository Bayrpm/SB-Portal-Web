"use client";

import React, { useState } from "react";
import clsx from "clsx";
import Swal from "sweetalert2";
import {
  Plus,
  Pencil,
  Check,
  Trash2,
  Eye,
  Download,
  ArrowRight,
} from "lucide-react";

type Accion =
  | "primario"
  | "secundario"
  | "fantasma"
  | "agregar"
  | "editar"
  | "actualizar"
  | "eliminar"
  | "inspeccionar"
  | "descargar"
  | "cancelar";

type Size = "sm" | "md" | "lg";

type ConfirmOptions = {
  title?: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: "warning" | "question" | "info" | "success" | "error";
  confirmButtonColor?: string;
  cancelButtonColor?: string;
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  accion?: Accion; // variante/propósito del botón (en español)
  size?: Size;
  block?: boolean;
  loading?: boolean; // loading controlado externo (sigue funcionando)
  autoLoading?: boolean; // NUEVO: activa loading automático mientras corre el handler
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hideIcon?: boolean;

  // SweetAlert2
  confirm?: boolean; // muestra confirm (implícito para eliminar)
  confirmOptions?: ConfirmOptions; // textos/colores personalizados
  toastOnSuccess?: string | false; // toast después de confirmar

  onConfirm?: () => void | Promise<void>; // si existe y se confirma, se ejecuta este; si no, onClick
};

const BRAND = "#0085CA";
const HEADER = "#0B4F9E";

const classesByAccion: Record<Accion, string> = {
  primario: `bg-[${BRAND}] text-white hover:opacity-95`,
  secundario: "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50",
  fantasma: `bg-transparent text-[${BRAND}] hover:bg-blue-50`,
  agregar: `bg-[${BRAND}] text-white hover:opacity-95`,
  editar: `bg-blue-50 text-[${HEADER}] border border-blue-200 hover:bg-blue-100`,
  actualizar: `bg-[${HEADER}] text-white hover:opacity-95`,
  eliminar: "bg-red-600 text-white hover:bg-red-700",
  inspeccionar:
    "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100",
  descargar:
    "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100",
  cancelar:
    "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200",
};

const iconByAccion: Record<Accion, React.ReactNode> = {
  primario: <ArrowRight className="h-4 w-4" />,
  secundario: null,
  fantasma: null,
  agregar: <Plus className="h-4 w-4" />,
  editar: <Pencil className="h-4 w-4" />,
  actualizar: <Check className="h-4 w-4" />,
  eliminar: <Trash2 className="h-4 w-4" />,
  inspeccionar: <Eye className="h-4 w-4" />,
  descargar: <Download className="h-4 w-4" />,
  cancelar: null,
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm h-9 px-3",
  md: "text-sm h-10 px-4",
  lg: "text-base h-12 px-5",
};

// textos por acción (default)
const defaultConfirmByAccion: Record<Accion, ConfirmOptions> = {
  agregar: {
    title: "¿Agregar registro?",
    text: "Se creará un nuevo elemento con los datos ingresados.",
    confirmButtonText: "Sí, agregar",
    cancelButtonText: "Cancelar",
    icon: "question",
  },
  editar: {
    title: "¿Guardar cambios?",
    text: "Se actualizarán los campos modificados.",
    confirmButtonText: "Guardar cambios",
    cancelButtonText: "Cancelar",
    icon: "question",
  },
  actualizar: {
    title: "¿Actualizar información?",
    text: "Esta acción actualizará los datos del elemento.",
    confirmButtonText: "Actualizar",
    cancelButtonText: "Cancelar",
    icon: "question",
  },
  eliminar: {
    title: "¿Eliminar definitivamente?",
    text: "No podrás deshacer esta acción.",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    icon: "warning",
  },
  inspeccionar: {
    title: "Abrir inspección",
    text: "Se abrirá la vista de inspección para este elemento.",
    confirmButtonText: "Continuar",
    cancelButtonText: "Cancelar",
    icon: "info",
  },
  descargar: {
    title: "¿Descargar archivo?",
    text: "Se preparará el archivo para tu descarga.",
    confirmButtonText: "Descargar",
    cancelButtonText: "Cancelar",
    icon: "question",
  },
  primario: {
    title: "Confirmar acción",
    text: "¿Deseas continuar?",
    confirmButtonText: "Confirmar",
    cancelButtonText: "Cancelar",
    icon: "question",
  },
  secundario: {
    title: "Confirmar",
    text: "¿Deseas continuar?",
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
    icon: "question",
  },
  fantasma: {
    title: "Confirmar",
    text: "¿Deseas continuar?",
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
    icon: "question",
  },
  cancelar: {
    title: "¿Cancelar?",
    text: "¿Deseas cancelar la operación?",
    confirmButtonText: "Sí, cancelar",
    cancelButtonText: "Volver",
    icon: "question",
  },
};

// colores SweetAlert por acción
const confirmColorByAccion: Record<Accion, string> = {
  eliminar: "#DC2626",
  actualizar: HEADER,
  agregar: BRAND,
  editar: HEADER,
  inspeccionar: BRAND,
  descargar: "#059669",
  primario: BRAND,
  secundario: BRAND,
  fantasma: BRAND,
  cancelar: "#9CA3AF",
};

const cancelColor = "#9CA3AF";

export default function ButtonComponent({
  accion = "primario",
  size = "md",
  block,
  loading, // controlado externo (opcional)
  autoLoading, // NUEVO: si true, activa loading interno auto
  leftIcon,
  rightIcon,
  hideIcon,
  confirm,
  confirmOptions,
  toastOnSuccess,
  onConfirm,
  onClick,
  className,
  children,
  disabled,
  ...props
}: Props) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = Boolean(loading ?? internalLoading); // mezcla externo + interno
  const IconLeft = !hideIcon && (leftIcon ?? iconByAccion[accion]);

  const runHandler = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Ejecuta onConfirm si existe; si no, onClick
    if (onConfirm) {
      await Promise.resolve(onConfirm());
    } else if (onClick) {
      await Promise.resolve(onClick(e));
    }
    if (toastOnSuccess) {
      await Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
        icon: "success",
        title: toastOnSuccess,
      });
    }
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;

    const mustConfirm = !!confirm || accion === "eliminar";

    const doRun = async () => {
      try {
        if (autoLoading) setInternalLoading(true);
        await runHandler(e);
      } finally {
        if (autoLoading) setInternalLoading(false);
      }
    };

    if (!mustConfirm) {
      await doRun();
      return;
    }

    const def = defaultConfirmByAccion[accion];
    const merged: ConfirmOptions = { ...def, ...confirmOptions };

    const result = await Swal.fire({
      title: merged.title,
      text: merged.text,
      icon: merged.icon ?? "question",
      showCancelButton: true,
      confirmButtonText: merged.confirmButtonText ?? "Confirmar",
      cancelButtonText: merged.cancelButtonText ?? "Cancelar",
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor:
        merged.confirmButtonColor ?? confirmColorByAccion[accion],
      cancelButtonColor: merged.cancelButtonColor ?? cancelColor,
    });

    if (result.isConfirmed) {
      await doRun();
    }
  };

  return (
    <button
      type="button"
      {...props}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg",
        "transition-all duration-150 select-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        `focus-visible:ring-[${BRAND}]`,
        "disabled:opacity-60 disabled:cursor-not-allowed",
        sizeClasses[size],
        classesByAccion[accion],
        block && "w-full",
        className
      )}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
      {!isLoading && IconLeft}
      <span className="whitespace-nowrap">{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
}
