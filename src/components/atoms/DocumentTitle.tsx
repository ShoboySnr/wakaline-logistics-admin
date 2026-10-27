"use client";

import { useEffect } from "react";

export default function DocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = `${title} | Waka Line Admin`;
  }, [title]);

  return null;
}
