import { ShieldCheck } from "lucide-react";

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
    <div className="rounded-lg border border-brass/30 bg-[linear-gradient(135deg,rgba(0,157,85,.18),rgba(18,20,20,.86)_58%)] p-4 shadow-[0_0_60px_rgba(0,157,85,.1)] backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <ShieldCheck aria-hidden="true" size={16} className="text-brass" />
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">{title}</p>
      </div>
      <div className={`mt-3 flex flex-wrap ${compact ? "gap-2" : "gap-3"}`}>
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-brass/20 bg-ink/30 px-3 py-1 font-mono text-[11px] text-paper-muted"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
