import React, { forwardRef, useId } from "react";
import clsx from "clsx";

type SelectBaseProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "size"
>;

type SelectProps = SelectBaseProps & {
  label?: string;
  helperText?: string;
  error?: string | boolean;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  id?: string;
};

export const SelectComponent = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      placeholder,
      size = "md",
      className,
      id,
      required,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    const described = helperText || error ? `${selectId}-desc` : undefined;
    const hasError = Boolean(error);

    const sizeClasses =
      size === "sm"
        ? "text-sm py-2 ps-3 pe-9"
        : size === "lg"
        ? "text-base py-3 ps-4 pe-10"
        : "text-sm py-2.5 ps-4 pe-10";

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={selectId}
            className={clsx(
              "text-sm font-medium mb-1",
              hasError ? "text-red-700" : "text-gray-700"
            )}
          >
            {label} {required && <span className="text-red-600">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            required={required}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={described}
            className={clsx(
              "w-full rounded-lg border outline-none bg-white text-gray-900",
              "[color-scheme:light]", // fuerza UI clara del control nativo
              "appearance-none transition-all duration-200 ease-in-out",
              "focus-visible:ring-2 focus-visible:ring-[#0085CA] focus-visible:border-[#0085CA]",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "shadow-sm focus-visible:shadow-md",
              sizeClasses,
              hasError
                ? "border-red-500 focus-visible:ring-red-500"
                : "border-gray-300",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {children}
          </select>

          {/* Chevron en color #0085CA */}
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0085CA]"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.2l3.71-2.97a.75.75 0 011.04 1.08l-4.24 3.4a.75.75 0 01-.94 0l-4.24-3.4a.75.75 0 01-.02-1.1z" />
          </svg>
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

SelectComponent.displayName = "SelectComponent";
export default SelectComponent;
