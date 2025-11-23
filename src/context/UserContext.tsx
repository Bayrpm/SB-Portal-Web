"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";

export interface AllowedPage {
  id: string;
  nombre: string;
  titulo: string;
  path: string;
}

type UserContextType = {
  role: number | null;
  setRole: (role: number | null) => void;
  name: string | null;
  setName: (name: string | null) => void;
  allowedPages: AllowedPage[];
  setAllowedPages: (pages: AllowedPage[]) => void;
  loadAllowedPages: (rolId: number) => Promise<AllowedPage[] | undefined>;
  isPageAllowed: (path: string) => boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<number | null>(null);
  const [name, setNameState] = useState<string | null>(null);
  const [allowedPages, setAllowedPagesState] = useState<AllowedPage[]>([]);
  // const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole");
    const savedName = localStorage.getItem("userName");
    const savedPages = localStorage.getItem("allowedPages");
    const expireAt = localStorage.getItem("sessionExpireAt");

    if (expireAt && Date.now() > Number(expireAt)) {
      // Expiró la sesión
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
      localStorage.removeItem("allowedPages");
      localStorage.removeItem("sessionExpireAt");
      setRoleState(null);
      setNameState(null);
      setAllowedPagesState([]);
      router.push("/");
      return;
    }

    if (savedRole) setRoleState(Number(savedRole));
    if (savedName) setNameState(savedName);
    if (savedPages) {
      try {
        const parsedPages = JSON.parse(savedPages);
        // Validar que sea un array
        if (Array.isArray(parsedPages) && parsedPages.length > 0) {
          setAllowedPagesState(parsedPages);
        } else {
          console.warn("allowedPages inválido o vacío:", parsedPages);
          setAllowedPagesState([]);
        }
      } catch (error) {
        console.error("Error parsing allowedPages:", error);
        setAllowedPagesState([]);
      }
    }
  }, [router]);
  const setRole = (newRole: number | null) => {
    setRoleState(newRole);
    if (newRole !== null) localStorage.setItem("userRole", String(newRole));
    else localStorage.removeItem("userRole");
  };

  const setName = (newName: string | null) => {
    setNameState(newName);
    if (newName) localStorage.setItem("userName", newName);
    else localStorage.removeItem("userName");
  };

  const setAllowedPages = (pages: AllowedPage[]) => {
    setAllowedPagesState(pages);
    localStorage.setItem("allowedPages", JSON.stringify(pages));
  };

  const loadAllowedPages = async (): Promise<AllowedPage[] | undefined> => {
    try {
      const response = await fetch(`/api/users/allowed-pages`);
      const data = await response.json();

      if (response.ok && data.success) {
        setAllowedPages(data.paginas || []);
        return data.paginas || [];
      } else {
        console.error("Error cargando páginas permitidas:", data.error);
        setAllowedPages([]);
        return undefined;
      }
    } catch (error) {
      console.error("Error en loadAllowedPages:", error);
      setAllowedPages([]);
      return undefined;
    }
  };

  const isPageAllowed = (path: string): boolean => {
    // Solo la ruta de login es siempre pública
    if (path === "/") {
      return true;
    }

    // Todas las demás rutas deben estar en allowedPages
    return allowedPages.some((page) => path.startsWith(page.path));
  };

  return (
    <UserContext.Provider
      value={{
        role,
        setRole,
        name,
        setName,
        allowedPages,
        setAllowedPages,
        loadAllowedPages,
        isPageAllowed,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}
