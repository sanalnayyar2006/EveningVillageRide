"use client";

import type { ReactNode } from "react";

/** A menu choice. `primary` marks the one Enter picks. */
export function MenuButton({
  children,
  onClick,
  primary = false,
  hint,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  /** A short line under the label, e.g. where a saved ride left off. */
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-md border px-5 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-dusk-200 ${
        primary
          ? "border-dusk-400 bg-dusk-600/70 hover:bg-dusk-600"
          : "border-dusk-50/25 hover:bg-dusk-50/10"
      }`}
    >
      <span className="block">{children}</span>
      {hint && <span className="block text-xs text-dusk-100/70">{hint}</span>}
    </button>
  );
}
