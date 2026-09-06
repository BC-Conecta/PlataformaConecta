import { supabase } from "./supabase";
import type { Attendance, Fixed, Group, Holiday, Lesson, Person } from "../types";

export type AppData = {
  people: Person[];
  groups: Group[];
  fixed: Fixed[];
  lessons: Lesson[];
  attendance: Attendance[];
  holidays: Holiday[];
};

const time = (value: string | null) => value?.slice(0, 5) || "";

export async function createUserAccess(person: Person): Promise<{ invited: boolean }> {
  const { data, error } = await supabase.functions.invoke("create-user", {
    body: {
      personId: person.id,
      name: person.name,
      email: person.email,
      role: person.type,
    },
  });
  if (error) {
    const context = "context" in error ? error.context : undefined;
    if (context instanceof Response) {
      const body = await context.json().catch(() => null) as { error?: string } | null;
      if (body?.error) throw new Error(body.error);
    }
    throw new Error(error.message || "Não foi possível criar o acesso.");
  }
  return data as { invited: boolean };
}

export async function loadAppData(): Promise<AppData> {
  const [peopleResult, groupsResult, enrollmentsResult, fixedResult, lessonsResult, attendanceResult, holidaysResult] = await Promise.all([
    supabase.from("people").select("id,name,type,email,phone,active").order("name"),
    supabase.from("class_groups").select("id,name,start_date,end_date,status").order("start_date", { ascending: false }),
    supabase.from("enrollments").select("class_id,student_id"),
    supabase.from("recurring_activities").select("id,weekday,start_time,end_time,teacher_id,title,active").order("weekday").order("start_time"),
    supabase.from("lessons").select("id,lesson_date,recurring_activity_id,type,title,content,notes,teacher_id,start_time,end_time,done").order("lesson_date"),
    supabase.from("attendance").select("lesson_id,student_id,status"),
    supabase.from("holidays").select("id,holiday_date,title,type").order("holiday_date"),
  ]);
  const result = [peopleResult, groupsResult, enrollmentsResult, fixedResult, lessonsResult, attendanceResult, holidaysResult].find((query) => query.error);
  if (result?.error) throw result.error;
  const enrollments = enrollmentsResult.data || [];
  return {
    people: (peopleResult.data || []) as Person[],
    groups: (groupsResult.data || []).map((row) => ({
      id: row.id, name: row.name, start: row.start_date, end: row.end_date, status: row.status,
      students: enrollments.filter((item) => item.class_id === row.id).map((item) => item.student_id),
    })) as Group[],
    fixed: (fixedResult.data || []).map((row) => ({
      id: row.id, weekday: row.weekday, start: time(row.start_time), end: time(row.end_time),
      teacherId: row.teacher_id, title: row.title, active: row.active,
    })) as Fixed[],
    lessons: (lessonsResult.data || []).map((row) => ({
      id: row.id, date: row.lesson_date, fixedId: row.recurring_activity_id || undefined,
      type: row.type, title: row.title, content: row.content, notes: row.notes,
      teacherId: row.teacher_id || undefined, start: row.start_time ? time(row.start_time) : undefined,
      end: row.end_time ? time(row.end_time) : undefined, done: row.done,
    })) as Lesson[],
    attendance: (attendanceResult.data || []).map((row) => ({ lessonId: row.lesson_id, studentId: row.student_id, status: row.status })) as Attendance[],
    holidays: (holidaysResult.data || []).map((row) => ({ id: row.id, date: row.holiday_date, title: row.title, type: row.type })) as Holiday[],
  };
}

async function syncTable<T extends { id: string }>(table: string, values: T[], payload: (value: T) => Record<string, unknown>) {
  if (values.length) {
    const { error } = await supabase.from(table).upsert(values.map(payload));
    if (error) throw error;
  }
}

async function removeMissing(table: string, ids: string[]) {
  const { data, error } = await supabase.from(table).select("id");
  if (error) throw error;
  const missing = (data || []).map((row) => row.id).filter((id) => !ids.includes(id));
  if (missing.length) {
    const { error: deleteError } = await supabase.from(table).delete().in("id", missing);
    if (deleteError) throw deleteError;
  }
}

export async function syncPeople(values: Person[]) {
  await syncTable("people", values, (value) => ({ id: value.id, name: value.name, type: value.type, email: value.email, phone: value.phone, active: value.active }));
  await removeMissing("people", values.map((value) => value.id));
}

export async function syncGroups(values: Group[]) {
  await syncTable("class_groups", values, (value) => ({ id: value.id, name: value.name, start_date: value.start, end_date: value.end, status: value.status }));
  await removeMissing("class_groups", values.map((value) => value.id));
  const { error: enrollmentDeleteError } = await supabase.from("enrollments").delete().not("class_id", "is", null);
  if (enrollmentDeleteError) throw enrollmentDeleteError;
  const enrollments = values.flatMap((group) => group.students.map((studentId) => ({ class_id: group.id, student_id: studentId })));
  if (enrollments.length) {
    const { error } = await supabase.from("enrollments").insert(enrollments);
    if (error) throw error;
  }
}

export async function syncFixed(values: Fixed[]) {
  await syncTable("recurring_activities", values, (value) => ({ id: value.id, weekday: value.weekday, start_time: value.start, end_time: value.end, teacher_id: value.teacherId, title: value.title, active: value.active }));
  await removeMissing("recurring_activities", values.map((value) => value.id));
}

export async function syncLessons(values: Lesson[]) {
  await syncTable("lessons", values, (value) => ({ id: value.id, lesson_date: value.date, recurring_activity_id: value.fixedId || null, type: value.type, title: value.title, content: value.content, notes: value.notes, teacher_id: value.teacherId || null, start_time: value.start || null, end_time: value.end || null, done: value.done }));
  await removeMissing("lessons", values.map((value) => value.id));
}

export async function syncAttendance(values: Attendance[]) {
  const { error: deleteError } = await supabase.from("attendance").delete().not("lesson_id", "is", null);
  if (deleteError) throw deleteError;
  if (values.length) {
    const { error } = await supabase.from("attendance").insert(values.map((value) => ({ lesson_id: value.lessonId, student_id: value.studentId, status: value.status })));
    if (error) throw error;
  }
}

export async function syncHolidays(values: Holiday[]) {
  await syncTable("holidays", values, (value) => ({ id: value.id, holiday_date: value.date, title: value.title, type: value.type }));
  await removeMissing("holidays", values.map((value) => value.id));
}