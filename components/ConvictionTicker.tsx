import { getTickerFeed } from "@/lib/investor-data";

export default async function ConvictionTicker() {
  const tickerFeed = await getTickerFeed();
  const items = [...tickerFeed, ...tickerFeed]; // duplicated for seamless loop

  return (
    <div className="relative overflow-hidden border-y border-ink-hairline bg-ink-elevated/55 py-3 shadow-[0_0_70px_rgba(0,157,85,.06)] backdrop-blur-xl">
      <div className="flex w-max animate-marquee gap-10 font-mono text-xs text-paper-muted motion-reduce:animate-none">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-brass" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
