"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export function useGetBookings(userId = null, type = "ALL", status = "ALL") {
  return useQuery({
    queryKey: ["bookings", userId, type, status],
    queryFn: async () => {
      console.log("📡 Fetching bookings...", { userId, type, status });

      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      params.append("type", type);
      params.append("status", status);

      const url = `${BACKEND_URL}/api/admins/bookings/get-all?${params.toString()}`;
      console.log("🔗 URL:", url);

      const res = await fetch(url);

      if (!res.ok) {
        const error = await res.text();
        console.error("❌ Backend error:", error);
        throw new Error(`Backend error: ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ Bookings received:", data.count, "bookings");
      return data;
    },
    refetchInterval: 5000,
    staleTime: 0,
    enabled: true,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData) => {
      console.log("📤 Creating booking...");

      const res = await fetch(`${BACKEND_URL}/api/admins/bookings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (!res.ok) throw new Error("Failed to create booking");

      const data = await res.json();
      console.log("✅ Booking created:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status, videoLink, certificateUrl }) => {
      console.log("🔄 Updating booking status...", { bookingId, status });

      const res = await fetch(`${BACKEND_URL}/api/admins/bookings/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          status,
          videoLink,  // ✅ ADD THIS
          certificateUrl,  // ✅ ADD THIS
        }),
      });

      if (!res.ok) throw new Error("Failed to update booking");

      const data = await res.json();
      console.log("✅ Status updated:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
export function useCreateReminders() {
  return useMutation({
    mutationFn: async (bookingId) => {
      console.log("📲 Creating reminders...", bookingId);

      const res = await fetch(`${BACKEND_URL}/api/admins/bookings/create-reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (!res.ok) throw new Error("Failed to create reminders");

      const data = await res.json();
      console.log("✅ Reminders scheduled:", data);
      return data;
    },
  });
}
export function useGenerateCertificate() {
  return useMutation({
    mutationFn: async (bookingId) => {
      const res = await fetch(`${BACKEND_URL}/api/admins/bookings/generate-certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (!res.ok) throw new Error("Failed to generate certificate");
      return res.json();
    },
  });
}