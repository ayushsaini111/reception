"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Phone, Mail, UserX } from "lucide-react";

function UserCell({ user, userId }) {
  if (!userId) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-400">
        <UserX size={13} /> Not recorded
      </span>
    );
  }
  if (!user) {
    return <span className="text-xs text-gray-400">User deleted ({userId.slice(0, 8)}...)</span>;
  }
  return (
    <div className="space-y-0.5">
      <p className="font-medium text-gray-800">{user.name || user.username || "Unnamed"}</p>
      {user.phone && (
        <a
          href={`tel:${user.phone}`}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-purple-600"
        >
          <Phone size={12} /> {user.phone}
        </a>
      )}
      {user.email && (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <Mail size={12} /> {user.email}
        </p>
      )}
    </div>
  );
}

export default function ExpertSearchAdminPage() {
  const { status } = useSession();
  const router = useRouter();

  const [data, setData] = useState({ requests: [], pagination: { page: 1, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | unviewed
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter === "unviewed") params.set("viewed", "false");
      const res = await fetch(`/backend/admins/expert-search?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load expert search requests:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    if (status === "authenticated") fetchData();
  }, [status, fetchData]);

  async function markViewed(id) {
    setData((prev) => ({
      ...prev,
      requests: prev.requests.map((r) => (r.id === id ? { ...r, viewed: true } : r)),
    }));
    try {
      await fetch(`/backend/admins/expert-search`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, viewed: true }),
      });
    } catch (err) {
      console.error("Failed to mark viewed:", err);
      fetchData();
    }
  }

  if (status === "loading") return <div className="p-8 text-sm text-gray-500">Loading...</div>;
  if (status === "unauthenticated") return null;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Expert Searches</h1>
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="unviewed">Unviewed only</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Expertise</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Matched</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : data.requests?.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No requests found</td></tr>
            ) : (
              data.requests?.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3">
                    <UserCell user={r.user} userId={r.userId} />
                  </td>
                  <td className="px-4 py-3">{r.problemCategory}</td>
                  <td className="px-4 py-3">{r.expertiseType}</td>
                  <td className="px-4 py-3 max-w-[240px] truncate" title={r.problemDescription || ""}>
                    {r.problemDescription || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={r.matchedCount === 0 ? "font-medium text-red-600" : "text-gray-700"}>
                      {r.matchedCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {r.viewed ? (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">Viewed</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">New</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!r.viewed && (
                      <button
                        onClick={() => markViewed(r.id)}
                        className="rounded bg-gray-900 px-3 py-1.5 text-xs text-white hover:bg-gray-700"
                      >
                        Mark viewed
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-500">
          Page {data.pagination?.page || 1} of {data.pagination?.totalPages || 1}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={page >= (data.pagination?.totalPages || 1)}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}