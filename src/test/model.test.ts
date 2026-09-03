import { describe, expect, it } from "vitest";
import { dayLessons } from "../context/AppContext";
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
});
