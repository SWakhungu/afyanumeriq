// src/components/home/GettingStartedTab.tsx
"use client";

import Link from "next/link";

interface Step {
  number: number;
  title: string;
  description: string;
  link: string;
  linkText: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: "Add organization details",
    description: "Add your organization name and contact details.",
    link: "/settings?tab=organization",
    linkText: "Open →",
  },
  {
    number: 2,
    title: "Add users and assign roles",
    description:
      "Add your management system implementation or maintenance team.",
    link: "/settings?tab=users",
    linkText: "Open →",
  },
  {
    number: 3,
    title: "Select a standard",
    description:
      "Use the standards selection dropdown in the top bar to access the dashboard for the standard you are implementing or maintaining. Get to work.",
    link: "#",
    linkText: "",
  },
];

export default function GettingStartedTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {steps.map((step) => (
          <div
            key={step.number}
            className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold flex items-center justify-center">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {step.title}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm ml-11">
                  {step.description}
                </p>
              </div>
              {step.linkText && (
                <Link
                  href={step.link}
                  className="text-teal-700 font-medium hover:text-teal-900 whitespace-nowrap mt-2"
                >
                  {step.linkText}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-3">
          You&apos;re on your way!
        </h3>
        <p className="text-blue-800 text-sm">
          Once you&apos;ve completed these steps, you&apos;ll be ready to start
          tracking compliance, managing risks, conducting audits, and generating
          reports for your selected standard.
        </p>
      </div>
    </div>
  );
}
