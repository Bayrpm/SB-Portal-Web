"use client";

import React from "react";
import { Check } from "lucide-react";
import clsx from "clsx";

interface CheckComponenteProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

// Componente global de checkbox estilizado para formularios internos
// Uso similar a otros componentes (ToggleSwitch, ButtonComponent)
export default function CheckComponente({
  checked,
  onChange,
  label,
  disabled,
  size = "md",
  className,
}: CheckComponenteProps) {
  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (disabled) return;
    onChange(!checked);
  };

  const sizeClasses = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const fontClasses = size === "sm" ? "text-xs" : "text-sm";

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={clsx(
        "group inline-flex items-center gap-2 select-none",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
      role="checkbox"
      aria-checked={checked}
    >
      <span
        className={clsx(
          "flex items-center justify-center rounded-md border transition-colors", // base
          size === "sm" ? "h-5 w-5" : "h-6 w-6",
          checked
            ? "bg-[#0085CA] border-[#0085CA] text-white shadow-sm"
            : "bg-white border-gray-300 text-transparent group-hover:border-blue-400",
          disabled && "border-gray-200"
        )}
      >
        <Check
          className={clsx(sizeClasses, checked ? "opacity-100" : "opacity-0")}
        />
      </span>
      {label && (
        <span
          className={clsx(
            fontClasses,
            "font-medium text-gray-700 group-hover:text-gray-900"
          )}
        >
          {label}
        </span>
      )}
    </button>
  );
}
