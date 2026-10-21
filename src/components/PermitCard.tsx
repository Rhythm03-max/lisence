import type { PublicPermit, VerifiedPermit } from "@/lib/types";
import { formatDate, statusClass } from "@/lib/format";
import { publicDocumentUrl } from "@/lib/storage";
import { permitPublicPath } from "@/lib/permalink";

export function PublicPermitCard({
  permit,
  photoUrl,
  showPermalink = true,
}: {
  permit: PublicPermit;
  photoUrl?: string | null;
  showPermalink?: boolean;
}) {
  const conditions = permit.conditions ?? [];
  const documentUrl = publicDocumentUrl(permit.document_path);
  const permalink = permitPublicPath(permit.permit_number);
  return (
    <article className="public-permit-card">
      <header>
        <h2>{permit.authority}</h2>
        <div>
          <span>Permit Number: <strong>{permit.permit_number}</strong></span>
          <span>Status: <strong className={`public-permit-status ${statusClass(permit.status)}`}>{permit.status}</strong></span>
        </div>
      </header>
      <div className="public-permit-body">
        <div className="public-permit-identity">
          <div>
            <div>Surname: <strong>{permit.surname}</strong></div>
            <div>First Name: <strong>{permit.first_name}</strong></div>
            <div>Nationality: <strong>{permit.nationality ?? "—"}</strong></div>
          </div>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={`${permit.first_name} ${permit.surname}`} />
          ) : (
            <div className="public-permit-photo-placeholder" aria-hidden="true">PHOTO</div>
          )}
        </div>
        <div className="public-permit-details">
          <div>Name of Employer: <strong>{permit.employer ?? "—"}</strong></div>
          <div>Post Held: <strong>{permit.post_held ?? "—"}</strong></div>
          <div className="public-permit-paired">
            <div>Gender: <strong>{permit.gender ?? "—"}</strong></div>
            <div>Validity: <strong>From {formatDate(permit.valid_from)} To {formatDate(permit.valid_to)}</strong></div>
          </div>
        </div>
        {conditions.length > 0 && (
          <div className="public-permit-conditions">
            <strong>Conditions:</strong>
            <ol>{conditions.map((c, i) => <li key={i}>{c}</li>)}</ol>
          </div>
        )}
        {(documentUrl || showPermalink) && (
          <div className="public-permit-actions">
            {documentUrl && (
              <a className="primary-action" href={documentUrl} target="_blank" rel="noopener" style={{ marginRight: 12 }}>
                Download permit (PDF)
              </a>
            )}
            {showPermalink && <a className="secondary-action" href={permalink}>Permalink</a>}
          </div>
        )}
      </div>
    </article>
  );
}

export function VerifyCard({
  permit,
  photoUrl,
}: {
  permit: VerifiedPermit;
  photoUrl?: string | null;
}) {
  const conditions = permit.conditions ?? [];
  const documentUrl = publicDocumentUrl(permit.document_path);
  return (
    <article className="verify-card">
      <header className="permit-header">
        <h1>{permit.authority}</h1>
        <div className="permit-heading-row">
          <div><strong>Permit Number:</strong> <span>{permit.permit_number}</span></div>
          <div><strong>Status:</strong> <span className="verify-status">{permit.status}</span></div>
        </div>
      </header>
      <div className="permit-body">
        <section className="permit-identity">
          <dl>
            <div><dt>Surname:</dt><dd>{permit.surname}</dd></div>
            <div><dt>First Name:</dt><dd>{permit.first_name}</dd></div>
            <div><dt>Nationality:</dt><dd>{permit.nationality ?? "—"}</dd></div>
          </dl>
          <div className="verify-photo">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Candidate photograph" />
            ) : (
              <span>OFFICIAL<br />PHOTO</span>
            )}
          </div>
        </section>
        <dl className="permit-details">
          <div><dt>Name of Employer:</dt><dd>{permit.employer ?? "—"}</dd></div>
          <div><dt>Post Held:</dt><dd>{permit.post_held ?? "—"}</dd></div>
          <div className="permit-detail-pair">
            <span><dt>Passport Number:</dt><dd>{permit.passport_number ?? "—"}</dd></span>
            <span><dt>Date of Birth:</dt><dd>{formatDate(permit.date_of_birth)}</dd></span>
          </div>
          <div className="permit-detail-pair">
            <span><dt>Gender:</dt><dd>{permit.gender ?? "—"}</dd></span>
            <span><dt>Validity:</dt><dd><strong>From</strong> {formatDate(permit.valid_from)} <strong>To</strong> {formatDate(permit.valid_to)}</dd></span>
          </div>
        </dl>
        {conditions.length > 0 && (
          <section className="verify-conditions">
            <h2>Conditions:</h2>
            <ol>{conditions.map((c, i) => <li key={i}>{c}</li>)}</ol>
          </section>
        )}
        {documentUrl && (
          <div className="public-permit-actions">
            <a className="primary-action" href={documentUrl} target="_blank" rel="noopener">
              Download permit (PDF)
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
