"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Pencil, Trash2, X, Search, Star, Image as ImageIcon,
  Loader2, CheckCircle2, AlertCircle, Tag, IndianRupee,FileText,
  MessageSquareText, User,
} from "lucide-react";
import PoojaContentModal from "@/components/poojas/PoojaContentModal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
const CATEGORIES = [
  { value: "online", label: "Online" },
  { value: "onsite", label: "Onsite" },
];

const MODES = [
  { value: "Video Call", label: "Video Call" },
  { value: "At Home", label: "At Home" },
];

const EMPTY_FORM = {
  id: null,
  title: "",
  short_description: "",
  description: "",
  price: "",
  offer_price: "",
  duration: "",
  mode: "Video Call",
  image: "",
  rating: "",
  bookings: "",
  popular: false,
  category: "online",
  filter: "",
  languages: [],
};

const EMPTY_TESTIMONIAL = {
  id: null,
  pooja_id: null,
  name: "",
  location: "",
  rating: 5,
  text: "",
};

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === "error";
  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2">
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          isError ? "bg-red-600 text-white" : "bg-green-600 text-white"
        }`}
      >
        {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
        {toast.message}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Language Tag Input
// ---------------------------------------------------------------------------
function LanguageInput({ languages, onChange }) {
  const [input, setInput] = useState("");

  const addLanguage = () => {
    const val = input.trim();
    if (val && !languages.includes(val)) {
      onChange([...languages, val]);
    }
    setInput("");
  };

  const removeLanguage = (lang) => {
    onChange(languages.filter((l) => l !== lang));
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addLanguage();
            }
          }}
          placeholder="e.g. Hindi, English"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        />
        <button
          type="button"
          onClick={addLanguage}
          className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
        >
          Add
        </button>
      </div>
      {languages.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {languages.map((lang) => (
            <span
              key={lang}
              className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium"
            >
              {lang}
              <button
                type="button"
                onClick={() => removeLanguage(lang)}
                className="hover:text-purple-900"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Star Rating Selector
// ---------------------------------------------------------------------------
function StarRatingInput({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            size={22}
            className={star <= value ? "text-yellow-500" : "text-gray-300"}
            fill={star <= value ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pooja Form Modal
// ---------------------------------------------------------------------------
function PoojaFormModal({ isOpen, onClose, onSubmit, initialData, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM);
      setImageError(false);
    }
  }, [isOpen, initialData]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.price || !form.offer_price) {
      return;
    }

    onSubmit({
      ...form,
      price: parseFloat(form.price),
      offer_price: parseFloat(form.offer_price),
      rating: form.rating ? parseFloat(form.rating) : 0,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-gray-800">
            {form.id ? "Edit Pooja" : "Add New Pooja"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g. Satyanarayan Katha"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description
            </label>
            <input
              type="text"
              value={form.short_description}
              onChange={(e) => handleChange("short_description", e.target.value)}
              placeholder="e.g. For prosperity and happiness."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Full description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Price Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="1100"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Offer Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.offer_price}
                  onChange={(e) => handleChange("offer_price", e.target.value)}
                  placeholder="999"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Duration & Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                placeholder="e.g. 90 Min"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mode <span className="text-red-500">*</span>
              </label>
              <select
                value={form.mode}
                onChange={(e) => handleChange("mode", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
              >
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter Tag
              </label>
              <input
                type="text"
                value={form.filter}
                onChange={(e) => handleChange("filter", e.target.value)}
                placeholder="e.g. wealth-prosperity"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Rating & Bookings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating (0-5)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={form.rating}
                onChange={(e) => handleChange("rating", e.target.value)}
                placeholder="4.9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bookings Label
              </label>
              <input
                type="text"
                value={form.bookings}
                onChange={(e) => handleChange("bookings", e.target.value)}
                placeholder="e.g. 12K+"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Cloudinary Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <ImageIcon size={14} /> Image URL (Cloudinary)
            </label>
            <input
              type="text"
              value={form.image}
              onChange={(e) => {
                handleChange("image", e.target.value);
                setImageError(false);
              }}
              placeholder="https://res.cloudinary.com/.../image.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            {form.image && !imageError && (
              <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            )}
            {imageError && (
              <p className="text-xs text-red-500 mt-1">Could not load image from this URL.</p>
            )}
          </div>

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Tag size={14} /> Languages
            </label>
            <LanguageInput
              languages={form.languages}
              onChange={(langs) => handleChange("languages", langs)}
            />
          </div>

          {/* Popular Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="popular"
              checked={form.popular}
              onChange={(e) => handleChange("popular", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="popular" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Star size={14} className="text-yellow-500" /> Mark as Popular
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : form.id ? (
                "Update Pooja"
              ) : (
                "Create Pooja"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Testimonials Modal (per pooja) — works for both ONLINE & ONSITE
// ---------------------------------------------------------------------------
function TestimonialsModal({ pooja, onClose, showToast }) {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_TESTIMONIAL);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTestimonials = useCallback(async () => {
    if (!pooja) return;
    setLoading(true);
    try {
      const res = await fetch(`/backend/poojas/testimonials?poojaId=${pooja.id}`);
      const data = await res.json();
      if (data.success) setTestimonials(data.testimonials);
    } catch (error) {
      console.error(error);
      showToast("Failed to load testimonials", "error");
    } finally {
      setLoading(false);
    }
  }, [pooja, showToast]);

  useEffect(() => {
    if (pooja) {
      fetchTestimonials();
      setForm({ ...EMPTY_TESTIMONIAL, pooja_id: pooja.id });
    }
  }, [pooja, fetchTestimonials]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) return;

    setSaving(true);
    try {
      const isEdit = Boolean(form.id);
      const res = await fetch("/backend/poojas/testimonials", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast(isEdit ? "Testimonial updated" : "Testimonial added");
      setForm({ ...EMPTY_TESTIMONIAL, pooja_id: pooja.id });
      fetchTestimonials();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (t) => {
    setForm({
      id: t.id,
      pooja_id: pooja.id,
      name: t.name,
      location: t.location || "",
      rating: t.rating,
      text: t.text,
    });
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/backend/poojas/testimonials?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast("Testimonial deleted");
      fetchTestimonials();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (!pooja) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MessageSquareText size={18} className="text-purple-600" />
              Testimonials
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[300px]">
              {pooja.title} <span className="capitalize text-purple-500">({pooja.category})</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Add/Edit Form */}
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3"
          >
            <p className="text-sm font-semibold text-gray-700">
              {form.id ? "Edit Testimonial" : "Add New Testimonial"}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Customer name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Mumbai"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Rating <span className="text-red-500">*</span>
              </label>
              <StarRatingInput
                value={form.rating}
                onChange={(r) => setForm((p) => ({ ...p, rating: r }))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Review Text <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={form.text}
                onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
                placeholder="Customer's review..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              />
            </div>

            <div className="flex gap-2">
              {form.id && (
                <button
                  type="button"
                  onClick={() => setForm({ ...EMPTY_TESTIMONIAL, pooja_id: pooja.id })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : form.id ? (
                  "Update Testimonial"
                ) : (
                  "Add Testimonial"
                )}
              </button>
            </div>
          </form>

          {/* List */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Existing ({testimonials.length})
            </p>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-purple-600" size={22} />
              </div>
            ) : testimonials.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No testimonials yet.</p>
            ) : (
              <div className="space-y-3">
                {testimonials.map((t) => (
                  <div key={t.id} className="p-3 border border-gray-200 rounded-lg bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                          {t.location && <p className="text-xs text-gray-400">{t.location}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < t.rating ? "text-yellow-500" : "text-gray-200"}
                            fill={i < t.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{t.text}</p>
                    <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(t)}
                        className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1"
                      >
                        <Pencil size={11} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1 disabled:opacity-50"
                      >
                        {deletingId === t.id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Trash2 size={11} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirm Modal
// ---------------------------------------------------------------------------
function DeleteConfirmModal({ pooja, onConfirm, onCancel, deleting }) {
  if (!pooja) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Trash2 size={22} className="text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Pooja?</h3>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete <span className="font-semibold text-gray-700">"{pooja.title}"</span>?
          This will also delete its testimonials. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function PoojasManagementPage() {
  const [poojas, setPoojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPooja, setEditingPooja] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [testimonialsPooja, setTestimonialsPooja] = useState(null);
  const [toast, setToast] = useState(null);
  const [contentPooja, setContentPooja] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);
 useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchPoojas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/backend/poojas");
      const data = await res.json();
      if (Array.isArray(data)) {
        setPoojas(data);
      } else {
        throw new Error(data.error || "Failed to load");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to load poojas", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPoojas();
  }, [fetchPoojas]);

  const filteredPoojas = useMemo(() => {
    return poojas.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [poojas, searchTerm, categoryFilter]);

  const handleOpenAdd = () => {
    setEditingPooja(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (pooja) => {
    setEditingPooja({
      ...pooja,
      languages: pooja.language || [],
    });
    setShowFormModal(true);
  };

  const handleSubmit = async (formData) => {
    setSaving(true);
    try {
      const isEdit = Boolean(formData.id);
      const res = await fetch("/backend/poojas", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");

      showToast(isEdit ? "Pooja updated successfully" : "Pooja created successfully");
      setShowFormModal(false);
      fetchPoojas();
    } catch (error) {
      console.error(error);
      showToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/backend/poojas?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to delete");

      showToast("Pooja deleted successfully");
      setDeleteTarget(null);
      fetchPoojas();
    } catch (error) {
      console.error(error);
      showToast(error.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Poojas Management</h1>
            <p className="text-gray-500 text-sm mt-1">
              Add, update, or remove poojas & manage testimonials
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Plus size={18} /> Add Pooja
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search poojas by title..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500 ml-auto">
            {filteredPoojas.length} pooja{filteredPoojas.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="text-center">
              <Loader2 className="animate-spin mx-auto mb-3 text-purple-600" size={28} />
              <p className="text-gray-500 text-sm">Loading poojas...</p>
            </div>
          </div>
        ) : filteredPoojas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 text-gray-400">
            <ImageIcon size={40} className="mb-3" />
            <p>No poojas found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPoojas.map((pooja) => (
              <div
                key={pooja.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-40 bg-gray-100">
                  {pooja.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pooja.image} alt={pooja.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  {pooja.popular && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                      <Star size={11} fill="currentColor" /> Popular
                    </span>
                  )}
                  <span className="absolute top-2 right-2 px-2 py-1 bg-white/90 text-gray-700 text-xs font-medium rounded-full capitalize">
                    {pooja.category}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 truncate">{pooja.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pooja.short_description}</p>

                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span>{pooja.mode}</span>
                    {pooja.duration && (
                      <>
                        <span>•</span>
                        <span>{pooja.duration}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-purple-700">₹{pooja.offer_price}</span>
                      {pooja.price !== pooja.offer_price && (
                        <span className="text-xs text-gray-400 line-through">₹{pooja.price}</span>
                      )}
                    </div>
                    {pooja.rating > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Star size={12} className="text-yellow-500" fill="currentColor" />
                        {pooja.rating}
                      </span>
                    )}
                  </div>

                  {pooja.language?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {pooja.language.map((lang) => (
                        <span
                          key={lang}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}

                 {/* was: grid-cols-3 with 3 buttons — now grid-cols-2 with 4 buttons */}
<div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
  <button
    onClick={() => handleOpenEdit(pooja)}
    className="flex items-center justify-center gap-1.5 px-2 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
  >
    <Pencil size={13} /> Edit
  </button>
  <button
    onClick={() => setContentPooja(pooja)}
    className="flex items-center justify-center gap-1.5 px-2 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors"
  >
    <FileText size={13} /> Content
  </button>
  <button
    onClick={() => setTestimonialsPooja(pooja)}
    className="flex items-center justify-center gap-1.5 px-2 py-2 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
  >
    <MessageSquareText size={13} /> Reviews
  </button>
  <button
    onClick={() => setDeleteTarget(pooja)}
    className="flex items-center justify-center gap-1.5 px-2 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
  >
    <Trash2 size={13} /> Delete
  </button>
</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PoojaFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleSubmit}
        initialData={editingPooja}
        saving={saving}
      />

      <DeleteConfirmModal
        pooja={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        deleting={deleting}
      />

      {testimonialsPooja && (
        <TestimonialsModal
          pooja={testimonialsPooja}
          onClose={() => setTestimonialsPooja(null)}
          showToast={showToast}
        />
      )}
      {contentPooja && (
  <PoojaContentModal
    pooja={contentPooja}
    onClose={() => setContentPooja(null)}
    showToast={showToast}
  />
)}
    </div>
  );
}