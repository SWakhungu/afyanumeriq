// src/components/home/OverviewTab.tsx
"use client";

import { useRouter } from "next/navigation";

interface StandardIcon {
  code: string;
  name: string;
  path: string;
  description: string;
  icon: string;
}

const standards: StandardIcon[] = [
  {
    code: "iso-7101",
    name: "ISO 7101",
    path: "/7101",
    description: "Healthcare Quality Management Systems",
    icon: "🏥",
  },
  {
    code: "iso-27001",
    name: "ISO/IEC 27001",
    path: "/27001",
    description: "Information Security Management Systems",
    icon: "🔐",
  },
  {
    code: "iso-42001",
    name: "ISO/IEC 42001",
    path: "/42001",
    description: "AI Management Systems",
    icon: "🤖",
  },
  {
    code: "iso-13485",
    name: "ISO 13485",
    path: "/13485",
    description: "Medical Devices Quality Management Systems",
    icon: "⚕️",
  },
  {
    code: "iso-15189",
    name: "ISO 15189",
    path: "/15189",
    description: "Medical Laboratory Quality Management Systems",
    icon: "🧬",
  },
  {
    code: "iso-17025",
    name: "ISO/IEC 17025",
    path: "/17025",
    description: "Testing & Calibration Lab Competency",
    icon: "⚗️",
  },
];

export default function OverviewTab() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Main Content */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          Simplifying ISO standards compliance
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl">
          AfyaNumeriq helps your organization implement and maintain management
          system standards through guided workflows across Risks, Compliance,
          Audits, and Reports modules.
        </p>
      </div>

      {/* Standards Grid */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Supported Standards & Frameworks
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {standards.map((std) => (
            <button
              key={std.code}
              onClick={() => router.push(std.path)}
              className="p-6 border border-gray-200 rounded-lg hover:shadow-lg hover:border-teal-400 transition-all text-left group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                {std.icon}
              </div>
              <h4 className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                {std.name}
              </h4>
              <p className="text-sm text-gray-600 mt-2">{std.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Call to action */}
      <div className="mt-12 p-6 bg-teal-50 border border-teal-200 rounded-lg">
        <h3 className="font-semibold text-teal-900 mb-2">
          Ready to get started?
        </h3>
        <p className="text-teal-800">
          Use the standards selection dropdown in the top bar to access the
          dashboard for the standard you&apos;re implementing or maintaining.
        </p>
      </div>
    </div>
  );
}
