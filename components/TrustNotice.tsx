import { ShieldCheck, Check } from "lucide-react";

const DEFAULT_ITEMS = [
  "Fictional demo data.",
  "Not investment advice.",
  "Read-only follow alerts.",
  "No copy trading or order execution.",
  "You make every investment decision.",
];

export default function TrustNotice({
  title = "Read-only research, not copy trading",
  items = DEFAULT_ITEMS,
  compact = false,
}: {
  title?: string;
  items?: string[];
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl border border-brass/25 bg-ink-elevated/60 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brass/15">
          <ShieldCheck aria-hidden="true" size={14} className="text-brass" />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-paper">{title}</p>
      </div>
      <ul className={`mt-4 grid gap-2.5 ${compact ? "" : "sm:grid-cols-2"}`}>
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-paper-muted">
            <Check aria-hidden="true" size={14} className="mt-0.5 shrink-0 text-brass" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
