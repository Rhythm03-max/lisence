-- =============================================================================
-- Generated documents: application acknowledgement PDFs + permit certificates
-- Adds storage for generated PDFs and exposes the certificate path through the
-- public search / verification RPCs so anyone can download an issued permit.
-- =============================================================================

-- Path (within the private application-documents bucket) of the acknowledgement
-- PDF that is produced when an applicant submits an application.
alter table public.applications
  add column if not exists confirmation_pdf_path text;

-- Path (within the public permit-documents bucket) of the issued certificate
-- PDF that is produced when an application is approved / a record is issued.
alter table public.permit_records
  add column if not exists document_path text;

-- -----------------------------------------------------------------------------
-- Storage: public bucket for issued permit certificates
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('permit-documents', 'permit-documents', true)
  on conflict (id) do nothing;

-- Only administrators may write certificates; public reads bypass RLS.
drop policy if exists permit_documents_admin on storage.objects;
create policy permit_documents_admin on storage.objects for all
  using (bucket_id = 'permit-documents' and public.is_admin())
  with check (bucket_id = 'permit-documents' and public.is_admin());

-- -----------------------------------------------------------------------------
-- Public search / verification now also return the certificate path so the
-- public permit card can offer a direct PDF download.
-- -----------------------------------------------------------------------------
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
    'photo_path',    rec.photo_path,
    'document_path', rec.document_path
  );
end;
$$;

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
    'issued_date',     rec.issued_date,
    'valid_from',      rec.valid_from,
    'valid_to',        rec.valid_to,
    'conditions',      rec.conditions,
    'photo_path',      rec.photo_path,
    'document_path',   rec.document_path
  );
end;
$$;

grant execute on function public.search_public_permit(text, date, text) to anon, authenticated;
grant execute on function public.verify_permit_by_token(text) to anon, authenticated;
