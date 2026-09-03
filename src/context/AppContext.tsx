import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Attendance,
  Fixed,
  Group,
  Holiday,
  Lesson,
  Person,
} from "../types";
const students = [
  "Mariana Oliveira",
  "Lucas Fernandes",
  "Gabriel Santos",
  "Isabela Costa",
  "Rafael Martins",
  "Sofia Rodrigues",
];
const seedPeople: Person[] = [
  {
    id: "p1",
    name: "Ana Beatriz Lima",
    type: "PROFESSOR",
    email: "ana@conecta.org.br",
    phone: "(14) 99911-2200",
    active: true,
  },
  {
    id: "p2",
    name: "Bruno Martins",
    type: "PROFESSOR",
    email: "bruno@conecta.org.br",
    phone: "(14) 99922-3300",
    active: true,
  },
  {
    id: "g1",
    name: "Carlos Henrique Souza",
    type: "GESTOR",
    email: "carlos@conecta.org.br",
    phone: "(14) 99922-3311",
    active: true,
  },
  ...students.map((name, i) => ({
    id: `a${i + 1}`,
    name,
    type: "ALUNO" as const,
    email: `aluno${i + 1}@email.com`,
    phone: `(14) 9980${i + 1}-100${i + 1}`,
    active: true,
  })),
];
const seedGroups: Group[] = [
  {
    id: "t26",
    name: "Conecta 2026",
    start: "2026-02-02",
    end: "2026-11-30",
    status: "ATIVA",
    students: students.map((_, i) => `a${i + 1}`),
  },
  {
    id: "t25",
    name: "Conecta 2025",
    start: "2025-02-03",
    end: "2025-11-28",
    status: "CONCLUIDA",
    students: [],
  },
];
const seedFixed: Fixed[] = [
  {
    id: "f1",
    weekday: 1,
    start: "13:30",
    end: "15:10",
    teacherId: "p1",
    title: "Comunicação e Projeto de Vida",
    active: true,
  },
  {
    id: "f2",
    weekday: 1,
    start: "15:20",
    end: "17:00",
    teacherId: "p2",
    title: "Tecnologia e Mundo do Trabalho",
    active: true,
  },
  {
    id: "f3",
    weekday: 3,
    start: "13:30",
    end: "17:00",
    teacherId: "p1",
    title: "Desenvolvimento de Projetos",
    active: true,
  },
  {
    id: "f4",
    weekday: 5,
    start: "13:30",
    end: "17:00",
    teacherId: "p2",
    title: "Formação Profissional",
    active: true,
  },
];
const seedHolidays: Holiday[] = [
  {
    id: "h1",
    date: "2026-09-07",
    title: "Independência do Brasil",
    type: "FERIADO",
  },
  {
    id: "h2",
    date: "2026-10-12",
    title: "Nossa Senhora Aparecida",
    type: "FERIADO",
  },
  { id: "h3", date: "2026-07-13", title: "Recesso de julho", type: "RECESSO" },
];
const load = <T,>(k: string, f: T): T => {
  try {
    return JSON.parse(localStorage.getItem(k) || "null") || f;
  } catch {
    return f;
  }
};
type C = {
  people: Person[];
  setPeople: React.Dispatch<React.SetStateAction<Person[]>>;
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  fixed: Fixed[];
  setFixed: React.Dispatch<React.SetStateAction<Fixed[]>>;
  lessons: Lesson[];
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  attendance: Attendance[];
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
};
const Context = createContext<C | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState(() => load("bc.people", seedPeople)),
    [groups, setGroups] = useState(() => load("bc.groups", seedGroups)),
    [fixed, setFixed] = useState(() => load("bc.fixed", seedFixed)),
    [lessons, setLessons] = useState<Lesson[]>(() => load("bc.lessons", [])),
    [attendance, setAttendance] = useState<Attendance[]>(() =>
      load("bc.attendance", []),
    ),
    [holidays, setHolidays] = useState<Holiday[]>(() =>
      load("bc.holidays", seedHolidays),
    );
  useEffect(() => {
    localStorage.setItem("bc.people", JSON.stringify(people));
    localStorage.setItem("bc.groups", JSON.stringify(groups));
    localStorage.setItem("bc.fixed", JSON.stringify(fixed));
    localStorage.setItem("bc.lessons", JSON.stringify(lessons));
    localStorage.setItem("bc.attendance", JSON.stringify(attendance));
    localStorage.setItem("bc.holidays", JSON.stringify(holidays));
  }, [people, groups, fixed, lessons, attendance, holidays]);
  const value = useMemo(
    () => ({
      people,
      setPeople,
      groups,
      setGroups,
      fixed,
      setFixed,
      lessons,
      setLessons,
      attendance,
      setAttendance,
      holidays,
      setHolidays,
    }),
    [people, groups, fixed, lessons, attendance, holidays],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useApp = () => {
  const c = useContext(Context);
  if (!c) throw Error("AppProvider");
  return c;
};
export function dayLessons(
  date: string,
  fixed: Fixed[],
  saved: Lesson[],
  holidays: Holiday[] = [],
) {
  const day = new Date(date + "T12:00").getDay();
  const isNonInstructional = holidays.some((h) => h.date === date);
  return [
    ...fixed
      .filter((x) => x.active && x.weekday === day && !isNonInstructional)
      .map(
        (x) =>
          saved.find((l) => l.date === date && l.fixedId === x.id) || {
            id: `virtual:${date}:${x.id}`,
            date,
            fixedId: x.id,
            type: "AULA" as const,
            title: x.title,
            content: "",
            notes: "",
            teacherId: x.teacherId,
            start: x.start,
            end: x.end,
            done: false,
          },
      ),
    ...saved.filter((x) => x.date === date && !x.fixedId),
  ];
}
