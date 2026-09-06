import { describe, expect, it } from "vitest";
import { dayLessons } from "../context/AppContext";
import {
  materializeLesson,
  saveAttendance,
  saveGroup,
  validateCalendarActivity,
  validateGroupPeriod,
  validateHoliday,
  validateNonInstructionalPeriod,
  validateRecurringActivity,
} from "../lib/domain";
import type { Group, Lesson } from "../types";
describe("modelo", () => {
  it("jsdom oferece localStorage", () => {
    localStorage.setItem("x", "ok");
    expect(localStorage.getItem("x")).toBe("ok");
  });
  it("gera aula recorrente", () =>
    expect(
      dayLessons(
        "2026-09-07",
        [
          {
            id: "f",
            weekday: 1,
            start: "13:00",
            end: "14:00",
            teacherId: "p",
            title: "Aula",
            active: true,
          },
        ],
        [],
      ),
    ).toHaveLength(1));

  it("mantém apenas uma turma ativa", () => {
    const groups: Group[] = [
      { id: "old", name: "Antiga", start: "2026-01-01", end: "2026-06-30", status: "ATIVA", students: [] },
    ];
    const result = saveGroup(
      groups,
      { id: "new", name: "Nova", start: "2026-07-01", end: "2026-12-31", status: "ATIVA", students: [] },
      true,
    );
    expect(result.find((group) => group.id === "old")?.status).toBe("CONCLUIDA");
    expect(result.find((group) => group.id === "new")?.status).toBe("ATIVA");
  });

  it("materializa aula virtual e substitui presença do aluno", () => {
    const virtual: Lesson = {
      id: "virtual:2026-09-07:f",
      date: "2026-09-07",
      fixedId: "f",
      type: "AULA",
      title: "Aula",
      content: "",
      notes: "",
      done: false,
    };
    const lesson = materializeLesson(virtual, { done: true });
    expect(lesson.id).not.toBe(virtual.id);
    expect(saveAttendance(
      [{ lessonId: lesson.id, studentId: "student", status: "PRESENTE" }],
      { lessonId: lesson.id, studentId: "student", status: "AUSENTE" },
    )).toEqual([{ lessonId: lesson.id, studentId: "student", status: "AUSENTE" }]);
  });

  it("valida o período da turma antes de salvar", () => {
    expect(validateGroupPeriod("", "")).toBeTruthy();
    expect(validateGroupPeriod("2026-09-10", "2026-09-01")).toBeTruthy();
    expect(validateGroupPeriod("2026-09-01", "2026-09-10")).toBeNull();
  });

  it("valida os campos obrigatórios dos demais cadastros", () => {
    expect(validateRecurringActivity("", "13:00", "14:00", "teacher")).toBeTruthy();
    expect(validateRecurringActivity("Aula", "14:00", "13:00", "teacher")).toBeTruthy();
    expect(validateRecurringActivity("Aula", "13:00", "14:00", "teacher")).toBeNull();
    expect(validateCalendarActivity("2026-09-07", "")).toBeTruthy();
    expect(validateCalendarActivity("2026-09-07", "Palestra")).toBeNull();
    expect(validateHoliday("", "Feriado")).toBeTruthy();
    expect(validateHoliday("2026-09-07", "Feriado")).toBeNull();
    expect(validateNonInstructionalPeriod("FERIAS", "2026-07-01", "2026-07-15", "Férias")).toBeNull();
    expect(validateNonInstructionalPeriod("FERIADO", "2026-09-07", "2026-09-08", "Feriado")).toBeTruthy();
  });

  it("limita recorrências ao período e mantém atividades pontuais", () => {
    const items = dayLessons(
      "2027-01-04",
      [{ id: "fixed", weekday: 1, start: "13:00", end: "14:00", teacherId: "teacher", title: "Aula recorrente", active: true }],
      [{ id: "activity", date: "2027-01-04", type: "PALESTRA", title: "Atividade pontual", content: "", notes: "", done: false }],
      [],
      { start: "2026-01-01", end: "2026-12-31" },
    );
    expect(items.map((item) => item.id)).toEqual(["activity"]);
  });
});
