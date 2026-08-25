"use client";

import { useEffect } from "react";

import { registerServiceWorker } from "@/lib/push-notifications";

export function PwaProvider() {
  useEffect(() => {
    void registerServiceWorker();
  }, []);

  return null;
}
