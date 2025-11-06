"use client";

import { useState, useCallback } from "react";

interface Toast {
  id: number;
  message: string;
  type?: "success" | "error" | "info";
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded shadow text-white ${
            t.type === "error"
              ? "bg-red-500"
              : t.type === "success"
              ? "bg-green-500"
              : "bg-gray-800"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );

  return { show, ToastContainer };
}
