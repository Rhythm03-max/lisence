import type { PublicPermit, VerifiedPermit } from "@/lib/types";
import { formatDate, statusClass } from "@/lib/format";
import { publicDocumentUrl, publicPhotoUrl } from "@/lib/storage";

export function PublicPermitCard({ permit }: { permit: PublicPermit }) {
  const conditions = permit.conditions ?? [];
  const active = statusClass(permit.status) === "active";
  const photoUrl = publicPhotoUrl(permit.photo_path);
  return (
    <div className="publicSearchContainer">
        <div className="print-side-slider" aria-hidden="true">
          <div className="slider-btn-up">
            <svg viewBox="0 0 8 5" width="8" height="5">
              <polygon points="4,0 8,5 0,5" fill="#717171" />
            </svg>
          </div>
          <div className="slider-thumb" />
          <div className="slider-track" />
          <div className="slider-btn-down">
            <svg viewBox="0 0 8 5" width="8" height="5">
              <polygon points="0,0 8,0 4,5" fill="#717171" />
            </svg>
          </div>
        </div>
        <div className="row infoPannel">
          <div className="col-md-12">
            <div className="panel panel-default">
            <div className="panel-heading">
              <div className="row">
                <div className="col-md-12" style={{ textAlign: "center" }}>
                  <p>{permit.authority}</p>
                </div>
              </div>
              <div className="row">
                <div className="col-md-8">
                  <p> Permit Number: {permit.permit_number}</p>
                </div>
                <div className="col-md-4">
                  <p>
                    {" "}Status:{" "}
                    <span
                      className={active ? "status-active" : "status-inactive"}
                      style={{ color: active ? "green" : "red" }}
                    >
                      {permit.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <table>
              <tbody>
                <tr>
                  <td>
                    <div>
                      <span className="bold">Surname:</span>
                      <span className="uppercase"> {permit.surname}</span>
                    </div>
                    {permit.first_name && (
                      <div>
                        <span className="bold">First Name:</span>
                        <span className="capitalize"> {permit.first_name}</span>
                      </div>
                    )}
                    <div>
                      <span className="bold">Nationality:</span> {permit.nationality}
                    </div>
                  </td>
                  <td>
                    <div>
                      {photoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="passport-photo" src={photoUrl} alt="Passport photograph" />
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    {permit.employer && (
                      <div>
                        <span className="bold">Name of Employer:</span> {permit.employer}
                      </div>
                    )}
                    <div>
                      <span className="bold">Post Held:</span> {permit.post_held}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div>
                      <span className="bold">Passport Number:</span> {permit.passport_number}
                    </div>
                    <div>
                      <span className="bold">Gender:</span>{" "}
                      <span className="capitalize">{permit.gender}</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="bold">Date of Birth:</span>{" "}
                      {formatDate(permit.date_of_birth)}
                    </div>
                    <div>
                      <span className="bold">Validity: From </span>
                      {formatDate(permit.valid_from)} <span className="bold">To </span>
                      {formatDate(permit.valid_to)}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="panel-body">
              <div>
                <span className="bold">Conditions:</span>
              </div>
              <ol type="1">
                {conditions.map((condition, index) => (
                  <li key={index}>{condition}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PermitNotFoundPanel() {
  return (
    <div className="publicSearchContainer">
      <div className="row infoPannel">
        <div className="col-md-12">
          <div className="panel panel-warning">
            <div className="panel-heading">Permit not found</div>
            <div className="panel-body">
              <p>There is no record of a permit based on the information given.</p>
              <p>
                For more information about your licence state contact{" "}
                <a href="mailto:nels@edbmauritius.org">nels@edbmauritius.org</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
