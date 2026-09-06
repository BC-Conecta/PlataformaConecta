import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import { addOrReplace, holidayIncludesDate, removeById, upsertHoliday, validateCalendarActivity, validateNonInstructionalPeriod } from "../lib/domain";

const holidayLabels: Record<HolidayType, string> = {
  FERIADO: "Feriado",
  RECESSO: "Recesso",
  FERIAS: "Férias",
  PONTO_FACULTATIVO: "Ponto facultativo",
  REUNIAO_PLANEJAMENTO: "Reunião de planejamento",
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
const blankHoliday = { startDate: "", endDate: "", title: "", type: "FERIADO" as HolidayType };

export function CalendarPage() {
  const [savedDraft] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("bc.calendar.modal") || "null") as {
        dialog: "activity" | "holiday" | null;
        date: string;
        f: typeof blankActivity;
        hf: typeof blankHoliday;
      } | null;
    } catch {
      return null;
    }
  });
  const { fixed, lessons, setLessons, holidays, setHolidays, groups } = useApp(),
    [m, setM] = useState(new Date()),
    [dialog, setDialog] = useState<"activity" | "holiday" | null>(savedDraft?.dialog || null),
    [date, setDate] = useState(savedDraft?.date || ""),
    [f, setF] = useState(savedDraft?.f || blankActivity),
    [hf, setHf] = useState(savedDraft?.hf || blankHoliday),
    [formError, setFormError] = useState("");

  useEffect(() => {
    if (dialog) {
      sessionStorage.setItem("bc.calendar.modal", JSON.stringify({ dialog, date, f, hf }));
    } else {
      sessionStorage.removeItem("bc.calendar.modal");
    }
  }, [dialog, date, f, hf]);

  const holidayByDate = useMemo(() => {
    return holidays;
  }, [holidays]);

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [holidays],
  );
  const activeGroup = groups.find((group) => group.status === "ATIVA");

  function openActivity(iso: string) {
    setDate(iso);
    setF(blankActivity);
    setFormError("");
    setDialog("activity");
  }

  function openHoliday(iso: string) {
    const existing = holidayByDate.find((holiday) => holidayIncludesDate(holiday, iso));
    setDate(iso);
    setHf(
      existing ? { startDate: existing.startDate, endDate: existing.endDate, title: existing.title, type: existing.type } : { ...blankHoliday, startDate: iso, endDate: iso },
    );
    setFormError("");
    setDialog("holiday");
  }

  function saveActivity(e: FormEvent) {
    e.preventDefault();
    const validationError = validateCalendarActivity(date, f.title);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setLessons((v) => addOrReplace(v, { ...f, id: crypto.randomUUID(), date, notes: "", done: false }));
    setDialog(null);
  }

  function saveHoliday(e: FormEvent) {
    e.preventDefault();
    const validationError = validateNonInstructionalPeriod(hf.type, hf.startDate, hf.endDate, hf.title);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    const existing = holidayByDate.find((holiday) => holidayIncludesDate(holiday, date));
    setHolidays((v) => upsertHoliday(v, { id: existing?.id || crypto.randomUUID(), ...hf }));
    setDialog(null);
  }

  function removeHoliday(id: string) {
    setHolidays((v) => removeById(v, id));
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
            const holiday = holidayByDate.find((item) => holidayIncludesDate(item, iso));
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
                {dayLessons(iso, fixed, lessons, holidays, activeGroup).map((x) => (
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
                  {new Date(h.startDate + "T12:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                  {h.startDate !== h.endDate && ` a ${new Date(h.endDate + "T12:00").toLocaleDateString("pt-BR")}`}
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
            {formError && <div className="alert error">{formError}</div>}
            <label>
              Data
              <input
                type="date"
                value={date}
                required
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
                required
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
            holidayByDate.some((holiday) => holidayIncludesDate(holiday, date))
              ? "Editar feriado / dia não letivo"
              : "Marcar feriado / dia não letivo"
          }
          onClose={() => setDialog(null)}
        >
          <form className="form" onSubmit={saveHoliday}>
            {formError && <div className="alert error">{formError}</div>}
            <label>
              Tipo
              <select
                value={hf.type}
                onChange={(e) => {
                  const type = e.target.value as HolidayType;
                  setHf({
                    ...hf,
                    type,
                    ...(type !== "FERIAS" && type !== "RECESSO"
                      ? { endDate: hf.startDate }
                      : {}),
                  });
                }}
              >
                <option value="FERIADO">Feriado</option>
                <option value="FERIAS">Férias</option>
                <option value="RECESSO">Recesso</option>
                <option value="PONTO_FACULTATIVO">Ponto facultativo</option>
                <option value="REUNIAO_PLANEJAMENTO">Reunião de planejamento</option>
                <option value="OUTRO">Outro</option>
              </select>
            </label>
            {hf.type === "FERIAS" || hf.type === "RECESSO" ? (
              <div className="row">
                <label>
                  Início
                  <input
                    type="date"
                    value={hf.startDate}
                    required
                    onChange={(e) => setHf({ ...hf, startDate: e.target.value })}
                  />
                </label>
                <label>
                  Término
                  <input
                    type="date"
                    value={hf.endDate}
                    required
                    onChange={(e) => setHf({ ...hf, endDate: e.target.value })}
                  />
                </label>
              </div>
            ) : (
              <label>
                Data
                <input
                  type="date"
                  value={hf.startDate}
                  required
                  onChange={(e) => setHf({ ...hf, startDate: e.target.value, endDate: e.target.value })}
                />
              </label>
            )}
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
              {holidayByDate.some((holiday) => holidayIncludesDate(holiday, date)) && (
                <>
                  <button
                    type="button"
                    className="link danger"
                    onClick={() => {
                      const existing = holidayByDate.find((holiday) => holidayIncludesDate(holiday, date));
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
