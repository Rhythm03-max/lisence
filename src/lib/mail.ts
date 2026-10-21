import nodemailer, { type Transporter } from "nodemailer";

export interface MailAttachment {
  filename: string;
  content: Uint8Array;
  contentType?: string;
}

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: MailAttachment[];
}

export interface MailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

/**
 * Sends mail through your own SMTP server. Configure the following environment
 * variables to enable delivery:
 *
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_SECURE ("true"/"false"),
 *   SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_FROM_NAME
 *
 * When SMTP_HOST is not set, delivery is skipped and logged — approvals never
 * fail because mail could not be sent.
 */
export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

let cached: Transporter | null = null;

function getTransport(): Transporter | null {
  if (!mailConfigured()) return null;
  if (cached) return cached;

  const port = Number(process.env.SMTP_PORT ?? 587);
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  return cached;
}

function fromAddress(): string {
  const email = process.env.MAIL_FROM ?? process.env.SMTP_USER ?? "no-reply@localhost";
  const name = process.env.MAIL_FROM_NAME ?? "National Electronic Licensing System";
  return `${name} <${email}>`;
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  const transport = getTransport();
  if (!transport) {
    console.warn(`[mail] SMTP not configured; skipped email to ${input.to}: ${input.subject}`);
    return { ok: false, skipped: true };
  }

  try {
    await transport.sendMail({
      from: fromAddress(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: Buffer.from(attachment.content),
        contentType: attachment.contentType ?? "application/pdf",
      })),
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown mail error";
    console.error(`[mail] Failed to send to ${input.to}: ${message}`);
    return { ok: false, error: message };
  }
}
