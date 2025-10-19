"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Share2,
  MapPin,
  Users,
  Settings,
  ShieldCheck,
  User2,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const { role, name } = useUser();

  const roleLabel =
    role === 1 ? "Administrador" : role === 2 ? "Operador" : "Usuario";

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/users/logout", {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        localStorage.removeItem("sessionExpireAt");
        router.push("/");
      } else {
        console.error("Error al cerrar sesión:", result.error);
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const navItems = [
    { href: "/portal/dashboard", icon: Home, label: "Dashboard" },
    { href: "/portal/denuncias", icon: FileText, label: "Denuncias" },
    { href: "/portal/derivaciones", icon: Share2, label: "Derivaciones" },
    { href: "/portal/mapa", icon: MapPin, label: "Mapa" },
    { href: "/portal/usuarios", icon: Users, label: "Usuarios" },
    { href: "/portal/auditoria", icon: ShieldCheck, label: "Auditoría" },
  ];

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header Principal */}
      <header
        className="fixed top-0 left-0 right-0 h-20 z-50 shadow-md"
        style={{ backgroundColor: "#003C96" }}
      >
        <div className="h-full px-6 flex items-center justify-between">
          {/* Logo y Marca */}
          <div className="flex items-center gap-8">
            <Link href="/portal/dashboard" className="flex items-center gap-3">
              <Image
                src="/Logotipo horizontal blanco.png"
                alt="Logotipo Municipalidad de San Bernardo"
                width={160}
                height={50}
                priority
                className="h-12 w-auto"
              />
            </Link>

            {/* Navegación Principal */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? "bg-white/20 text-white font-medium"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}

              {/* Dropdown Catálogos */}
              <div className="relative">
                <button
                  onClick={() => setCatalogOpen(!catalogOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    pathname.startsWith("/portal/catalogos")
                      ? "bg-white/20 text-white font-medium"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Settings size={18} />
                  <span className="text-sm">Catálogos</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      catalogOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {catalogOpen && (
                  <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl py-2 min-w-[180px] z-50">
                    <Link
                      href="/portal/catalogos/tipo"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Inspectores
                    </Link>
                    <Link
                      href="/portal/catalogos/estado"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Categorías
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Usuario y Acciones */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-white font-medium">{name}</p>
                <p className="text-xs text-white/80">{roleLabel}</p>
              </div>
              <div className="bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center">
                <User2 size={20} />
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
              <span className="text-sm hidden md:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="pt-20 min-h-screen">
        <div className="w-full">
          {children}
          <SpeedInsights />
        </div>
      </main>
    </div>
  );
}
