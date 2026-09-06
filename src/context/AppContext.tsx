import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Attendance, Fixed, Group, Holiday, Lesson, Person } from "../types";
import { loadAppData, syncAttendance, syncFixed, syncGroups, syncHolidays, syncLessons, syncPeople } from "../lib/dataService";
import { useAuth } from "./AuthContext";
import { dayLessons } from "../lib/domain";
import { translateKnownAuthError } from "../lib/authErrors";

type Setter<T> = React.Dispatch<React.SetStateAction<T[]>>;
type C = {
  people: Person[]; setPeople: Setter<Person>;
  groups: Group[]; setGroups: Setter<Group>;
  fixed: Fixed[]; setFixed: Setter<Fixed>;
  lessons: Lesson[]; setLessons: Setter<Lesson>;
  attendance: Attendance[]; setAttendance: Setter<Attendance>;
  holidays: Holiday[]; setHolidays: Setter<Holiday>;
  loading: boolean; error: string;
};

const Context = createContext<C | null>(null);

function getErrorMessage(reason: unknown, fallback: string): string {
  if (reason instanceof Error) return translateKnownAuthError(reason.message) || fallback;
  if (typeof reason === "object" && reason && "message" in reason && typeof reason.message === "string") {
    return translateKnownAuthError(reason.message) || fallback;
  }
  return fallback;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [fixed, setFixed] = useState<Fixed[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const peopleReady = useRef(false);
  const groupsReady = useRef(false);
  const fixedReady = useRef(false);
  const lessonsReady = useRef(false);
  const attendanceReady = useRef(false);
  const holidaysReady = useRef(false);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    let active = true;
    peopleReady.current = false;
    groupsReady.current = false;
    fixedReady.current = false;
    lessonsReady.current = false;
    attendanceReady.current = false;
    holidaysReady.current = false;
    setLoading(true);
    setError("");
    loadAppData()
      .then((data) => {
        if (!active) return;
        setPeople(data.people);
        setGroups(data.groups);
        setFixed(data.fixed);
        setLessons(data.lessons);
        setAttendance(data.attendance);
        setHolidays(data.holidays);
      })
      .catch((reason: unknown) => {
        if (active) setError(getErrorMessage(reason, "Não foi possível carregar os dados."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user || loading || error) return;
    if (!peopleReady.current) {
      peopleReady.current = true;
      return;
    }
    void syncPeople(people).catch((reason: unknown) => setError(getErrorMessage(reason, "Não foi possível salvar as pessoas.")));
  }, [authLoading, user, loading, error, people]);

  useEffect(() => {
    if (authLoading || !user || loading || error) return;
    if (!groupsReady.current) {
      groupsReady.current = true;
      return;
    }
    void syncGroups(groups).catch((reason: unknown) => setError(getErrorMessage(reason, "Não foi possível salvar as turmas.")));
  }, [authLoading, user, loading, error, groups]);

  useEffect(() => {
    if (authLoading || !user || loading || error) return;
    if (!fixedReady.current) {
      fixedReady.current = true;
      return;
    }
    void syncFixed(fixed).catch((reason: unknown) => setError(getErrorMessage(reason, "Não foi possível salvar a agenda.")));
  }, [authLoading, user, loading, error, fixed]);

  useEffect(() => {
    if (authLoading || !user || loading || error) return;
    if (!lessonsReady.current) {
      lessonsReady.current = true;
      return;
    }
    void syncLessons(lessons).catch((reason: unknown) => setError(getErrorMessage(reason, "Não foi possível salvar as aulas.")));
  }, [authLoading, user, loading, error, lessons]);

  useEffect(() => {
    if (authLoading || !user || loading || error) return;
    if (!attendanceReady.current) {
      attendanceReady.current = true;
      return;
    }
    void syncAttendance(attendance).catch((reason: unknown) => setError(getErrorMessage(reason, "Não foi possível salvar a frequência.")));
  }, [authLoading, user, loading, error, attendance]);

  useEffect(() => {
    if (authLoading || !user || loading || error) return;
    if (!holidaysReady.current) {
      holidaysReady.current = true;
      return;
    }
    void syncHolidays(holidays).catch((reason: unknown) => setError(getErrorMessage(reason, "Não foi possível salvar o calendário.")));
  }, [authLoading, user, loading, error, holidays]);

  const value = useMemo(() => ({
    people, setPeople, groups, setGroups, fixed, setFixed, lessons, setLessons,
    attendance, setAttendance, holidays, setHolidays, loading, error,
  }), [people, groups, fixed, lessons, attendance, holidays, loading, error]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useApp = () => {
  const context = useContext(Context);
  if (!context) throw Error("AppProvider");
  return context;
};

export { dayLessons };
