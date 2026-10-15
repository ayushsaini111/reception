"use client";

import { useQuery } from "@tanstack/react-query";

const BACKEND_URL = "/backend";

function useGetReplies(bookingId = null) {
  return useQuery({
    queryKey: ["whatsapp-replies", bookingId],
    queryFn: async () => {
      const url = bookingId
        ? `${BACKEND_URL}/admins/whatsapp/replies?bookingId=${bookingId}`
        : `${BACKEND_URL}/admins/whatsapp/replies`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch replies");
      return res.json();
    },
    refetchInterval: 5000,
  });
}

export default function WhatsAppRepliesPage() {
  const { data, isLoading } = useGetReplies();
  const replies = data?.data || [];

  return (
    <div className="max-w-4xl mx-auto px-s24 py-s32">
      <h1 className="heading-h3 text-main mb-s24">WhatsApp Replies</h1>

      {isLoading && <p className="text-secondary">Loading...</p>}

      {!isLoading && replies.length === 0 && (
        <p className="text-secondary py-s32 text-center">No replies yet.</p>
      )}

      <div className="flex flex-col gap-s12">
        {replies.map((r) => (
          <div
            key={r.id}
            className="rounded-r12 p-s16 border"
            style={{ borderColor: "var(--secondary-dark)" }}
          >
            <div className="flex justify-between items-center mb-s8">
              <span className="body-small font-semibold text-main">
                📞 {r.fromNumber}
              </span>
              <span className="caption text-secondary">
                {new Date(r.receivedAt).toLocaleString()}
              </span>
            </div>
            <p className="body-default text-main">{r.messageText}</p>
            {r.bookingId && (
              <p className="caption text-secondary mt-s8">
                Linked booking: {r.bookingId.slice(-8)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}