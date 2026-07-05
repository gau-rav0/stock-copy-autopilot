import { Transaction } from "@/lib/types";

const ACTION_LABEL: Record<string, string> = {
  buy: "New position",
  add: "Added",
  reduce: "Reduced",
  exit: "Full exit",
};

export default function ReplayTimeline({ transactions }: { transactions: Transaction[] }) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
  );

  return (
    <ol className="relative space-y-6 border-l border-ink-hairline pl-6">
      {sorted.map((tx) => (
        <li key={tx.id} className="relative">
          <span
            className={`absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-ink ${
              tx.isConvictionAlert ? "bg-brass shadow-[0_0_18px_rgba(97,222,142,.5)]" : "bg-paper-muted"
            }`}
          />
          <div className="flex items-center justify-between text-xs text-paper-muted">
            <span className="font-mono">{tx.transactionDate}</span>
            {tx.isConvictionAlert && (
              <span className="rounded-full border border-brass/40 px-2 py-0.5 text-brass">
                Conviction alert
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-paper">
            <span className="text-paper-muted">{ACTION_LABEL[tx.action]}</span>{" "}
            <span className="font-mono">{tx.ticker}</span>{" "}
            <span className="font-mono text-paper-muted">
              {tx.allocationBefore}% to {tx.allocationAfter}%
            </span>
          </p>
          {tx.alertText && <p className="mt-1 text-sm text-paper-muted italic">{tx.alertText}</p>}
        </li>
      ))}
    </ol>
  );
}
