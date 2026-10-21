-- =============================================================================
-- Fix: generate_verification_token() called gen_random_bytes() unqualified.
-- On Supabase, pgcrypto lives in the `extensions` schema, so the call failed
-- with "function gen_random_bytes(integer) does not exist" when creating a
-- permit record. Recreate the function with `extensions` on its search_path.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

create or replace function public.generate_verification_token()
returns text language sql volatile
set search_path = public, extensions as $$
  select 'v1_' || rtrim(translate(encode(gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
$$;
