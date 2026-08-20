"use client";

import { useState } from "react";
import { FileText, Video, X, Loader2, Info, User, Hash, Sparkles } from "lucide-react";
import { useGenerateCertificate } from "@/hooks/useBookings";

export default function CertificateModal({ booking, onClose, onSubmit, isPending }) {
  const isOnline = booking.poojaType === "ONLINE";
  const generateCert = useGenerateCertificate();

  const [certificateUrl, setCertificateUrl] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [error, setError] = useState("");

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAutoGenerate = async () => {
    setError("");
    try {
      const result = await generateCert.mutateAsync(booking.id);
      if (result.success) {
        setCertificateUrl(result.certificateUrl);
      } else {
        setError(result.error || "Failed to generate certificate");
      }
    } catch (err) {
      setError(err.message || "Failed to generate certificate");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!certificateUrl.trim()) {
      setError("Certificate link is required — click 'Auto-Generate' or paste one manually");
      return;
    }
    if (!isValidUrl(certificateUrl)) {
      setError("Enter a valid certificate URL");
      return;
    }
    if (isOnline && videoLink && !isValidUrl(videoLink)) {
      setError("Enter a valid video URL");
      return;
    }

    try {
      await onSubmit(booking.id, "COMPLETED", isOnline ? videoLink : undefined, certificateUrl);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to send. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
              <FileText size={18} className="text-green-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Send Completion Message</h3>
              <p className="text-xs text-gray-500">via WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Booking Info */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <User size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium text-gray-800 truncate">{booking.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">Pooja:</span>
              <span className="font-medium text-gray-800 truncate">{booking.poojaTitle}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Hash size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">ID:</span>
              <span className="font-mono text-xs text-gray-500">{booking.id.slice(-8)}</span>
              <span
                className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${
                  isOnline ? "bg-blue-500" : "bg-orange-500"
                }`}
              >
                {booking.poojaType}
              </span>
            </div>
          </div>

          {/* ✅ Auto-Generate Button */}
          <button
            type="button"
            onClick={handleAutoGenerate}
            disabled={generateCert.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50"
          >
            {generateCert.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating Certificate...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Auto-Generate Certificate
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or paste manually</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Certificate URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <FileText size={14} /> Certificate PDF Link <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              value={certificateUrl}
              onChange={(e) => setCertificateUrl(e.target.value)}
              placeholder="Auto-filled after generating, or paste your own link"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            {certificateUrl && isValidUrl(certificateUrl) && (
              <a
                href={certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:underline mt-1 inline-block"
              >
                Preview certificate →
              </a>
            )}
          </div>

          {/* Video Link — ONLINE only */}
          {isOnline && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Video size={14} /> Recorded Video Link
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="https://example.com/pooja-video.mp4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              Certificates are generated on-demand with the customer's name & pooja details, then
              sent directly via WhatsApp — nothing is saved in your database.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !certificateUrl.trim()}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Sending...
                </>
              ) : (
                "Send via WhatsApp"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}