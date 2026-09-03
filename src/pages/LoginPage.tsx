import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

const roles: Role[] = [
  "ADMINISTRADOR",
  "GESTOR",
  "PROFESSOR",
  "ALUNO",
  "RESPONSAVEL",
];

export function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("admin@barracred.org.br");
  const [password, setPassword] = useState("conecta123");
  const [role, setRole] = useState<Role>("ADMINISTRADOR");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-brand">
        <img src="/logo-branco.png" alt="Barracred Conecta" />
        <div>
          <span className="eyebrow">
            <ShieldCheck size={14} /> Educação que transforma
          </span>
          <h1>Acompanhamento simples, próximo e humano.</h1>
          <p>
            Um espaço para professores registrarem aulas, frequência e a
            trajetória de aprendizagem de cada estudante.
          </p>
        </div>
        <small>Projeto social Barracred Conecta</small>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-mark">
            <img src="/logo-escuro.png" alt="Barracred Conecta" />
          </div>
          <div>
            <h2>Bem-vindo de volta</h2>
            <p>Acesse o ambiente de acompanhamento educacional.</p>
          </div>
          <label>
            E-mail
            <div className="input-icon">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                autoComplete="username"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>
          <label>
            Senha
            <div className="input-icon">
              <LockKeyhole size={18} />
              <input
                type={show ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="ghost"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <label>
            Perfil de demonstração
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          {error && <div className="alert error">{error}</div>}
          <button className="primary large" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <p className="demo-note">
            Modo demonstração ativo. Use os dados preenchidos ou qualquer e-mail
            com senha de pelo menos 4 caracteres.
          </p>
        </form>
      </section>
    </div>
  );
}
