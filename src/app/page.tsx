"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Loader from "./components/Loader";
import Image from "next/image";
import { X, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { setRole, setName } = useUser();

  useEffect(() => {
    const expireAt = localStorage.getItem("sessionExpireAt");
    if (expireAt && Date.now() < Number(expireAt)) {
      setCheckingSession(true);
      router.push("/portal/dashboard");
    } else {
      setCheckingSession(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      // Llamada a login
      const loginResponse = await fetch("/api/users/login", {
        method: "POST",
        body: formData,
      });

      const result = await loginResponse.json();

      if (result && result.error) {
        setErrorMsg(result.error);
        setLoading(false);
        return;
      }

      // Llamada a getUserInfo
      const userInfoResponse = await fetch(
        `/api/users?email=${encodeURIComponent(email)}`
      );
      const userInfo = await userInfoResponse.json();

      if (userInfo.error) {
        setErrorMsg(userInfo.error);
        setLoading(false);
        return;
      }

      setRole(userInfo.role);
      setName(userInfo.name ?? null);

      const expireAt = Date.now() + 12 * 60 * 60 * 1000;
      localStorage.setItem("sessionExpireAt", String(expireAt));
      router.push("/portal/dashboard");
    } catch (error) {
      console.error("Error durante el inicio de sesión:", error);
      setErrorMsg("Error de conexión. Intenta nuevamente.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return <Loader text="Verificando sesión..." />;
  }

  if (loading) {
    return <Loader text="Iniciando sesión..." />;
  }

  return (
    <>
      <div className="min-h-screen flex bg-gradient-to-br from-[#003C96] via-[#0085CA] to-[#00A7CE]">
        {/* Panel izquierdo - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
          {/* Decoración de fondo - Ahora más oscura para mejor contraste */}
          <div className="absolute inset-0 bg-[#003C96]/40 backdrop-blur-sm" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#0085CA]/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#003C96]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 text-center max-w-md">
            <Image
              src="/Logotipo vertical blanco.png"
              alt="Municipalidad de San Bernardo"
              width={200}
              height={240}
              priority
              className="mb-8 mx-auto drop-shadow-2xl"
            />
            <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Portal de Gestión
            </h1>
            <p className="text-xl text-white leading-relaxed drop-shadow-md">
              Sistema de administración y seguimiento de denuncias ciudadanas
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-white">
              <div className="w-12 h-1 bg-white/60 rounded-full" />
              <span className="text-sm font-medium">
                Municipalidad de San Bernardo
              </span>
              <div className="w-12 h-1 bg-white/60 rounded-full" />
            </div>
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Logo móvil */}
            <div className="lg:hidden flex justify-center mb-8">
              <Image
                src="/Logotipo vertical blanco.png"
                alt="Municipalidad de San Bernardo"
                width={120}
                height={145}
                priority
                className="drop-shadow-2xl"
              />
            </div>

            {/* Card del formulario */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Bienvenido
                </h2>
                <p className="text-gray-600">
                  Ingresa tus credenciales para continuar
                </p>
              </div>

              {/* Mensaje de error */}
              {errorMsg && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Error de autenticación
                    </p>
                    <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail
                        className={`w-5 h-5 transition-colors ${
                          focusedInput === "email"
                            ? "text-[#0085CA]"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedInput("email")}
                      onBlur={() => setFocusedInput(null)}
                      className={`block w-full pl-10 pr-4 py-3 border-2 rounded-lg text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none ${
                        focusedInput === "email"
                          ? "border-[#0085CA] ring-4 ring-[#0085CA]/10"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock
                        className={`w-5 h-5 transition-colors ${
                          focusedInput === "password"
                            ? "text-[#0085CA]"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      className={`block w-full pl-10 pr-12 py-3 border-2 rounded-lg text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none ${
                        focusedInput === "password"
                          ? "border-[#0085CA] ring-4 ring-[#0085CA]/10"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Olvidaste contraseña */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="text-sm font-medium text-[#0085CA] hover:text-[#003C96] transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Botón submit */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#003C96] to-[#0085CA] text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#0085CA]/50"
                >
                  Iniciar sesión
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-xs text-gray-500">
                  Portal protegido. Acceso solo para personal autorizado.
                </p>
              </div>
            </div>

            {/* Información adicional */}
            <p className="mt-6 text-center text-sm text-white drop-shadow-lg lg:hidden">
              Sistema de Gestión de Denuncias · San Bernardo
            </p>
          </div>
        </div>
      </div>

      {/* Modal de recuperación de contraseña */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-[#0085CA]/20 to-[#00A7CE]/20 mb-6">
                <AlertCircle className="h-8 w-8 text-[#0085CA]" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Recuperación de Contraseña
              </h3>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Para restablecer tu contraseña, por favor contacta con un
                administrador del sistema quien te ayudará a recuperar el acceso
                a tu cuenta.
              </p>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 font-medium">
                  💡 Consejo de seguridad
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  Nunca compartas tus credenciales con terceros
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gradient-to-r from-[#003C96] to-[#0085CA] text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-semibold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
