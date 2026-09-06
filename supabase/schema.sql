-- Barracred Conecta
-- Schema completo para PostgreSQL / Supabase
-- Alinhado aos tipos e às funcionalidades presentes na aplicação React.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Tipos de domínio
-- -----------------------------------------------------------------------------

create type public.app_role as enum (
  'ADMINISTRADOR',
  'GESTOR',
  'PROFESSOR',
  'ALUNO',
  'RESPONSAVEL'
);

create type public.group_status as enum (
  'ATIVA',
  'CONCLUIDA'
);

create type public.lesson_type as enum (
  'AULA',
  'PALESTRA',
  'VISITA_TECNICA',
  'OFICINA',
  'OUTRA'
);

create type public.attendance_status as enum (
  'PRESENTE',
  'AUSENTE',
  'JUSTIFICADA'
);

create type public.holiday_type as enum (
  'FERIADO',
  'RECESSO',
  'PONTO_FACULTATIVO',
  'OUTRO'
);

-- -----------------------------------------------------------------------------
-- Funções utilitárias
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Pessoas e autenticação
-- -----------------------------------------------------------------------------

create table public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  type public.app_role not null,
  email text not null check (btrim(email) <> ''),
  phone text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index people_email_unique
  on public.people (lower(email));

create index people_type_active_idx
  on public.people (type, active);

create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  person_id uuid unique references public.people (id) on delete set null,
  name text not null check (btrim(name) <> ''),
  email text not null check (btrim(email) <> ''),
  role public.app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index user_profiles_email_unique
  on public.user_profiles (lower(email));

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.user_profiles
  where id = auth.uid()
    and active = true;
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_user_role() in ('ADMINISTRADOR', 'GESTOR', 'PROFESSOR'),
    false
  );
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_user_role() in ('ADMINISTRADOR', 'GESTOR'),
    false
  );
$$;

-- Cria o perfil mínimo após o cadastro no Supabase Auth.
-- Metadados aceitos: name e role. O papel padrão é ALUNO.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.app_role;
begin
  begin
    requested_role := coalesce(
      nullif(new.raw_user_meta_data ->> 'role', '')::public.app_role,
      'ALUNO'::public.app_role
    );
  exception
    when invalid_text_representation then
      requested_role := 'ALUNO'::public.app_role;
  end;

  insert into public.user_profiles (id, name, email, role)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuário'
    ),
    coalesce(new.email, new.id::text || '@sem-email.local'),
    requested_role
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- Turmas e matrículas
-- -----------------------------------------------------------------------------

create table public.class_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  start_date date not null,
  end_date date not null,
  status public.group_status not null default 'ATIVA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_groups_date_order check (end_date >= start_date)
);

-- A interface atual trabalha com uma única turma ativa.
create unique index class_groups_one_active_idx
  on public.class_groups ((status))
  where status = 'ATIVA';

create table public.enrollments (
  class_id uuid not null references public.class_groups (id) on delete cascade,
  student_id uuid not null references public.people (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

create index enrollments_student_idx
  on public.enrollments (student_id);

create or replace function public.validate_student_enrollment()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.people
    where id = new.student_id
      and type = 'ALUNO'
  ) then
    raise exception 'A matrícula deve referenciar uma pessoa do tipo ALUNO.';
  end if;

  return new;
end;
$$;

create trigger validate_student_enrollment_trigger
before insert or update on public.enrollments
for each row execute function public.validate_student_enrollment();

-- -----------------------------------------------------------------------------
-- Configuração semanal, aulas e atividades pontuais
-- -----------------------------------------------------------------------------

create table public.recurring_activities (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  teacher_id uuid not null references public.people (id) on delete restrict,
  title text not null check (btrim(title) <> ''),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_activities_time_order check (end_time > start_time)
);

create index recurring_activities_weekday_active_idx
  on public.recurring_activities (weekday, active);

create index recurring_activities_teacher_idx
  on public.recurring_activities (teacher_id);

create or replace function public.validate_teacher()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.teacher_id is not null and not exists (
    select 1
    from public.people
    where id = new.teacher_id
      and type in ('PROFESSOR', 'GESTOR', 'ADMINISTRADOR')
  ) then
    raise exception 'O responsável pela aula deve ser professor, gestor ou administrador.';
  end if;

  return new;
end;
$$;

create trigger validate_recurring_activity_teacher_trigger
before insert or update of teacher_id on public.recurring_activities
for each row execute function public.validate_teacher();

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  lesson_date date not null,
  recurring_activity_id uuid references public.recurring_activities (id) on delete set null,
  type public.lesson_type not null default 'AULA',
  title text not null check (btrim(title) <> ''),
  content text not null default '',
  notes text not null default '',
  teacher_id uuid references public.people (id) on delete restrict,
  start_time time,
  end_time time,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lessons_time_pair check (
    (start_time is null and end_time is null)
    or
    (start_time is not null and end_time is not null and end_time > start_time)
  )
);

