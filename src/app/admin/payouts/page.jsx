"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
const BACKEND_URL = "/backend";
const LIMIT = 10;

export default function PayoutsAdminPage() {
      const { data: session, status } = useSession();
  const router = useRouter();
  const [payouts, setPayouts] = useState([]);
  const [panditList, setPanditList] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [selectedPanditId, setSelectedPanditId] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
    useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // ✅ Load pandit dropdown list once (uses ?basic=true, no need for /pandits/list route)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/admins/pandits?basic=true`);
        const data = await res.json();
        if (data.success) setPanditList(data.pandits || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const fetchPage = useCallback(
    async (pageNum, replace = false) => {
      if (replace) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          status: filter,
          page: String(pageNum),
          limit: String(LIMIT),
        });
        if (selectedPanditId) params.set("panditId", selectedPanditId);

        const res = await fetch(`${BACKEND_URL}/admins/payouts?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          setPayouts((prev) => (replace ? data.payouts : [...prev, ...data.payouts]));
          setTotal(data.total || 0);
          setHasMore(pageNum < (data.totalPages || 1));
          setPage(pageNum);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter, selectedPanditId]
  );

  // ✅ Reset + reload whenever filters change
  useEffect(() => {
    setPayouts([]);
    setHasMore(true);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, selectedPanditId]);

  // ✅ Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchPage(page + 1);
        }
      },
      { rootMargin: "200px" }
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [page, hasMore, loading, loadingMore, fetchPage]);

  // ✅ Show "scroll to top" button after scrolling down
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const reload = () => {
    setPayouts([]);
    setHasMore(true);
    fetchPage(1, true);
  };

  const markAsPaid = async (id) => {
    const notes = prompt("Add any notes (optional):") || "";
    if (!confirm("Confirm you've transferred this payment manually?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admins/payouts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID", adminNotes: notes }),
      });
      if (res.ok) reload();
      else alert("Failed to update");
    } catch (err) {
      console.error(err);
    }
  };

  const markAsProcessing = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admins/payouts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PROCESSING" }),
      });
      if (res.ok) reload();
    } catch (err) {
      console.error(err);
    }
  };

  const rejectPayout = async (id) => {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    if (!confirm("Are you sure you want to reject this payout request?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admins/payouts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", adminNotes: reason }),
      });
      if (res.ok) reload();
      else alert("Failed to reject");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-s24 md:p-s40 max-w-[1200px] mx-auto relative">
      <div className="mb-s24">
        <h1 className="heading-h3 text-main">Payout Requests</h1>
        <p className="body-small text-secondary">Review and process pandit payout requests</p>
      </div>

      {/* Filters row */}
      <div className="flex flex-col md:flex-row gap-s16 mb-s24">
        <div className="flex flex-wrap gap-s8">
          {["PENDING", "PROCESSING", "PAID", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-s16 py-s8 rounded-r16 body-small font-semibold transition-colors ${
                filter === s
                  ? "bg-primary-main text-white"
                  : "bg-secondary-main/30 text-main hover:bg-secondary-main/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <select
          value={selectedPanditId}
          onChange={(e) => setSelectedPanditId(e.target.value)}
          className="h-[44px] px-s16 rounded-r16 border border-secondary-main bg-background body-small text-main outline-none md:ml-auto"
        >
          <option value="">All Pandits</option>
          {panditList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (@{p.username})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="body-default text-secondary">Loading...</p>
      ) : payouts.length === 0 ? (
        <p className="body-default text-secondary">No {filter.toLowerCase()} requests.</p>
      ) : (
        <>
          <p className="caption text-secondary mb-s8">
            Showing {payouts.length} of {total} request{total !== 1 ? "s" : ""}
          </p>

          <div className="overflow-x-auto rounded-r16 border border-secondary-main">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-secondary-main/10 text-left">
                  <th className="p-s16 caption font-semibold text-secondary">Pandit</th>
                  <th className="p-s16 caption font-semibold text-secondary">Amount</th>
                  <th className="p-s16 caption font-semibold text-secondary">Method</th>
                  <th className="p-s16 caption font-semibold text-secondary">Details</th>
                  <th className="p-s16 caption font-semibold text-secondary">Requested At</th>
                  <th className="p-s16 caption font-semibold text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-t border-secondary-main/30 align-top">
                    <td className="p-s16 body-small text-main">
                      {p.pandit.name}
                      <br />
                      <span className="caption text-secondary">{p.pandit.phone}</span>
                    </td>

                    <td className="p-s16 body-small font-semibold text-main">
                      ₹{p.amount.toFixed(2)}
                    </td>

                    <td className="p-s16 body-small text-main">{p.upiId ? "UPI" : "Bank"}</td>

                    <td className="p-s16 body-small text-secondary">
                      {p.upiId ? (
                        <span>{p.upiId}</span>
                      ) : (
                        <span>
                          {p.accountHolderName}
                          <br />
                          {p.accountNumber}
                          <br />
                          {p.ifsc}
                        </span>
                      )}
                    </td>

                    <td className="p-s16 caption text-secondary">
                      {new Date(p.requestedAt).toLocaleString()}
                    </td>

                    <td className="p-s16">
                      {p.status === "PENDING" && (
                        <div className="flex flex-col gap-s8 min-w-[140px]">
                          <ActionButton onClick={() => markAsProcessing(p.id)}>
                            Mark Processing
                          </ActionButton>
                          <ActionButton onClick={() => markAsPaid(p.id)} variant="green">
                            Mark Paid
                          </ActionButton>
                          <ActionButton onClick={() => rejectPayout(p.id)} variant="red">
                            Reject
                          </ActionButton>
                        </div>
                      )}

                      {p.status === "PROCESSING" && (
                        <div className="flex flex-col gap-s8 min-w-[140px]">
                          <ActionButton onClick={() => markAsPaid(p.id)} variant="green">
                            Mark Paid
                          </ActionButton>
                          <ActionButton onClick={() => rejectPayout(p.id)} variant="red">
                            Reject
                          </ActionButton>
                        </div>
                      )}

                      {p.status === "PAID" && (
                        <span className="caption text-green-700">
                          ✅ Paid on{" "}
                          {p.processedAt ? new Date(p.processedAt).toLocaleDateString() : "-"}
                          {p.adminNotes && (
                            <>
                              <br />
                              <span className="text-secondary">{p.adminNotes}</span>
                            </>
                          )}
                        </span>
                      )}

                      {p.status === "REJECTED" && (
                        <span className="caption text-red-main">
                          ❌ Rejected on{" "}
                          {p.processedAt ? new Date(p.processedAt).toLocaleDateString() : "-"}
                          {p.adminNotes && (
                            <>
                              <br />
                              <span className="text-secondary">Reason: {p.adminNotes}</span>
                            </>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ✅ Infinite scroll sentinel — triggers loading more when visible */}
          <div ref={sentinelRef} className="h-[1px]" />

          {loadingMore && (
            <p className="text-center body-small text-secondary py-s16">Loading more...</p>
          )}
          {!hasMore && payouts.length > 0 && (
            <p className="text-center caption text-secondary py-s16">— End of results —</p>
          )}
        </>
      )}

      {/* ✅ Fixed floating back-to-top button (replaces old Prev/Next bar) */}
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

function ActionButton({ onClick, variant = "primary", children }) {
  const styles = {
    primary: "bg-primary-main hover:bg-primary-light text-white",
    green: "bg-green-600 hover:bg-green-700 text-white",
    red: "bg-red-main hover:bg-red-dark text-white",
  };
  return (
    <button
      onClick={onClick}
      className={`px-s16 py-s8 rounded-r8 caption font-semibold transition-colors ${styles[variant]}`}
    >
      {children}
    </button>
  );
}