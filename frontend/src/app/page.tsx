"use client";

import Link from "next/link";
import { useAfyaStore } from "@/store/useAfyaStore";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function Home() {
  const { risks, audits, complianceRecords } = useAfyaStore();

  // --- Metrics ---
  const totalRisks = risks.length;
  const openRisks = risks.filter((r) => r.status !== "Closed").length;

  const totalAudits = audits.length;
  const completedAudits = audits.filter((a) => a.status === "Completed").length;

  const scoreMap: Record<string, number> = {
    NI: 0,
    P: 25,
    IP: 50,
    MI: 75,
    O: 100,
  };
  const complianceScores = complianceRecords.map(
    (c) => scoreMap[c.status] || 0
  );
  const averageCompliance =
    complianceScores.length > 0
      ? (
          complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length
        ).toFixed(1)
      : 0;

  const COLORS = ["#14b8a6", "#e5e7eb"];
  const donutData = (val: number) => [
    { name: "Done", value: val },
    { name: "Remaining", value: 100 - val },
  ];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-teal-700">
        Welcome to AfyaNumeriq Dashboard
      </h1>
      <p className="text-gray-600">
        Overview of key Healthcare Quality Management metrics.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Risk Register */}
        <Link href="/risk">
          <Card className="hover:shadow-lg transition border-teal-100 cursor-pointer">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Risk Register
              </h2>
              <div className="w-28 h-28 mx-auto">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={donutData(
                        totalRisks > 0
                          ? ((openRisks / totalRisks) * 100).toFixed(1)
                          : 0
                      )}
                      innerRadius={40}
                      outerRadius={55}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {donutData(
                        totalRisks > 0
                          ? ((openRisks / totalRisks) * 100).toFixed(1)
                          : 0
                      ).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-gray-500 text-sm mt-2">
                {openRisks} Open / {totalRisks} Total
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Compliance */}
        <Link href="/compliance">
          <Card className="hover:shadow-lg transition border-teal-100 cursor-pointer">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Compliance Status
              </h2>
              <div className="w-28 h-28 mx-auto">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={donutData(Number(averageCompliance))}
                      innerRadius={40}
                      outerRadius={55}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {donutData(Number(averageCompliance)).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-gray-500 text-sm mt-2">
                {averageCompliance}% average
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Audits */}
        <Link href="/audit">
          <Card className="hover:shadow-lg transition border-teal-100 cursor-pointer">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Audits
              </h2>
              <div className="w-28 h-28 mx-auto">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={donutData(
                        totalAudits > 0
                          ? ((completedAudits / totalAudits) * 100).toFixed(1)
                          : 0
                      )}
                      innerRadius={40}
                      outerRadius={55}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {donutData(
                        totalAudits > 0
                          ? ((completedAudits / totalAudits) * 100).toFixed(1)
                          : 0
                      ).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-gray-500 text-sm mt-2">
                {completedAudits} Completed / {totalAudits} Total
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Reports */}
        <Link href="/reports">
          <Card className="hover:shadow-lg transition border-teal-100 cursor-pointer">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Reports
              </h2>
              <div className="w-28 h-28 mx-auto">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={donutData(100)} // Always complete (Reports are summaries)
                      innerRadius={40}
                      outerRadius={55}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {donutData(100).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-gray-500 text-sm mt-2">
                View generated summaries
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
