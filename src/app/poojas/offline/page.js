"use client";

import BookingsBoard from "@/components/poojas/BookingsBoard";

export default function OfflinePoojaPage() {
  return (
    <BookingsBoard
      poojaType="OFFLINE"
      title="🕉️ Offline Poojas"
      subtitle="Manage offline pooja bookings — check the box to move to the next stage"
    />
  );
}