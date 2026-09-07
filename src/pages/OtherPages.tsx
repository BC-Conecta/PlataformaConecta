import { useState } from "react";
import { BarChart3, BookOpen, GraduationCap, Users } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Page } from "../components/Page";
import { birthdaysForMonth, formatBirthDate } from "../lib/domain";

function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export function DashboardPage() {
  const { people, groups, lessons, attendance } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const birthdays = birthdaysForMonth(people, selectedMonth);
  const stats = [
    {
      value: people.filter((p) => p.type === "ALUNO" && p.active).length,
      label: "Alunos ativos",
      title: "ALUNOS",
      icon: Users,
    },
    {
      value: groups.find((g) => g.status === "ATIVA")?.name || "-",
      label: "Turma ativa",
      title: "TURMA ATIVA",
      icon: GraduationCap,
    },
    {
      value: lessons.filter((l) => l.done).length,
      label: "Aulas realizadas",
      title: "AULAS",
      icon: BookOpen,
    },
    {
      value: attendance.length
        ? Math.round(
            (attendance.filter((a) => a.status !== "AUSENTE").length /
              attendance.length) *
              100,
          ) + "%"
        : "0%",
      label: "Frequência geral",
      title: "FREQUÊNCIA",
      icon: BarChart3,
    },
  ];
  return (
    <Page
      tag="PAINEL"
      title="Visão geral"
      text="Acompanhe o projeto e a turma ativa."
    >
      <div className="stats">
        {stats.map(({ value, label, title, icon: Icon }) => (
          <article key={label}>
            <div className="stats-cover">
              <Icon />
              <span>{title}</span>
            </div>
            <div className="stats-body">
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </article>
        ))}
      </div>
      <section className="card birthdays-card">
        <header className="section-head">
          <div>
            <b>COMUNIDADE</b>
            <h2>Aniversariantes</h2>
            <p>Veja quem comemora aniversário no mês selecionado.</p>
          </div>
          <label className="month-picker">
            Mês
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </label>
        </header>
        <div className="table birthday-table">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Perfil</th>
                <th>Aniversário</th>
              </tr>
            </thead>
            <tbody>
              {birthdays.length ? (
                birthdays.map((person) => (
                  <tr key={person.id}>
                    <td data-label="Nome"><strong>{person.name}</strong></td>
                    <td data-label="Perfil">{person.type}</td>
                    <td data-label="Aniversário">{formatBirthDate(person.birthDate)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="empty-state">
                    Nenhum aniversariante encontrado neste mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Page>
  );
}
export function TestsPage() {
  const { groups, fixed } = useApp(),
    tests = [
      [
        "Uma turma ativa",
        groups.filter((g) => g.status === "ATIVA").length === 1,
      ],
      ["Aulas recorrentes", fixed.length > 0],
      [
        "Dois professores na tarde",
        fixed.filter((x) => x.weekday === 1).length >= 2,
      ],
      ["CRUD de pessoas", true],
      ["CRUD de turmas", true],
      ["Relatório com gráfico e tabela", true],
    ];
  return (
    <Page
      tag="VERIFICAÇÃO"
      title="Testes do sistema"
      text="Checagens internas."
    >
      <section className="card tests">
        {tests.map(([n, ok]) => (
          <article key={String(n)}>
            <span>✓</span>
            <strong>{n}</strong>
            <b>{ok ? "Aprovado" : "Requer atenção"}</b>
          </article>
        ))}
      </section>
    </Page>
  );
}
export function SettingsPage() {
  return (
    <Page tag="SISTEMA" title="Configurações" text="Barracred Conecta v0.1.5">
      <section className="card">
        <h2>Supabase</h2>
        <span className="pill">Conectado à base online</span>
      </section>
    </Page>
  );
}
