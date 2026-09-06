-- Migra dias nao letivos pontuais para o modelo de periodos.
alter type public.holiday_type add value if not exists 'FERIAS';
alter type public.holiday_type add value if not exists 'REUNIAO_PLANEJAMENTO';

alter table public.holidays
  add column if not exists start_date date,
  add column if not exists end_date date;

update public.holidays
set start_date = coalesce(start_date, holiday_date),
    end_date = coalesce(end_date, holiday_date)
where start_date is null or end_date is null;

alter table public.holidays
  alter column start_date set not null,
  alter column end_date set not null;

alter table public.holidays
  drop constraint if exists holidays_date_title_unique;

alter table public.holidays
  add constraint holidays_date_order check (end_date >= start_date),
  add constraint holidays_date_title_unique unique (start_date, title);

 drop index if exists public.holidays_date_idx;
create index if not exists holidays_start_date_idx
  on public.holidays (start_date);

alter table public.holidays
  drop column if exists holiday_date;
