-- colleges: which UCSD colleges a rider can call home.
-- Why: onboarding asks for a home college, and rider rows show it ("Jake · Marshall").
-- Spec: §6.2 table 1, §9.3 onboarding.
-- The list is reference data the app needs in every environment, so it's inserted here rather
-- than in seed.sql (which only runs locally).

create table public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort smallint not null unique
);

comment on table public.colleges is 'UCSD colleges a rider can pick as home college. Read-only reference data.';
comment on column public.colleges.name is 'Display name, e.g. "Sixth College".';
comment on column public.colleges.sort is 'Order in the onboarding picker (founding order, Graduate student last).';

alter table public.colleges enable row level security;

create policy "signed-in users can read colleges"
  on public.colleges for select
  to authenticated
  using (true);

-- No insert/update/delete policies: changes come only from migrations.

insert into public.colleges (name, sort) values
  ('Revelle College', 1),
  ('John Muir College', 2),
  ('Thurgood Marshall College', 3),
  ('Earl Warren College', 4),
  ('Eleanor Roosevelt College', 5),
  ('Sixth College', 6),
  ('Seventh College', 7),
  ('Eighth College', 8),
  ('Graduate student', 9);
