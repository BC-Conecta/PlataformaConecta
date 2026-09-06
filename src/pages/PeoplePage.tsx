import { useState, type FormEvent } from "react";
import { ImagePlus, KeyRound, Pencil, Plus, Power } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Modal } from "../components/Modal";
import { Page } from "../components/Page";
import type { Person, Role } from "../types";
import { addOrReplace, formatPhone, togglePersonActive } from "../lib/domain";
import { createUserAccess, uploadPersonPhotos } from "../lib/dataService";
import { useModalDraft } from "../lib/modalDraft";
const blank: Omit<Person, "id"> = {
  name: "",
  type: "ALUNO" as Role,
  email: "",
  phone: "",
  active: true,
  profilePhotoUrl: "",
  portalPhotoUrl: "",
};
export function PeoplePage() {
  const { people, setPeople } = useApp(),
    [search, setSearch] = useState(""),
    [profileFilter, setProfileFilter] = useState<"TODOS" | Role>("TODOS"),
    [statusFilter, setStatusFilter] = useState<"TODOS" | "ATIVO" | "INATIVO">("TODOS"),
    [draft, setDraft, clearDraft] = useModalDraft("bc.people.modal", blank),
    [accessLoading, setAccessLoading] = useState<string | null>(null),
    [feedback, setFeedback] = useState(""),
    [photoFiles, setPhotoFiles] = useState<{ profile?: File; portal?: File }>({}),
    [saving, setSaving] = useState(false);
  const edit = draft.editId ? people.find((person) => person.id === draft.editId) : draft.open ? null : undefined;
  const f = draft.value;
  const filteredPeople = people.filter((person) => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const matchesSearch = !normalizedSearch || person.name.toLocaleLowerCase().includes(normalizedSearch);
    const matchesProfile = profileFilter === "TODOS" || person.type === profileFilter;
    const matchesStatus = statusFilter === "TODOS" || (statusFilter === "ATIVO" ? person.active : !person.active);
    return matchesSearch && matchesProfile && matchesStatus;
  });
  function open(p?: Person) {
    setDraft({ open: true, editId: p?.id || null, value: p || blank });
    setPhotoFiles({});
    setFeedback("");
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    const duplicated = people.some(
      (person) => person.id !== edit?.id && person.email.trim().toLowerCase() === f.email.trim().toLowerCase(),
    );
    if (f.email && duplicated) {
      setFeedback("Já existe uma pessoa cadastrada com este e-mail.");
      return;
    }
    setSaving(true);
    try {
      const id = edit?.id || crypto.randomUUID();
      const photoUrls = await uploadPersonPhotos(id, photoFiles);
      setPeople((v) => addOrReplace(v, { ...f, ...photoUrls, id }));
      clearDraft();
      setPhotoFiles({});
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível salvar as fotos.");
    } finally {
      setSaving(false);
    }
  }

  async function createAccess(person: Person) {
    setFeedback("");
    setAccessLoading(person.id);
    try {
      const result = await createUserAccess(person);
      setFeedback(result.invited ? `Convite enviado para ${person.email}.` : `Acesso vinculado a ${person.name}.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível criar o acesso.");
    } finally {
      setAccessLoading(null);
    }
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
        {feedback && <div className="alert error">{feedback}</div>}
        <div className="filters">
          <label>
            Pesquisar por nome
            <input
              type="search"
              value={search}
              placeholder="Digite um nome"
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            Perfil
            <select
              value={profileFilter}
              onChange={(e) => setProfileFilter(e.target.value as "TODOS" | Role)}
            >
              <option value="TODOS">Todos os perfis</option>
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="GESTOR">Gestor</option>
              <option value="PROFESSOR">Professor</option>
              <option value="ALUNO">Aluno</option>
              <option value="RESPONSAVEL">Responsável</option>
            </select>
          </label>
          <label>
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="TODOS">Todos os status</option>
              <option value="ATIVO">Ativos</option>
              <option value="INATIVO">Inativos</option>
            </select>
          </label>
        </div>
        <table className="people-table">
          <colgroup>
            <col className="people-name-column" />
            <col className="people-profile-column" />
            <col className="people-contact-column" />
            <col className="people-status-column" />
            <col className="people-actions-column" />
          </colgroup>
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
            {filteredPeople.map((p) => (
              <tr key={p.id}>
                <td data-label="Nome">
                  <strong>{p.name}</strong>
                  <small>{p.email}</small>
                </td>
                <td data-label="Perfil">
                  <span className="pill">{p.type}</span>
                </td>
                <td data-label="Contato">{formatPhone(p.phone)}</td>
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
                      setPeople((v) => togglePersonActive(v, p.id))
                    }
                    title="Ativar ou inativar"
                  >
                    <Power />
                  </button>
                  {(p.type === "GESTOR" || p.type === "PROFESSOR") && p.email && (
                    <button
                      className="icon"
                      onClick={() => void createAccess(p)}
                      title="Criar ou vincular acesso"
                      disabled={accessLoading === p.id}
                    >
                      <KeyRound />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredPeople.length && (
          <div className="empty">
            {people.length ? "Nenhuma pessoa corresponde aos filtros." : "Nenhuma pessoa cadastrada."}
          </div>
        )}
      </section>
      {draft.open && (
        <Modal
          title={edit ? "Editar pessoa" : "Nova pessoa"}
          onClose={clearDraft}
        >
          <form className="form" onSubmit={save}>
            {feedback && <div className="alert error">{feedback}</div>}
            <label>
              Nome
              <input
                value={f.name}
                onChange={(e) => setDraft((current) => ({ ...current, value: { ...current.value, name: e.target.value } }))}
                required
              />
            </label>
            <label>
              Perfil
              <select
                value={f.type}
                onChange={(e) => setDraft((current) => ({ ...current, value: { ...current.value, type: e.target.value as Role } }))}
              >
                <option value="ADMINISTRADOR">ADMINISTRADOR</option>
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
                required
                onChange={(e) => setDraft((current) => ({ ...current, value: { ...current.value, email: e.target.value } }))}
              />
            </label>
            <label>
              Telefone
              <input
                value={f.phone}
                onChange={(e) => setDraft((current) => ({ ...current, value: { ...current.value, phone: e.target.value } }))}
              />
            </label>
            <div className="photo-fields">
              <label className="photo-field">
                <span>Foto de perfil (opcional)</span>
                {photoFiles.profile ? (
                  <img src={URL.createObjectURL(photoFiles.profile)} alt="Pré-visualização do perfil" />
                ) : f.profilePhotoUrl ? (
                  <img src={f.profilePhotoUrl} alt="Foto de perfil atual" />
                ) : (
                  <span className="photo-placeholder"><ImagePlus /> Selecionar foto</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFiles((current) => ({ ...current, profile: e.target.files?.[0] }))}
                />
              </label>
              <label className="photo-field">
                <span>Foto do portal (opcional)</span>
                {photoFiles.portal ? (
                  <img src={URL.createObjectURL(photoFiles.portal)} alt="Pré-visualização do portal" />
                ) : f.portalPhotoUrl ? (
                  <img src={f.portalPhotoUrl} alt="Foto do portal atual" />
                ) : (
                  <span className="photo-placeholder"><ImagePlus /> Selecionar foto</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFiles((current) => ({ ...current, portal: e.target.files?.[0] }))}
                />
              </label>
            </div>
            <footer>
              <button
                type="button"
                className="secondary"
                onClick={clearDraft}
              >
                Cancelar
              </button>
              <button className="primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </footer>
          </form>
        </Modal>
      )}
    </Page>
  );
}
