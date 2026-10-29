import Image from "next/image";
import Link from "next/link";

/**
 * The logo swaps to its white variant in dark mode. The swap is driven by the
 * `.dark` wrapper class (via Tailwind's dark: variant) rather than store state,
 * so it always matches the theme actually painted on screen — no hydration flash
 * and no dependence on when the persisted theme rehydrates. Pass `isWhite` to
 * force the white variant (e.g. on a coloured header).
 */
export default function Logo({ isWhite }: { isWhite?: boolean }) {
  const dimensions = { width: 169, height: 40 };

  return (
    <Link href="/dashboard" className="inline-block">
      {isWhite ? (
        <Image src="/wakaline-logo-white.svg" alt="Waka Line Logistics logo" {...dimensions} priority />
      ) : (
        <>
          <Image src="/wakaline-logo.svg" alt="Waka Line Logistics logo" {...dimensions} priority className="block dark:hidden" />
          <Image src="/wakaline-logo-white.svg" alt="Waka Line Logistics logo" {...dimensions} priority className="hidden dark:block" />
        </>
      )}
    </Link>
  );
}
