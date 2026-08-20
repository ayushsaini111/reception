// src/app/admin/calendar/page.jsx
"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, X, Check, AlertCircle } from "lucide-react";
// import { useSession } from "next-auth/react";
// import { useRouter } from "next/navigation";

const TIME_SLOTS = [
  { value: "8-12", label: "Morning", time: "8:00 AM - 12:00 PM" },
  { value: "12-15", label: "Afternoon", time: "12:00 PM - 3:00 PM" },
  { value: "15-19", label: "Evening", time: "3:00 PM - 7:00 PM" },
  { value: "19-22", label: "Night", time: "7:00 PM - 10:00 PM" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// ✅ NEW: Local (IST-safe) date formatter — avoids UTC shift from toISOString()
function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CalendarManagementPage() {
//   const { data: session, status } = useSession();
//   const router = useRouter();

  const currentDate = new Date();
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [availability, setAvailability] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     if (status === "unauthenticated") {
//       router.push("/login");
//     }
//   }, [status, router]);

  useEffect(() => {
    fetchAvailability();
  }, [currentYear, currentMonth]);

  async function fetchAvailability() {
    setLoading(true);
    try {
      const res = await fetch(
        `/backend/admins/calendar?year=${currentYear}&month=${currentMonth}`
      );
      const data = await res.json();

      if (data.success) {
        const availabilityMap = {};
        data.availability.forEach((item) => {
          // ✅ fixed — was: new Date(item.date).toISOString().split("T")[0]
          const dateKey = toLocalDateString(new Date(item.date));
          availabilityMap[dateKey] = item;
        });
        setAvailability(availabilityMap);
      }
    } catch (error) {
      console.error("Failed to fetch availability:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleDateAvailability(date) {
    const dateKey = toLocalDateString(date); // ✅ fixed
    const current = availability[dateKey];

    setSaving(true);
    try {
      const res = await fetch(`/backend/admins/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey,
          isAvailable: !current?.isAvailable,
          timeSlots: current?.timeSlots || {
            "8-12": true,
            "12-15": true,
            "15-19": true,
            "19-22": true,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAvailability((prev) => ({
          ...prev,
          [dateKey]: data.availability,
        }));
      }
    } catch (error) {
      console.error("Failed to update:", error);
      alert("Failed to update availability");
    } finally {
      setSaving(false);
    }
  }

  async function updateTimeSlot(slotValue, isAvailable) {
    if (!selectedDate) return;

    const dateKey = toLocalDateString(selectedDate); // ✅ fixed
    const current = availability[dateKey];
    const updatedSlots = {
      ...(current?.timeSlots || {
        "8-12": true,
        "12-15": true,
        "15-19": true,
        "19-22": true,
      }),
      [slotValue]: isAvailable,
    };

    setSaving(true);
    try {
      const res = await fetch(`/backend/admins/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey,
          isAvailable: current?.isAvailable ?? true,
          timeSlots: updatedSlots,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAvailability((prev) => ({
          ...prev,
          [dateKey]: data.availability,
        }));
      }
    } catch (error) {
      console.error("Failed to update slot:", error);
      alert("Failed to update time slot");
    } finally {
      setSaving(false);
    }
  }

  function getDaysInMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }

  function canGoPrevious() {
    const today = new Date();
    const currentViewDate = new Date(currentYear, currentMonth, 1);
    const todayFirstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return currentViewDate > todayFirstOfMonth;
  }

  function handlePrevious() {
    if (!canGoPrevious()) return;

    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function handleNext() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  function getDisabledSlotLabels(dayAvailability) {
    if (!dayAvailability?.timeSlots) return [];
    return TIME_SLOTS
      .filter((slot) => dayAvailability.timeSlots[slot.value] === false)
      .map((slot) => slot.label);
  }

  const days = getDaysInMonth(currentYear, currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <CalendarIcon className="text-purple-600" size={32} />
            Calendar Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage booking availability for dates and time slots
          </p>
        </div>

        {/* Month/Year Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious()}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
          </div>

          <button
            onClick={handleNext}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Next →
          </button>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
              <span>Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
              <span>Past Date</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded"></div>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading calendar...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-sm text-gray-600 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square"></div>;
                  }

                  const dateKey = toLocalDateString(date); // ✅ fixed
                  const dayAvailability = availability[dateKey];
                  const isAvailable = dayAvailability?.isAvailable ?? true;
                  const isPast = date < today;
                  const isToday = date.getTime() === today.getTime();

                  const allSlotsDisabled = dayAvailability?.timeSlots &&
                    Object.values(dayAvailability.timeSlots).every(v => !v);

                  const canManageSlots = !isPast && isAvailable;

                  const disabledSlotLabels = getDisabledSlotLabels(dayAvailability);

                  return (
                    <div
                      key={dateKey}
                      className="aspect-square relative group"
                    >
                      <button
                        onClick={() => {
                          if (!isPast) {
                            toggleDateAvailability(date);
                          }
                        }}
                        disabled={isPast || saving}
                        className={`
                          w-full h-full rounded-lg border-2 transition-all
                          ${isPast ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-50" :
                            isToday ? "border-blue-500 bg-blue-50" :
                            !isAvailable || allSlotsDisabled ? "bg-red-100 border-red-500" :
                            "bg-green-100 border-green-500 hover:bg-green-200"}
                          disabled:cursor-not-allowed
                        `}
                      >
                        <div className="flex flex-col items-center justify-center h-full px-1">
                          <span className={`text-lg font-semibold ${
                            isPast ? "text-gray-400" :
                            isToday ? "text-blue-700" :
                            !isAvailable || allSlotsDisabled ? "text-red-700" :
                            "text-green-700"
                          }`}>
                            {date.getDate()}
                          </span>
                          {!isPast && (
                            <span className="text-xs mt-1">
                              {!isAvailable || allSlotsDisabled ? "Blocked" : "Available"}
                            </span>
                          )}

                          {!isPast && isAvailable && !allSlotsDisabled && disabledSlotLabels.length > 0 && (
                            <span className="text-[9px] leading-tight mt-1 text-orange-700 text-center break-words">
                              {disabledSlotLabels.join(", ")} off
                            </span>
                          )}
                        </div>
                      </button>

                      {canManageSlots && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(date);
                            setShowSlotModal(true);
                          }}
                          className="absolute bottom-1 right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Manage time slots"
                        >
                          <Clock size={14} className="text-purple-600" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Time Slot Modal */}
        {showSlotModal && selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">
                  Manage Time Slots
                </h3>
                <button
                  onClick={() => setShowSlotModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900 font-medium">
                  {selectedDate.toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "Asia/Kolkata", // ✅ explicit IST for display
                  })}
                </p>
              </div>

              <div className="space-y-3">
                {TIME_SLOTS.map((slot) => {
                  const dateKey = toLocalDateString(selectedDate); // ✅ fixed
                  const dayAvailability = availability[dateKey];
                  const slotAvailable = dayAvailability?.timeSlots?.[slot.value] ?? true;

                  return (
                    <button
                      key={slot.value}
                      onClick={() => updateTimeSlot(slot.value, !slotAvailable)}
                      disabled={saving}
                      className={`
                        w-full p-4 rounded-lg border-2 transition-all text-left
                        ${slotAvailable
                          ? "border-green-500 bg-green-50 hover:bg-green-100"
                          : "border-red-500 bg-red-50 hover:bg-red-100"}
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold ${slotAvailable ? "text-green-700" : "text-red-700"}`}>
                            {slot.label}
                          </p>
                          <p className={`text-sm ${slotAvailable ? "text-green-600" : "text-red-600"}`}>
                            {slot.time}
                          </p>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          slotAvailable ? "bg-green-500" : "bg-red-500"
                        }`}>
                          {slotAvailable ? (
                            <Check size={16} className="text-white" />
                          ) : (
                            <X size={16} className="text-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-800">
                    Click on a time slot to enable/disable it. Disabled slots won't be available for booking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}