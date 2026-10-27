"use client";

import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/src/store";

export default function Logo({ isWhite }: { isWhite?: boolean }) {
  const theme = useStore((state) => state.theme);

  return (
    <Link href="/dashboard" className="inline-block">
      <Image
        src={isWhite || theme === "dark" ? "/wakaline-logo-white.svg" : "/wakaline-logo.svg"}
        alt="Waka Line Logistics logo"
        width={169}
        height={40}
        priority
      />
    </Link>
  );
}
