"use client";
import { useState, useEffect } from "react";
import { login } from "@/api/users/login";
import { getUserInfo } from "@/api/users/userInfo";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Loader from "./components/Loader";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false); // Nuevo estado para loading
  const [checkingSession, setCheckingSession] = useState(true);
  const { setRole, setName } = useUser();

  useEffect(() => {
    // Mostrar loader mientras se verifica la sesión
    const expireAt = localStorage.getItem("sessionExpireAt");
    if (expireAt && Date.now() < Number(expireAt)) {
      // Si hay sesión válida, mostrar loader y redirigir
      setCheckingSession(true);
      router.push("/portal/dashboard");
    } else {
      // Si no hay sesión, mostrar login
      setCheckingSession(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true); // Activa el loader

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    // 1. Login y validación de activo
    const result = await login(formData);

    if (result && result.error) {
      setErrorMsg(result.error);
      setLoading(false); // Desactiva el loader
      return;
    }

    // 2. Obtener info del usuario y guardar en contexto
    const userInfo = await getUserInfo(email);
    if (userInfo.error) {
      setErrorMsg(userInfo.error);
      setLoading(false); // Desactiva el loader
      return;
    }


    // Guarda explícitamente el rol y nombre en el contexto
    setRole(userInfo.role);
    setName(userInfo.name);

    // Guardar la expiración de la sesión (12 horas)
    const expireAt = Date.now() + 12 * 60 * 60 * 1000; // 12 horas en ms
    localStorage.setItem("sessionExpireAt", String(expireAt));
    router.push("/portal/dashboard");
    // No es necesario desactivar el loader aquí porque se redirige
  };

  if (checkingSession) {
    return <Loader text="Verificando sesión..." />;
  }

  if (loading) {
    return <Loader text="Iniciando sesión..." />;
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">
          Iniciar sesión en tu cuenta
        </h2>
      </div>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {errorMsg && (
          <div className="mb-4 text-red-500 text-sm text-center">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm/6 font-medium text-gray-100"
            >
              Correo electrónico
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm/6 font-medium text-gray-100"
              >
                Contraseña
              </label>
              <div className="text-sm">
                <a
                  href="#"
                  className="font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Iniciar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
