import { useState, type FormEvent } from "react";
import { Pencil, Plus, Power } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Modal } from "../components/Modal";
import { Page } from "../components/Page";
import type { Person, Role } from "../types";
const blank = {
  name: "",
  type: "ALUNO" as Role,
  email: "",
  phone: "",
  active: true,
};
export function PeoplePage() {
  const { people, setPeople } = useApp(),
    [edit, setEdit] = useState<Person | null | undefined>(),
    [f, setF] = useState(blank);
  function open(p?: Person) {
    setEdit(p || null);
    setF(p || blank);
  }
  function save(e: FormEvent) {
    e.preventDefault();
    setPeople((v) =>
      edit
        ? v.map((x) => (x.id === edit.id ? { ...edit, ...f } : x))
        : [...v, { ...f, id: crypto.randomUUID() }],
    );
    setEdit(undefined);
  }
  return (
    <Page
      tag="CADASTROS"
      title="Pessoas"
      text="Cadastre, edite e gerencie alunos, professores, responsáveis e gestores."
      action={
        <button className="primary" onClick={() => open()}>
          <Plus />
          Nova pessoa
        </button>
      }
    >
      <section className="card table">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Perfil</th>
              <th>Contato</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id}>
                <td data-label="Nome">
                  <strong>{p.name}</strong>
                  <small>{p.email}</small>
                </td>
                <td data-label="Perfil">
                  <span className="pill">{p.type}</span>
                </td>
                <td data-label="Contato">{p.phone}</td>
                <td data-label="Status">{p.active ? "Ativo" : "Inativo"}</td>
                <td className="actions" data-label="Ações">
                  <button
                    className="icon"
                    onClick={() => open(p)}
                    title="Editar"
                  >
                    <Pencil />
                  </button>
                  <button
                    className="icon"
                    onClick={() =>
                      setPeople((v) =>
                        v.map((x) =>
                          x.id === p.id ? { ...x, active: !x.active } : x,
                        ),
                      )
                    }
                    title="Ativar ou inativar"
                  >
                    <Power />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {edit !== undefined && (
        <Modal
          title={edit ? "Editar pessoa" : "Nova pessoa"}
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
            <label>
              Perfil
              <select
                value={f.type}
                onChange={(e) => setF({ ...f, type: e.target.value as Role })}
              >
                <option value="ALUNO">ALUNO</option>
                <option value="PROFESSOR">PROFESSOR</option>
                <option value="RESPONSAVEL">RESPONSAVEL</option>
                <option value="GESTOR">GESTOR</option>
              </select>
            </label>
            <label>
              E-mail
              <input
                type="email"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
            </label>
            <label>
              Telefone
              <input
                value={f.phone}
                onChange={(e) => setF({ ...f, phone: e.target.value })}
              />
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
