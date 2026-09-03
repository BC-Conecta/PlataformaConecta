import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../context/AppContext";
import { Page } from "../components/Page";

export function ReportsPage() {
  const { people, lessons, attendance } = useApp(),
    [mode, setMode] = useState("GERAL"),
    [month, setMonth] = useState(new Date().toISOString().slice(0, 7)),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    valid = useMemo(
      () =>
        new Set(
          lessons
            .filter(
              (l) =>
                mode === "GERAL" ||
                (mode === "MES" && l.date.startsWith(month)) ||
                (mode === "PERIODO" &&
                  (!start || l.date >= start) &&
                  (!end || l.date <= end)),
            )
            .map((l) => l.id),
        ),
      [lessons, mode, month, start, end],
    ),
    data = people
      .filter((p) => p.type === "ALUNO")
      .map((p) => {
        const a = attendance.filter(
            (x) => x.studentId === p.id && valid.has(x.lessonId),
          ),
          present = a.filter((x) => x.status === "PRESENTE").length,
          just = a.filter((x) => x.status === "JUSTIFICADA").length;
        return {
          name: p.name,
          Presentes: present,
          Ausentes: a.length - present - just,
          Justificadas: just,
          rate: a.length ? Math.round(((present + just) / a.length) * 100) : 0,
          total: a.length,
        };
      }),
    hasRecords = data.some((d) => d.total > 0);

  return (
    <Page
      tag="INDICADORES"
      title="Relatórios"
      text="Frequência geral, mensal ou por período."
    >
      <section className="card filters">
        <label>
          Visualização
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="GERAL">GERAL</option>
            <option value="MES">POR MÊS</option>
            <option value="PERIODO">POR PERÍODO</option>
          </select>
        </label>
        {mode === "MES" && (
          <label>
            Mês
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
        )}
        {mode === "PERIODO" && (
          <>
            <label>
              Início
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              Fim
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </>
        )}
      </section>

      <section className="card chart">
        {hasRecords ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid var(--b)",
                  background: "var(--s)",
                }}
              />
              <Legend />
              <Bar
                dataKey="Presentes"
                stackId="a"
                fill="#159447"
                minPointSize={2}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Justificadas"
                stackId="a"
                fill="#d99a1f"
                minPointSize={2}
              />
              <Bar
                dataKey="Ausentes"
                stackId="a"
                fill="#c8414f"
                minPointSize={2}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty chart-empty">
            Nenhuma chamada foi registrada ainda para este filtro. Assim que o
            Diário de classe tiver frequência lançada, o gráfico aparece aqui.
          </div>
        )}
      </section>

      <section className="card table">
        <table>
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Presentes</th>
              <th>Ausentes</th>
              <th>Justificadas</th>
              <th>Frequência</th>
            </tr>
          </thead>
          <tbody>
            {data.map((x) => (
              <tr key={x.name}>
                <td data-label="Aluno">{x.name}</td>
                <td data-label="Presentes">{x.Presentes}</td>
                <td data-label="Ausentes">{x.Ausentes}</td>
                <td data-label="Justificadas">{x.Justificadas}</td>
                <td data-label="Frequência">
                  <strong>{x.rate}%</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Page>
  );
}
