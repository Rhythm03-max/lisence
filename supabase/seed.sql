-- =============================================================================
-- Seed data: reference catalogue (categories, agencies, permits), content,
-- and a small set of demo permit records.
-- Run after the migration. Idempotent (safe to re-run).
-- =============================================================================

-- ---- Categories ------------------------------------------------------------
insert into public.permit_categories (name, slug, sort_order) values
  ('Construction and Land Development', 'construction-and-land-development', 1),
  ('Education', 'education', 2),
  ('Environment', 'environment', 3),
  ('Health', 'health', 4),
  ('Manufacturing', 'manufacturing', 5),
  ('Safety', 'safety', 6),
  ('Schemes', 'schemes', 7),
  ('Study and Live', 'study-and-live', 8),
  ('Tourism', 'tourism', 9),
  ('Work & Live', 'work-and-live', 10)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

-- ---- Agencies --------------------------------------------------------------
insert into public.agencies (name, slug, sort_order) values
  ('Early Childhood Care and Education Authority', 'early-childhood-care-and-education-authority', 1),
  ('Economic Development Board', 'economic-development-board', 2),
  ('Local Authorities', 'local-authorities', 3),
  ('Mauritius Fire and Rescue Service', 'mauritius-fire-and-rescue-service', 4),
  ('Mauritius Qualifications Authority', 'mauritius-qualifications-authority', 5),
  ('Mauritius Revenue Authority', 'mauritius-revenue-authority', 6),
  ('Ministry of Agro-Industry, Food Security, Blue Economy and Fisheries', 'ministry-of-agro-industry', 7),
  ('Ministry of Environment, Solid Waste Management and Climate Change', 'ministry-of-environment', 8),
  ('Ministry of Health and Wellness', 'ministry-of-health-and-wellness', 9),
  ('Ministry of Housing and Lands', 'ministry-of-housing-and-lands', 10),
  ('Ministry of Labour and Industrial Relations', 'ministry-of-labour-and-industrial-relations', 11),
  ('Passport and Immigration Office', 'passport-and-immigration-office', 12),
  ('Tourism Authority', 'tourism-authority', 13)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

