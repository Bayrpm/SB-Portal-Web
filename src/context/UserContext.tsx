"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";

type UserContextType = {
  role: number | null;
  setRole: (role: number | null) => void;
  name: string | null;
  setName: (name: string | null) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<number | null>(null);
  const [name, setNameState] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole");
    const savedName = localStorage.getItem("userName");
    const expireAt = localStorage.getItem("sessionExpireAt");

    if (expireAt && Date.now() > Number(expireAt)) {
      // Expiró la sesión
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
      localStorage.removeItem("sessionExpireAt");
      setRoleState(null);
      setNameState(null);
      router.push("/");
      return;
    }

    if (savedRole) setRoleState(Number(savedRole));
    if (savedName) setNameState(savedName);
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

  return (
    <UserContext.Provider value={{ role, setRole, name, setName }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}
