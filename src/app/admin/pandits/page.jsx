"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePandits } from "@/hooks/usePandits";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
const BACKEND_URL = "/backend";

const statuesColors = {
  PENDING: "text-secondary bg-secondary-main/20",
  PROCESSING: "text-accent-main bg-accent-main/10",
  PAID: "text-green-700 bg-green-100",
  REJECTED: "text-red-main bg-red-main/10",
};

function formatTalkTime(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function PanditsAdminPage() {
      const { data: session, status } = useSession();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statues, setstatues] = useState("");
  const [sortBy, setSortBy] = useState("earnings");
  const [deletingId, setDeletingId] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { pandits, loading, loadingMore, hasMore, total, error, loadMore, refetch } =
    usePandits({ search, statues, sortBy });

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "300px" }
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  // Back-to-top button visibility
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleDelete = async (pandit) => {
    const confirmed = confirm(
      `Delete ${pandit.name}'s account permanently?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(pandit.id);
    try {
      const res = await fetch(`${BACKEND_URL}admins/pandits/${pandit.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to delete pandit");
        return;
      }
      refetch();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while deleting");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-s24 md:p-s40 max-w-[1200px] mx-auto relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-s16 mb-s24">
        <div>
          <h1 className="heading-h3 text-main">Pandits</h1>
          <p className="body-small text-secondary">Earnings and talk time overview</p>
        </div>

        {/* ✅ fixed path — was pointing to /admin/payouts (typo) */}
        <Link
          href="/admin/payouts"
          className="h-[44px] px-s24 rounded-r16 bg-primary-main hover:bg-primary-light text-white body-small font-semibold flex items-center justify-center transition-colors"
        >
          View All Payouts
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-s16 mb-s24">
        <input
          type="text"
          placeholder="Search by name, username, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-[48px] px-s16 rounded-r16 border border-secondary-main bg-background body-default text-main outline-none focus:border-primary-main transition-colors"
        />

        <select
          value={statues}
          onChange={(e) => setstatues(e.target.value)}
          className="h-[48px] px-s16 rounded-r16 border border-secondary-main bg-background body-default text-main outline-none"
        >
          <option value="">All statues</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-[48px] px-s16 rounded-r16 border border-secondary-main bg-background body-default text-main outline-none"
        >
          <option value="earnings">Sort: Earnings</option>
          <option value="talktime">Sort: Talk Time</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {error && (
        <div className="p-s16 rounded-r16 bg-red-main/10 border border-red-main text-red-dark body-small mb-s24">
          ⚠️ {error}{" "}
          <button onClick={refetch} className="underline font-semibold">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-s16">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[280px] rounded-r24 bg-secondary-main/30 animate-pulse" />
          ))}
        </div>
      ) : pandits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-s80 gap-s8">
          <p className="heading-h5 text-main">No pandits found</p>
          <p className="body-small text-secondary">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <p className="caption text-secondary mb-s16">
            Showing {pandits.length} of {total} pandit{total !== 1 ? "s" : ""}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-s16">
            {pandits.map((p) => (
              <div
                key={p.id}
                className="rounded-r24 border border-secondary-main p-s24 flex flex-col gap-s16 bg-background"
              >
                <Link href={`/admin/pandits/${p.id}`} className="flex items-start justify-between gap-s8">
                  <div>
                    <p className="body-default font-semibold text-main hover:underline">{p.name}</p>
                    <p className="caption text-secondary">@{p.username} · {p.phone}</p>
                  </div>
                  <span
                    className={`caption px-s8 py-[4px] rounded-r8 font-semibold whitespace-nowrap ${
                      p.isAvailable ? "bg-green-100 text-green-700" : "bg-secondary-main/40 text-secondary"
                    }`}
                  >
                    {p.isAvailable ? "Available" : "Offline"}
                  </span>
                </Link>

                {!p.hasBankDetails && (
                  <div className="flex items-start gap-s8 p-s6 rounded-r8 bg-red-main/10 border border-red-main">
                    {/* <span className="text-red-main">⚠️</span> */}
                    <p className="caption text-red-dark">  No payout details added yet</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-s16">
                  <Stat label="Talk Time" value={formatTalkTime(p.totalTalkSeconds)} />
                  <Stat label="Calls" value={p.totalCalls} />
                  <Stat label="Earnings" value={`₹${p.totalEarnings.toFixed(2)}`} />
                  <Stat label="Paid" value={`₹${p.totalPaid.toFixed(2)}`} color="text-green-700" />
                </div>

                {/* ✅ Last payout info */}
                <div className="pt-s16 border-t border-secondary-main/40">
                  <p className="caption text-secondary mb-s4">Last Payout</p>
                  {p.lastPayout ? (
                    <div className="flex items-center justify-between gap-s8">
                      <p className="body-small font-semibold text-main">
                        ₹{p.lastPayout.amount.toFixed(2)}
                      </p>
                      <span
                        className={`caption px-s8 py-[2px] rounded-r8 font-semibold ${statuesColors[p.lastPayout.statues]}`}
                      >
                        {p.lastPayout.statues}
                      </span>
                    </div>
                  ) : (
                    <p className="caption text-secondary">No payout requests yet</p>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(p)}
                  disabled={deletingId === p.id}
                  className="mt-s8 w-full h-[40px] rounded-r16 border border-red-main text-red-main hover:bg-red-main hover:text-white body-small font-semibold transition-colors disabled:opacity-50"
                >
                  {deletingId === p.id ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-[1px]" />

          {loadingMore && (
            <p className="text-center body-small text-secondary py-s16">Loading more...</p>
          )}
          {!hasMore && pandits.length > 0 && (
            <p className="text-center caption text-secondary py-s16">— End of results —</p>
          )}
        </>
      )}

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-s24 right-s24 z-50 w-[48px] h-[48px] rounded-full bg-primary-main hover:bg-primary-light text-white shadow-lg flex items-center justify-center transition-colors"
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}

function Stat({ label, value, color = "text-main" }) {
  return (
    <div>
      <p className="caption text-secondary">{label}</p>
      <p className={`body-small font-semibold ${color}`}>{value}</p>
    </div>
  );
}