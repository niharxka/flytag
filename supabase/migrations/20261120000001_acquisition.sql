-- acquisition: where a rider heard about FlyTag, and which tagged link brought them.
-- Why: promotion runs on Instagram, WhatsApp, flyers and student orgs. Two signals, because
-- each misses something: `heard_from` is an optional onboarding question (works on phones,
-- where app stores drop link tags), `signup_source` is the ?utm_source= of the first web link
-- the person opened (precise, but web only).
-- Both live in profile_private, not profiles: every signed-in rider can read profiles, and how
-- someone found the app is nobody else's business. The existing owner-only policies cover them.
-- Spec: §14 success metrics (acquisition).

create type public.heard_from as enum ('instagram', 'whatsapp', 'friend', 'flyer', 'org', 'other');

alter table public.profile_private
  add column heard_from public.heard_from,
  -- Lowercase letters, digits, - and _: the app normalises tags before saving, and this keeps
  -- free text (or anything personal pasted into a link) out of the column.
  add column signup_source text
    constraint signup_source_format check (signup_source ~ '^[a-z0-9_-]{1,40}$');

comment on column public.profile_private.heard_from is
  'Answer to "How did you hear about FlyTag?" at onboarding. Optional.';
comment on column public.profile_private.signup_source is
  'utm_source of the first tagged web link this person opened before signing up (e.g. instagram). Null on phones or untagged links.';

-- Owners write both at onboarding, like their other private fields.
grant update (heard_from, signup_source) on public.profile_private to authenticated;
