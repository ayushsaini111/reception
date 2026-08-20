"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Pencil, Trash2, X, Search, Star, Image as ImageIcon,
  Loader2, CheckCircle2, AlertCircle, Tag, IndianRupee,
  MessageSquareText, User, Link as LinkIcon, Settings2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
const EMPTY_PRODUCT = {
  id: null,
  title: "",
  shortDescription: "",
  description: "",
  longDescription: "",
  category: "",
  price: "",
  originalPrice: "",
  image: "",
  images: [],
  inStock: true,
  isActive: true,
  benefits: [],
  tags: [],
  specifications: {},
};

const EMPTY_TESTIMONIAL = {
  id: null,
  productId: null,
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
    <div className="fixed top-4 right-4 z-[100]">
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
// Generic Tag/Chip Input (used for tags, benefits, image URLs)
// ---------------------------------------------------------------------------
function ChipInput({ items, onChange, placeholder, addLabel = "Add" }) {
  const [input, setInput] = useState("");

  const addItem = () => {
    const val = input.trim();
    if (val && !items.includes(val)) onChange([...items, val]);
    setInput("");
  };

  const removeItem = (item) => onChange(items.filter((i) => i !== item));

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
              addItem();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
        >
          {addLabel}
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {items.map((item) => (
            <span
              key={item}
              className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium max-w-full"
            >
              <span className="truncate max-w-[200px]">{item}</span>
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="hover:text-purple-900 flex-shrink-0"
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
// Specifications Key-Value Editor
// ---------------------------------------------------------------------------
function SpecificationsEditor({ specs, onChange }) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const entries = Object.entries(specs || {});

  const addSpec = () => {
    const k = key.trim();
    const v = value.trim();
    if (k && v) {
      onChange({ ...specs, [k]: v });
      setKey("");
      setValue("");
    }
  };

  const removeSpec = (k) => {
    const updated = { ...specs };
    delete updated[k];
    onChange(updated);
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Key (e.g. material)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSpec();
            }
          }}
          placeholder="Value (e.g. Brass)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        />
        <button
          type="button"
          onClick={addSpec}
          className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex-shrink-0"
        >
          Add
        </button>
      </div>
      {entries.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between px-3 py-2 text-sm bg-gray-50">
              <span>
                <span className="font-medium text-gray-700 capitalize">{k}:</span>{" "}
                <span className="text-gray-500">{v}</span>
              </span>
              <button
                type="button"
                onClick={() => removeSpec(k)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </div>
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
// Product Form Modal
// ---------------------------------------------------------------------------
function ProductFormModal({ isOpen, onClose, onSubmit, initialData, saving, categories }) {
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_PRODUCT, ...initialData } : EMPTY_PRODUCT);
      setImageError(false);
    }
  }, [isOpen, initialData]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.category.trim() || !form.price) return;

    onSubmit({
      ...form,
      price: parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      image: form.image || form.images?.[0] || "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-gray-800">
            {form.id ? "Edit Product" : "Add New Product"}
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
              placeholder="e.g. 5 Mukhi Rudraksha Bracelet"
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
              value={form.shortDescription}
              onChange={(e) => handleChange("shortDescription", e.target.value)}
              placeholder="e.g. For peace and prosperity"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Short summary description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Long Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Long Description
            </label>
            <textarea
              rows={4}
              value={form.longDescription}
              onChange={(e) => handleChange("longDescription", e.target.value)}
              placeholder="Detailed product description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              list="category-options"
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              placeholder="e.g. Rudraksha, Idols"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            <datalist id="category-options">
              {categories.map((c) => (
                <option key={c.id || c} value={c.name || c} />
              ))}
            </datalist>
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
                  placeholder="499"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Price (₹)
              </label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={form.originalPrice}
                  onChange={(e) => handleChange("originalPrice", e.target.value)}
                  placeholder="699"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Primary Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <ImageIcon size={14} /> Primary Image URL (Cloudinary)
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
          </div>

          {/* Additional Images (gallery) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <LinkIcon size={14} /> Gallery Images (URLs)
            </label>
            <ChipInput
              items={form.images}
              onChange={(imgs) => handleChange("images", imgs)}
              placeholder="Paste Cloudinary URL & press Enter"
            />
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
            <ChipInput
              items={form.benefits}
              onChange={(b) => handleChange("benefits", b)}
              placeholder="e.g. Reduces stress"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Tag size={14} /> Tags
            </label>
            <ChipInput
              items={form.tags}
              onChange={(t) => handleChange("tags", t.map((x) => x.toLowerCase()))}
              placeholder="e.g. rudraksha, popular"
            />
          </div>

          {/* Specifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Settings2 size={14} /> Specifications
            </label>
            <SpecificationsEditor
              specs={form.specifications}
              onChange={(s) => handleChange("specifications", s)}
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => handleChange("inStock", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              In Stock
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Active (Visible to customers)
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
              ) : form.id ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Testimonials Modal (per product)
// ---------------------------------------------------------------------------
function TestimonialsModal({ product, onClose, showToast }) {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_TESTIMONIAL);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTestimonials = useCallback(async () => {
    if (!product) return;
    setLoading(true);
    try {
      const res = await fetch(`/backend/products/testimonials?productId=${product.id}`);
      const data = await res.json();
      if (data.success) setTestimonials(data.testimonials);
    } catch (error) {
      console.error(error);
      showToast("Failed to load testimonials", "error");
    } finally {
      setLoading(false);
    }
  }, [product, showToast]);

  useEffect(() => {
    if (product) {
      fetchTestimonials();
      setForm({ ...EMPTY_TESTIMONIAL, productId: product.id });
    }
  }, [product, fetchTestimonials]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) return;

    setSaving(true);
    try {
      const isEdit = Boolean(form.id);
      const res = await fetch("/backend/products/testimonials", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(isEdit ? "Testimonial updated" : "Testimonial added");
      setForm({ ...EMPTY_TESTIMONIAL, productId: product.id });
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
      productId: product.id,
      name: t.name,
      location: t.location || "",
      rating: t.rating,
      text: t.text,
    });
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/backend/products/testimonials?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("Testimonial deleted");
      fetchTestimonials();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MessageSquareText size={18} className="text-purple-600" />
              Testimonials
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[300px]">{product.title}</p>
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
                  onClick={() => setForm({ ...EMPTY_TESTIMONIAL, productId: product.id })}
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
                  <div
                    key={t.id}
                    className="p-3 border border-gray-200 rounded-lg bg-white"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                          {t.location && (
                            <p className="text-xs text-gray-400">{t.location}</p>
                          )}
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
function DeleteConfirmModal({ product, onConfirm, onCancel, deleting }) {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Trash2 size={22} className="text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Product?</h3>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-700">"{product.title}"</span>? This will also
          delete its testimonials. This action cannot be undone.
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
export default function ProductsManagementPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [testimonialsProduct, setTestimonialsProduct] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);
 useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (categoryFilter !== "All") params.set("category", categoryFilter);
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/backend/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        if (data.meta?.categoryCounts) {
          setCategories(
            data.meta.categoryCounts.map((c) => ({ name: c.category }))
          );
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchTerm, showToast]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300); // debounce search
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setShowFormModal(true);
  };

  const handleSubmit = async (formData) => {
    setSaving(true);
    try {
      const isEdit = Boolean(formData.id);
      const res = await fetch("/backend/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Something went wrong");

      showToast(isEdit ? "Product updated successfully" : "Product created successfully");
      setShowFormModal(false);
      fetchProducts();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/backend/products?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete");

      showToast("Product deleted successfully");
      setDeleteTarget(null);
      fetchProducts();
    } catch (error) {
      showToast(
        error.message.includes("foreign key") || error.message.includes("constraint")
          ? "Cannot delete — product has existing orders. Deactivate it instead."
          : error.message,
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = useMemo(() => products, [products]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Products Management</h1>
            <p className="text-gray-500 text-sm mt-1">
              Add, update, or remove products & manage testimonials
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Plus size={18} /> Add Product
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
              placeholder="Search products by title..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500 ml-auto">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="text-center">
              <Loader2 className="animate-spin mx-auto mb-3 text-purple-600" size={28} />
              <p className="text-gray-500 text-sm">Loading products...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 text-gray-400">
            <ImageIcon size={40} className="mb-3" />
            <p>No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-40 bg-gray-100">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <span className="absolute top-2 right-2 px-2 py-1 bg-white/90 text-gray-700 text-xs font-medium rounded-full">
                    {product.category}
                  </span>
                  {!product.isActive && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-gray-800/80 text-white text-xs font-medium rounded-full">
                      Inactive
                    </span>
                  )}
                  {!product.inStock && (
                    <span className="absolute bottom-2 left-2 px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 truncate">{product.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {product.shortDescription}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-purple-700">₹{product.price}</span>
                      {product.originalPrice && product.originalPrice !== product.price && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>
                    {product.rating > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Star size={12} className="text-yellow-500" fill="currentColor" />
                        {product.rating} ({product.reviews})
                      </span>
                    )}
                  </div>

                  {product.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {product.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {product.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-gray-400 text-[10px]">
                          +{product.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleOpenEdit(product)}
                      className="flex items-center justify-center gap-1.5 px-2 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => setTestimonialsProduct(product)}
                      className="flex items-center justify-center gap-1.5 px-2 py-2 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
                    >
                      <MessageSquareText size={13} /> Reviews
                    </button>
                    <button
                      onClick={() => setDeleteTarget(product)}
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

      <ProductFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleSubmit}
        initialData={editingProduct}
        saving={saving}
        categories={categories}
      />

      <DeleteConfirmModal
        product={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        deleting={deleting}
      />

      {testimonialsProduct && (
        <TestimonialsModal
          product={testimonialsProduct}
          onClose={() => setTestimonialsProduct(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
}