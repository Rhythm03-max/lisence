-- =============================================================================
-- Harden public permit lookup.
--
-- The strict equality `lower(btrim(permit_number)) = normalized` failed for
-- records whose number contains an en/em dash, non-breaking space, or other
-- unicode separator introduced by copy-paste into the admin form. Normalise
-- both sides (case, whitespace, and all dash variants) before comparing so a
-- lookup for MOL-WP-2026-23794 matches regardless of separator style.
-- =============================================================================

create or replace function public.normalize_permit_number(p_value text)
returns text language sql immutable as $$
  select lower(
    regexp_replace(
      translate(
        coalesce(p_value, ''),
        -- unicode space/dash variants → ascii equivalents
        E'\u00a0\u2007\u202f\u2010\u2011\u2012\u2013\u2014\u2015\u2212',
        '         ---------'
      ),
      '[\s-]+', '-', 'g'
    )
  );
$$;

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
  -- Strip a leading "WP No:" style prefix, then normalise dashes/whitespace.
  normalized := public.normalize_permit_number(
    regexp_replace(coalesce(p_permit_number, ''), '^\s*wp\s*no\s*[:.\-]?\s*', '', 'i')
  );
  normalized := regexp_replace(normalized, '^-+|-+$', '', 'g');

  select * into rec
  from public.permit_records
  where archived = false
    and regexp_replace(public.normalize_permit_number(permit_number), '^-+|-+$', '', 'g') = normalized
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

grant execute on function public.normalize_permit_number(text) to anon, authenticated;
grant execute on function public.search_public_permit(text, date, text) to anon, authenticated;
