// app/admins/pandits/[id]/page.jsx
"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePanditDetail } from "@/hooks/usePanditDetail";
import { useSession } from "next-auth/react";
const statusColors = {
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

// ✅ Clean "DD Mon YYYY" date style — e.g. 15 Jan 2024
function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
}

// ✅ Optional — with time included, e.g. 15 Jan 2024, 4:30 PM
function formatDateTime(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const datePart = formatDate(dateStr);
    const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${datePart}, ${timePart}`;
}

export default function PanditDetailPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = useParams();
    const { pandit, payoutHistory, loading, error, refetch } = usePanditDetail(id);
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);
    if (loading) {
        return (
            <div className="p-s24 md:p-s40 max-w-[1000px] mx-auto">
                <div className="h-[120px] rounded-r24 bg-secondary-main/30 animate-pulse mb-s24" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-s16 mb-s24">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-[90px] rounded-r16 bg-secondary-main/30 animate-pulse" />
                    ))}
                </div>
                <div className="h-[200px] rounded-r24 bg-secondary-main/30 animate-pulse" />
            </div>
        );
    }

    if (error || !pandit) {
        return (
            <div className="p-s24 md:p-s40 max-w-[1000px] mx-auto">
                <div className="p-s16 rounded-r16 bg-red-main/10 border border-red-main text-red-dark body-small">
                    ⚠️ {error || "Pandit not found"}{" "}
                    <button onClick={refetch} className="underline font-semibold">Retry</button>
                </div>
                <button onClick={() => router.back()} className="mt-s16 body-small text-primary-main underline">
                    ← Go back
                </button>
            </div>
        );
    }

    const hasBankDetails =
        pandit.payoutMethod === "UPI"
            ? !!pandit.upiId
            : !!(pandit.accountHolderName && pandit.accountNumber && pandit.ifsc);

    return (
        <div className="p-s24 md:p-s40 max-w-[1000px] mx-auto flex flex-col gap-s24">
            <Link href="/admins/pandits" className="body-small text-primary-main underline w-fit">
                ← Back to Pandits
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-s16 rounded-r24 border border-secondary-main p-s24">
                <div>
                    <h1 className="heading-h4 text-main">{pandit.name}</h1>
                    <p className="body-small text-secondary">@{pandit.username} · {pandit.phone}</p>
                    {pandit.email && <p className="caption text-secondary">{pandit.email}</p>}
                </div>
                <span
                    className={`caption px-s16 py-[6px] rounded-r8 font-semibold w-fit ${pandit.isAvailable ? "bg-green-100 text-green-700" : "bg-secondary-main/40 text-secondary"
                        }`}
                >
                    {pandit.isAvailable ? "Available" : "Offline"}
                </span>
            </div>

            {/* ⚠️ Alert — missing bank details */}
            {!hasBankDetails && (
                <div className="flex items-start gap-s8 p-s16 rounded-r16 bg-red-main/10 border border-red-main">
                    <span className="text-red-main text-lg">⚠️</span>
                    <div>
                        <p className="body-small font-semibold text-red-dark">No payout details on file</p>
                        <p className="caption text-red-dark/80">
                            This pandit hasn't added bank/UPI details yet. They won't be able to redeem earnings.
                        </p>
                    </div>
                </div>
            )}

            {/* Stats grid — ✅ Rate/Min removed */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-s16">
                <StatBox label="Total Talk Time" value={formatTalkTime(pandit.totalTalkSeconds)} />
                <StatBox label="Total Calls" value={pandit.totalCalls} />
                <StatBox label="Total Earnings" value={`₹${pandit.totalEarnings.toFixed(2)}`} />
                <StatBox label="Total Paid" value={`₹${pandit.totalPaid.toFixed(2)}`} highlight="green" />
                <StatBox label="Pending Payout" value={`₹${pandit.pendingAmount.toFixed(2)}`} highlight="accent" />
                <StatBox label="Available Balance" value={`₹${pandit.availableBalance.toFixed(2)}`} />
                <StatBox label="Joined" value={formatDate(pandit.createdAt)} />
            </div>

            {/* Payment details */}
            <div className="rounded-r24 border border-secondary-main p-s24">
                <h2 className="heading-h6 text-main mb-s16">Payout Details</h2>
                {hasBankDetails ? (
                    pandit.payoutMethod === "UPI" ? (
                        <p className="body-default text-main">UPI ID: <span className="font-semibold">{pandit.upiId}</span></p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-s16">
                            <Field label="Account Holder" value={pandit.accountHolderName} />
                            <Field label="Account Number" value={pandit.accountNumber} />
                            <Field label="IFSC" value={pandit.ifsc} />
                        </div>
                    )
                ) : (
                    <p className="body-small text-secondary">No details added.</p>
                )}

                {pandit.lastPayout && (
                    <div className="mt-s16 pt-s16 border-t border-secondary-main/50">
                        <p className="caption text-secondary mb-s8">Last Payout Request</p>
                        <div className="flex items-center justify-between flex-wrap gap-s8">
                            <p className="body-default font-semibold text-main">₹{pandit.lastPayout.amount.toFixed(2)}</p>
                            <span className={`caption px-s8 py-[4px] rounded-r8 font-semibold ${statusColors[pandit.lastPayout.status]}`}>
                                {pandit.lastPayout.status}
                            </span>
                            <p className="caption text-secondary">{formatDateTime(pandit.lastPayout.requestedAt)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Payout history */}
            <div className="rounded-r24 border border-secondary-main p-s24">
                <h2 className="heading-h6 text-main mb-s16">Payout History</h2>
                {payoutHistory.length === 0 ? (
                    <p className="body-small text-secondary">No payout requests yet.</p>
                ) : (
                    <div className="flex flex-col gap-s16">
                        {payoutHistory.map((p) => (
                            <div
                                key={p.id}
                                className="flex flex-col md:flex-row md:items-center justify-between gap-s8 p-s16 rounded-r16 bg-secondary-main/10"
                            >
                                <div>
                                    <p className="body-default font-semibold text-main">₹{p.amount.toFixed(2)}</p>
                                    <p className="caption text-secondary">Requested {formatDateTime(p.requestedAt)}</p>
                                    {p.processedAt && (
                                        <p className="caption text-secondary">Processed {formatDate(p.processedAt)}</p>
                                    )}
                                    {p.adminNotes && <p className="caption text-secondary italic">Note: {p.adminNotes}</p>}
                                </div>
                                <span className={`caption px-s16 py-[6px] rounded-r8 font-semibold w-fit ${statusColors[p.status]}`}>
                                    {p.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatBox({ label, value, highlight }) {
    const color =
        highlight === "green" ? "text-green-700" : highlight === "accent" ? "text-accent-main" : "text-main";
    return (
        <div className="rounded-r16 border border-secondary-main p-s16 flex flex-col gap-s8">
            <p className="caption text-secondary">{label}</p>
            <p className={`body-default font-semibold ${color}`}>{value}</p>
        </div>
    );
}

function Field({ label, value }) {
    return (
        <div>
            <p className="caption text-secondary">{label}</p>
            <p className="body-default font-semibold text-main">{value || "-"}</p>
        </div>
    );
}