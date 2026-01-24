"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type StandardItem = {
  code: string; // url segment for standard routes
  name: string; // display name
  path: string; // route prefix
};

const STANDARDS: StandardItem[] = [
  { code: "7101", name: "ISO 7101", path: "/" },
  { code: "27001", name: "ISO/IEC 27001", path: "/27001" },
  { code: "42001", name: "ISO/IEC 42001", path: "/42001" },
  { code: "13485", name: "ISO 13485", path: "/13485" },
  { code: "15189", name: "ISO 15189", path: "/15189" },
  { code: "17025", name: "ISO/IEC 17025", path: "/17025" },
];

export default function StandardsDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // ✅ derive selected standard from current URL
  const selected = useMemo(() => {
    const p = pathname || "/";

    // longest prefix match wins
    const match = STANDARDS
      .filter((s) => (s.path === "/" ? true : p.startsWith(s.path)))
      .sort((a, b) => b.path.length - a.path.length)[0];

    return match || STANDARDS[0];
  }, [pathname]);

  const handleSelect = (standard: StandardItem) => {
    setOpen(false);
    router.push(standard.path);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <span className="font-medium text-gray-700">{selected.name}</span>
        <span className="text-gray-500">▼</span>
      </button>

      {open && (
        <div className="absolute mt-2 w-56 bg-white border rounded-md shadow-lg z-50">
          {STANDARDS.map((std) => (
            <button
              key={std.code}
              onClick={() => handleSelect(std)}
              className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                std.path === selected.path ? "font-semibold bg-gray-50" : ""
              }`}
            >
              {std.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
