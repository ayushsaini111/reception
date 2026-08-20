"use client";

import BookingsBoard from "@/components/poojas/BookingsBoard";

export default function OnlinePoojaPage() {
  return (
    <BookingsBoard
      poojaType="ONLINE"
      title="🎥 Online Poojas"
      subtitle="Manage online pooja bookings — check the box to move to the next stage"
    />
  );
}