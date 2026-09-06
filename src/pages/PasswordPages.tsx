import { useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, KeyRound, LockKeyhole, Mail } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PasswordShell({ children }: { children: ReactNode }) {
  return (
    <div className="login-page">
      <section className="login-brand">
        <img src="/logo-branco.png" alt="Barracred Conecta" />
        <div>
          <span className="eyebrow"><KeyRound size={14} /> Acesso seguro</span>
          <h1>Seu acesso continua nas suas mãos.</h1>
          <p>Atualize seus dados de acesso com segurança para continuar acompanhando o projeto.</p>
        </div>
        <small>Projeto social Barracred Conecta</small>
      </section>
      <section className="login-panel">{children}</section>
    </div>
  );
}

export function PasswordRecoveryPage() {
  const { user, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setMessage("Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível enviar o e-mail.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PasswordShell>
      <form className="login-card" onSubmit={submit}>
        <div className="login-mark">
          <img className="logo-dark" src="/logo-escuro.png" alt="Barracred Conecta" />
          <img className="logo-light" src="/logo-branco.png" alt="Barracred Conecta" />
        </div>
        <div>
          <h2>Recuperar senha</h2>
          <p>Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>
        </div>
        <label>
          E-mail
          <div className="input-icon">
            <Mail size={18} />
            <input type="email" value={email} autoComplete="email" onChange={(event) => setEmail(event.target.value)} required />
          </div>
        </label>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}
        <button className="primary large" disabled={loading}>
          {loading ? "Enviando..." : "Enviar link"}
        </button>
        <Link className="login-back" to="/login">Voltar para o login</Link>
      </form>
    </PasswordShell>
  );
}

export function ResetPasswordPage() {
  const { user, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não conferem.");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate("/"), 1200);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PasswordShell>
      <form className="login-card" onSubmit={submit}>
        <div className="login-mark">
          <img className="logo-dark" src="/logo-escuro.png" alt="Barracred Conecta" />
          <img className="logo-light" src="/logo-branco.png" alt="Barracred Conecta" />
        </div>
        <div>
          <h2>Definir nova senha</h2>
          <p>Escolha uma senha nova para proteger sua conta.</p>
        </div>
        {!user && <div className="alert warning">Abra esta página pelo link recebido no seu e-mail.</div>}
        <label>
          Nova senha
          <div className="input-icon">
            <LockKeyhole size={18} />
            <input type={show ? "text" : "password"} value={password} autoComplete="new-password" onChange={(event) => setPassword(event.target.value)} required />
            <button type="button" className="ghost" onClick={() => setShow((value) => !value)} aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <label>
          Confirmar senha
          <div className="input-icon">
            <LockKeyhole size={18} />
            <input type={show ? "text" : "password"} value={confirmation} autoComplete="new-password" onChange={(event) => setConfirmation(event.target.value)} required />
          </div>
        </label>
        {error && <div className="alert error">{error}</div>}
        {done && <div className="alert success">Senha atualizada. Redirecionando...</div>}
        <button className="primary large" disabled={loading || !user || done}>
          {loading ? "Atualizando..." : "Atualizar senha"}
        </button>
        <Link className="login-back" to="/login">Voltar para o login</Link>
      </form>
    </PasswordShell>
  );
}
