export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-md border border-dusk-50/30 bg-dusk-900/40 px-1.5 py-0.5 font-sans text-[11px] leading-none text-dusk-50">
      {children}
    </kbd>
  );
}
