type ScoreRingProps = {
  score: number;
  label: string;
  tone?: "good" | "risk" | "neutral";
};

export function ScoreRing({ score, label, tone = "neutral" }: ScoreRingProps) {
  const color = tone === "good" ? "#61DE8E" : tone === "risk" ? "#FF5A66" : "#009D55";
  const background = `conic-gradient(${color} ${score * 3.6}deg, rgba(17,20,19,0.1) 0deg)`;

  return (
    <div className="flex items-center gap-3">
      <div
        className="grid h-16 w-16 shrink-0 place-items-center rounded-full"
        style={{ background }}
        aria-label={`${label}: ${score}`}
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#07080a] text-sm font-black text-white">
          {score}
        </div>
      </div>
      <div>
        <div className="text-sm font-bold text-white/82">{label}</div>
        <div className="text-xs text-white/45">out of 100</div>
      </div>
    </div>
  );
}
