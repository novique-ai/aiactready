"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

export default function Analytics() {
  useEffect(() => {
    void track("page_view");
  }, []);
  return null;
}
