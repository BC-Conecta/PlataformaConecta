import { useState, type FormEvent } from "react";
import { GraduationCap, Pencil, Plus, Users } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Modal } from "../components/Modal";
import { Page } from "../components/Page";
import type { Group } from "../types";
const blank: Omit<Group, "id"> = {
  name: "",
  start: "",
  end: "",
  status: "ATIVA",
  students: [],
};
export function GroupsPage() {
  const { groups, setGroups, people } = useApp(),
    [edit, setEdit] = useState<Group | null | undefined>(),
    [f, setF] = useState<Omit<Group, "id">>(blank);
  function save(e: FormEvent) {
    e.preventDefault();
    setGroups((v) =>
      edit
        ? v.map((x) => (x.id === edit.id ? { ...edit, ...f } : x))
        : [
            ...v.map((x) => ({ ...x, status: "CONCLUIDA" as const })),
            { ...f, id: crypto.randomUUID() },
          ],
    );
    setEdit(undefined);
  }
  return (
    <Page
      tag="HISTÓRICO"
      title="Turmas"
      text="Uma turma ativa por vez, com histórico e gestão de participantes."
      action={
        <button
          className="primary"
          onClick={() => {
            setEdit(null);
            setF(blank);
          }}
        >
          <Plus />
          Nova turma
        </button>
      }
    >
      <div className="group-grid">
        {groups.map((g) => (
          <article
            key={g.id}
            className={`group-card ${g.status.toLowerCase()}`}
          >
            <div className="cover">
              <GraduationCap />
              <span>{g.status}</span>
            </div>
            <div className="group-body">
              <h2>{g.name}</h2>
              <p>
                {new Date(g.start + "T12:00").toLocaleDateString("pt-BR")} a{" "}
                {new Date(g.end + "T12:00").toLocaleDateString("pt-BR")}
              </p>
              <strong>
                <Users /> {g.students.length} participantes
              </strong>
              <button
                className="secondary"
                onClick={() => {
                  setEdit(g);
                  setF(g);
                }}
              >
                <Pencil />
                Editar turma
              </button>
            </div>
          </article>
        ))}
      </div>
      {edit !== undefined && (
        <Modal
          title={edit ? "Editar turma" : "Nova turma"}
          onClose={() => setEdit(undefined)}
        >
          <form className="form" onSubmit={save}>
            <label>
              Nome
              <input
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
                required
              />
            </label>
            <div className="row">
              <label>
                Início
                <input
                  type="date"
                  value={f.start}
                  onChange={(e) => setF({ ...f, start: e.target.value })}
                />
              </label>
              <label>
                Término
                <input
                  type="date"
                  value={f.end}
                  onChange={(e) => setF({ ...f, end: e.target.value })}
                />
              </label>
            </div>
            <fieldset>
              <legend>Participantes</legend>
              {people
                .filter((p) => p.type === "ALUNO" && p.active)
                .map((p) => (
                  <label key={p.id} className="check">
                    <input
                      type="checkbox"
                      checked={f.students.includes(p.id)}
                      onChange={(e) =>
                        setF({
                          ...f,
                          students: e.target.checked
                            ? [...f.students, p.id]
                            : f.students.filter((x) => x !== p.id),
                        })
                      }
                    />
                    {p.name}
                  </label>
                ))}
            </fieldset>
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
