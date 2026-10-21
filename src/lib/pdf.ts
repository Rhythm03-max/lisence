import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import QRCode from "qrcode";

const BLUE = rgb(0.125, 0.475, 0.718);
const NAVY = rgb(0.09, 0.208, 0.314);
const YELLOW = rgb(1, 0.78, 0.267);
const GREEN = rgb(0.149, 0.6, 0.475);
const SLATE = rgb(0.357, 0.38, 0.498);
const BAND = rgb(0.945, 0.957, 0.969);
const LINE = rgb(0.82, 0.85, 0.88);
const DARK = rgb(0.11, 0.12, 0.14);
const WHITE = rgb(1, 1, 1);

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;

export interface ConfirmationPdfInput {
  reference: string;
  permitName: string;
  authority?: string | null;
  applicantName: string;
  applicantEmail?: string | null;
  submittedAt?: string | null;
  formData: Record<string, unknown>;
  documents: { document_type: string; file_name?: string | null }[];
  siteUrl?: string;
}

export interface CertificatePdfInput {
  permitNumber: string;
  status: string;
  authority: string;
  surname: string;
  firstName: string;
  nationality?: string | null;
  gender?: string | null;
  passportNumber?: string | null;
  dateOfBirth?: string | null;
  employer?: string | null;
  postHeld?: string | null;
  issuedDate?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  conditions?: string[] | null;
  permitName?: string | null;
  photoBytes?: Uint8Array | null;
  photoType?: "png" | "jpg" | null;
  qrData: string;
  verifyUrl?: string;
}

const FIELD_LABELS: Record<string, string> = {
  business_name: "Proposed business / activity name",
  business_address: "Proposed business address",
  contact_address: "Correspondence address",
  contact_phone: "Contact phone",
  contact_email: "Contact email",
  title: "Title",
  first_name: "First name",
  surname: "Surname",
  other_names: "Other names",
  nationality: "Nationality",
  gender: "Gender",
  passport_number: "Passport number",
  date_of_birth: "Date of birth",
  employer: "Name of employer",
  post_held: "Post held",
  valid_to: "Requested validity end",
  declaration: "Declaration accepted",
};

