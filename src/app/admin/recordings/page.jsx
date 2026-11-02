"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const API = "/backend/admins/recordings"; // matches the route path in your server log
const PAGE_SIZES = [10, 20, 50, 100];

const fmtDur = (s) =>
  s || s === 0 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "-";

// 1 ... 4 5 [6] 7 8 ... 20
function pageList(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, page, page - 1, page + 1, page - 2, page + 2]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("...");
    out.push(n);
  });
  return out;
}

export default function RecordingsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [pandits, setPandits] = useState([]);
  const [panditId, setPanditId] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const reqId = useRef(0);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetchRecordings();
  }, [page, limit, panditId]);

  async function fetchRecordings() {
    const id = ++reqId.current; // ignore out-of-order responses
    setLoading(true);
    setPlaying(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (panditId !== "all") qs.set("panditId", panditId);
      const res = await fetch(`${API}?${qs}`);
      const data = await res.json();
      if (id !== reqId.current) return;
      if (data.success) {
        setItems(data.recordings);
        setPandits(data.pandits);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        if (page > data.totalPages) setPage(data.totalPages);
      }
    } catch (e) {
      console.error("Failed to fetch recordings:", e);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }

  async function play(callId) {
    setBusyId(callId);
    try {
      const res = await fetch(`${API}/${callId}/url`);
      const data = await res.json();
      if (data.success) setPlaying({ callId, url: data.url });
      else alert(data.error || "Recording not available");
    } catch {
      alert("Failed to load recording");
    } finally {
      setBusyId(null);
    }
  }

  const goTo = (p) => setPage(Math.min(Math.max(p, 1), totalPages));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Call Recordings</h1>

      <div className="my-4 flex flex-wrap items-center gap-3">
        <select
          value={panditId}
          onChange={(e) => { setPanditId(e.target.value); setPage(1); }}
          className="rounded border px-3 py-2"
        >
          <option value="all">All pandits</option>
          {pandits.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={limit}
          onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
          className="rounded border px-3 py-2"
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>

        <span className="text-sm text-gray-500">
          {total === 0 ? "0 recordings" : `${from}-${to} of ${total}`}
        </span>
      </div>

      <div className={loading ? "opacity-50 transition-opacity" : ""}>
        {!loading && items.length === 0 && <p>No recordings found.</p>}

        {items.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Date</th>
                <th className="p-2">Pandit</th>
                <th className="p-2">User</th>
                <th className="p-2">Duration</th>
                <th className="p-2">Play</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.callId} className="border-b align-top">
                  <td className="p-2">{new Date(r.startedAt).toLocaleString()}</td>
                  <td className="p-2">{r.call.pandit?.name || "-"}</td>
                  <td className="p-2">{r.call.user?.name || "-"}</td>
                  <td className="p-2">{fmtDur(r.call.duration)}</td>
                  <td className="p-2">
                    {playing?.callId === r.callId ? (
                      <div>
                        <audio
                          controls
                          autoPlay
                          preload="auto"
                          src={playing.url}
                          onError={(e) => console.error("audio error:", e.currentTarget.error)}
                        />
                        <a href={playing.url} target="_blank" rel="noreferrer" className="block text-xs underline">
                          Open / download
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => play(r.callId)}
                        disabled={busyId === r.callId}
                        className="rounded bg-black px-3 py-1 text-white disabled:opacity-50"
                      >
                        {busyId === r.callId ? "..." : "Play"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1">
          <button onClick={() => goTo(1)} disabled={page === 1 || loading}
            className="rounded border px-2 py-1 disabled:opacity-40">«</button>
          <button onClick={() => goTo(page - 1)} disabled={page === 1 || loading}
            className="rounded border px-3 py-1 disabled:opacity-40">Prev</button>

          {pageList(page, totalPages).map((n, i) =>
            n === "..." ? (
              <span key={`d${i}`} className="px-2">...</span>
            ) : (
              <button
                key={n}
                onClick={() => goTo(n)}
                disabled={loading}
                className={`rounded border px-3 py-1 ${n === page ? "bg-black text-white" : ""}`}
              >
                {n}
              </button>
            )
          )}

          <button onClick={() => goTo(page + 1)} disabled={page === totalPages || loading}
            className="rounded border px-3 py-1 disabled:opacity-40">Next</button>
          <button onClick={() => goTo(totalPages)} disabled={page === totalPages || loading}
            className="rounded border px-2 py-1 disabled:opacity-40">»</button>
        </div>
      )}
    </div>
  );
}