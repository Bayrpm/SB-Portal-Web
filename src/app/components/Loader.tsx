"use client";

export default function Loader({ text = "Cargando..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#003C96]/95 via-[#0085CA]/90 to-[#00A7CE]/85 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        {/* Logo animado */}
        <div className="relative mb-6">
          {/* Círculo externo giratorio */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white border-r-white/60 animate-spin w-20 h-20" />

          {/* Círculo medio pulsante */}
          <div className="absolute inset-2 rounded-full bg-white opacity-20 animate-pulse" />

          {/* Círculo interno */}
          <div className="relative w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#003C96] to-[#00A7CE] flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Texto con animación */}
        <div className="text-center">
          <p className="text-white text-lg font-semibold mb-2 drop-shadow-lg">
            {text}
          </p>
          <div className="flex gap-1 justify-center">
            <span
              className="w-2 h-2 rounded-full bg-white animate-bounce shadow-lg"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-white animate-bounce shadow-lg"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-white animate-bounce shadow-lg"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
