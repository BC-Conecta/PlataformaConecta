import { useMemo, useState, type FormEvent } from "react";
import {
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { dayLessons, useApp } from "../context/AppContext";
import { Page } from "../components/Page";
import { Modal } from "../components/Modal";
import type { Holiday, HolidayType } from "../types";

const holidayLabels: Record<HolidayType, string> = {
  FERIADO: "Feriado",
  RECESSO: "Recesso",
  PONTO_FACULTATIVO: "Ponto facultativo",
  OUTRO: "Outro",
};

function monthDays(m: Date) {
  const a = new Date(m.getFullYear(), m.getMonth(), 1);
  a.setDate(a.getDate() - a.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(a);
    d.setDate(a.getDate() + i);
    return d;
  });
}

const blankActivity = { type: "PALESTRA" as const, title: "", content: "" };
const blankHoliday = { title: "", type: "FERIADO" as HolidayType };

export function CalendarPage() {
  const { fixed, lessons, setLessons, holidays, setHolidays } = useApp(),
    [m, setM] = useState(new Date()),
    [dialog, setDialog] = useState<"activity" | "holiday" | null>(null),
    [date, setDate] = useState(""),
    [f, setF] = useState(blankActivity),
    [hf, setHf] = useState(blankHoliday);

  const holidayByDate = useMemo(() => {
    const map = new Map<string, Holiday>();
    holidays.forEach((h) => map.set(h.date, h));
    return map;
  }, [holidays]);

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => a.date.localeCompare(b.date)),
    [holidays],
  );

  function openActivity(iso: string) {
    setDate(iso);
    setF(blankActivity);
    setDialog("activity");
  }

  function openHoliday(iso: string) {
    const existing = holidayByDate.get(iso);
    setDate(iso);
    setHf(
      existing ? { title: existing.title, type: existing.type } : blankHoliday,
    );
    setDialog("holiday");
  }

  function saveActivity(e: FormEvent) {
    e.preventDefault();
    setLessons((v) => [
      ...v,
      { ...f, id: crypto.randomUUID(), date, notes: "", done: false },
    ]);
    setDialog(null);
  }

  function saveHoliday(e: FormEvent) {
    e.preventDefault();
    if (!hf.title.trim()) return;
    setHolidays((v) => {
      const existing = v.find((h) => h.date === date);
      return existing
        ? v.map((h) => (h.date === date ? { ...h, ...hf } : h))
        : [...v, { id: crypto.randomUUID(), date, ...hf }];
    });
    setDialog(null);
  }

  function removeHoliday(id: string) {
    setHolidays((v) => v.filter((h) => h.id !== id));
  }

  return (
    <Page
      tag="PLANEJAMENTO"
      title="Calendário"
      text="Aulas recorrentes, atividades pontuais, feriados e dias não letivos."
      action={
        <div className="page-actions">
          <button
            className="secondary"
            onClick={() => openHoliday(new Date().toISOString().slice(0, 10))}
          >
            <CalendarOff size={18} />
            Feriado / dia não letivo
          </button>
          <button
            className="primary"
            onClick={() => openActivity(new Date().toISOString().slice(0, 10))}
          >
            <Plus size={18} />
            Nova atividade pontual
          </button>
        </div>
      }
    >
      <section className="calendar card">
        <div className="cal-head">
          <button
            className="icon"
            onClick={() => setM(new Date(m.getFullYear(), m.getMonth() - 1))}
          >
            <ChevronLeft />
          </button>
          <h2>
            {m.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </h2>
          <button
            className="icon"
            onClick={() => setM(new Date(m.getFullYear(), m.getMonth() + 1))}
          >
            <ChevronRight />
          </button>
          <button className="secondary" onClick={() => setM(new Date())}>
            Hoje
          </button>
        </div>
        <div className="week">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((x) => (
            <b key={x}>{x}</b>
          ))}
        </div>
        <div className="days">
          {monthDays(m).map((d) => {
            const iso = d.toISOString().slice(0, 10);
            const holiday = holidayByDate.get(iso);
            const today = iso === new Date().toISOString().slice(0, 10);
            return (
              <button
                key={iso}
                className={[
                  d.getMonth() !== m.getMonth() ? "out" : "",
                  holiday ? `holiday ${holiday.type.toLowerCase()}` : "",
                  today ? "today" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => openActivity(iso)}
              >
                <time>{d.getDate()}</time>
                {holiday && (
                  <span
                    className="event holiday-tag"
                    onClick={(e) => {
                      e.stopPropagation();
                      openHoliday(iso);
                    }}
                  >
                    <CalendarOff size={12} />
                    {holiday.title}
                  </span>
                )}
                {!holiday &&
                  dayLessons(iso, fixed, lessons, holidays).map((x) => (
                    <span
                      key={x.id}
                      className={`event ${x.type.toLowerCase()}`}
                    >
                      <small>{x.start}</small>
                      {x.title}
                    </span>
                  ))}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card holiday-list">
        <div className="holiday-list-head">
          <h2>Feriados e dias não letivos</h2>
          <span className="muted">
            Nesses dias, as aulas recorrentes não são geradas automaticamente.
          </span>
        </div>
        {sortedHolidays.length ? (
          <ul>
            {sortedHolidays.map((h) => (
              <li key={h.id}>
                <span className={`pill holiday-pill ${h.type.toLowerCase()}`}>
                  {holidayLabels[h.type]}
                </span>
                <strong>
                  {new Date(h.date + "T12:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
                <span>{h.title}</span>
                <button
                  className="icon danger"
                  title="Remover"
                  onClick={() => removeHoliday(h.id)}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">Nenhum feriado cadastrado ainda.</div>
        )}
      </section>

      {dialog === "activity" && (
        <Modal title="Nova atividade pontual" onClose={() => setDialog(null)}>
          <form className="form" onSubmit={saveActivity}>
            <label>
              Data
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              Tipo
              <select
                value={f.type}
                onChange={(e) =>
                  setF({ ...f, type: e.target.value as typeof f.type })
                }
              >
                <option>PALESTRA</option>
                <option>VISITA_TECNICA</option>
                <option>OFICINA</option>
                <option>OUTRA</option>
              </select>
            </label>
            <label>
              Título
              <input
                value={f.title}
                onChange={(e) => setF({ ...f, title: e.target.value })}
              />
            </label>
            <label>
              Objetivo
              <textarea
                value={f.content}
                onChange={(e) => setF({ ...f, content: e.target.value })}
              />
            </label>
            <footer>
              <button
                type="button"
                className="link"
                onClick={() => openHoliday(date)}
              >
                Marcar este dia como feriado / não letivo
              </button>
              <div className="spacer" />
              <button
                type="button"
                className="secondary"
                onClick={() => setDialog(null)}
              >
                Cancelar
              </button>
              <button className="primary">Salvar</button>
            </footer>
          </form>
        </Modal>
      )}

      {dialog === "holiday" && (
        <Modal
          title={
            holidayByDate.has(date)
              ? "Editar feriado / dia não letivo"
              : "Marcar feriado / dia não letivo"
          }
          onClose={() => setDialog(null)}
        >
          <form className="form" onSubmit={saveHoliday}>
            <label>
              Data
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              Tipo
              <select
                value={hf.type}
                onChange={(e) =>
                  setHf({ ...hf, type: e.target.value as HolidayType })
                }
              >
                <option value="FERIADO">Feriado</option>
                <option value="RECESSO">Recesso</option>
                <option value="PONTO_FACULTATIVO">Ponto facultativo</option>
                <option value="OUTRO">Outro</option>
              </select>
            </label>
            <label>
              Título / motivo
              <input
                value={hf.title}
                placeholder="Ex.: Independência do Brasil"
                onChange={(e) => setHf({ ...hf, title: e.target.value })}
                required
              />
            </label>
            <footer>
              {holidayByDate.has(date) && (
                <>
                  <button
                    type="button"
                    className="link danger"
                    onClick={() => {
                      const existing = holidayByDate.get(date);
                      if (existing) removeHoliday(existing.id);
                      setDialog(null);
                    }}
                  >
                    Remover marcação
                  </button>
                  <div className="spacer" />
                </>
              )}
              <button
                type="button"
                className="secondary"
                onClick={() => setDialog(null)}
              >
                Cancelar
              </button>
              <button className="primary">Salvar</button>
            </footer>
          </form>
        </Modal>
      )}
    </Page>
  );
}
