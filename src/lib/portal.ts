import { createClient } from "@/lib/supabase/server";
import type { Application, Permit } from "@/lib/types";

export async function getMyApplications(applicantId: string): Promise<Application[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("*, permit:permits(*)")
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Application[];
}

export async function getMyApplication(id: string, applicantId: string): Promise<Application | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("*, permit:permits(*)")
    .eq("id", id)
    .eq("applicant_id", applicantId)
    .maybeSingle();
  if (!data) return null;

  const application = data as Application;

  const { data: documents } = await supabase
    .from("application_documents")
    .select("*")
    .eq("application_id", id)
    .order("uploaded_at", { ascending: false });
  application.documents = documents ?? [];

  if (application.issued_record_id) {
    const { data: record } = await supabase
      .from("permit_records")
      .select("*")
      .eq("id", application.issued_record_id)
      .maybeSingle();
    application.issued_record = record ?? null;
  }

  return application;
}

export async function getPermitById(id: string): Promise<Permit | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("permits").select("*").eq("id", id).maybeSingle();
  return (data as Permit) ?? null;
}
