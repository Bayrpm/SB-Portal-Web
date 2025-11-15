"use client";

export default function LoaderInline({
  text = "Cargando...",
  progress,
}: {
  text?: string;
  progress?: number;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-gray-50/95 via-blue-50/90 to-gray-50/85 backdrop-blur-sm rounded-lg">
      <div className="flex flex-col items-center">
        {/* Logo animado */}
        <div className="relative mb-4">
          {/* Círculo externo giratorio */}
          <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-[#003C96] border-r-[#0085CA] animate-spin w-16 h-16" />

          {/* Círculo medio pulsante */}
          <div className="absolute inset-2 rounded-full bg-[#003C96] opacity-10 animate-pulse" />

          {/* Círculo interno */}
          <div className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003C96] to-[#00A7CE] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Texto con animación */}
        <div className="text-center">
          <p className="text-gray-700 text-sm font-medium mb-2">{text}</p>

          {/* Barra de progreso */}
          {progress !== undefined && (
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-[#003C96] to-[#00A7CE] transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}

          <div className="flex gap-1 justify-center">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#003C96] animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#0085CA] animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#00A7CE] animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
