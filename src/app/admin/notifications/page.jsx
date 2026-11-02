"use client";

import { useState, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

export default function NotificationsAdminPage() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [target, setTarget] = useState("SEGMENT");
  const [userId, setUserId] = useState("");
  const [segment, setSegment] = useState("");
  const [segments, setSegments] = useState([]);
  const [segmentsLoading, setSegmentsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch("/backend/admins/notifications/segments", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSegments(d.segments);
          setSegment(d.segments[0]?.key || "");
        }
      })
      .finally(() => setSegmentsLoading(false));
  }, []);

  async function handleSend() {
    if (!title.trim() || !text.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/backend/admins/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          text,
          target,
          userId: target === "USER" ? userId : undefined,
          segment: target === "SEGMENT" ? segment : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ ok: true, msg: `Sent to ${data.sentTo} user(s), pushed to ${data.pushedTo ?? "—"} device(s)` });
        setTitle("");
        setText("");
      } else {
        setResult({ ok: false, msg: data.error || "Failed to send" });
      }
    } catch (e) {
      setResult({ ok: false, msg: "Failed to send" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Send Notification</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex gap-3">
          {["SEGMENT", "ALL", "USER"].map((t) => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${target === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              {t === "SEGMENT" ? "Targeted Segment" : t === "ALL" ? "All Users" : "Specific User"}
            </button>
          ))}
        </div>

        {target === "SEGMENT" && (
          <div>
            {segmentsLoading ? (
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading segments...
              </div>
            ) : (
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {segments.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label} — {s.count} users
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Segments are computed live from purchase/activity history — more relevant = higher open rate.
            </p>
          </div>
        )}

        {target === "USER" && (
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notification title"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message body"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />

        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !text.trim() || (target === "SEGMENT" && !segment)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Notification
        </button>

        {result && <p className={`text-sm ${result.ok ? "text-green-600" : "text-red-500"}`}>{result.msg}</p>}
      </div>
    </div>
  );
}