create index lessons_date_idx
  on public.lessons (lesson_date);

create index lessons_teacher_date_idx
  on public.lessons (teacher_id, lesson_date);

create index lessons_recurring_activity_idx
  on public.lessons (recurring_activity_id);

create trigger validate_lesson_teacher_trigger
before insert or update of teacher_id on public.lessons
for each row execute function public.validate_teacher();

-- -----------------------------------------------------------------------------
-- Frequência
-- -----------------------------------------------------------------------------

create table public.attendance (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  student_id uuid not null references public.people (id) on delete cascade,
  status public.attendance_status not null,
  recorded_by uuid references auth.users (id) on delete set null default auth.uid(),
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (lesson_id, student_id)
);

create index attendance_student_idx
  on public.attendance (student_id);

create index attendance_status_idx
  on public.attendance (status);

create or replace function public.validate_attendance_student()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.people
    where id = new.student_id
      and type = 'ALUNO'
  ) then
    raise exception 'A frequência deve referenciar uma pessoa do tipo ALUNO.';
  end if;

  return new;
end;
$$;

create trigger validate_attendance_student_trigger
before insert or update of student_id on public.attendance
for each row execute function public.validate_attendance_student();

-- -----------------------------------------------------------------------------
-- Feriados, recessos e pontos facultativos
-- -----------------------------------------------------------------------------

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null,
  title text not null check (btrim(title) <> ''),
  type public.holiday_type not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint holidays_date_title_unique unique (holiday_date, title)
);

create index holidays_date_idx
  on public.holidays (holiday_date);

-- -----------------------------------------------------------------------------
-- Atualização automática de updated_at
-- -----------------------------------------------------------------------------

create trigger people_set_updated_at
before update on public.people
for each row execute function public.set_updated_at();

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create trigger class_groups_set_updated_at
before update on public.class_groups
for each row execute function public.set_updated_at();

create trigger recurring_activities_set_updated_at
before update on public.recurring_activities
for each row execute function public.set_updated_at();

create trigger lessons_set_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

create trigger attendance_set_updated_at
before update on public.attendance
for each row execute function public.set_updated_at();

create trigger holidays_set_updated_at
before update on public.holidays
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.people enable row level security;
alter table public.user_profiles enable row level security;
alter table public.class_groups enable row level security;
alter table public.enrollments enable row level security;
alter table public.recurring_activities enable row level security;
alter table public.lessons enable row level security;
alter table public.attendance enable row level security;
alter table public.holidays enable row level security;

-- Perfis
create policy user_profiles_select_own_or_manager
on public.user_profiles
for select
to authenticated
using (id = auth.uid() or public.is_manager());

create policy user_profiles_update_own_or_admin
on public.user_profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.current_user_role() = 'ADMINISTRADOR'
)
with check (
  id = auth.uid()
  or public.current_user_role() = 'ADMINISTRADOR'
);

-- Pessoas
create policy people_select_authenticated
on public.people
for select
to authenticated
using (true);

create policy people_insert_manager
on public.people
for insert
to authenticated
with check (public.is_manager());

create policy people_update_manager
on public.people
for update
to authenticated
using (public.is_manager())
with check (public.is_manager());

create policy people_delete_admin
on public.people
for delete
to authenticated
using (public.current_user_role() = 'ADMINISTRADOR');

-- Turmas e matrículas
create policy class_groups_select_authenticated
on public.class_groups
for select
to authenticated
using (true);

create policy class_groups_manage_manager
on public.class_groups
for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

create policy enrollments_select_authenticated
on public.enrollments
for select
to authenticated
using (true);

create policy enrollments_manage_manager
on public.enrollments
for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

-- Agenda recorrente
create policy recurring_activities_select_authenticated
on public.recurring_activities
for select
to authenticated
using (true);

create policy recurring_activities_manage_manager
on public.recurring_activities
for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

-- Aulas, diário e frequência
create policy lessons_select_authenticated
on public.lessons
for select
to authenticated
using (true);

create policy lessons_manage_staff
on public.lessons
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy attendance_select_authenticated
on public.attendance
for select
to authenticated
using (true);

create policy attendance_manage_staff
on public.attendance
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- Calendário institucional
create policy holidays_select_authenticated
on public.holidays
for select
to authenticated
using (true);

create policy holidays_manage_manager
on public.holidays
for all
to authenticated
using (public.is_manager())
with check (public.is_manager());

-- -----------------------------------------------------------------------------
-- Permissões explícitas para a API do Supabase
-- -----------------------------------------------------------------------------

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.people to authenticated;
grant select, update on public.user_profiles to authenticated;
grant select, insert, update, delete on public.class_groups to authenticated;
grant select, insert, update, delete on public.enrollments to authenticated;
grant select, insert, update, delete on public.recurring_activities to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update, delete on public.attendance to authenticated;
grant select, insert, update, delete on public.holidays to authenticated;
