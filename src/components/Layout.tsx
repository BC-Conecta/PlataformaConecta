import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CalendarCog,
  ChevronLeft,
  ClipboardCheck,
  FlaskConical,
  GraduationCap,
  LogOut,
  Menu,
  Minus,
  Moon,
  Plus,
  Settings,
  Sun,
  Users,
  X,
} from "lucide-react";
const nav = [
  ["/", "Visão geral", BarChart3],
  ["/pessoas", "Pessoas", Users],
  ["/turmas", "Turmas", GraduationCap],
  ["/aulas", "Configuração das aulas", CalendarCog],
  ["/calendario", "Calendário", CalendarDays],
  ["/diario", "Diário de classe", ClipboardCheck],
  ["/relatorios", "Relatórios", BookOpenCheck],
  ["/testes", "Testes do sistema", FlaskConical],
  ["/configuracoes", "Configurações", Settings],
] as const;
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

export function Layout() {
  const { user, signOut } = useAuth();
  const { loading, error, people } = useApp();
  const navigate = useNavigate();
  const displayName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário Conecta";
  const displayRole = user?.user_metadata?.role || "";
  const profilePhotoUrl = people.find(
    (person) => person.email.toLowerCase() === user?.email?.toLowerCase(),
  )?.profilePhotoUrl;
  const [collapsed, setCollapsed] = useState(
      localStorage.getItem("bc.collapse") === "1",
    ),
    [open, setOpen] = useState(false),
    [dark, setDark] = useState(localStorage.getItem("bc.theme") === "dark"),
    [font, setFont] = useState(Number(localStorage.getItem("bc.font") || 100));
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.style.fontSize = `${font}%`;
    localStorage.setItem("bc.theme", dark ? "dark" : "light");
    localStorage.setItem("bc.font", String(font));
    localStorage.setItem("bc.collapse", collapsed ? "1" : "0");
  }, [dark, font, collapsed]);
  return (
    <div className={`shell ${collapsed ? "collapsed" : ""}`}>
      <aside className={open ? "open" : ""}>
        <div className="brand">
          <img src="/logo-branco.png" />
          <button onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav>
          {nav.map(([to, label, I]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              <I />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="collapse" onClick={() => setCollapsed(!collapsed)}>
          <ChevronLeft />
          <span>Recolher menu</span>
        </button>
      </aside>
      <section className="work">
        <header>
          <button className="menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div className="product">
            <strong>Barracred Conecta</strong>
            <small>Acompanhamento educacional</small>
          </div>
          <div className="tools">
            <div className="font">
              <button onClick={() => setFont(Math.max(90, font - 10))}>
                <Minus />
              </button>
              <b>{font}%</b>
              <button onClick={() => setFont(Math.min(130, font + 10))}>
                <Plus />
              </button>
            </div>
            <button className="icon" onClick={() => setDark(!dark)}>
              {dark ? <Sun /> : <Moon />}
            </button>
            <div className="profile">
              <span>
                {profilePhotoUrl ? <img src={profilePhotoUrl} alt="" /> : initials(displayName)}
              </span>
              <div>
                <strong>{displayName}</strong>
                <small>{displayRole}</small>
              </div>
            </div>
            <button
              className="icon"
              title="Sair"
              onClick={() => {
                void signOut();
                navigate("/login", { replace: true });
              }}
            >
              <LogOut />
            </button>
          </div>
        </header>
        <main>
          {loading ? (
            <div className="empty">Carregando dados da plataforma...</div>
          ) : (
            <>
              {error && <div className="alert error data-error">{error}</div>}
              <Outlet />
            </>
          )}
        </main>
      </section>
    </div>
  );
}
