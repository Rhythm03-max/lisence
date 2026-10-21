-- =============================================================================
-- National Electronic Licensing System - Mauritius Business Licensing Platform
-- Initial schema: tables, helper functions, RLS policies, stored procedures,
-- and storage buckets.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Verification tokens are URL-safe, 43 characters after the "v1_" prefix,
-- matching the reference format /^v1_[A-Za-z0-9_-]{43}$/.
create or replace function public.generate_verification_token()
returns text language sql volatile as $$
  select 'v1_' || rtrim(translate(encode(gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
$$;

-- -----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  role            text not null default 'applicant' check (role in ('admin','officer','applicant')),
  is_active       boolean not null default true,
  title           text,
  first_name      text,
  last_name       text,
  gender          text,
  email           text,
  mobile          text,
  nationality     text,
  passport_number text,
  date_of_birth   date,
  address         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user registers.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, title, first_name, last_name, gender, mobile)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'title',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'mobile'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helpers
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','officer') and p.is_active
  );
$$;

-- Prevent applicants from escalating their own role / activation status.
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_protect on public.profiles;
create trigger trg_profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- -----------------------------------------------------------------------------
-- Reference data: agencies, categories, permits
-- -----------------------------------------------------------------------------
create table if not exists public.agencies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  logo_path   text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.permit_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.permits (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  category_id         uuid references public.permit_categories(id) on delete set null,
  agency_id           uuid references public.agencies(id) on delete set null,
  number_prefix       text not null default 'GEN',
  description         text,
  legislation_links   jsonb not null default '[]'::jsonb,
  steps               jsonb not null default '[]'::jsonb,
  required_documents  jsonb not null default '[]'::jsonb,
  fee                 numeric(12,2),
  is_active           boolean not null default true,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Issued permit records (the publicly searchable register)
-- -----------------------------------------------------------------------------
create table if not exists public.permit_records (
  id                 uuid primary key default gen_random_uuid(),
  permit_number      text not null unique,
  permit_id          uuid references public.permits(id) on delete set null,
  status             text not null default 'Active' check (status in ('Active','Pending','Expired','Cancelled')),
  authority          text not null,
  surname            text not null,
  first_name         text not null,
  nationality        text,
  gender             text,
  passport_number    text,
  date_of_birth      date,
  employer           text,
  post_held          text,
  issued_date        date,
  valid_from         date,
  valid_to           date,
  conditions         text[] not null default '{}',
  photo_path         text,
  verification_token text not null unique default public.generate_verification_token(),
  archived           boolean not null default false,
  created_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_permit_records_number on public.permit_records (lower(permit_number));
create index if not exists idx_permit_records_token on public.permit_records (verification_token);
create index if not exists idx_permit_records_archived on public.permit_records (archived);

drop trigger if exists trg_permit_records_updated on public.permit_records;
create trigger trg_permit_records_updated before update on public.permit_records
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Applications
-- -----------------------------------------------------------------------------
create table if not exists public.applications (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null unique default ('APP-' || to_char(now(),'YYYY') || '-' || lpad((floor(random()*900000)+100000)::int::text, 6, '0')),
  applicant_id     uuid not null references public.profiles(id) on delete cascade,
  permit_id        uuid not null references public.permits(id) on delete restrict,
  status           text not null default 'draft'
                     check (status in ('draft','submitted','under_review','more_info_required','approved','rejected','cancelled')),
  form_data        jsonb not null default '{}'::jsonb,
  reviewer_id      uuid references public.profiles(id) on delete set null,
  reviewer_notes   text,
  issued_record_id uuid references public.permit_records(id) on delete set null,
  submitted_at     timestamptz,
  decided_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_applications_applicant on public.applications (applicant_id);
create index if not exists idx_applications_status on public.applications (status);

drop trigger if exists trg_applications_updated on public.applications;
create trigger trg_applications_updated before update on public.applications
  for each row execute function public.set_updated_at();

create table if not exists public.application_documents (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  document_type  text not null,
  file_path      text not null,
  file_name      text,
  uploaded_at    timestamptz not null default now()
);

create index if not exists idx_application_documents_app on public.application_documents (application_id);

-- -----------------------------------------------------------------------------
-- Content: news, faqs / notices
-- -----------------------------------------------------------------------------
create table if not exists public.news (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text not null unique,
  body         text,
  category     text not null default 'event' check (category in ('morcellement','event')),
  published_at timestamptz not null default now(),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  type       text not null default 'faq' check (type in ('faq','did_you_know','notice')),
  sort_order int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Permit-number generator
-- -----------------------------------------------------------------------------
create sequence if not exists public.permit_number_seq start 1000;

create or replace function public.next_permit_number(p_prefix text)
returns text language sql volatile as $$
  select upper(coalesce(nullif(p_prefix,''),'GEN')) || '-' || to_char(now(),'YYYY') || '-' ||
         lpad(nextval('public.permit_number_seq')::text, 5, '0');
$$;

-- =============================================================================
-- Stored procedures (RPCs)
-- =============================================================================

-- ---- Public: search -------------------------------------------------------
create or replace function public.search_public_permit(
  p_permit_number text,
  p_issued_date   date default null,
  p_holder        text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  rec public.permit_records;
  normalized text;
begin
  normalized := lower(btrim(regexp_replace(coalesce(p_permit_number,''), '^\s*wp\s*no\s*[:.\-]?\s*', '', 'i')));

  select * into rec
  from public.permit_records
  where archived = false
    and lower(btrim(permit_number)) = normalized
    and (p_issued_date is null or issued_date = p_issued_date)
    and (
      p_holder is null or btrim(p_holder) = ''
      or lower(first_name || ' ' || surname) like '%' || lower(btrim(p_holder)) || '%'
      or lower(surname || ' ' || first_name) like '%' || lower(btrim(p_holder)) || '%'
    )
  limit 1;

  if rec.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'permit_number', rec.permit_number,
    'status',        rec.status,
    'authority',     rec.authority,
    'surname',       rec.surname,
    'first_name',    rec.first_name,
    'nationality',   rec.nationality,
    'gender',        rec.gender,
    'employer',      rec.employer,
    'post_held',     rec.post_held,
    'issued_date',   rec.issued_date,
    'valid_from',    rec.valid_from,
    'valid_to',      rec.valid_to,
    'conditions',    rec.conditions,
    'photo_path',    rec.photo_path
  );
end;
$$;

-- ---- Public: token verification (QR) --------------------------------------
create or replace function public.verify_permit_by_token(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  rec public.permit_records;
begin
  select * into rec
  from public.permit_records
  where verification_token = btrim(coalesce(p_token,'')) and archived = false
  limit 1;

  if rec.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'permit_number',   rec.permit_number,
    'status',          rec.status,
    'authority',       rec.authority,
    'surname',         rec.surname,
    'first_name',      rec.first_name,
    'nationality',     rec.nationality,
    'gender',          rec.gender,
    'passport_number', rec.passport_number,
    'date_of_birth',   rec.date_of_birth,
    'employer',        rec.employer,
    'post_held',       rec.post_held,
    'valid_from',      rec.valid_from,
    'valid_to',        rec.valid_to,
    'conditions',      rec.conditions,
    'photo_path',      rec.photo_path
  );
end;
$$;

-- ---- Admin: permit records ------------------------------------------------
create or replace function public.admin_list_permit_records()
returns setof jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  return query
    select to_jsonb(r) from public.permit_records r
    where r.archived = false
    order by r.created_at desc;
end;
$$;

create or replace function public.admin_get_permit_record(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  return (select to_jsonb(r) from public.permit_records r where r.id = p_id);
end;
$$;

create or replace function public.admin_create_permit_record(p_candidate jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  rec public.permit_records;
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;

  insert into public.permit_records (
    permit_number, permit_id, status, authority, surname, first_name, nationality,
    gender, passport_number, date_of_birth, employer, post_held, issued_date,
    valid_from, valid_to, conditions, photo_path, created_by
  ) values (
    p_candidate->>'permit_number',
    nullif(p_candidate->>'permit_id','')::uuid,
    coalesce(p_candidate->>'status','Active'),
    coalesce(p_candidate->>'authority',''),
    coalesce(p_candidate->>'surname',''),
    coalesce(p_candidate->>'first_name',''),
    p_candidate->>'nationality',
    p_candidate->>'gender',
    p_candidate->>'passport_number',
    nullif(p_candidate->>'date_of_birth','')::date,
    p_candidate->>'employer',
    p_candidate->>'post_held',
    nullif(p_candidate->>'issued_date','')::date,
    nullif(p_candidate->>'valid_from','')::date,
    nullif(p_candidate->>'valid_to','')::date,
    coalesce((select array_agg(value::text) from jsonb_array_elements_text(coalesce(p_candidate->'conditions','[]'::jsonb)) as value), '{}'),
    p_candidate->>'photo_path',
    auth.uid()
  )
  returning * into rec;

  return jsonb_build_object(
    'id', rec.id,
    'permit_number', rec.permit_number,
    'verification_token', rec.verification_token
  );
end;
$$;

create or replace function public.admin_update_permit_record(p_id uuid, p_candidate jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  rec public.permit_records;
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;

  update public.permit_records set
    permit_number   = coalesce(p_candidate->>'permit_number', permit_number),
    permit_id       = coalesce(nullif(p_candidate->>'permit_id','')::uuid, permit_id),
    status          = coalesce(p_candidate->>'status', status),
    authority       = coalesce(p_candidate->>'authority', authority),
    surname         = coalesce(p_candidate->>'surname', surname),
    first_name      = coalesce(p_candidate->>'first_name', first_name),
    nationality     = coalesce(p_candidate->>'nationality', nationality),
    gender          = coalesce(p_candidate->>'gender', gender),
    passport_number = coalesce(p_candidate->>'passport_number', passport_number),
    date_of_birth   = coalesce(nullif(p_candidate->>'date_of_birth','')::date, date_of_birth),
    employer        = coalesce(p_candidate->>'employer', employer),
    post_held       = coalesce(p_candidate->>'post_held', post_held),
    issued_date     = coalesce(nullif(p_candidate->>'issued_date','')::date, issued_date),
    valid_from      = coalesce(nullif(p_candidate->>'valid_from','')::date, valid_from),
    valid_to        = coalesce(nullif(p_candidate->>'valid_to','')::date, valid_to),
    conditions      = coalesce((select array_agg(value::text) from jsonb_array_elements_text(coalesce(p_candidate->'conditions','[]'::jsonb)) as value), conditions),
    photo_path      = coalesce(p_candidate->>'photo_path', photo_path)
  where id = p_id
  returning * into rec;

  if rec.id is null then raise exception 'NOT_FOUND'; end if;
  return to_jsonb(rec);
end;
$$;

create or replace function public.admin_archive_permit_record(p_id uuid, p_archived boolean default true)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  update public.permit_records set archived = coalesce(p_archived, true) where id = p_id;
end;
$$;

create or replace function public.admin_set_permit_photo(p_id uuid, p_photo_path text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  update public.permit_records set photo_path = p_photo_path where id = p_id;
end;
$$;

create or replace function public.admin_rotate_verification_token(p_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  new_token text;
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  new_token := public.generate_verification_token();
  update public.permit_records set verification_token = new_token where id = p_id;
  return new_token;
end;
$$;

-- ---- Admin: overview stats ------------------------------------------------
create or replace function public.admin_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  return jsonb_build_object(
    'total_records',   (select count(*) from public.permit_records where archived = false),
    'active_records',  (select count(*) from public.permit_records where archived = false and status = 'Active'),
    'expiring_soon',   (select count(*) from public.permit_records where archived = false and valid_to between current_date and current_date + interval '60 days'),
    'pending_apps',    (select count(*) from public.applications where status in ('submitted','under_review','more_info_required')),
    'total_applicants',(select count(*) from public.profiles where role = 'applicant'),
    'unread_news',     (select count(*) from public.news where is_active = true)
  );
end;
$$;

-- ---- Applicant: applications ----------------------------------------------
create or replace function public.get_my_applications()
returns setof jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  return query
    select to_jsonb(a) || jsonb_build_object('permit', to_jsonb(p))
    from public.applications a
    left join public.permits p on p.id = a.permit_id
    where a.applicant_id = auth.uid()
    order by a.created_at desc;
end;
$$;

create or replace function public.get_my_application(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  app public.applications;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into app from public.applications where id = p_id and applicant_id = auth.uid();
  if app.id is null then return null; end if;
  return to_jsonb(app) || jsonb_build_object(
    'permit', (select to_jsonb(p) from public.permits p where p.id = app.permit_id),
    'documents', (select coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb) from public.application_documents d where d.application_id = app.id),
    'issued_record', (select to_jsonb(r) from public.permit_records r where r.id = app.issued_record_id)
  );
end;
$$;

-- Submits an existing draft owned by the caller. If p_application_id is null,
-- a new application is created for p_permit_id (kept for convenience).
create or replace function public.submit_application(p_application_id uuid, p_form_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  app public.applications;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  if p_application_id is null then
    raise exception 'APPLICATION_REQUIRED';
  end if;

  update public.applications
    set status = 'submitted',
        form_data = coalesce(p_form_data, form_data),
        submitted_at = coalesce(submitted_at, now())
    where id = p_application_id
      and applicant_id = auth.uid()
      and status in ('draft','more_info_required')
    returning * into app;

  if app.id is null then raise exception 'NOT_FOUND_OR_LOCKED'; end if;
  return to_jsonb(app);
end;
$$;

create or replace function public.cancel_application(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  update public.applications
    set status = 'cancelled'
    where id = p_id and applicant_id = auth.uid() and status in ('draft','submitted','more_info_required');
end;
$$;

create or replace function public.save_application_document(
  p_application_id uuid, p_document_type text, p_file_path text, p_file_name text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  doc public.application_documents;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.applications a where a.id = p_application_id and a.applicant_id = auth.uid()) then
    raise exception 'NOT_FOUND';
  end if;
  insert into public.application_documents (application_id, document_type, file_path, file_name)
  values (p_application_id, p_document_type, p_file_path, p_file_name)
  returning * into doc;
  return to_jsonb(doc);
end;
$$;

-- ---- Admin: applications --------------------------------------------------
create or replace function public.admin_list_applications()
returns setof jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  return query
    select to_jsonb(a)
      || jsonb_build_object('permit', to_jsonb(p))
      || jsonb_build_object('applicant', jsonb_build_object(
           'first_name', pr.first_name, 'last_name', pr.last_name,
           'email', pr.email, 'mobile', pr.mobile, 'nationality', pr.nationality))
    from public.applications a
    left join public.permits p on p.id = a.permit_id
    left join public.profiles pr on pr.id = a.applicant_id
    order by a.created_at desc;
end;
$$;

create or replace function public.admin_get_application(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  app public.applications;
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  select * into app from public.applications where id = p_id;
  if app.id is null then return null; end if;
  return to_jsonb(app) || jsonb_build_object(
    'permit', (select to_jsonb(p) from public.permits p where p.id = app.permit_id),
    'applicant', (select to_jsonb(pr) from public.profiles pr where pr.id = app.applicant_id),
    'documents', (select coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb) from public.application_documents d where d.application_id = app.id)
  );
end;
$$;

create or replace function public.admin_review_application(p_id uuid, p_decision text, p_notes text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  app public.applications;
  perm public.permits;
  rec public.permit_records;
  new_status text;
  form jsonb;
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;

  select * into app from public.applications where id = p_id;
  if app.id is null then raise exception 'NOT_FOUND'; end if;

  new_status := case p_decision
    when 'approve' then 'approved'
    when 'reject' then 'rejected'
    when 'more_info' then 'more_info_required'
    when 'review' then 'under_review'
    else app.status end;

  if new_status = 'approved' and app.issued_record_id is null then
    select * into perm from public.permits where id = app.permit_id;
    form := app.form_data;

    insert into public.permit_records (
      permit_number, permit_id, status, authority, surname, first_name, nationality,
      gender, passport_number, date_of_birth, employer, post_held, issued_date,
      valid_from, valid_to, conditions, created_by
    ) values (
      public.next_permit_number(coalesce(perm.number_prefix,'GEN')),
      perm.id,
      'Active',
      coalesce(form->>'authority', (select name from public.agencies where id = perm.agency_id), 'Government of Mauritius'),
      coalesce(form->>'surname',''),
      coalesce(form->>'first_name',''),
      form->>'nationality',
      form->>'gender',
      form->>'passport_number',
      nullif(form->>'date_of_birth','')::date,
      form->>'employer',
      form->>'post_held',
      current_date,
      current_date,
      coalesce(nullif(form->>'valid_to','')::date, (current_date + interval '1 year')::date),
      array['This permit is valid for the period indicated above.',
            'This permit is personal to the holder and is not transferable.'],
      auth.uid()
    )
    returning * into rec;
  end if;

  update public.applications
    set status = new_status,
        reviewer_id = auth.uid(),
        reviewer_notes = coalesce(p_notes, reviewer_notes),
        issued_record_id = coalesce(app.issued_record_id, rec.id),
        decided_at = case when new_status in ('approved','rejected') then now() else decided_at end
    where id = p_id
    returning * into app;

  return to_jsonb(app);
end;
$$;

-- ---- Admin: users ---------------------------------------------------------
create or replace function public.admin_list_profiles()
returns setof jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  return query select to_jsonb(p) from public.profiles p order by p.created_at desc;
end;
$$;

create or replace function public.admin_set_profile_role(p_id uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  if p_role not in ('admin','officer','applicant') then raise exception 'INVALID_ROLE'; end if;
  if p_id = auth.uid() and p_role <> 'admin' then raise exception 'CANNOT_DEMOTE_SELF'; end if;
  update public.profiles set role = p_role where id = p_id;
end;
$$;

create or replace function public.admin_toggle_profile_active(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  new_state boolean;
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  if p_id = auth.uid() then raise exception 'CANNOT_DEACTIVATE_SELF'; end if;
  update public.profiles set is_active = not is_active where id = p_id returning is_active into new_state;
  return new_state;
end;
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles              enable row level security;
alter table public.agencies              enable row level security;
alter table public.permit_categories     enable row level security;
alter table public.permits               enable row level security;
alter table public.permit_records        enable row level security;
alter table public.applications          enable row level security;
alter table public.application_documents enable row level security;
alter table public.news                  enable row level security;
alter table public.faqs                  enable row level security;

-- Profiles: read own; admins read all; update own.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- Public reference data: readable by everyone (anon), writable by admins.
drop policy if exists agencies_read on public.agencies;
create policy agencies_read on public.agencies for select using (true);
drop policy if exists agencies_admin on public.agencies;
create policy agencies_admin on public.agencies for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists categories_read on public.permit_categories;
create policy categories_read on public.permit_categories for select using (true);
drop policy if exists categories_admin on public.permit_categories;
create policy categories_admin on public.permit_categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists permits_read on public.permits;
create policy permits_read on public.permits for select using (is_active or public.is_admin());
drop policy if exists permits_admin on public.permits;
create policy permits_admin on public.permits for all using (public.is_admin()) with check (public.is_admin());

-- Permit records: NO direct public select (search/verify go through SECURITY DEFINER RPCs).
-- Admins can do everything directly.
drop policy if exists records_admin on public.permit_records;
create policy records_admin on public.permit_records for all
  using (public.is_admin()) with check (public.is_admin());

-- Applications: applicant owns; admin all.
drop policy if exists applications_owner on public.applications;
create policy applications_owner on public.applications for select
  using (applicant_id = auth.uid() or public.is_admin());
drop policy if exists applications_insert_own on public.applications;
create policy applications_insert_own on public.applications for insert
  with check (applicant_id = auth.uid());
drop policy if exists applications_update_own on public.applications;
create policy applications_update_own on public.applications for update
  using (applicant_id = auth.uid() or public.is_admin())
  with check (applicant_id = auth.uid() or public.is_admin());

drop policy if exists documents_owner on public.application_documents;
create policy documents_owner on public.application_documents for select
  using (public.is_admin() or exists (
    select 1 from public.applications a where a.id = application_id and a.applicant_id = auth.uid()));
drop policy if exists documents_insert_owner on public.application_documents;
create policy documents_insert_owner on public.application_documents for insert
  with check (exists (
    select 1 from public.applications a where a.id = application_id and a.applicant_id = auth.uid()));
drop policy if exists documents_admin on public.application_documents;
create policy documents_admin on public.application_documents for all
  using (public.is_admin()) with check (public.is_admin());

-- Content
drop policy if exists news_read on public.news;
create policy news_read on public.news for select using (is_active or public.is_admin());
drop policy if exists news_admin on public.news;
create policy news_admin on public.news for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists faqs_read on public.faqs;
create policy faqs_read on public.faqs for select using (is_active or public.is_admin());
drop policy if exists faqs_admin on public.faqs;
create policy faqs_admin on public.faqs for all using (public.is_admin()) with check (public.is_admin());

-- =============================================================================
-- Storage buckets
-- =============================================================================
-- permit-photos is public-read (photos appear on publicly searchable permits);
-- writes are restricted to administrators.
insert into storage.buckets (id, name, public) values ('permit-photos', 'permit-photos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('application-documents', 'application-documents', false)
  on conflict (id) do nothing;

-- permit-photos: admins manage (public bucket reads bypass RLS).
drop policy if exists permit_photos_admin on storage.objects;
create policy permit_photos_admin on storage.objects for all
  using (bucket_id = 'permit-photos' and public.is_admin())
  with check (bucket_id = 'permit-photos' and public.is_admin());

-- application-documents: applicants upload/read their own; admins read all.
drop policy if exists app_docs_insert on storage.objects;
create policy app_docs_insert on storage.objects for insert
  with check (bucket_id = 'application-documents' and auth.uid() is not null);

drop policy if exists app_docs_read on storage.objects;
create policy app_docs_read on storage.objects for select
  using (bucket_id = 'application-documents' and (public.is_admin() or owner = auth.uid()));

-- =============================================================================
-- Grants
-- =============================================================================
grant usage on schema public to anon, authenticated;
grant execute on function public.search_public_permit(text, date, text) to anon, authenticated;
grant execute on function public.verify_permit_by_token(text) to anon, authenticated;
grant execute on function public.get_my_applications() to authenticated;
grant execute on function public.get_my_application(uuid) to authenticated;
grant execute on function public.submit_application(uuid, jsonb) to authenticated;
grant execute on function public.cancel_application(uuid) to authenticated;
grant execute on function public.save_application_document(uuid, text, text, text) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- Admin RPCs: executable by authenticated users; each function re-checks
-- is_admin() internally.
grant execute on function public.admin_list_permit_records() to authenticated;
grant execute on function public.admin_get_permit_record(uuid) to authenticated;
grant execute on function public.admin_create_permit_record(jsonb) to authenticated;
grant execute on function public.admin_update_permit_record(uuid, jsonb) to authenticated;
grant execute on function public.admin_archive_permit_record(uuid, boolean) to authenticated;
grant execute on function public.admin_set_permit_photo(uuid, text) to authenticated;
grant execute on function public.admin_rotate_verification_token(uuid) to authenticated;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_list_applications() to authenticated;
grant execute on function public.admin_get_application(uuid) to authenticated;
grant execute on function public.admin_review_application(uuid, text, text) to authenticated;
grant execute on function public.admin_list_profiles() to authenticated;
grant execute on function public.admin_set_profile_role(uuid, text) to authenticated;
grant execute on function public.admin_toggle_profile_active(uuid) to authenticated;
