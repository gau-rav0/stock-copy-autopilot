"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Dialog from "@/components/Dialog";

const banter = [
  [
    "$20 a month for ‘great question’?",
    "We brought numbers. And fewer compliments.",
  ],
  [
    "Auditing the chaos.",
    "Checking if ‘long term’ is a strategy or a coping mechanism.",
  ],
  [
    "Diversification left the group chat.",
    "Inviting it back. It has muted notifications.",
  ],
  [
    "Your conviction called a lawyer.",
    "Apparently, the allocation chart is a hostile witness.",
  ],
  [
    "Running the numbers. Removing the flattery.",
    "A chatbot might call this ‘an interesting approach’. We have follow-up questions.",
  ],
  [
    "Calculating emotional damage per rupee.",
    "The spreadsheet is doing maths. The maths is doing therapy.",
  ],
  [
    "Checking the ‘buy the dip’ receipts.",
    "There is a fine line between conviction and a very expensive personality trait.",
  ],
  [
    "Preparing an honest answer.",
    "No ‘as a passionate investor’ intro. You have suffered enough.",
  ],
];

export default function RoastLoading({ onCancel }: { onCancel: () => void }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setPhase((current) => current + 1), 1900);
    return () => clearInterval(timer);
  }, []);
  const current = banter[phase % banter.length];
  return (
    <Dialog
      title="Preparing your portfolio roast"
      onClose={onCancel}
      closeLabel="Cancel roast"
    >
      <div className="roast-loading">
        <p className="eyebrow roast-loading-status" role="status">
          <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          Roast engine warming up
        </p>
        <div className="roast-loading-banter" aria-hidden="true">
          <h2 key={`headline-${phase}`}>{current[0]}</h2>
          <p key={`line-${phase}`}>{current[1]}</p>
        </div>
        <div className="roast-loading-track" aria-hidden="true">
          <span />
        </div>
        <div className="roast-loading-footer">
          <span>Analysing your holdings. Jokes included.</span>
          <button type="button" onClick={onCancel} className="text-link">
            Cancel
          </button>
        </div>
      </div>
    </Dialog>
  );
}