-- ---- Permits (default steps + documents) -----------------------------------
with defaults as (
  select
    '[{"title":"Submit Your Online Application","description":"Complete the application form and upload the required documents."},{"title":"Pay Permit Fees","description":"Settle the applicable processing and permit fees."},{"title":"Verification of Original Documents","description":"Present the original documents to the issuing authority for verification."},{"title":"Issuance of Permit","description":"Collect the approved permit once it has been issued."}]'::jsonb as steps,
    '[{"label":"Completed application form","required":true},{"label":"Copy of National Identity Card or Passport bio-data page","required":true},{"label":"Business Registration Number or Certificate of Incorporation","required":true},{"label":"Supporting documents specific to this permit","required":true}]'::jsonb as docs
),
v as (
  select * from (values
    ('Building and Land Use Permit', 'building-and-land-use-permit', 'construction-and-land-development', 'local-authorities', 'BLU', 'Permit for the erection, alteration or change of use of a building.'),
    ('Occupation Certificate', 'occupation-certificate', 'construction-and-land-development', 'local-authorities', 'OC', 'Certificate confirming that a building is fit for occupation.'),
    ('Morcellement Permit', 'morcellement-permit', 'construction-and-land-development', 'ministry-of-housing-and-lands', 'MOR', 'Permit for the subdivision or excision of land under the Morcellement Act 1990.'),
    ('Land Conversion Permit', 'land-conversion-permit', 'construction-and-land-development', 'ministry-of-agro-industry', 'LC', 'Authorisation to convert agricultural land to another use.'),
    ('Property Acquisition', 'property-acquisition', 'construction-and-land-development', 'ministry-of-housing-and-lands', 'PA', 'Authorisation for a non-citizen to acquire immovable property in Mauritius.'),
    ('MQA - New Registration for Training Institution', 'mqa-new-registration', 'education', 'mauritius-qualifications-authority', 'MQA', 'Registration of a new training institution with the Mauritius Qualifications Authority.'),
    ('MQA - Renewal of Registration for Training Institution', 'mqa-renewal-registration', 'education', 'mauritius-qualifications-authority', 'MQA', 'Renewal of an existing training institution registration.'),
    ('MQA - Authorisation of Change for Training Institution', 'mqa-authorisation-change', 'education', 'mauritius-qualifications-authority', 'MQA', 'Authorisation for a change affecting a registered training institution.'),
    ('Preliminary Environment Report (PER) Approval', 'per-environment-report-approval', 'environment', 'ministry-of-environment', 'PER', 'Approval of a Preliminary Environmental Report for a scheduled activity.'),
    ('Environment Impact Assessment (EIA) Licence', 'eia-licence', 'environment', 'ministry-of-environment', 'EIA', 'Licence issued following an approved Environmental Impact Assessment.'),
    ('Completion Certificate', 'completion-certificate', 'environment', 'ministry-of-environment', 'CC', 'Certificate issued on completion of environmental mitigation measures.'),
    ('License to trade In Dangerous Chemicals', 'dangerous-chemicals-licence', 'health', 'ministry-of-health-and-wellness', 'DC', 'Licence to trade in dangerous chemicals.'),
    ('Registration of Extremely Dangerous Chemicals', 'extremely-dangerous-chemicals-registration', 'health', 'ministry-of-health-and-wellness', 'EDC', 'Registration required to handle extremely dangerous chemicals.'),
    ('Excise License', 'excise-license', 'manufacturing', 'mauritius-revenue-authority', 'EX', 'Excise licence for the manufacture or import of excisable goods.'),
    ('Fire Certificate', 'fire-certificate', 'safety', 'mauritius-fire-and-rescue-service', 'FC', 'Certificate confirming compliance with fire safety requirements.'),
    ('Fire Safety Plan', 'fire-safety-plan', 'safety', 'mauritius-fire-and-rescue-service', 'FSP', 'Approval of a fire safety plan for a premises.'),
    ('Film Rebate Scheme - Mauritius', 'film-rebate-scheme', 'schemes', 'economic-development-board', 'FILM', 'Rebate scheme for qualifying film production expenditure in Mauritius.'),
    ('Support for Trade Promotion and Marketing Scheme', 'trade-promotion-marketing-scheme', 'schemes', 'economic-development-board', 'STP', 'Support for trade promotion and marketing activities.'),
    ('Student Entry Permit', 'student-entry-permit', 'study-and-live', 'passport-and-immigration-office', 'SEP', 'Entry permit for a foreign student enrolled in a recognised institution.'),
    ('Student Residence Permit', 'student-residence-permit', 'study-and-live', 'passport-and-immigration-office', 'SRP', 'Residence permit for the duration of a course of study in Mauritius.'),
    ('Academic Course Register', 'academic-course-register', 'study-and-live', 'passport-and-immigration-office', 'ACR', 'Registration of an academic course for student permit purposes.'),
    ('Pleasure Craft Licence', 'pleasure-craft-licence', 'tourism', 'tourism-authority', 'PCL', 'Licence to operate a pleasure craft in Mauritian waters.'),
    ('Occupation/Residence Permit', 'occupation-residence-permit', 'work-and-live', 'economic-development-board', 'MOL-WP', 'Permit for a non-citizen to work and reside in Mauritius.'),
    ('Premium Visa', 'premium-visa', 'work-and-live', 'passport-and-immigration-office', 'PV', 'Long-stay visa for remote workers and visitors.'),
    ('Work Permit', 'work-permit', 'work-and-live', 'ministry-of-labour-and-industrial-relations', 'MOL-WP', 'Permit for a non-citizen to take up employment in Mauritius.'),
    ('Dependent - Occupation Permit', 'dependent-occupation-permit', 'work-and-live', 'passport-and-immigration-office', 'DOP', 'Residence permit for dependents of an Occupation Permit holder.'),
    ('Request for Skilled Workers from India', 'skilled-workers-india', 'work-and-live', 'economic-development-board', 'RSW', 'Request for the employment of skilled workers from India.'),
    ('Certificate of Exemption', 'certificate-of-exemption', 'work-and-live', 'ministry-of-labour-and-industrial-relations', 'COE', 'Certificate exempting an employer from certain work permit requirements.'),
    ('Per Capita Grant Claim', 'per-capita-grant-claim', 'schemes', 'early-childhood-care-and-education-authority', 'PCG', 'Claim for the per capita grant for an early childhood care institution.')
  ) as t(name, slug, cat, agency, prefix, descr)
)
insert into public.permits (name, slug, category_id, agency_id, number_prefix, description, steps, required_documents)
select v.name, v.slug,
  (select id from public.permit_categories c where c.slug = v.cat),
  (select id from public.agencies a where a.slug = v.agency),
  v.prefix, v.descr, d.steps, d.docs
from v, defaults d
on conflict (slug) do update set
  name = excluded.name,
  category_id = excluded.category_id,
  agency_id = excluded.agency_id,
  number_prefix = excluded.number_prefix,
  description = excluded.description;

