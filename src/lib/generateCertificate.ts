import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface CertificateData {
  student_name: string;
  team_name: string;
  project_title: string;
  company_name: string;
  cert_type: "Participation" | "LOE" | "Confirmation";
  issue_date: string;
}

/**
 * Generate a professional certificate PDF using pdf-lib (serverless-friendly, no puppeteer).
 * Returns a Uint8Array of the PDF bytes.
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 landscape

  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const timesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const { width, height } = page.getSize();

  // Colors
  const primaryColor = rgb(0.27, 0.35, 0.65); // Deep blue
  const goldColor = rgb(0.75, 0.62, 0.23);     // Gold
  const darkText = rgb(0.15, 0.15, 0.15);
  const lightText = rgb(0.4, 0.4, 0.4);

  // === BORDER ===
  const borderInset = 30;
  page.drawRectangle({
    x: borderInset,
    y: borderInset,
    width: width - 2 * borderInset,
    height: height - 2 * borderInset,
    borderColor: goldColor,
    borderWidth: 3,
  });

  // Inner border
  page.drawRectangle({
    x: borderInset + 8,
    y: borderInset + 8,
    width: width - 2 * (borderInset + 8),
    height: height - 2 * (borderInset + 8),
    borderColor: primaryColor,
    borderWidth: 1,
  });

  // === HEADER ===
  const headerY = height - 80;

  // Type label
  const typeLabels: Record<string, string> = {
    Participation: "CERTIFICATE OF PARTICIPATION",
    LOE: "LETTER OF EXPERIENCE",
    Confirmation: "CERTIFICATE OF CONFIRMATION",
  };
  const certTitle = typeLabels[data.cert_type] || "CERTIFICATE";

  // "PARYUKTAM" brand
  const brandText = "PARYUKTAM";
  const brandWidth = helveticaBold.widthOfTextAtSize(brandText, 14);
  page.drawText(brandText, {
    x: (width - brandWidth) / 2,
    y: headerY + 10,
    size: 14,
    font: helveticaBold,
    color: primaryColor,
  });

  // Main title
  const titleWidth = helveticaBold.widthOfTextAtSize(certTitle, 28);
  page.drawText(certTitle, {
    x: (width - titleWidth) / 2,
    y: headerY - 25,
    size: 28,
    font: helveticaBold,
    color: primaryColor,
  });

  // Decorative line
  page.drawLine({
    start: { x: width / 2 - 120, y: headerY - 40 },
    end: { x: width / 2 + 120, y: headerY - 40 },
    thickness: 2,
    color: goldColor,
  });

  // === BODY ===
  const bodyY = headerY - 80;

  const presentedText = "This is to certify that";
  const ptWidth = helvetica.widthOfTextAtSize(presentedText, 14);
  page.drawText(presentedText, {
    x: (width - ptWidth) / 2,
    y: bodyY,
    size: 14,
    font: helvetica,
    color: lightText,
  });

  // Student name (large)
  const nameWidth = helveticaBold.widthOfTextAtSize(data.student_name, 32);
  page.drawText(data.student_name, {
    x: (width - nameWidth) / 2,
    y: bodyY - 45,
    size: 32,
    font: helveticaBold,
    color: darkText,
  });

  // Underline name
  page.drawLine({
    start: { x: (width - nameWidth) / 2 - 10, y: bodyY - 50 },
    end: { x: (width + nameWidth) / 2 + 10, y: bodyY - 50 },
    thickness: 1,
    color: goldColor,
  });

  // Body text (description varies by type)
  let bodyLines: string[] = [];
  if (data.cert_type === "Participation") {
    bodyLines = [
      `has successfully participated in the project "${data.project_title}"`,
      `as a member of Team "${data.team_name}", commissioned by ${data.company_name}.`,
    ];
  } else if (data.cert_type === "LOE") {
    bodyLines = [
      `has demonstrated professional competency while working on the project`,
      `"${data.project_title}" as a member of Team "${data.team_name}",`,
      `under the supervision of ${data.company_name}.`,
    ];
  } else {
    bodyLines = [
      `has completed and delivered the project "${data.project_title}"`,
      `as part of Team "${data.team_name}", for ${data.company_name}.`,
      `This certificate confirms successful project completion.`,
    ];
  }

  bodyLines.forEach((line, i) => {
    const lineWidth = helvetica.widthOfTextAtSize(line, 13);
    page.drawText(line, {
      x: (width - lineWidth) / 2,
      y: bodyY - 80 - i * 22,
      size: 13,
      font: helvetica,
      color: darkText,
    });
  });

  // === FOOTER ===
  const footerY = 90;

  // Date
  const dateStr = `Issued: ${data.issue_date}`;
  page.drawText(dateStr, {
    x: 80,
    y: footerY,
    size: 11,
    font: helvetica,
    color: lightText,
  });

  // Signature placeholder
  const sigText = "Authorized Signatory";
  const sigWidth = timesItalic.widthOfTextAtSize(sigText, 12);
  page.drawLine({
    start: { x: width - 80 - sigWidth - 20, y: footerY + 15 },
    end: { x: width - 80, y: footerY + 15 },
    thickness: 1,
    color: darkText,
  });
  page.drawText(sigText, {
    x: width - 80 - sigWidth,
    y: footerY,
    size: 12,
    font: timesItalic,
    color: lightText,
  });

  // Platform credit
  const creditText = "Powered by Paryuktam — Real Projects. Real Experience.";
  const creditWidth = helvetica.widthOfTextAtSize(creditText, 9);
  page.drawText(creditText, {
    x: (width - creditWidth) / 2,
    y: 50,
    size: 9,
    font: helvetica,
    color: lightText,
  });

  return await doc.save();
}
