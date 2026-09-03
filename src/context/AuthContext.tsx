import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role, UserProfile } from "../types";

type AuthValue = {
  user: UserProfile | null;
  login: (email: string, password: string, role?: Role) => Promise<void>;
  logout: () => void;
};

const Context = createContext<AuthValue | null>(null);

function load(): UserProfile | null {
  try {
    return JSON.parse(sessionStorage.getItem("bc.user") || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(load);

  async function login(
    email: string,
    password: string,
    role: Role = "ADMINISTRADOR",
  ) {
    if (!email || password.length < 4) {
      throw new Error("Informe e-mail e senha com pelo menos 4 caracteres.");
    }
    // Modo demonstração: não há backend de autenticação configurado.
    // Qualquer credencial válida entra com o perfil escolhido.
    await new Promise((r) => setTimeout(r, 350));
    const profile: UserProfile = {
      id: "demo-" + role.toLowerCase(),
      name:
        role === "ADMINISTRADOR"
          ? "Administrador Conecta"
          : email.split("@")[0].replace(/\W/g, " ").trim() || "Usuário",
      email,
      role,
    };
    setUser(profile);
    sessionStorage.setItem("bc.user", JSON.stringify(profile));
  }

  function logout() {
    setUser(null);
    sessionStorage.removeItem("bc.user");
  }

  return (
    <Context.Provider value={{ user, login, logout }}>
      {children}
    </Context.Provider>
  );
}

export function useAuth() {
  const c = useContext(Context);
  if (!c) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return c;
}
