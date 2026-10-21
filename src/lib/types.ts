export type PermitStatus = "Active" | "Pending" | "Expired" | "Cancelled";

export type UserRole = "admin" | "officer" | "applicant";

export interface PermitRecord {
  id: string;
  permit_number: string;
  permit_id: string | null;
  status: PermitStatus;
  authority: string;
  surname: string;
  first_name: string;
  nationality: string | null;
  gender: string | null;
  passport_number: string | null;
  date_of_birth: string | null;
  employer: string | null;
  post_held: string | null;
  issued_date: string | null;
  valid_from: string | null;
  valid_to: string | null;
  conditions: string[] | null;
  photo_path: string | null;
  document_path: string | null;
  verification_token: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

/** The subset returned by the public search RPC. */
export interface PublicPermit {
  permit_number: string;
  status: PermitStatus;
  authority: string;
  surname: string;
  first_name: string;
  nationality: string | null;
  gender: string | null;
  employer: string | null;
  post_held: string | null;
  issued_date: string | null;
  valid_from: string | null;
  valid_to: string | null;
  conditions: string[] | null;
  photo_path: string | null;
  document_path: string | null;
}

/** The superset returned by the token-verification RPC. */
export interface VerifiedPermit extends PublicPermit {
  passport_number: string | null;
  date_of_birth: string | null;
}

export interface PermitStep {
  title: string;
  description?: string;
}

export interface PermitDocument {
  label: string;
  required?: boolean;
}

export interface PermitLink {
  label: string;
  url: string;
}

export interface Permit {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  agency_id: string | null;
  number_prefix: string;
  description: string | null;
  legislation_links: PermitLink[];
  steps: PermitStep[];
  required_documents: PermitDocument[];
  fee: number | null;
  is_active: boolean;
  sort_order: number;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_path: string | null;
  sort_order: number;
}

export interface PermitCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  body: string | null;
  category: "morcellement" | "event";
  published_at: string;
  is_active: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  type: "faq" | "did_you_know" | "notice";
  sort_order: number;
  is_active: boolean;
}

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "more_info_required"
  | "approved"
  | "rejected"
  | "cancelled";

export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_type: string;
  file_path: string;
  file_name: string | null;
  uploaded_at: string;
}

export interface Application {
  id: string;
  reference: string;
  applicant_id: string;
  permit_id: string;
  status: ApplicationStatus;
  form_data: Record<string, unknown>;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  issued_record_id: string | null;
  confirmation_pdf_path: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
  permit?: Permit | null;
  applicant?: Partial<Profile> | null;
  documents?: ApplicationDocument[];
  issued_record?: PermitRecord | null;
}

export interface Profile {
  id: string;
  role: UserRole;
  is_active: boolean;
  title: string | null;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  email: string | null;
  mobile: string | null;
  nationality: string | null;
  passport_number: string | null;
  date_of_birth: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  total_records: number;
  active_records: number;
  expiring_soon: number;
  pending_apps: number;
  total_applicants: number;
  unread_news: number;
}
