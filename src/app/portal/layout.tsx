"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Home,
  FileText,
  Share2,
  MapPin,
  Users,
  Settings,
  ShieldCheck,
  ChevronDown,
  User2,
  Menu,
} from "lucide-react";
import { useUser } from "@/context/UserContext"; // Asegúrate de tener nombre y rol en el contexto

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeItem, setActiveItem] = useState("dashboard");
  const [catalogOpen, setCatalogOpen] = useState(false);

  // Ejemplo de datos desde el contexto
  const { role, name } = useUser();

  // Traducción de rol
  const roleLabel =
    role === 1 ? "Administrador" : role === 2 ? "Operador" : "Usuario";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-72 bg-white text-gray-900 flex flex-col border-r border-gray-200">
        {/* Logo y título */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-700">Denuncia</h1>
          <p className="text-xs text-gray-500 mt-1">San Bernardo</p>
        </div>

        {/* Navegación principal */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            <li>
              <Link
                href="/portal/dashboard"
                className={`flex items-center px-4 py-2 rounded-lg ${
                  activeItem === "dashboard"
                    ? "bg-gray-200 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => setActiveItem("dashboard")}
              >
                <Home className="w-5 h-5 mr-3" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                href="/portal/denuncias"
                className={`flex items-center px-4 py-2 rounded-lg ${
                  activeItem === "denuncias"
                    ? "bg-gray-200 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => setActiveItem("denuncias")}
              >
                <FileText className="w-5 h-5 mr-3" />
                <span>Denuncias</span>
              </Link>
            </li>
            <li>
              <Link
                href="/portal/derivaciones"
                className={`flex items-center px-4 py-2 rounded-lg ${
                  activeItem === "derivaciones"
                    ? "bg-gray-200 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => setActiveItem("derivaciones")}
              >
                <Share2 className="w-5 h-5 mr-3" />
                <span>Derivaciones</span>
              </Link>
            </li>
            <li>
              <Link
                href="/portal/mapa"
                className={`flex items-center px-4 py-2 rounded-lg ${
                  activeItem === "mapa"
                    ? "bg-gray-200 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => setActiveItem("mapa")}
              >
                <MapPin className="w-5 h-5 mr-3" />
                <span>Mapa</span>
              </Link>
            </li>
            <li>
              <Link
                href="/portal/usuarios"
                className={`flex items-center px-4 py-2 rounded-lg ${
                  activeItem === "usuarios"
                    ? "bg-gray-200 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => setActiveItem("usuarios")}
              >
                <Users className="w-5 h-5 mr-3" />
                <span>Usuarios</span>
              </Link>
            </li>
            <li>
              <button
                className={`w-full flex items-center px-4 py-2 rounded-lg ${
                  activeItem === "catalogos"
                    ? "bg-gray-200 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => {
                  setActiveItem("catalogos");
                  setCatalogOpen((open) => !open);
                }}
              >
                <Settings className="w-5 h-5 mr-3" />
                <span>Catálogos</span>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </button>
              {/* Submenú de catálogos */}
              {catalogOpen && (
                <ul className="ml-8 mt-2 space-y-1">
                  <li>
                    <Link
                      href="/portal/catalogos/tipo"
                      className="block px-2 py-1 text-sm text-gray-600 hover:text-blue-700"
                    >
                      Inspectores
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/portal/catalogos/estado"
                      className="block px-2 py-1 text-sm text-gray-600 hover:text-blue-700"
                    >
                      Categorias
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link
                href="/portal/auditoria"
                className={`flex items-center px-4 py-2 rounded-lg ${
                  activeItem === "auditoria"
                    ? "bg-gray-200 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => setActiveItem("auditoria")}
              >
                <ShieldCheck className="w-5 h-5 mr-3" />
                <span>Auditoría</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-end px-8 py-4 border-b border-gray-200 bg-white">
          <Menu className="w-6 h-6 text-gray-500 mr-auto" />
          <span className="text-sm text-gray-500 mr-4">{roleLabel}</span>
          <span className="flex items-center gap-2">
            <span className="bg-blue-900 text-white rounded-full w-8 h-8 flex items-center justify-center">
              <User2 className="w-5 h-5" />
            </span>
            <span className="text-gray-900 font-medium">{name}</span>
          </span>
        </header>
        {/* Page content */}
        <main className="flex-1 p-0">{children}</main>
      </div>
    </div>
  );
}
