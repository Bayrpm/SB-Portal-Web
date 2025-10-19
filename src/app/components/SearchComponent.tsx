// SearchComponent.tsx
import React, { forwardRef, useId } from "react";
import clsx from "clsx";

type InputBaseProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
>;

type SearchProps = InputBaseProps & {
  label?: string;
  helperText?: string;
  error?: string | boolean;
  size?: "sm" | "md" | "lg";
  id?: string;
  /** Muestra la X personalizada para limpiar (requiere uso controlado con `value`) */
  allowClear?: boolean;
  /** Callback opcional al limpiar (útil para setear estado externo) */
  onClear?: () => void;
};

export const SearchComponent = forwardRef<HTMLInputElement, SearchProps>(
  (
    {
      label,
      helperText,
      error,
      size = "md",
      id,
      className,
      required,
      disabled,
      value,
      allowClear = true,
      onClear,
      onChange,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hasError = Boolean(error);
    const described = helperText || error ? `${inputId}-desc` : undefined;

    const sizeClasses =
      size === "sm"
        ? "text-sm py-2 ps-10 pe-10"
        : size === "lg"
        ? "text-base py-3 ps-11 pe-12"
        : "text-sm py-2.5 ps-10 pe-10";

    const showClear =
      allowClear && typeof value === "string" && value.length > 0 && !disabled;

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      // Notifica al consumidor
      onClear?.();
      // Si no usan onClear, intentamos limpiar vía onChange controlado
      if (onChange) {
        const target = { value: "" } as unknown as EventTarget &
          HTMLInputElement;
        const synthetic = { target } as React.ChangeEvent<HTMLInputElement>;
        onChange(synthetic);
      }
    };

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className={clsx(
              "text-sm font-medium mb-1",
              hasError ? "text-red-700" : "text-gray-700"
            )}
          >
            {label} {required && <span className="text-red-600">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Lupa izquierda */}
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12.9 14.32a7 7 0 111.414-1.414l3.39 3.39a1 1 0 01-1.414 1.414l-3.39-3.39zM14 9a5 5 0 11-10 0 5 5 0 0110 0z"
              clipRule="evenodd"
            />
          </svg>

          <input
            id={inputId}
            ref={ref}
            type="search" // seguimos con search, pero sin X nativa (usamos la nuestra)
            required={required}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={described}
            className={clsx(
              "w-full rounded-lg border outline-none bg-white text-gray-900",
              "[color-scheme:light]", // siempre claro
              "appearance-none transition-all duration-200 ease-in-out",
              "placeholder:text-gray-400",
              "focus-visible:ring-2 focus-visible:ring-[#0085CA] focus-visible:border-[#0085CA]",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "shadow-sm focus-visible:shadow-md",
              "no-native-cancel", // ← tu utilidad global para ocultar la X nativa
              sizeClasses,
              hasError
                ? "border-red-500 focus-visible:ring-red-500"
                : "border-gray-300",
              className
            )}
            value={value}
            onChange={onChange}
            {...props}
          />

          {/* X personalizada (derecha) */}
          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-6 w-6 rounded-full border border-gray-300 hover:bg-gray-50 active:scale-95"
              aria-label="Limpiar búsqueda"
              title="Limpiar"
            >
              <svg
                className="h-3.5 w-3.5 text-gray-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 8.586l4.243-4.243a1 1 0 111.414 1.414L11.414 10l4.243 4.243a1 1 0 01-1.414 1.414L10 11.414l-4.243 4.243a1 1 0 01-1.414-1.414L8.586 10 4.343 5.757A1 1 0 115.757 4.343L10 8.586z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {(helperText || hasError) && (
          <p
            id={described}
            className={clsx(
              "text-xs mt-1",
              hasError ? "text-red-600" : "text-gray-600"
            )}
          >
            {typeof error === "string" ? error : helperText}
          </p>
        )}
      </div>
    );
  }
);

SearchComponent.displayName = "SearchComponent";
export default SearchComponent;
