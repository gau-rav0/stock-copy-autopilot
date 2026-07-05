const DEFAULT_ITEMS = [
  "Fictional demo data.",
  "Not investment advice.",
  "No copy trading.",
  "No order execution.",
  "Users make their own decisions.",
];

export default function TrustNotice({
  title = "Trust and compliance",
  items = DEFAULT_ITEMS,
  compact = false,
}: {
  title?: string;
  items?: string[];
  compact?: boolean;
}) {
  return (
    <div className="rounded-lg border border-ink-hairline bg-ink-elevated/70 p-4 shadow-[0_0_60px_rgba(0,157,85,.05)] backdrop-blur-xl">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">{title}</p>
      <div className={`mt-3 flex flex-wrap ${compact ? "gap-2" : "gap-3"}`}>
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-ink-hairline px-3 py-1 font-mono text-[11px] text-paper-muted"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
