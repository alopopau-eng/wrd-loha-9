"use client"

import { ReactNode } from "react"

interface DataBubbleProps {
  title: string
  data: Record<string, any>
  timestamp?: string | Date
  status?: "pending" | "approved" | "rejected"
  showActions?: boolean
  isLatest?: boolean
  actions?: ReactNode
  icon?: string
  color?: "blue" | "green" | "purple" | "orange" | "pink" | "indigo" | "gray"
  layout?: "vertical" | "horizontal"
}

export function DataBubble({
  title,
  data,
  timestamp,
  status,
  showActions,
  isLatest,
  actions,
  icon,
  color,
  layout = "vertical"
}: DataBubbleProps) {
  // Get status badge
  const getStatusBadge = () => {
    if (!status) return null
    
    const badges: Record<string, { text: string; className: string }> = {
      pending: { text: "⏳ قيد المراجعة", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      approved: { text: "✓ تم القبول", className: "bg-green-100 text-green-800 border-green-300" },
      rejected: { text: "✗ تم الرفض", className: "bg-red-100 text-red-800 border-red-300" },
      approved_with_otp: { text: "🔑 تحول OTP", className: "bg-blue-100 text-blue-800 border-blue-300" },
      approved_with_pin: { text: "🔐 تحول PIN", className: "bg-purple-100 text-purple-800 border-purple-300" },
      resend: { text: "🔄 إعادة إرسال", className: "bg-orange-100 text-orange-800 border-orange-300" }
    }
    
    const badge = badges[status]
    if (!badge) return null
    
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-bold border ${badge.className}`}>
        {badge.text}
      </span>
    )
  }

  // Get color styles
  const getColorStyles = () => {
    const colors = {
      blue: {
        gradient: 'from-blue-600 via-blue-500 to-blue-700',
        border: 'border-blue-400',
        iconBg: 'bg-blue-500',
        titleColor: 'text-blue-900'
      },
      green: {
        gradient: 'from-green-600 via-green-500 to-green-700',
        border: 'border-green-400',
        iconBg: 'bg-green-500',
        titleColor: 'text-green-900'
      },
      purple: {
        gradient: 'from-purple-600 via-purple-500 to-purple-700',
        border: 'border-purple-400',
        iconBg: 'bg-purple-500',
        titleColor: 'text-purple-900'
      },
      orange: {
        gradient: 'from-orange-600 via-orange-500 to-orange-700',
        border: 'border-orange-400',
        iconBg: 'bg-orange-500',
        titleColor: 'text-orange-900'
      },
      pink: {
        gradient: 'from-pink-600 via-pink-500 to-pink-700',
        border: 'border-pink-400',
        iconBg: 'bg-pink-500',
        titleColor: 'text-pink-900'
      },
      indigo: {
        gradient: 'from-indigo-600 via-indigo-500 to-indigo-700',
        border: 'border-indigo-400',
        iconBg: 'bg-indigo-500',
        titleColor: 'text-indigo-900'
      },
      gray: {
        gradient: 'from-gray-700 via-gray-600 to-gray-800',
        border: 'border-gray-400',
        iconBg: 'bg-gray-500',
        titleColor: 'text-gray-900'
      }
    }
    
    return colors[color || 'blue']
  }
  
  const colorStyles = getColorStyles()

  // Format timestamp to match screenshot format (12-10 | 7:45 pm)
  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    let hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'pm' : 'am'
    hours = hours % 12 || 12
    
    return `${month}-${day} | ${hours}:${minutes} ${ampm}`
  }

  // Format relative time
  const formatRelativeTime = (timestamp: string | Date) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    
    if (diffMs < 0) return 'الآن'
    
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffSecs < 10) return 'الآن'
    if (diffSecs < 60) return 'منذ لحظات'
    if (diffMins === 1) return 'منذ دقيقة'
    if (diffMins < 60) return `منذ ${diffMins} د`
    if (diffHours === 1) return 'منذ ساعة'
    if (diffHours < 24) return `منذ ${diffHours} س`
    if (diffDays === 1) return 'منذ يوم'
    return `منذ ${diffDays} يوم`
  }

  // Check if this is a card data bubble (has card-specific fields)
  const isCardData = title === "معلومات البطاقة" || data["رقم البطاقة"] || data["نوع البطاقة"]

  // Render credit card style for card data (both layouts use same design)
  if (isCardData) {
    let cardNumber = data["رقم البطاقة"] || data["Card Number"] || "•••• •••• •••• ••••"
    // Format card number with spaces (4 digits per group)
    if (cardNumber && !cardNumber.includes(' ')) {
      cardNumber = cardNumber.match(/.{1,4}/g)?.join(' ') || cardNumber
    }
    const expiryDate = data["تاريخ الانتهاء"] || data["Expiry"] || "••/••"
    const cvv = data["CVV"] || data["الكود"] || "•••"
    const holderName = data["اسم حامل البطاقة"] || data["Card Holder"] || "CARD HOLDER"
    const cardType = data["نوع البطاقة"] || data["Card Type"] || data["البنك"] || "CARD"
    
    return (
      <div className="bg-gray-50 rounded-lg p-2 border border-gray-300" style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}>
        {/* Header - Timestamp and Title */}
        <div className="mb-2">
          {timestamp && (
            <div className="text-[10px] text-gray-500 text-right mb-0.5">
              {formatTimestamp(timestamp)}
            </div>
          )}
          <h3 className="text-sm font-bold text-gray-800 text-center">{title}</h3>
        </div>

        {/* Credit Card */}
        <div 
          className={`relative bg-gradient-to-br ${colorStyles.gradient} rounded-lg shadow-md p-3 text-white overflow-hidden mb-2`}
          style={{ aspectRatio: '1.8/1' }}
        >
          {/* Card Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>

          {/* Card Content */}
          <div className="relative h-full flex flex-col justify-between">
            {/* Top Section - Icon */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {icon && <span className="text-3xl">{icon}</span>}
              </div>
              {isLatest && (
                <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-bold rounded-full">
                  ⭐
                </span>
              )}
            </div>

            {/* Middle Section - Card Number */}
            <div className="flex flex-col gap-1 my-2">
              <div 
                className="text-2xl font-bold tracking-wider text-center"
                style={{ direction: "ltr", fontFamily: "'Courier New', monospace", letterSpacing: '0.08em' }}
              >
                {cardNumber}
              </div>
            </div>

            {/* Bottom Section - Expiry, CVV & Holder */}
            <div className="flex items-end justify-between mt-auto">
              <div className="flex gap-4 text-base">
                <div>
                  <div className="text-xs opacity-70">تاريخ الانتهاء</div>
                  <div className="font-bold text-lg" style={{ direction: "ltr" }}>{expiryDate}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70">CVV</div>
                  <div className="font-bold text-lg" style={{ direction: "ltr" }}>{cvv}</div>
                </div>
              </div>
              <div className="text-right text-base">
                <div className="text-xs opacity-70">اسم حامل البطاقة</div>
                <div className="font-bold uppercase text-base">{holderName}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Status and Actions */}
        <div className="flex items-center justify-between">
          <div>
            {getStatusBadge()}
          </div>
          {showActions && actions && (
            <div>
              {actions}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Check if this is a numeric display (PIN, OTP only - exclude Phone)
  const isPinOrOtp = title.includes("PIN") || title.includes("رمز") || title.includes("كلمة مرور") || title.includes("OTP") || title.includes("كود")
  
  // Get the main value to display in digit boxes
  let digitValue = ""
  if (isPinOrOtp) {
    // Find the numeric value (usually the first or only value)
    const entries = Object.entries(data)
    if (entries.length > 0) {
      digitValue = entries[0][1]?.toString() || ""
    }
  }

  // Default layout for non-card data (OTP, PIN, etc.)
    return (
      <div className="bg-gray-50 rounded-lg p-2 border border-gray-300" style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      {/* Header - Timestamp and Title */}
      <div className="mb-2">
        {timestamp && (
          <div className="text-[10px] text-gray-500 text-right mb-0.5">
            {formatTimestamp(timestamp)}
          </div>
        )}
        <h3 className="text-sm font-bold text-gray-800 text-center">{title}</h3>
      </div>

      {/* Content - Digit Boxes for PIN/OTP or Regular Display */}
      {isPinOrOtp && digitValue ? (
        <div className="flex justify-center gap-1 mb-2" style={{ direction: 'ltr' }}>
          {digitValue.split('').map((digit, index) => (
            <div 
              key={index}
              className="bg-white rounded shadow-sm flex items-center justify-center w-8 h-10"
            >
              <span className="text-xl font-bold text-gray-900">{digit}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded p-2 shadow-sm mb-2">
          <div className="space-y-2">
            {Object.entries(data).map(([key, value]) => {
              if (value === undefined || value === null) return null
              return (
                <div key={key} className="flex justify-between items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-600">{key}:</span>
                  <span className="text-gray-900 font-bold text-right">
                    {value?.toString() || "-"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer - Status and Actions */}
      <div className="flex items-center justify-between">
        <div>
          {getStatusBadge()}
        </div>
        {showActions && actions && (
          <div>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
