export type Role =
  "ADMINISTRADOR" | "GESTOR" | "PROFESSOR" | "ALUNO" | "RESPONSAVEL";
export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: Role;
};
export type Person = {
  id: string;
  name: string;
  type: Role;
  email: string;
  phone: string;
  active: boolean;
};
export type Group = {
  id: string;
  name: string;
  start: string;
  end: string;
  status: "ATIVA" | "CONCLUIDA";
  students: string[];
};
export type Fixed = {
  id: string;
  weekday: number;
  start: string;
  end: string;
  teacherId: string;
  title: string;
  active: boolean;
};
export type Lesson = {
  id: string;
  date: string;
  fixedId?: string;
  type: "AULA" | "PALESTRA" | "VISITA_TECNICA" | "OFICINA" | "OUTRA";
  title: string;
  content: string;
  notes: string;
  teacherId?: string;
  start?: string;
  end?: string;
  done: boolean;
};
export type Attendance = {
  lessonId: string;
  studentId: string;
  status: "PRESENTE" | "AUSENTE" | "JUSTIFICADA";
};
export type HolidayType = "FERIADO" | "RECESSO" | "PONTO_FACULTATIVO" | "OUTRO";
export type Holiday = {
  id: string;
  date: string;
  title: string;
  type: HolidayType;
};