function prettifyKey(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function truncate(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && font.widthOfTextAtSize(`${out}…`, size) > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

interface HeaderOptions {
  title: string;
  subtitle?: string;
  kicker?: string;
}

function drawHeader(
  page: PDFPage,
  fonts: { bold: PDFFont; regular: PDFFont },
  { title, subtitle, kicker = "GOVERNMENT OF MAURITIUS" }: HeaderOptions,
): void {
  const { width, height } = page.getSize();
  const bandHeight = 104;
  page.drawRectangle({ x: 0, y: height - bandHeight, width, height: bandHeight, color: NAVY });
  page.drawRectangle({ x: 0, y: height - bandHeight, width, height: 5, color: YELLOW });

  page.drawText(kicker, {
    x: MARGIN,
    y: height - 44,
    size: 10,
    font: fonts.bold,
    color: YELLOW,
  });
  page.drawText(title, {
    x: MARGIN,
    y: height - 74,
    size: 21,
    font: fonts.bold,
    color: WHITE,
  });
  if (subtitle) {
    page.drawText(truncate(subtitle, fonts.regular, 10.5, width - MARGIN * 2), {
      x: MARGIN,
      y: height - 92,
      size: 10.5,
      font: fonts.regular,
      color: rgb(0.85, 0.89, 0.93),
    });
  }
}

interface FieldRow {
  label: string;
  value: string;
}

function drawFieldGrid(
  page: PDFPage,
  fonts: { bold: PDFFont; regular: PDFFont },
  rows: FieldRow[],
  startY: number,
  topPad = 0,
): number {
  const { width } = page.getSize();
  const innerWidth = width - MARGIN * 2 - 28;
  const colGap = 18;
  const colWidth = (innerWidth - colGap) / 2;
  const rowHeight = 40;
  let y = startY - topPad;
  let col = 0;

  const rowsNeeded = Math.ceil(rows.length / 2);
  page.drawRectangle({
    x: MARGIN,
    y: y - rowsNeeded * rowHeight - 10,
    width: width - MARGIN * 2,
    height: rowsNeeded * rowHeight + 16,
    color: WHITE,
    borderColor: LINE,
    borderWidth: 1,
  });

  for (const row of rows) {
    const x = MARGIN + 14 + col * (colWidth + colGap);
    const baseline = y - 6;
    page.drawText(row.label.toUpperCase(), {
      x,
      y: baseline,
      size: 7.5,
      font: fonts.bold,
      color: SLATE,
    });
    const valueLines = wrap(row.value, fonts.regular, 11, colWidth - 4).slice(0, 2);
    valueLines.forEach((line, i) => {
      page.drawText(line, {
        x,
        y: baseline - 14 - i * 13,
        size: 11,
        font: fonts.regular,
        color: DARK,
      });
    });
    col += 1;
    if (col === 2) {
      col = 0;
      y -= rowHeight;
    }
  }
  if (col !== 0) y -= rowHeight;

  return y - 22;
}

function drawSectionTitle(
  page: PDFPage,
  fonts: { bold: PDFFont },
  label: string,
  y: number,
): number {
  page.drawText(label.toUpperCase(), {
    x: MARGIN,
    y,
    size: 10,
    font: fonts.bold,
    color: BLUE,
  });
  page.drawLine({
    start: { x: MARGIN, y: y - 6 },
    end: { x: page.getSize().width - MARGIN, y: y - 6 },
    thickness: 1,
    color: LINE,
  });
  return y - 22;
}

export async function buildConfirmationPdf(input: ConfirmationPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fonts = { regular, bold };
  const page = pdf.addPage(A4);
  const { width, height } = page.getSize();

  drawHeader(page, fonts, {
    title: "Application Acknowledgement",
    subtitle: input.permitName,
  });

  let y = height - 140;
  page.drawText("Your application has been received", {
    x: MARGIN,
    y,
    size: 15,
    font: bold,
    color: DARK,
  });
  y -= 18;
  const intro =
    "Thank you. This document confirms that the National Electronic Licensing System has received your application. " +
    "It is an acknowledgement of receipt and is not a permit. Keep your reference number for future correspondence.";
  for (const line of wrap(intro, regular, 10.5, width - MARGIN * 2)) {
    page.drawText(line, { x: MARGIN, y, size: 10.5, font: regular, color: SLATE });
    y -= 14;
  }

  y -= 10;
  y = drawSectionTitle(page, fonts, "Application summary", y);
  y = drawFieldGrid(
    page,
    fonts,
    [
      { label: "Reference", value: input.reference },
      { label: "Status", value: "Submitted" },
      { label: "Permit applied for", value: input.permitName },
      { label: "Issuing authority", value: input.authority || "Government of Mauritius" },
      { label: "Applicant", value: input.applicantName || "—" },
      { label: "Contact email", value: input.applicantEmail || "—" },
      { label: "Date submitted", value: formatDate(input.submittedAt) },
      { label: "Generated", value: formatDate(new Date().toISOString()) },
    ],
    y,
  );

  const detailRows = Object.entries(input.formData ?? {}).map(([key, value]) => ({
    label: prettifyKey(key),
    value: formatValue(value),
  }));

  if (detailRows.length) {
    y = drawSectionTitle(page, fonts, "Application details", y);
    y = drawFieldGrid(page, fonts, detailRows, y);
  }

  y = drawSectionTitle(page, fonts, "Documents received", y);
  if (!input.documents.length) {
    page.drawText("No documents were attached to this application.", {
      x: MARGIN,
      y,
      size: 10.5,
      font: regular,
      color: SLATE,
    });
    y -= 20;
  } else {
    for (const doc of input.documents) {
      page.drawText("•", { x: MARGIN, y, size: 11, font: bold, color: BLUE });
      const label = `${doc.document_type}${doc.file_name ? `  (${doc.file_name})` : ""}`;
      page.drawText(truncate(label, regular, 10.5, width - MARGIN * 2 - 18), {
        x: MARGIN + 14,
        y,
        size: 10.5,
        font: regular,
        color: DARK,
      });
      y -= 16;
    }
  }

  const footer = `Reference ${input.reference} · Generated ${new Date().toLocaleString("en-GB")}${
    input.siteUrl ? ` · ${input.siteUrl}` : ""
  }`;
  page.drawLine({
    start: { x: MARGIN, y: 58 },
    end: { x: width - MARGIN, y: 58 },
    thickness: 1,
    color: LINE,
  });
  page.drawText(truncate(footer, regular, 8, width - MARGIN * 2), {
    x: MARGIN,
    y: 42,
    size: 8,
    font: regular,
    color: SLATE,
  });

  return pdf.save();
}

export async function buildCertificatePdf(input: CertificatePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fonts = { regular, bold };
  const page = pdf.addPage(A4);
  const { width, height } = page.getSize();

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.98, 0.99, 1) });
  page.drawRectangle({
    x: 18,
    y: 18,
    width: width - 36,
    height: height - 36,
    borderColor: BLUE,
    borderWidth: 3,
    color: WHITE,
  });
  page.drawRectangle({
    x: 26,
    y: 26,
    width: width - 52,
    height: height - 52,
    borderColor: YELLOW,
    borderWidth: 1,
  });

  drawHeader(page, fonts, {
    title: input.permitName || "Permit",
    subtitle: input.authority,
    kicker: "GOVERNMENT OF MAURITIUS · OFFICIAL PERMIT",
  });

  const statusColor = input.status.toLowerCase() === "active" ? GREEN : input.status.toLowerCase() === "cancelled" ? rgb(0.8, 0.27, 0.24) : SLATE;

  let y = height - 150;
  page.drawText("PERMIT NUMBER", { x: MARGIN, y, size: 8, font: bold, color: SLATE });
  page.drawText(input.permitNumber, { x: MARGIN, y: y - 26, size: 22, font: bold, color: NAVY });
  page.drawText(`STATUS: ${input.status.toUpperCase()}`, {
    x: width - MARGIN - bold.widthOfTextAtSize(`STATUS: ${input.status.toUpperCase()}`, 10),
    y: y - 22,
    size: 10,
    font: bold,
    color: statusColor,
  });

  const photoWidth = 108;
  const photoHeight = 132;
  const photoX = width - MARGIN - photoWidth;
  const photoY = y - 48 - photoHeight;
  if (input.photoBytes && input.photoType) {
    try {
      const image =
        input.photoType === "png"
          ? await pdf.embedPng(input.photoBytes)
          : await pdf.embedJpg(input.photoBytes);
      page.drawRectangle({ x: photoX - 2, y: photoY - 2, width: photoWidth + 4, height: photoHeight + 4, color: BAND, borderColor: LINE, borderWidth: 1 });
      page.drawImage(image, { x: photoX, y: photoY, width: photoWidth, height: photoHeight });
    } catch {
      drawPhotoPlaceholder(page, fonts, photoX, photoY, photoWidth, photoHeight);
    }
  } else {
    drawPhotoPlaceholder(page, fonts, photoX, photoY, photoWidth, photoHeight);
  }

  const detailRows: FieldRow[] = [
    { label: "Surname", value: input.surname || "—" },
    { label: "First name", value: input.firstName || "—" },
    { label: "Nationality", value: input.nationality || "—" },
    { label: "Gender", value: input.gender || "—" },
    { label: "Passport number", value: input.passportNumber || "—" },
    { label: "Date of birth", value: formatDate(input.dateOfBirth) },
    { label: "Name of employer", value: input.employer || "—" },
    { label: "Post held", value: input.postHeld || "—" },
    { label: "Date of issue", value: formatDate(input.issuedDate) },
    { label: "Valid from", value: formatDate(input.validFrom) },
    { label: "Valid to", value: formatDate(input.validTo) },
    { label: "Issuing authority", value: input.authority || "—" },
  ];
  y = drawFieldGrid(page, fonts, detailRows, y - 30, 0);

  const conditions = (input.conditions ?? []).filter(Boolean);
  if (conditions.length) {
    y = drawSectionTitle(page, fonts, "Conditions", y);
    for (const condition of conditions) {
      const lines = wrap(condition, regular, 10.5, width - MARGIN * 2 - 18);
      page.drawText("•", { x: MARGIN, y, size: 11, font: bold, color: BLUE });
      lines.forEach((line, i) => {
        page.drawText(line, { x: MARGIN + 14, y: y - i * 14, size: 10.5, font: regular, color: DARK });
      });
      y -= lines.length * 14 + 6;
    }
  }

  const qrSize = 118;
  const qrPng = await QRCode.toBuffer(input.qrData, {
    margin: 0,
    width: 480,
    errorCorrectionLevel: "M",
    color: { dark: "#0d2a3f", light: "#ffffff" },
  });
  const qrImage = await pdf.embedPng(qrPng);
  const qrX = width - MARGIN - qrSize - 6;
  const qrY = 92;
  page.drawRectangle({ x: qrX - 6, y: qrY - 6, width: qrSize + 12, height: qrSize + 12, color: WHITE, borderColor: LINE, borderWidth: 1 });
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  page.drawText("Scan to verify online", {
    x: qrX - 6,
    y: qrY - 20,
    size: 8,
    font: bold,
    color: SLATE,
  });

  page.drawText("Authorised Officer", {
    x: MARGIN,
    y: 132,
    size: 10,
    font: bold,
    color: DARK,
  });
  page.drawLine({
    start: { x: MARGIN, y: 112 },
    end: { x: MARGIN + 180, y: 112 },
    thickness: 1,
    color: SLATE,
  });
  page.drawText("National Electronic Licensing System", {
    x: MARGIN,
    y: 98,
    size: 8.5,
    font: regular,
    color: SLATE,
  });
  if (input.verifyUrl) {
    page.drawText(truncate(input.verifyUrl, regular, 8, width - MARGIN * 2), {
      x: MARGIN,
      y: 84,
      size: 8,
      font: regular,
      color: BLUE,
    });
  }

  return pdf.save();
}

function drawPhotoPlaceholder(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  page.drawRectangle({ x, y, width: w, height: h, color: BAND, borderColor: LINE, borderWidth: 1 });
  const label = "PHOTO";
  page.drawText(label, {
    x: x + (w - fonts.bold.widthOfTextAtSize(label, 9)) / 2,
    y: y + h / 2,
    size: 9,
    font: fonts.bold,
    color: SLATE,
  });
}
