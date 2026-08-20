"use client";

import { memo, useState } from "react";
import {
  Phone, Calendar, Clock, IndianRupee, FileText,
  CheckCircle2, ArrowRight, Loader2, Video,
} from "lucide-react";
import CertificateModal from "./CertificateModal";

const STATUS_STYLES = {
  CONFIRMED: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  FEEDBACK: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  COMPLETED: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
};

function BookingCard({ booking, onStatusChange, isPending, columnId }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.CONFIRMED;

  const getNextStatus = () => {
    if (columnId === "booking") return "FEEDBACK";
    if (columnId === "feedback") return "COMPLETED";
    return null;
  };

  const getConfirmLabel = () => {
    if (columnId === "booking") return { icon: "💬", text: "Move to Feedback?" };
    if (columnId === "feedback") return { icon: "✅", text: "Mark as Completed?" };
    return { icon: "", text: "" };
  };

  const handleCheckboxChange = (checked) => {
    setIsChecked(checked);
    if (checked) setShowConfirm(true);
  };

  const handleConfirm = async () => {
    const nextStatus = getNextStatus();
    if (!nextStatus) return;
    try {
      await onStatusChange(booking.id, nextStatus);
    } finally {
      setIsChecked(false);
      setShowConfirm(false);
    }
  };

  const canMove = columnId !== "completed";
  const confirmLabel = getConfirmLabel();

  return (
    <>
      <div
        className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
          isChecked ? "border-purple-400 ring-2 ring-purple-100" : "border-gray-200"
        }`}
      >
        {/* Header row */}
        <div className="flex items-start gap-2.5 mb-3">
          {canMove && (
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => handleCheckboxChange(e.target.checked)}
              disabled={isPending}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-800 truncate">{booking.poojaTitle}</h4>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{booking.customerName}</p>
          </div>
          <span
            className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
              booking.poojaType === "ONLINE" ? "bg-blue-500" : "bg-orange-500"
            }`}
          >
            {booking.poojaType[0]}
          </span>
        </div>

        {/* Info rows */}
        <div className="space-y-1.5 mb-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Phone size={12} className="flex-shrink-0" />
            <span className="truncate">{booking.customerPhone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="flex-shrink-0" />
            <span>{booking.scheduledDate}</span>
          </div>
          {booking.scheduledTime && booking.scheduledTime !== "00:00" && (
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="flex-shrink-0" />
              <span>{booking.scheduledTime}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-gray-100 font-semibold text-gray-700">
            <IndianRupee size={12} className="flex-shrink-0" />
            <span>{booking.amount}</span>
          </div>
        </div>

        {/* Extra info once completed */}
        {booking.status === "COMPLETED" && (booking.certificateUrl || booking.videoLink) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {booking.certificateUrl && (
              <a
                href={booking.certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] px-2 py-1 bg-green-50 text-green-700 rounded-full hover:bg-green-100"
              >
                <FileText size={10} /> Certificate
              </a>
            )}
            {booking.videoLink && (
              <a
                href={booking.videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] px-2 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
              >
                <Video size={10} /> Video
              </a>
            )}
          </div>
        )}

        {/* Status badge */}
        <div
          className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold mb-3 ${statusStyle.bg} ${statusStyle.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {booking.status}
        </div>

        {/* Action button — only in COMPLETED column */}
        {columnId === "completed" && !booking.certificateUrl && (
          <button
            onClick={() => setShowCertModal(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
          >
            <FileText size={13} /> Send Certificate & Video
          </button>
        )}

        {columnId === "completed" && booking.certificateUrl && (
          <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-500 rounded-lg text-xs font-medium">
            <CheckCircle2 size={13} className="text-green-600" /> Certificate sent
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {showCertModal && (
        <CertificateModal
          booking={booking}
          onClose={() => setShowCertModal(false)}
          onSubmit={onStatusChange}
          isPending={isPending}
        />
      )}

      {/* Confirmation Modal (stage move) */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{confirmLabel.icon}</span>
              <h3 className="text-base font-bold text-gray-800">{confirmLabel.text}</h3>
            </div>

            <div className="mb-5 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1.5">
              <p><span className="font-medium text-gray-800">Pooja:</span> {booking.poojaTitle}</p>
              <p><span className="font-medium text-gray-800">Customer:</span> {booking.customerName}</p>
              <p><span className="font-medium text-gray-800">Phone:</span> {booking.customerPhone}</p>
              <p>
                <span className="font-medium text-gray-800">Date:</span> {booking.scheduledDate}
                {booking.scheduledTime && booking.scheduledTime !== "00:00" ? ` at ${booking.scheduledTime}` : ""}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsChecked(false);
                  setShowConfirm(false);
                }}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    Confirm <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(BookingCard);