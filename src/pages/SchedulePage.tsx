import { useState, type FormEvent } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Page } from "../components/Page";
import { Modal } from "../components/Modal";
import type { Fixed } from "../types";
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
    teachers = people.filter((p) => p.type === "PROFESSOR" && p.active),
    [edit, setEdit] = useState<Fixed | null | undefined>(),
    [f, setF] = useState(blank);
  function save(e: FormEvent) {
    e.preventDefault();
    setFixed((v) =>
      edit
        ? v.map((x) => (x.id === edit.id ? { ...edit, ...f } : x))
        : [...v, { ...f, id: crypto.randomUUID() }],
    );
    setEdit(undefined);
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
            setEdit(null);
            setF({ ...blank, teacherId: teachers[0]?.id || "" });
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
              <th>Professor</th>
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
                <td data-label="Professor">
                  {people.find((p) => p.id === x.teacherId)?.name}
                </td>
                <td data-label="Status">{x.active ? "Ativa" : "Inativa"}</td>
                <td className="actions" data-label="Ações">
                  <button
                    className="icon"
                    onClick={() => {
                      setEdit(x);
                      setF(x);
                    }}
                  >
                    <Pencil />
                  </button>
                  <button
                    className="icon"
                    onClick={() =>
                      setFixed((v) =>
                        v.map((a) =>
                          a.id === x.id ? { ...a, active: !a.active } : a,
                        ),
                      )
                    }
                  >
                    <Power />
                  </button>
                  <button
                    className="icon danger"
                    onClick={() =>
                      setFixed((v) => v.filter((a) => a.id !== x.id))
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
      {edit !== undefined && (
        <Modal
          title={edit ? "Editar aula recorrente" : "Nova aula recorrente"}
          onClose={() => setEdit(undefined)}
        >
          <form className="form" onSubmit={save}>
            <label>
              Dia
              <select
                value={f.weekday}
                onChange={(e) =>
                  setF({ ...f, weekday: Number(e.target.value) })
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
                  onChange={(e) => setF({ ...f, start: e.target.value })}
                />
              </label>
              <label>
                Término
                <input
                  type="time"
                  value={f.end}
                  onChange={(e) => setF({ ...f, end: e.target.value })}
                />
              </label>
            </div>
            <label>
              Atividade
              <input
                value={f.title}
                onChange={(e) => setF({ ...f, title: e.target.value })}
              />
            </label>
            <label>
              Professor
              <select
                value={f.teacherId}
                onChange={(e) => setF({ ...f, teacherId: e.target.value })}
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
                onClick={() => setEdit(undefined)}
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
