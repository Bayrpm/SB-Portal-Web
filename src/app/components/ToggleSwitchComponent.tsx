import { useState } from "react";

interface ToggleSwitchProps {
  isActive: boolean;
  onChange: (isActive: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function ToggleSwitch({
  isActive,
  onChange,
  disabled = false,
  size = "md",
}: ToggleSwitchProps) {
  const [checked, setChecked] = useState(isActive);

  const handleToggle = () => {
    if (disabled) return;
    const newValue = !checked;
    setChecked(newValue);
    onChange(newValue);
  };

  const sizeClasses = {
    sm: "w-10 h-5",
    md: "w-12 h-6",
    lg: "w-14 h-7",
  };

  const thumbSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const translateClasses = {
    sm: "translate-x-5",
    md: "translate-x-6",
    lg: "translate-x-7",
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`
        relative inline-flex items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2
        ${sizeClasses[size]}
        ${
          checked
            ? "bg-[#003C96] focus:ring-[#003C96]"
            : "bg-gray-300 focus:ring-gray-400"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      aria-checked={checked}
      role="switch"
    >
      <span className="sr-only">{checked ? "Activo" : "Inactivo"}</span>
      <span
        className={`
          ${thumbSizeClasses[size]}
          inline-block transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out
          ${checked ? translateClasses[size] : "translate-x-0.5"}
        `}
      />
    </button>
  );
}
