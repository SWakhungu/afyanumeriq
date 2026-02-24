"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function standardToPrefix(standard: string | null) {
  // iso-7101 -> /7101, iso-27001 -> /27001
  if (!standard) return "/7101";
  const code = standard.replace("iso-", "").trim();
  return code ? `/${code}` : "/7101";
}

export default function FindingsRootRedirect() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const auditId = sp.get("audit_id");
    const standard = sp.get("standard"); // expected: iso-7101, iso-27001, etc

    const base = standardToPrefix(standard);

    const target = auditId
      ? `${base}/audit/findings?audit_id=${encodeURIComponent(auditId)}${
          standard ? `&standard=${encodeURIComponent(standard)}` : ""
        }`
      : `${base}/audit/findings${standard ? `?standard=${encodeURIComponent(standard)}` : ""}`;

    router.replace(target);
  }, [router, sp]);

  return null;
}
