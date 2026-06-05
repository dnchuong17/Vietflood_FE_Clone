"use client";

import { useEffect } from "react";

import { prefetchVietnamDivisions } from "@/features/location/api/vietnam-divisions";

export function VietnamDivisionsPrefetch() {
  useEffect(() => {
    void prefetchVietnamDivisions().catch(() => undefined);
  }, []);

  return null;
}
