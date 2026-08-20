"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Inbox } from "lucide-react";
import { useGetBookings, useUpdateBookingStatus } from "@/hooks/useBookings";
import DateFilter from "./DateFilter";
import BookingCard from "./BookingCard";

const COLUMN_CONFIG = [
  { id: "booking", label: "Booking Confirmed", icon: "📅", color: "#8b5cf6", status: "CONFIRMED" },
  { id: "feedback", label: "Feedback", icon: "💬", color: "#3b82f6", status: "FEEDBACK" },
  { id: "completed", label: "Completed", icon: "✅", color: "#16a34a", status: "COMPLETED" },
];

function filterByDate(bookings, dateFilter) {
  if (dateFilter === "all") return bookings;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return bookings.filter((b) => {
    if (!b.scheduledDate) return false;
    try {
      const bookingDate = new Date(b.scheduledDate);
      bookingDate.setHours(0, 0, 0, 0);

      switch (dateFilter) {
        case "today":
          return bookingDate.getTime() === today.getTime();
        case "yesterday": {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return bookingDate.getTime() === yesterday.getTime();
        }
        case "week": {
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          return bookingDate >= weekStart && bookingDate <= weekEnd;
        }
        case "year":
          return bookingDate.getFullYear() === today.getFullYear();
        default:
          return true;
      }
    } catch {
      return false;
    }
  });
}

export default function BookingsBoard({ poojaType, title, subtitle }) {
  const { status } = useSession();
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState("today");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const { data: bookingsData, isLoading } = useGetBookings(null, poojaType, "ALL");
  const updateStatus = useUpdateBookingStatus();

  const allBookings = bookingsData?.data || [];

  const filteredBookings = useMemo(
    () => filterByDate(allBookings, dateFilter),
    [allBookings, dateFilter]
  );

  const columnBookings = useMemo(() => {
    const map = {};
    COLUMN_CONFIG.forEach((col) => {
      map[col.id] = filteredBookings.filter((b) => b.status === col.status);
    });
    return map;
  }, [filteredBookings]);

  const handleStatusChange = async (bookingId, newStatus, videoLink, certificateUrl) => {
    await updateStatus.mutateAsync({ bookingId, status: newStatus, videoLink, certificateUrl });
  };

  // Single loading gate — no duplicate spinners
  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-4 md:px-6 py-6 border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-500 text-sm mt-1 mb-4">{subtitle}</p>
          <DateFilter selectedFilter={dateFilter} onFilterChange={setDateFilter} />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-200 text-gray-400">
              <Inbox size={40} className="mb-3" />
              <p className="font-medium text-gray-600">No bookings found</p>
              <p className="text-sm mt-1">Try a different date filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {COLUMN_CONFIG.map((column) => {
                const bookings = columnBookings[column.id];
                return (
                  <div key={column.id} className="flex flex-col">
                    {/* Column Header */}
                    <div
                      className="bg-white rounded-t-xl px-4 py-3.5 border-b-4"
                      style={{ borderColor: column.color }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{column.icon}</span>
                          <p className="text-sm font-semibold text-gray-800">{column.label}</p>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                          style={{ background: column.color }}
                        >
                          {bookings.length}
                        </span>
                      </div>
                    </div>

                    {/* Column Body */}
                    <div className="flex-1 space-y-3 min-h-[400px] max-h-[70vh] overflow-y-auto p-3 bg-gray-50/50 rounded-b-xl border border-t-0 border-gray-100">
                      {bookings.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-sm text-gray-400">
                          No poojas here yet
                        </div>
                      ) : (
                        bookings.map((booking) => (
                          <BookingCard
                            key={booking.id}
                            booking={booking}
                            onStatusChange={handleStatusChange}
                            isPending={updateStatus.isPending}
                            columnId={column.id}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}