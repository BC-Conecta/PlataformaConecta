import { useState } from "react";
import { Save } from "lucide-react";
import { dayLessons, useApp } from "../context/AppContext";
import { Page } from "../components/Page";
import type { Attendance, Lesson } from "../types";
export function JournalPage() {
  const {
      people,
      groups,
      fixed,
      lessons,
      setLessons,
      attendance,
      setAttendance,
      holidays,
    } = useApp(),
    [date, setDate] = useState(new Date().toISOString().slice(0, 10)),
    [index, setIndex] = useState(0),
    holiday = holidays.find((h) => h.date === date),
    items = dayLessons(date, fixed, lessons, holidays),
    chosen = items[index],
    students = people.filter((p) =>
      groups.find((g) => g.status === "ATIVA")?.students.includes(p.id),
    );
  function materialize(patch: Partial<Lesson> = {}) {
    if (!chosen) return undefined;
    const real = {
      ...chosen,
      ...patch,
      id: chosen.id.startsWith("virtual:") ? crypto.randomUUID() : chosen.id,
    };
    setLessons((v) =>
      chosen.id.startsWith("virtual:")
        ? [...v, real]
        : v.map((x) => (x.id === chosen.id ? real : x)),
    );
    return real;
  }
  function mark(studentId: string, status: Attendance["status"]) {
    const real = materialize();
    if (!real) return;
    setAttendance((v) => [
      ...v.filter(
        (x) => !(x.lessonId === real.id && x.studentId === studentId),
      ),
      { lessonId: real.id, studentId, status },
    ]);
  }
  return (
    <Page
      tag="REGISTRO PEDAGÓGICO"
      title="Diário de classe"
      text="Atividade, horário e professor carregados automaticamente."
      action={
        <button
          className="primary"
          disabled={!chosen}
          onClick={() => materialize({ done: true })}
        >
          <Save />
          Salvar diário
        </button>
      }
    >
      <div className="journal">
        <section className="card form">
          <label>
            Data
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setIndex(0);
              }}
            />
          </label>
          <label>
            Atividade
            <select
              value={index}
              disabled={!items.length}
              onChange={(e) => setIndex(Number(e.target.value))}
            >
              {items.length ? (
                items.map((x, i) => (
                  <option key={x.id} value={i}>
                    {x.start ? `${x.start} · ` : ""}
                    {x.title}
                  </option>
                ))
              ) : (
                <option>Nenhuma atividade nesta data</option>
              )}
            </select>
          </label>
          {holiday && (
            <div className="alert warning">
              {holiday.title} · {holiday.type.replace("_", " ")} — não há aulas
              recorrentes geradas para este dia.
            </div>
          )}
          <div className="row meta">
            <div>
              <span>Horário</span>
              <strong>
                {chosen?.start
                  ? `${chosen.start} às ${chosen.end}`
                  : "Não disponível"}
              </strong>
            </div>
            <div>
              <span>Professor</span>
              <strong>
                {people.find((p) => p.id === chosen?.teacherId)?.name ||
                  "Não disponível"}
              </strong>
            </div>
          </div>
          <label>
            Conteúdo trabalhado
            <textarea
              disabled={!chosen}
              value={chosen?.content || ""}
              onChange={(e) => materialize({ content: e.target.value })}
            />
          </label>
          <label>
            Observações
            <textarea
              disabled={!chosen}
              value={chosen?.notes || ""}
              onChange={(e) => materialize({ notes: e.target.value })}
            />
          </label>
          {!chosen && (
            <div className="empty">
              Sem atividade nesta data. Os controles permanecem visíveis e serão
              habilitados quando existir uma aula ou evento.
            </div>
          )}
        </section>
        <section className="card attendance">
          <h2>Chamada</h2>
          {students.map((s) => {
            const st =
              attendance.find(
                (a) => a.lessonId === chosen?.id && a.studentId === s.id,
              )?.status || "PRESENTE";
            return (
              <article key={s.id}>
                <strong>{s.name}</strong>
                <div>
                  {(["PRESENTE", "AUSENTE", "JUSTIFICADA"] as const).map(
                    (x) => (
                      <button
                        key={x}
                        disabled={!chosen}
                        className={st === x ? `selected ${x}` : ""}
                        onClick={() => mark(s.id, x)}
                      >
                        {x[0]}
                      </button>
                    ),
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </Page>
  );
}
