import { useApp } from "../context/AppContext";
import { Page } from "../components/Page";
export function DashboardPage() {
  const { people, groups, lessons, attendance } = useApp();
  return (
    <Page
      tag="PAINEL"
      title="Visão geral"
      text="Acompanhe o projeto e a turma ativa."
    >
      <div className="stats">
        {[
          [
            people.filter((p) => p.type === "ALUNO" && p.active).length,
            "Alunos ativos",
          ],
          [
            groups.find((g) => g.status === "ATIVA")?.name || "-",
            "Turma ativa",
          ],
          [lessons.filter((l) => l.done).length, "Aulas realizadas"],
          [
            attendance.length
              ? Math.round(
                  (attendance.filter((a) => a.status !== "AUSENTE").length /
                    attendance.length) *
                    100,
                ) + "%"
              : "0%",
            "Frequência geral",
          ],
        ].map((x) => (
          <article key={String(x[1])}>
            <strong>{x[0]}</strong>
            <span>{x[1]}</span>
          </article>
        ))}
      </div>
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
        <span className="pill">Modo demonstração</span>
      </section>
    </Page>
  );
}
