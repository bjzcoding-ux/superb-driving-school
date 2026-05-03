-- ============================================================
-- Superb Driving School — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Auto-incrementing SDS ID (SDS-001, SDS-002, ...)
create sequence if not exists students_sds_seq start 1;

-- ────────────────────────────────────────────────────────────
-- STUDENTS
-- ────────────────────────────────────────────────────────────
create table if not exists students (
  id            uuid default gen_random_uuid() primary key,
  sds_id        text unique not null
                  default ('SDS-' || lpad(nextval('students_sds_seq')::text, 3, '0')),
  first_name    text not null,
  last_name     text not null,
  phone         text not null,
  email         text,
  suburb        text,
  licence_stage text default 'L',    -- L | P1 | P2 | Senior | Refresher
  transmission  text default 'auto', -- auto | manual | both
  notes         text,
  active        boolean default true,
  created_at    timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- PACKAGES (lesson options)
-- ────────────────────────────────────────────────────────────
create table if not exists packages (
  id            serial primary key,
  name          text not null,
  lessons_count int  not null,   -- 1 = single lesson; 6/11/25 = bundle
  duration_min  int  not null,   -- 60 | 90 | 120
  price         numeric not null,
  active        boolean default true
);

-- Seed packages
insert into packages (name, lessons_count, duration_min, price) values
  ('60-Minute Lesson',         1,  60,    89),
  ('90-Minute Lesson',         1,  90,   126),
  ('120-Minute Lesson',        1, 120,   159),
  ('6-Lesson Bundle',          6,  60,   499),
  ('11-Lesson Bundle',        11,  60,   899),
  ('25-Lesson Bundle',        25,  60,  1999),
  ('Senior Driver Assessment', 1,  90,     0),  -- price TBC
  ('Test Prep Package',        2,  60,   160),
  ('Refresher (single)',       1,  60,    89)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- ENROLMENTS  (student purchases a package)
-- ────────────────────────────────────────────────────────────
create table if not exists enrolments (
  id             uuid default gen_random_uuid() primary key,
  student_id     uuid references students(id) on delete cascade,
  package_id     int  references packages(id),
  lessons_total  int  not null,
  lessons_used   int  default 0,
  status         text default 'active',  -- active | completed | paused
  created_at     timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- LESSONS  (individual scheduled sessions)
-- ────────────────────────────────────────────────────────────
create table if not exists lessons (
  id               uuid default gen_random_uuid() primary key,
  student_id       uuid references students(id) on delete cascade,
  enrolment_id     uuid references enrolments(id) on delete set null,
  scheduled_date   date not null,
  scheduled_time   time not null,
  duration_min     int  not null,
  lesson_type      text default 'regular',    -- regular | test-prep | assessment | refresher | 1-on-1
  status           text default 'scheduled',  -- scheduled | completed | cancelled | no-show
  notes            text,
  created_at       timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- PAYMENTS
-- ────────────────────────────────────────────────────────────
create table if not exists payments (
  id            uuid default gen_random_uuid() primary key,
  student_id    uuid references students(id) on delete cascade,
  enrolment_id  uuid references enrolments(id) on delete set null,
  amount        numeric not null,
  status        text    default 'unpaid',  -- unpaid | paid | partial
  paid_at       timestamptz,
  method        text,                      -- cash | bank-transfer | stripe
  notes         text,
  created_at    timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY  (open anon policies — tighten once auth added)
-- ────────────────────────────────────────────────────────────
alter table students   enable row level security;
alter table packages   enable row level security;
alter table enrolments enable row level security;
alter table lessons    enable row level security;
alter table payments   enable row level security;

create policy "anon read students"   on students   for all to anon using (true) with check (true);
create policy "anon read packages"   on packages   for all to anon using (true) with check (true);
create policy "anon read enrolments" on enrolments for all to anon using (true) with check (true);
create policy "anon read lessons"    on lessons    for all to anon using (true) with check (true);
create policy "anon read payments"   on payments   for all to anon using (true) with check (true);

-- ────────────────────────────────────────────────────────────
-- USEFUL VIEWS
-- ────────────────────────────────────────────────────────────

-- Active students with their latest enrolment and payment status
create or replace view student_summary as
  select
    s.id,
    s.sds_id,
    s.first_name || ' ' || s.last_name as full_name,
    s.phone,
    s.email,
    s.suburb,
    s.licence_stage,
    s.transmission,
    s.active,
    s.created_at,
    e.id           as enrolment_id,
    e.lessons_total,
    e.lessons_used,
    e.lessons_total - e.lessons_used as lessons_remaining,
    e.status       as enrolment_status,
    pk.name        as package_name,
    pk.price       as package_price,
    py.status      as payment_status,
    py.amount      as payment_amount
  from students s
  left join enrolments e  on e.student_id = s.id and e.status = 'active'
  left join packages   pk on pk.id = e.package_id
  left join payments   py on py.enrolment_id = e.id
  order by s.created_at desc;
