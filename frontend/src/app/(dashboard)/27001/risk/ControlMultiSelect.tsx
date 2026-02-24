"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Control = {
  id: number;
  code: string;
  title: string;
};

interface Props {
  value: number[];                 // selected control IDs
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export default function ControlMultiSelect({
  value,
  onChange,
  disabled = false,
}: Props) {
  const [controls, setControls] = useState<Control[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const ref = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------------
   * Load controls (ISO 27001)
   * ------------------------------------------------------------ */
  useEffect(() => {
    apiFetch("/isms/controls/?standard=iso-27001")
      .then(setControls)
      .catch((e) => console.error("Failed to load controls", e));
  }, []);

  /* ------------------------------------------------------------
   * Close on click outside / ESC
   * ------------------------------------------------------------ */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  /* ------------------------------------------------------------
   * Helpers
   * ------------------------------------------------------------ */
  const toggle = (id: number) => {
    const next = value.includes(id)
      ? value.filter((v) => v !== id)
      : [...value, id];
    onChange(next.filter(Boolean));
  };

  const remove = (id: number) => {
    onChange(value.filter((v) => v !== id));
  };

  const filtered = controls.filter(
    (c) =>
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.title.toLowerCase().includes(query.toLowerCase())
  );

  const selectedControls = controls.filter((c) => value.includes(c.id));

  /* ------------------------------------------------------------
   * Render
   * ------------------------------------------------------------ */
  return (
    <div ref={ref} className="relative space-y-2">
      {/* Selected chips */}
      {selectedControls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedControls.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded text-xs"
              title={c.title}
            >
              {c.code}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full border rounded px-3 py-2 text-left text-sm bg-white disabled:bg-gray-100"
      >
        {value.length === 0
          ? "Select controls…"
          : `${value.length} control${value.length > 1 ? "s" : ""} selected`}
      </button>

      {/* Dropdown */}
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow max-h-72 overflow-y-auto">
          {/* Search */}
          <div className="p-2 border-b">
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="Search controls (code or title)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">
              No controls found
            </div>
          ) : (
            filtered.map((c) => (
              <label
                key={c.id}
                className="flex items-start gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={value.includes(c.id)}
                  onChange={() => toggle(c.id)}
                  className="mt-1"
                />
                <div className="text-sm">
                  <div className="font-medium">{c.code}</div>
                  <div className="text-gray-500 text-xs">
                    {c.title}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
