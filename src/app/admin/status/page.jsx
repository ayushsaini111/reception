// app/admins/reminder/status/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  XCircle,
  History,
  User,
  Sparkles,
} from "lucide-react";

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function timeUntil(dateStr) {
  if (!dateStr) return "—";
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "overdue";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `in ${hrs}h ${mins % 60}m`;
}

const REMINDER_LABELS = {
  CONFIRMATION: "Confirmation",
  ONE_DAY_BEFORE: "1 Day Before",
  MORNING_OF_POOJA: "Morning Of Pooja",
  ONE_HOUR_BEFORE: "1 Hour Before",
};

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function BookingMini({ booking }) {
  if (!booking) return <p className="text-xs text-gray-400">No linked booking</p>;
  return (
    <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
      <User className="w-3 h-3" />
      <span className="font-medium text-gray-600">{booking.customerName}</span>
      <span className="text-gray-300">·</span>
      <Sparkles className="w-3 h-3" />
      <span>{booking.poojaTitle}</span>
    </div>
  );
}

export default function ReminderStatusPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/backend/admins/reminders/status", { cache: "no-store" });
      if (!res.ok) throw new Error("Request failed");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError("Failed to load reminder status");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(), 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // group byType data into a per-type map: { CONFIRMATION: { sent: 5, pending: 2 } }
  const typeBreakdown = {};
  if (data?.byType) {
    for (const row of data.byType) {
      const key = row.reminderType;
      if (!typeBreakdown[key]) typeBreakdown[key] = { sent: 0, pending: 0 };
      typeBreakdown[key][row.sent ? "sent" : "pending"] = row._count._all;
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reminder Cron Status</h1>
        <button
          onClick={() => fetchStatus(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading status...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-4 mb-4">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Health banner */}
          <div
            className={`flex items-center gap-3 rounded-xl p-4 mb-6 border ${
              data.cronLooksHealthy
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {data.cronLooksHealthy ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <p className="text-sm font-medium">
              {data.cronLooksHealthy
                ? "Cron is running normally — no overdue reminders."
                : `Cron may be stuck — ${data.overdue} overdue reminder(s) detected.`}
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Clock} label="Pending" value={data.pending} accent="bg-blue-50 text-blue-600" />
            <StatCard icon={Send} label="Sent" value={data.sent} accent="bg-green-50 text-green-600" />
            <StatCard icon={XCircle} label="Failed" value={data.failed} accent="bg-red-50 text-red-600" />
            <StatCard
              icon={AlertTriangle}
              label="Overdue"
              value={data.overdue}
              accent={data.overdue > 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}
            />
          </div>

          {/* Breakdown by reminder type */}
          {Object.keys(typeBreakdown).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-gray-900 mb-3">Breakdown by Reminder Type</p>
              <div className="grid sm:grid-cols-4 gap-3">
                {Object.entries(typeBreakdown).map(([type, counts]) => (
                  <div key={type} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">{REMINDER_LABELS[type] || type}</p>
                    <p className="text-sm">
                      <span className="text-green-600 font-semibold">{counts.sent || 0}</span>
                      <span className="text-gray-300"> sent / </span>
                      <span className="text-blue-600 font-semibold">{counts.pending || 0}</span>
                      <span className="text-gray-300"> pending</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next due / last sent */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Next Due Reminder</p>
              {data.nextDue ? (
                <>
                  <p className="text-sm font-semibold text-gray-900">
                    {REMINDER_LABELS[data.nextDue.reminderType] || data.nextDue.reminderType}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(data.nextDue.scheduledTime).toLocaleString()} ·{" "}
                    {timeUntil(data.nextDue.scheduledTime)}
                  </p>
                  <BookingMini booking={data.nextDue.booking} />
                </>
              ) : (
                <p className="text-sm text-gray-400">No pending reminders</p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Last Sent Reminder</p>
              {data.lastSent ? (
                <>
                  <p className="text-sm font-semibold text-gray-900">
                    {REMINDER_LABELS[data.lastSent.reminderType] || data.lastSent.reminderType}
                  </p>
                  <p className="text-xs text-gray-500">
                    {timeAgo(data.lastSent.sentAt)} · via {data.lastSent.sentVia || "—"}
                  </p>
                  <BookingMini booking={data.lastSent.booking} />
                </>
              ) : (
                <p className="text-sm text-gray-400">No reminders sent yet</p>
              )}
            </div>
          </div>

          {/* Recent errors */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-gray-500" />
              <p className="text-sm font-semibold text-gray-900">Recent Errors</p>
            </div>

            {data.recentErrors?.length ? (
              <div className="space-y-3">
                {data.recentErrors.map((err) => (
                  <div
                    key={err.id}
                    className="border border-gray-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {REMINDER_LABELS[err.reminderType] || err.reminderType}{" "}
                        <span className="text-gray-400 font-normal">
                          · {err.retryCount} retr{err.retryCount === 1 ? "y" : "ies"}
                        </span>
                      </p>
                      <BookingMini booking={err.booking} />
                      <p className="text-xs text-red-500 mt-1 max-w-md truncate" title={err.errorMessage}>
                        {err.errorMessage}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(err.updatedAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No recent errors 🎉</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}