-- ---- Permit detail: Occupation/Residence Permit ----------------------------
update public.permits set
  steps = '[{"title":"Submit Your Online Application","description":"Complete the online application form and upload all supporting documents."},{"title":"Pay Permit Fees","description":"Settle the applicable processing and permit fees."},{"title":"Verification of Original Documents","description":"Present the original documents for verification by the issuing authority."},{"title":"Issuance of Registration Certificate and Occupation Permit","description":"On approval, a registration certificate and occupation permit are issued."},{"title":"Collect Your Occupation Permit or Residence Permit","description":"Collect the issued permit from the Economic Development Board."}]'::jsonb,
  required_documents = '[{"label":"Medical certificate from local doctor in Mauritius and reports HIV, Hepatitis B, Chest X Ray to be done in Mauritius + other tests (less than six months)","required":false},{"label":"Copy of Occupation Permit / Work / Residence Permit (whichever is applicable)","required":false},{"label":"One recent colour passport size digital photograph 3.5cm x 4.5cm, less than six months old","required":true},{"label":"Passport bio-data and valid last-entry business visa pages","required":true},{"label":"Copy of previous Occupation Permit or Work / Residence Permit (if applicable)","required":false},{"label":"Payment bank cheque issued to the order of the Government of Mauritius (if applicable)","required":false},{"label":"Appropriate licence for the company and for the professional (GBL, TEL, TEC, MQA or Pilot Licence, etc.)","required":false},{"label":"Signed declaration section 4 of the application form","required":true}]'::jsonb,
  legislation_links = '[{"label":"Legislation and useful information","url":"https://edbmauritius.org/"}]'::jsonb
where slug = 'occupation-residence-permit';

-- ---- Content: news ---------------------------------------------------------
insert into public.news (title, slug, body, category, is_active) values
  ('Morcellement Board', 'morcellement-board', 'The Morcellement Board is established under Section (4) of the Morcellement Act 1990 as amended.', 'morcellement', true),
  ('New permit applications now available online', 'new-permit-applications-online', 'The National Electronic Licensing System now accepts new permit applications online. Applicants can submit, track and manage their applications from a single account.', 'event', true)
on conflict (slug) do nothing;

-- ---- Content: FAQs / Did You Know / Notices --------------------------------
insert into public.faqs (question, answer, type, sort_order) values
  ('Do I need clearance from the CEB and CWA when my land is built up?', 'This is a requirement from the CEB and CWA as per their regulations.', 'faq', 1),
  ('How long will it take to obtain the Morcellement Permit?', 'For the issuance of a Letter of Intent: a minimum of 10 to 12 weeks if all the documents are in order and the application is recommended by the stakeholders and approved by the Minister. Thereafter, the applicant has a timeframe of three years for the submission of clearances as per the Letter of Intent.', 'faq', 2),
  ('How often are Board Meetings held?', 'Every two (2) weeks.', 'faq', 3),
  ('Is withdrawal of an application possible?', 'An application can be requested to be withdrawn by an applicant, subject to valid justifications, provided in a letter or email signed by all the owners. No processing fee will be refunded upon withdrawal.', 'faq', 4),
  ('Plans - Dimensions', 'All plans to be submitted with the application for subdivision/excision that are larger than A3 should be submitted in hardcopies (14 originals and 15 copies) and should be submitted in autocad on DVD.', 'faq', 5),
  ('Plans - Requirements', 'All plans to be submitted with the application for subdivision/excision should be drawn to scale.', 'faq', 6),
  ('Which fees do I have to pay at the Morcellement Unit?', 'A processing fee at the time of application and a Morcellement fee prior to receiving the Morcellement Permit. The fees are available in the guideline.', 'faq', 7),
  ('Why do I have to pay Wastewater Management Authority fees?', 'Payment is mandatory as per S25 of the Wastewater Management Authority Act 2000.', 'faq', 8),
  ('Cash office opening hours', 'The Cash Office of the Ministry of Housing and Lands, located on the second floor of the Ebene Tower, is open from 08:45 to 14:30 on weekdays.', 'did_you_know', 1),
  ('What do I do after I receive the Morcellement Permit?', 'After receipt of the Morcellement Permit, you should apply for a PIN Certificate at the Cadastre Unit, contact your surveyor for a survey report and thereafter a Notary for obtention of a title deed.', 'did_you_know', 2),
  ('What is the purpose of the Morcellement Unit?', 'The Morcellement Unit is mainly responsible for processing applications for morcellement, i.e. the division of a plot of land into two or more lots, and the excision of land.', 'did_you_know', 3),
  ('Who should sign the application form?', 'The application form being online, the applicant should upload an authorisation letter, duly signed by all owners, giving permission to a third party or one of the owners to apply on their behalf.', 'did_you_know', 4),
  ('Supported Browsers', 'This platform is best viewed on the latest versions of Chrome, Edge, Firefox and Safari. Please keep your browser up to date for the best experience.', 'notice', 1),
  ('Protect your account', 'Always verify the website address before entering your login details. Never share your password. Report suspicious links or messages to nels@edbmauritius.org.', 'notice', 2)
on conflict do nothing;

-- =============================================================================
-- Making an administrator
-- Register a user through the web app first (or invite via the Supabase
-- dashboard), then promote them:
--   update public.profiles set role = 'admin' where email = 'admin@example.com';
-- =============================================================================
