"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, IndianRupee, CheckCircle2, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

export default function PartnersAdminPage() {
  const { status } = useSession();
  const router = useRouter();

  const [partners, setPartners] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchPartners = useCallback(async (page, searchTerm) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (searchTerm) params.set("search", searchTerm);
      const res = await fetch(`/backend/admins/partners?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setPartners(data.partners);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error("Failed to fetch partners:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchPartners(1, search), 350);
    return () => clearTimeout(t);
  }, [search, fetchPartners]);

  function goToPage(p) {
    if (p < 1 || p > pagination.totalPages) return;
    fetchPartners(p, search);
  }

  async function toggleExpand(partnerId) {
    if (expandedId === partnerId) {
      setExpandedId(null);
      setLedger([]);
      return;
    }
    setExpandedId(partnerId);
    setLedgerLoading(true);
    try {
      const res = await fetch(`/backend/admins/partners/${partnerId}/ledger?page=1&pageSize=20`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setLedger(data.ledger);
    } catch (e) {
      console.error("Failed to fetch ledger:", e);
    } finally {
      setLedgerLoading(false);
    }
  }

  async function markAsPaid(partnerId) {
    if (!confirm("Confirm payout has been sent via bank transfer? This will reset pending commission to 0.")) return;
    setPayingId(partnerId);
    try {
      const res = await fetch(`/backend/admins/partners/${partnerId}/payout`, { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Payout failed");
        return;
      }
      // instant refresh — no stale cache
      await fetchPartners(pagination.page, search);
    } catch (e) {
      console.error("Payout failed:", e);
      alert("Payout failed");
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Partner Commissions</h1>
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Partner</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Used</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total Commission</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Paid Out</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Pending</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading...
              </td></tr>
            ) : partners.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No partners found</td></tr>
            ) : (
            partners.map((p) => (
  <React.Fragment key={p.id}>
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{p.name}</div>
        <div className="text-xs text-gray-500">{p.email}</div>
      </td>
      <td className="px-4 py-3 font-mono text-xs">{p.codes.join(", ")}</td>
      <td className="px-4 py-3 text-right">{p.usageCount}</td>
      <td className="px-4 py-3 text-right">₹{p.totalCommission.toFixed(2)}</td>
      <td className="px-4 py-3 text-right text-green-600">₹{p.totalPaid.toFixed(2)}</td>
      <td className="px-4 py-3 text-right font-semibold text-orange-600">₹{p.pending.toFixed(2)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => markAsPaid(p.id)}
            disabled={p.pending <= 0 || payingId === p.id}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-700"
          >
            {payingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <IndianRupee className="w-3 h-3" />}
            Mark Paid
          </button>
          <button onClick={() => toggleExpand(p.id)} className="p-1.5 text-gray-500 hover:text-gray-800">
            {expandedId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </td>
    </tr>
    {expandedId === p.id && (
      <tr>
        <td colSpan={7} className="bg-gray-50 px-4 py-3">
          {ledgerLoading ? (
            <div className="text-center py-4 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading transactions...
            </div>
          ) : ledger.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-xs">No transactions yet</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500">
                  <th className="text-left py-1.5">Type</th>
                  <th className="text-left py-1.5">Date</th>
                  <th className="text-right py-1.5">Original</th>
                  <th className="text-right py-1.5">Discount</th>
                  <th className="text-right py-1.5">Commission</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((l) => (
                  <tr key={l.id} className="border-t border-gray-200">
                    <td className="py-1.5">{l.orderType}</td>
                    <td className="py-1.5">{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td className="py-1.5 text-right">₹{l.originalAmount.toFixed(2)}</td>
                    <td className="py-1.5 text-right">₹{l.discountAmount.toFixed(2)}</td>
                    <td className="py-1.5 text-right text-green-600">₹{l.commissionAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </td>
      </tr>
    )}
  </React.Fragment>
))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalCount} partners</span>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}