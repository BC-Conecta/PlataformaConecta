import type { Attendance, Fixed, Group, Holiday, Lesson, Person } from "../types";

export function replaceById<T extends { id: string }>(items: T[], value: T): T[] {
  return items.map((item) => (item.id === value.id ? value : item));
}

export function addOrReplace<T extends { id: string }>(items: T[], value: T): T[] {
  return items.some((item) => item.id === value.id)
    ? replaceById(items, value)
    : [...items, value];
}

export function togglePersonActive(people: Person[], personId: string): Person[] {
  return people.map((person) =>
    person.id === personId ? { ...person, active: !person.active } : person,
  );
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function toggleFixedActive(fixed: Fixed[], fixedId: string): Fixed[] {
  return fixed.map((item) =>
    item.id === fixedId ? { ...item, active: !item.active } : item,
  );
}

export function saveGroup(groups: Group[], group: Group, isNew: boolean): Group[] {
  const nextGroups = isNew
    ? [...groups, group]
    : replaceById(groups, group);

  if (group.status !== "ATIVA") return nextGroups;
  return nextGroups.map((item) =>
    item.id === group.id ? item : { ...item, status: "CONCLUIDA" },
  );
}

export function validateGroupPeriod(start: string, end: string): string | null {
  if (!start || !end) return "Informe as datas de início e término da turma.";
  if (end < start) return "A data de término deve ser posterior à data de início.";
  return null;
}

export function validateRecurringActivity(
  title: string,
  start: string,
  end: string,
  teacherId: string,
): string | null {
  if (!title.trim()) return "Informe o nome da atividade.";
  if (!start || !end) return "Informe os horários de início e término.";
  if (end <= start) return "O término deve ser posterior ao início.";
  if (!teacherId) return "Selecione um professor.";
  return null;
}

export function validateCalendarActivity(date: string, title: string): string | null {
  if (!date) return "Informe a data da atividade.";
  if (!title.trim()) return "Informe o título da atividade.";
  return null;
}

export function validateHoliday(date: string, title: string): string | null {
  if (!date) return "Informe a data do feriado ou dia não letivo.";
  if (!title.trim()) return "Informe o motivo do feriado ou dia não letivo.";
  return null;
}

export function validateNonInstructionalPeriod(
  type: string,
  startDate: string,
  endDate: string,
  title: string,
): string | null {
  if (!startDate) return "Informe a data de início.";
  if (!endDate) return "Informe a data de término.";
  if (endDate < startDate) return "A data de término deve ser posterior à data de início.";
  if (!title.trim()) return "Informe o motivo do dia não letivo.";
  if ((type === "FERIAS" || type === "RECESSO") && startDate === endDate) {
    return "Informe um período com mais de um dia para férias ou recesso.";
  }
  if (type !== "FERIAS" && type !== "RECESSO" && startDate !== endDate) {
    return "Este tipo de dia não letivo deve usar uma única data.";
  }
  return null;
}

export function holidayIncludesDate(holiday: Holiday, date: string): boolean {
  return date >= holiday.startDate && date <= holiday.endDate;
}

export function materializeLesson(
  lesson: Lesson,
  patch: Partial<Lesson> = {},
): Lesson {
  return {
    ...lesson,
    ...patch,
    id: lesson.id.startsWith("virtual:") ? crypto.randomUUID() : lesson.id,
  };
}

export function saveLesson(lessons: Lesson[], lesson: Lesson): Lesson[] {
  return addOrReplace(lessons, lesson);
}

export function saveAttendance(
  attendance: Attendance[],
  value: Attendance,
): Attendance[] {
  return [
    ...attendance.filter(
      (item) =>
        item.lessonId !== value.lessonId || item.studentId !== value.studentId,
    ),
    value,
  ];
}

export function upsertHoliday(holidays: Holiday[], holiday: Holiday): Holiday[] {
  const existing = holidays.find((item) => item.id === holiday.id);
  return existing ? replaceById(holidays, { ...existing, ...holiday }) : [...holidays, holiday];
}

export function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}

export function dayLessons(
  date: string,
  fixed: Fixed[],
  saved: Lesson[],
  holidays: Holiday[] = [],
  recurringPeriod?: { start: string; end: string },
): Lesson[] {
  const day = new Date(date + "T12:00").getDay();
  const isNonInstructional = holidays.some((holiday) => holidayIncludesDate(holiday, date));
  const isWithinRecurringPeriod =
    !recurringPeriod ||
    (date >= recurringPeriod.start && date <= recurringPeriod.end);
  return [
    ...fixed
      .filter(
        (item) =>
          item.active &&
          item.weekday === day &&
          !isNonInstructional &&
          isWithinRecurringPeriod,
      )
      .map(
        (item) =>
          saved.find((lesson) => lesson.date === date && lesson.fixedId === item.id) || {
            id: `virtual:${date}:${item.id}`,
            date,
            fixedId: item.id,
            type: "AULA" as const,
            title: item.title,
            content: "",
            notes: "",
            teacherId: item.teacherId,
            start: item.start,
            end: item.end,
            done: false,
          },
      ),
    ...saved.filter((item) => item.date === date && !item.fixedId),
  ];
}
