import { useState, type FormEvent } from "react";
import { GraduationCap, Pencil, Plus, Users } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Modal } from "../components/Modal";
import { Page } from "../components/Page";
import type { Group } from "../types";
import { saveGroup, validateGroupPeriod } from "../lib/domain";
import { useModalDraft } from "../lib/modalDraft";
const blank: Omit<Group, "id"> = {
  name: "",
  start: "",
  end: "",
  status: "ATIVA",
  students: [],
};
export function GroupsPage() {
  const { groups, setGroups, people } = useApp(),
    [draft, setDraft, clearDraft] = useModalDraft("bc.groups.modal", blank),
    [formError, setFormError] = useState("");
  const edit = draft.editId ? groups.find((group) => group.id === draft.editId) : draft.open ? null : undefined;
  const f = draft.value;
  function save(e: FormEvent) {
    e.preventDefault();
    const periodError = validateGroupPeriod(f.start, f.end);
    if (periodError) {
      setFormError(periodError);
      return;
    }
    setGroups((v) => saveGroup(v, { ...f, id: edit?.id || crypto.randomUUID() }, !edit));
    clearDraft();
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
            setDraft({ open: true, editId: null, value: blank });
            setFormError("");
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
              <div className="cover-title">
                <GraduationCap />
                <h2>{g.name}</h2>
              </div>
              <span>{g.status}</span>
            </div>
            <div className="group-body">
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
                  setDraft({ open: true, editId: g.id, value: g });
                  setFormError("");
                }}
              >
                <Pencil />
                Editar turma
              </button>
            </div>
          </article>
        ))}
      </div>
      {draft.open && (
        <Modal
          title={edit ? "Editar turma" : "Nova turma"}
          onClose={clearDraft}
        >
          <form className="form" onSubmit={save}>
            <label>
              Nome
              <input
                value={f.name}
                onChange={(e) => setDraft((current) => ({ ...current, value: { ...current.value, name: e.target.value } }))}
                required
              />
            </label>
            {formError && <div className="alert error">{formError}</div>}
            <div className="row">
              <label>
                Início
                <input
                  type="date"
                  value={f.start}
                  required
                  onChange={(e) => setDraft((current) => ({ ...current, value: { ...current.value, start: e.target.value } }))}
                />
              </label>
              <label>
                Término
                <input
                  type="date"
                  value={f.end}
                  required
                  onChange={(e) => setDraft((current) => ({ ...current, value: { ...current.value, end: e.target.value } }))}
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
                        setDraft((current) => ({ ...current, value: {
                          ...current.value,
                          students: e.target.checked
                            ? [...f.students, p.id]
                            : f.students.filter((x) => x !== p.id),
                        }}))
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
