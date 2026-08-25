"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Plus, Loader2, FileText } from "lucide-react";

const EMPTY_CONTENT = {
  hero_subtitle: "",
  hero_access: "Live",
  hero_benefits: [],
  about_title: "About the Pooja",
  about_content: "",
  live_title: "Experience the Pooja Live, Wherever You Are",
  live_content: "",
  how_it_works: [],
  process_intro: "",
  process_steps: [],
  preparation_note: "",
  preparation_required: [],
  preparation_optional: [],
  cultural_title: "Cultural Roots & Connection",
  cultural_story: "",
  cultural_chapters: [],
  cultural_closing: "",
  faqs: [],
  closing_title: "",
  closing_description: "",
  closing_tags: [],
};

const TABS = [
  { key: "hero", label: "Hero & Benefits" },
  { key: "about", label: "About & Live" },
  { key: "how", label: "How It Works" },
  { key: "process", label: "Process" },
  { key: "prep", label: "Preparation" },
  { key: "culture", label: "Cultural Roots" },
  { key: "faq", label: "FAQs" },
  { key: "closing", label: "Closing CTA" },
];

/* ---------------------------------------------------------
   Simple tag list — for plain string arrays
   (hero_benefits, preparation_required, preparation_optional,
   closing_tags)
--------------------------------------------------------- */
function SimpleTagList({ items = [], onChange, placeholder }) {
  const [input, setInput] = useState("");

  const add = () => {
    const val = input.trim();
    if (val) onChange([...items, val]);
    setInput("");
  };

  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

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
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-secondary-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 bg-primary-main/10 text-primary-main rounded-lg text-sm font-medium hover:bg-primary-main/20 transition-colors"
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {items.map((val, idx) => (
            <span
              key={idx}
              className="flex items-center gap-1 px-2.5 py-1 bg-primary-main/5 text-primary-main border border-primary-main/20 rounded-full text-xs font-medium"
            >
              {val}
              <button type="button" onClick={() => remove(idx)} className="hover:text-primary-light">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Repeatable object list — for arrays of structured items
   (how_it_works, process_steps, cultural_chapters, faqs)

   `fields` describes which keys to render as inputs, e.g.:
   [{ key: "title", label: "Title" }, { key: "description", label: "Description", type: "textarea" }]
--------------------------------------------------------- */
function RepeatableObjectList({ items = [], onChange, fields, addLabel = "Add Item" }) {
  const updateItem = (index, key, value) => {
    const updated = items.map((it, i) => (i === index ? { ...it, [key]: value } : it));
    onChange(updated);
  };

  const addItem = () => {
    const empty = Object.fromEntries(fields.map((f) => [f.key, ""]));
    onChange([...items, empty]);
  };

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="p-3 border border-secondary-dark rounded-lg bg-secondary-main/10 relative"
        >
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="absolute top-2 right-2 text-red-main hover:text-red-dark"
          >
            <X size={14} />
          </button>

          <div className="grid gap-2 pr-6">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-secondary mb-1">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    rows={2}
                    value={item[f.key] || ""}
                    onChange={(e) => updateItem(index, f.key, e.target.value)}
                    className="w-full px-2 py-1.5 border border-secondary-dark rounded-md text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={item[f.key] || ""}
                    onChange={(e) => updateItem(index, f.key, e.target.value)}
                    className="w-full px-2 py-1.5 border border-secondary-dark rounded-md text-sm outline-none focus:ring-2 focus:ring-primary-light"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 text-sm font-medium text-primary-main hover:text-primary-light"
      >
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------
   Main Modal
--------------------------------------------------------- */
export default function PoojaContentModal({ pooja, onClose, showToast }) {
  const [activeTab, setActiveTab] = useState("hero");
  const [content, setContent] = useState(EMPTY_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchContent = useCallback(async () => {
    if (!pooja) return;
    setLoading(true);
    try {
      const res = await fetch(`/backend/poojas/${pooja.id}/content`);
      const data = await res.json();
      if (data.success) {
        setContent({ ...EMPTY_CONTENT, ...(data.content || {}) });
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to load content", "error");
    } finally {
      setLoading(false);
    }
  }, [pooja, showToast]);

  useEffect(() => {
    if (pooja) fetchContent();
  }, [pooja, fetchContent]);

  const update = (key, value) => setContent((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/backend/poojas/${pooja.id}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast("Content saved successfully");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!pooja) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-main/50 p-4">
      <div className="bg-background rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="border-b border-secondary-dark p-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <FileText size={18} className="text-primary-main" />
              Manage Page Content
            </h3>
            <p className="text-xs text-secondary mt-0.5 truncate max-w-[400px]">
              {pooja.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary-main/30 flex items-center justify-center hover:bg-secondary-main/50 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 border-b border-secondary-dark overflow-x-auto flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? "bg-primary-main/10 text-primary-main border-b-2 border-primary-main"
                  : "text-secondary hover:text-main"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-primary-main" size={24} />
            </div>
          ) : (
            <>
              {/* HERO TAB */}
              {activeTab === "hero" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-main mb-1">Hero Subtitle / Intro Paragraph</label>
                    <textarea
                      rows={3}
                      value={content.hero_subtitle}
                      onChange={(e) => update("hero_subtitle", e.target.value)}
                      placeholder="Sri Satyanarayan Pooja is traditionally performed to invite peace, prosperity..."
                      className="w-full px-3 py-2 border border-secondary-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main mb-1">Access Label</label>
                    <input
                      type="text"
                      value={content.hero_access}
                      onChange={(e) => update("hero_access", e.target.value)}
                      placeholder="Live"
                      className="w-full px-3 py-2 border border-secondary-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main mb-1">Benefits</label>
                    <SimpleTagList
                      items={content.hero_benefits}
                      onChange={(v) => update("hero_benefits", v)}
                      placeholder="e.g. Peace & Family Harmony"
                    />
                  </div>
                </div>
              )}

              {/* ABOUT TAB */}
              {activeTab === "about" && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-main">About Section</h4>
                    <input
                      type="text"
                      value={content.about_title}
                      onChange={(e) => update("about_title", e.target.value)}
                      placeholder="About the Pooja"
                      className="w-full px-3 py-2 border border-secondary-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light"
                    />
                    <textarea
                      rows={6}
                      value={content.about_content}
                      onChange={(e) => update("about_content", e.target.value)}
                      placeholder="Full about description..."
                      className="w-full px-3 py-2 border border-secondary-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none"
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-secondary-dark">
                    <h4 className="text-sm font-semibold text-main">Live Experience Section</h4>
                    <input
                      type="text"
                      value={content.live_title}
                      onChange={(e) => update("live_title", e.target.value)}
                      placeholder="Experience the Pooja Live, Wherever You Are"
                      className="w-full px-3 py-2 border border-secondary-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light"
                    />
                    <textarea
                      rows={4}
                      value={content.live_content}
                      onChange={(e) => update("live_content", e.target.value)}
                      placeholder="With Rantraa E-Pooja, join your family for a live..."
                      className="w-full px-3 py-2 border border-secondary-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none"
                    />
                  </div>
                </div>
              )}

              {/* HOW IT WORKS TAB */}
              {activeTab === "how" && (
                <RepeatableObjectList
                  items={content.how_it_works}
                  onChange={(v) => update("how_it_works", v)}
                  addLabel="Add Step"
                  fields={[
                    { key: "step", label: "Step Number (e.g. 01)" },
                    { key: "title", label: "Title" },
                    { key: "description", label: "Description", type: "textarea" },
                  ]}
                />
              )}

              {/* PROCESS TAB */}
              {activeTab === "process" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-main mb-1">Intro Line (optional)</label>
                    <textarea
                      rows={2}
                      value={content.process_intro}
                      onChange={(e) => update("process_intro", e.target.value)}
                      placeholder="The exact sequence can vary according to the Pandit's tradition..."
                      className="w-full px-3 py-2 border border-secondary-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none"
                    />
                  </div>

                  <label className="block text-sm font-medium text-main mb-1">Ritual Steps</label>
                  <RepeatableObjectList
                    items={content.process_steps}
                    onChange={(v) => update("process_steps", v)}
                    addLabel="Add Ritual Step"
                    fields={[
                      { key: "title", label: "Title (e.g. Ganesh Pooja)" },
                      { key: "description", label: "Description", type: "textarea" },
                    ]}
                  />
                </div>
              )}

              {/* PREPARATION TAB */}
              {activeTab === "prep" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-main mb-1">Intro Note</label>
                    <textarea
                      rows={2}
                      value={content.preparation_note}
                      onChange={(e) => update("preparation_note", e.target.value)}
                      placeholder="You do not need to arrange the complete ritual setup at home..."
                      className="w-full px-3 py-2 border border-secondary-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main mb-1">Required Items</label>
                    <SimpleTagList
                      items={content.preparation_required}
                      onChange={(v) => update("preparation_required", v)}
                      placeholder="e.g. A quiet, clean space"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main mb-1">Optional Items</label>
                    <SimpleTagList
                      items={content.preparation_optional}
                      onChange={(v) => update("preparation_optional", v)}
                      placeholder="e.g. A diya"
                    />
                  </div>
                </div>
              )}

              {/* CULTURAL ROOTS TAB */}
              {activeTab === "culture" && (
                <div className="space-y-5">
                  <input
                    type="text"
                    value={content.cultural_title}
                    onChange={(e) => update("cultural_title", e.target.value)}
                    placeholder="Cultural Roots & Connection"
                    className="w-full px-3 py-2 border border-secondary-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light"
                  />

                  <div>
                    <label className="block text-sm font-medium text-main mb-1">Story Introduction</label>
                    <textarea
                      rows={5}
                      value={content.cultural_story}
                      onChange={(e) => update("cultural_story", e.target.value)}
                      placeholder="The Satyanarayan Vrat Katha is traditionally associated with..."
                      className="w-full px-3 py-2 border border-secondary-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main mb-2">Chapters</label>
                    <RepeatableObjectList
                      items={content.cultural_chapters}
                      onChange={(v) => update("cultural_chapters", v)}
                      addLabel="Add Chapter"
                      fields={[
                        { key: "chapter", label: "Chapter Number" },
                        { key: "title", label: "Chapter Title" },
                        { key: "description", label: "Chapter Description", type: "textarea" },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-main mb-1">Closing Note</label>
                    <textarea
                      rows={3}
                      value={content.cultural_closing}
                      onChange={(e) => update("cultural_closing", e.target.value)}
                      placeholder="A Tradition That Continues Today..."
                      className="w-full px-3 py-2 border border-secondary-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none"
                    />
                  </div>
                </div>
              )}

              {/* FAQ TAB */}
              {activeTab === "faq" && (
                <RepeatableObjectList
                  items={content.faqs}
                  onChange={(v) => update("faqs", v)}
                  addLabel="Add FAQ"
                  fields={[
                    { key: "question", label: "Question" },
                    { key: "answer", label: "Answer", type: "textarea" },
                  ]}
                />
              )}

              {/* CLOSING CTA TAB */}
              {activeTab === "closing" && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={content.closing_title}
                    onChange={(e) => update("closing_title", e.target.value)}
                    placeholder="Keep Your Tradition Close, Wherever You Are"
                    className="w-full px-3 py-2 border border-secondary-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light"
                  />
                  <textarea
                    rows={3}
                    value={content.closing_description}
                    onChange={(e) => update("closing_description", e.target.value)}
                    placeholder="A traditional Pooja and complete Satyanarayan Katha..."
                    className="w-full px-3 py-2 border border-secondary-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none"
                  />
                  <div>
                    <label className="block text-sm font-medium text-main mb-1">Feature Tags</label>
                    <SimpleTagList
                      items={content.closing_tags}
                      onChange={(v) => update("closing_tags", v)}
                      placeholder="e.g. Verified Pandit Ji"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-secondary-dark p-4 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-secondary-dark rounded-lg text-sm font-medium text-main hover:bg-secondary-main/20 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 px-4 py-2.5 bg-primary-main text-background rounded-lg text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              "Save Content"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}