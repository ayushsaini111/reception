"use client";

import { useCreateBooking, useCreateReminders } from "@/hooks/useBookings";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function BookPoojaModal({ pooja, onClose }) {
  const { data: session } = useSession();
  const createBooking = useCreateBooking();
  const createReminders = useCreateReminders();
  const [formData, setFormData] = useState({
    poojaType: "OFFLINE",
    scheduledDate: "",
    scheduledTime: "",
    customerName: session?.user?.name || "",
    customerPhone: "",
    customerEmail: session?.user?.email || "",
    specialRequests: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Create booking
      const bookingRes = await createBooking.mutateAsync({
        userId: session?.user?.id,
        poojaId: pooja.id,
        poojaTitle: pooja.name,
        poojaType: formData.poojaType,
        poojaImage: pooja.image,
        amount: pooja.price,
        originalPrice: pooja.price,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        specialRequests: formData.specialRequests,
      });

      console.log("✅ Booking created:", bookingRes.booking.id);

      // 2. Create reminders for this booking
      await createReminders.mutateAsync(bookingRes.booking.id);

      console.log("✅ Reminders scheduled");

      alert("Booking confirmed! Reminders scheduled.");
      onClose();
    } catch (error) {
      console.error("❌ Booking error:", error);
      alert("Failed to create booking: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-r16 p-s32 max-w-md w-full mx-s16">
        <h2 className="heading-h4 text-main mb-s24">Book {pooja.name}</h2>

        <form onSubmit={handleSubmit} className="space-y-s16">
          {/* Pooja Type */}
          <div>
            <label className="body-small font-medium text-main mb-s8 block">
              Pooja Type
            </label>
            <select
              value={formData.poojaType}
              onChange={(e) =>
                setFormData({ ...formData, poojaType: e.target.value })
              }
              className="w-full px-s16 py-s12 border rounded-r8 body-small"
              style={{ borderColor: "var(--secondary-dark)" }}
            >
              <option value="ONLINE">Online (Video Call)</option>
              <option value="OFFLINE">Offline (At Home)</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="body-small font-medium text-main mb-s8 block">
              Date
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) =>
                setFormData({ ...formData, scheduledDate: e.target.value })
              }
              required
              className="w-full px-s16 py-s12 border rounded-r8 body-small"
              style={{ borderColor: "var(--secondary-dark)" }}
            />
          </div>

          {/* Time */}
          <div>
            <label className="body-small font-medium text-main mb-s8 block">
              Time
            </label>
            <input
              type="time"
              value={formData.scheduledTime}
              onChange={(e) =>
                setFormData({ ...formData, scheduledTime: e.target.value })
              }
              required
              className="w-full px-s16 py-s12 border rounded-r8 body-small"
              style={{ borderColor: "var(--secondary-dark)" }}
            />
          </div>

          {/* Name */}
          <div>
            <label className="body-small font-medium text-main mb-s8 block">
              Your Name
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              required
              className="w-full px-s16 py-s12 border rounded-r8 body-small"
              style={{ borderColor: "var(--secondary-dark)" }}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="body-small font-medium text-main mb-s8 block">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) =>
                setFormData({ ...formData, customerPhone: e.target.value })
              }
              required
              className="w-full px-s16 py-s12 border rounded-r8 body-small"
              style={{ borderColor: "var(--secondary-dark)" }}
            />
          </div>

          {/* Special Requests */}
          <div>
            <label className="body-small font-medium text-main mb-s8 block">
              Special Requests (Optional)
            </label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) =>
                setFormData({ ...formData, specialRequests: e.target.value })
              }
              placeholder="Any special requests or preferences?"
              rows="3"
              className="w-full px-s16 py-s12 border rounded-r8 body-small"
              style={{ borderColor: "var(--secondary-dark)" }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-s16 mt-s24">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-s16 py-s12 rounded-r8 border body-small font-medium"
              style={{ borderColor: "var(--secondary-dark)", color: "var(--text-main)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createBooking.isPending}
              className="flex-1 px-s16 py-s12 rounded-r8 text-white body-small font-medium"
              style={{ background: "var(--primary-main)" }}
            >
              {createBooking.isPending ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}