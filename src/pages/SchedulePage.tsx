import { useState, type FormEvent } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Page } from "../components/Page";
import { Modal } from "../components/Modal";
import type { Fixed } from "../types";
import { addOrReplace, removeById, toggleFixedActive, validateRecurringActivity } from "../lib/domain";
import { useModalDraft } from "../lib/modalDraft";
const days = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
];
const blank = {
  weekday: 1,
  start: "13:30",
  end: "17:00",
  teacherId: "",
  title: "",
  active: true,
};
export function SchedulePage() {
  const { fixed, setFixed, people } = useApp(),
    teachers = people.filter(
      (p) =>
        ["PROFESSOR", "GESTOR", "ADMINISTRADOR"].includes(p.type) && p.active,
    ),
    [draft, setDraft, clearDraft] = useModalDraft("bc.schedule.modal", blank),
    [formError, setFormError] = useState("");
  const edit = draft.editId ? fixed.find((item) => item.id === draft.editId) : draft.open ? null : undefined;
  const f = draft.value;
  function save(e: FormEvent) {
    e.preventDefault();
    const validationError = validateRecurringActivity(f.title, f.start, f.end, f.teacherId);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFixed((v) => addOrReplace(v, { ...f, id: edit?.id || crypto.randomUUID() }));
    clearDraft();
  }
  return (
    <Page
      tag="PLANEJAMENTO RECORRENTE"
      title="Configuração das aulas"
      text="Defina dias, horários, atividades e professores uma única vez."
      action={
        <button
          className="primary"
          onClick={() => {
            setDraft({ open: true, editId: null, value: { ...blank, teacherId: teachers[0]?.id || "" } });
            setFormError("");
          }}
        >
          <Plus />
          Nova aula recorrente
        </button>
      }
    >
      <section className="card table">
        <table>
          <thead>
            <tr>
              <th>Dia</th>
              <th>Horário</th>
              <th>Atividade</th>
              <th>Responsável</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {fixed.map((x) => (
              <tr key={x.id}>
                <td data-label="Dia">{days[x.weekday]}</td>
                <td data-label="Horário">
                  {x.start} às {x.end}
                </td>
                <td data-label="Atividade">
                  <strong>{x.title}</strong>
                </td>
                <td data-label="Responsável">
                  {people.find((p) => p.id === x.teacherId)?.name}
                </td>
                <td data-label="Status">{x.active ? "Ativa" : "Inativa"}</td>
                <td className="actions" data-label="Ações">
                  <button
                    className="icon"
                    onClick={() => {
                      setDraft({ open: true, editId: x.id, value: x });
                      setFormError("");
                    }}
                  >
                    <Pencil />
                  </button>
                  <button
                    className="icon"
                    onClick={() =>
                      setFixed((v) => toggleFixedActive(v, x.id))
                    }
                  >
                    <Power />
                  </button>
                  <button
                    className="icon danger"
                    onClick={() =>
                      setFixed((v) => removeById(v, x.id))
                    }
                  >
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {draft.open && (
        <Modal
          title={edit ? "Editar aula recorrente" : "Nova aula recorrente"}
          onClose={clearDraft}
        >
          <form className="form" onSubmit={save}>
            {formError && <div className="alert error">{formError}</div>}
            <label>
              Dia
              <select
                value={f.weekday}
                onChange={(e) =>
                  setDraft((current) => ({ ...current, value: { ...current.value, weekday: Number(e.target.value) } }))
                }
              >
                {days.slice(1).map((d, i) => (
                  <option key={d} value={i + 1}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <div className="row">
              <label>
                Início
                <input
                  type="time"
                  value={f.start}
                  required
                  onChange={(e) => setDraft((current) => ({ ...current, value: { ...current.value, start: e.target.value } }))}
                />
              </label>
              <label>
                Término
                <input
                  type="time"
                  value={f.end}
                  required
                  onChange={(e) => setDraft((current) => ({ ...current, value: { ...current.value, end: e.target.value } }))}
                />
              </label>
            </div>
            <label>
              Atividade
              <input
                value={f.title}
                required
                onChange={(e) => setDraft((current) => ({ ...current, value: { ...current.value, title: e.target.value } }))}
              />
            </label>
            <label>
              Responsável pela aula
              <select
                value={f.teacherId}
                required
                onChange={(e) => setDraft((current) => ({ ...current, value: { ...current.value, teacherId: e.target.value } }))}
              >
                {teachers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <footer>
              <button
                type="button"
                className="secondary"
                onClick={clearDraft}
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
