"use client";

import { useState, useRef, useEffect } from "react";
import { useGetBookings, useUpdateBookingStatus } from "@/hooks/useBookings";

const COLUMN_CONFIG = [
  { id: "ALL", label: "All Bookings", accent: "var(--primary-main)", icon: "📊" },
  { id: "ONLINE", label: "Online", accent: "var(--primary-light)", icon: "🎥" },
  { id: "OFFLINE", label: "Offline", accent: "var(--accent-main)", icon: "🕉️" },
  { id: "DONE", label: "Completed", accent: "#16a34a", icon: "✅" },
];

const statusColors = {
  PENDING: "#f59e0b",
  CONFIRMED: "var(--primary-light)",
  COMPLETED: "#16a34a",
  CANCELLED: "var(--red-main)",
};

export default function AdminPoojaBookingsPage() {
  const [search, setSearch] = useState("");
  const [columnWidths, setColumnWidths] = useState({
    ALL: 340,
    ONLINE: 340,
    OFFLINE: 340,
    DONE: 340,
  });
  const [isDragging, setIsDragging] = useState(null);
  const containerRef = useRef(null);

  // Single fetch for all data
  const { data: bookingsData, isLoading } = useGetBookings(null, "ALL", "ALL");
  const updateStatus = useUpdateBookingStatus();

  const allBookings = bookingsData?.data || [];

  const matchesSearch = (b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.customerName?.toLowerCase().includes(q) ||
      b.customerPhone?.includes(q) ||
      b.customerEmail?.toLowerCase().includes(q) ||
      b.poojaTitle?.toLowerCase().includes(q) ||
      b.id?.toLowerCase().includes(q)
    );
  };

  const buckets = {
    ALL: allBookings.filter(matchesSearch),
    ONLINE: allBookings.filter((b) => b.poojaType === "ONLINE").filter(matchesSearch),
    OFFLINE: allBookings.filter((b) => b.poojaType === "OFFLINE").filter(matchesSearch),
    DONE: allBookings.filter((b) => b.status === "COMPLETED").filter(matchesSearch),
  };

  // Handle column resize
  const handleMouseDown = (colId, e) => {
    e.preventDefault();
    setIsDragging(colId);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const minWidth = 280;
      const maxWidth = 600;

      setColumnWidths((prev) => {
        const currentWidth = prev[isDragging];
        const newWidth = Math.min(maxWidth, Math.max(minWidth, currentWidth + e.movementX));
        return { ...prev, [isDragging]: newWidth };
      });
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateStatus.mutateAsync({ bookingId, status: newStatus });
    } catch (e) {
      alert("Failed to update status: " + e.message);
    }
  };

  // Statistics
  const stats = {
    total: allBookings.length,
    pending: allBookings.filter((b) => b.status === "PENDING").length,
    confirmed: allBookings.filter((b) => b.status === "CONFIRMED").length,
    completed: allBookings.filter((b) => b.status === "COMPLETED").length,
  };

  return (
    <div className="h-screen flex flex-col bg-background" style={{ background: "#f8f9fa" }}>
      {/* Header Section */}
      <div className="px-s24 py-s16 border-b" style={{ borderColor: "var(--secondary-dark)" }}>
        <div className="max-w-7xl mx-auto">
          {/* Title & Search */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-s16 mb-s16">
            <div>
              <h1 className="heading-h2 text-main mb-s4">Pooja Bookings</h1>
              <p className="body-small text-secondary">Manage all bookings across all platforms</p>
            </div>
            <input
              type="text"
              placeholder="🔍 Search by name, phone, email, pooja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-s16 py-s16 border rounded-r16 body-small w-full lg:max-w-sm transition-all focus:outline-none"
              style={{
                borderColor: "var(--secondary-dark)",
                boxShadow: search ? "0 0 0 3px rgba(52, 21, 57, 0.1)" : "none",
              }}
            />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-s16">
            <StatBox label="Total" value={stats.total} color="var(--primary-main)" icon="📊" />
            <StatBox label="Pending" value={stats.pending} color="var(--accent-main)" icon="⏳" />
            <StatBox label="Confirmed" value={stats.confirmed} color="var(--primary-light)" icon="✅" />
            <StatBox label="Completed" value={stats.completed} color="#16a34a" icon="🎉" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-s16"
              style={{
                borderColor: "var(--primary-main)",
                borderTopColor: "transparent",
              }}
            />
            <p className="body-default text-secondary">Loading bookings...</p>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {!isLoading && (
        <div className="flex-1 overflow-x-auto px-s16 py-s16" ref={containerRef}>
          <div className="flex gap-1 h-full pb-s16">
            {COLUMN_CONFIG.map((col) => (
              <div
                key={col.id}
                className="flex flex-col rounded-r16 border bg-white shadow-sm hover:shadow-md transition-shadow"
                style={{
                  borderColor: "var(--secondary-dark)",
                  width: `${columnWidths[col.id]}px`,
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                {/* Column Header */}
                <div
                  className="px-s16 py-s16 flex items-center justify-between border-b sticky top-0 z-20"
                  style={{
                    background: "var(--background)",
                    borderColor: `${col.accent}40`,
                    borderLeftWidth: "4px",
                    borderLeftColor: col.accent,
                  }}
                >
                  <div className="flex items-center gap-s8">
                    <span className="text-s16">{col.icon}</span>
                    <div>
                      <p className="body-small font-semibold text-main">{col.label}</p>
                    </div>
                  </div>
                  <span
                    className="px-s8 py-s4 rounded-r8 text-xs font-bold"
                    style={{
                      background: `${col.accent}20`,
                      color: col.accent,
                    }}
                  >
                    {buckets[col.id].length}
                  </span>
                </div>

                {/* Column Body */}
                <div className="flex-1 overflow-y-auto p-s16 space-y-s16" style={{ background: "#fafafa" }}>
                  {buckets[col.id].length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="body-small text-secondary text-center">
                        No bookings in {col.label.toLowerCase()}
                      </p>
                    </div>
                  ) : (
                    buckets[col.id].map((b) => (
                      <BookingCard
                        key={b.id}
                        booking={b}
                        onStatusChange={handleStatusChange}
                        isPending={updateStatus.isPending}
                      />
                    ))
                  )}
                </div>

                {/* Column Resize Handle */}
                <div
                  onMouseDown={(e) => handleMouseDown(col.id, e)}
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-main transition-colors group"
                  style={{
                    background: isDragging === col.id ? "var(--primary-main)" : "transparent",
                  }}
                  title="Drag to resize"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && allBookings.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="heading-h5 text-main mb-s8">No Bookings Yet</p>
            <p className="body-default text-secondary">Bookings from all sources will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Booking Card Component
function BookingCard({ booking, onStatusChange, isPending }) {
  const statusColors = {
    PENDING: "#f59e0b",
    CONFIRMED: "var(--primary-light)",
    COMPLETED: "#16a34a",
    CANCELLED: "var(--red-main)",
  };

  return (
    <div
      className="rounded-r16 p-s16 bg-background border border-secondary-dark hover:border-primary-main transition-all hover:shadow-md group"
      style={{
        borderColor: "var(--secondary-dark)",
      }}
    >
      {/* Header with Type Badge */}
      <div className="flex items-start justify-between gap-s8 mb-s8">
        <h4 className="body-small font-semibold text-main leading-tight flex-1">
          {booking.poojaTitle}
        </h4>
        <span
          className="text-[10px] font-bold uppercase px-s6 py-s2 rounded-r6 shrink-0 whitespace-nowrap"
          style={{
            background: booking.poojaType === "ONLINE" ? "var(--primary-light)" : "var(--accent-main)",
            color: "#fff",
          }}
        >
          {booking.poojaType}
        </span>
      </div>

      {/* Customer Info */}
      <div className="space-y-s6 mb-s8">
        <div className="flex items-center gap-s6">
          <span className="text-s16">👤</span>
          <p className="body-tiny text-secondary truncate">{booking.customerName}</p>
        </div>
        <div className="flex items-center gap-s6">
          <span className="text-s16">📞</span>
          <p className="body-tiny text-secondary">{booking.customerPhone}</p>
        </div>
        <div className="flex items-center gap-s6">
          <span className="text-s16">📅</span>
          <p className="body-tiny text-secondary">{booking.scheduledDate}</p>
        </div>
        {booking.scheduledTime && booking.scheduledTime !== "00:00" && (
          <div className="flex items-center gap-s6">
            <span className="text-s16">🕐</span>
            <p className="body-tiny text-secondary">{booking.scheduledTime}</p>
          </div>
        )}
        <div className="flex items-center gap-s6">
          <span className="text-s16">💰</span>
          <p className="body-tiny text-secondary font-medium">₹{booking.amount}</p>
        </div>
      </div>

      {/* Payment Status */}
      <div className="mb-s8 pb-s8 border-t" style={{ borderColor: "var(--secondary-dark)" }}>
        <p className="body-tiny text-secondary">
          Payment: <span className="font-semibold text-main">{booking.paymentStatus}</span>
        </p>
      </div>

      {/* Status Selector */}
      <select
        value={booking.status}
        onChange={(e) => onStatusChange(booking.id, e.target.value)}
        disabled={isPending}
        className="w-full px-s8 py-s8 rounded-r8 text-xs font-bold text-white border-none cursor-pointer transition-opacity disabled:opacity-50"
        style={{ background: statusColors[booking.status] }}
      >
        <option value="PENDING">PENDING</option>
        <option value="CONFIRMED">CONFIRMED</option>
        <option value="COMPLETED">COMPLETED</option>
        <option value="CANCELLED">CANCELLED</option>
      </select>

      {/* Status Indicator */}
      <div className="mt-s8 flex items-center gap-s6">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: statusColors[booking.status] }}
        />
        <p className="body-tiny text-secondary">{booking.status}</p>
      </div>
    </div>
  );
}

// Statistics Box Component
function StatBox({ label, value, color, icon }) {
  return (
    <div
      className="rounded-r16 p-s16 border flex items-center justify-between"
      style={{
        background: "white",
        borderColor: "var(--secondary-dark)",
      }}
    >
      <div>
        <p className="caption text-secondary mb-s4">{label}</p>
        <p className="heading-h5" style={{ color }}>
          {value}
        </p>
      </div>
      <span className="text-s32">{icon}</span>
    </div>
  );
}