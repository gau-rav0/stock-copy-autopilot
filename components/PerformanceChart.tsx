"use client";

import { GrowthPoint } from "@/lib/types";

const WIDTH = 920;
const HEIGHT = 300;
const PAD = { top: 26, right: 42, bottom: 40, left: 48 };

const formatPoint = (value: number) => `${Math.round(value)}`;

const makePath = (points: Array<{ x: number; y: number }>) =>
  points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

export default function PerformanceChart({ data }: { data: GrowthPoint[] }) {
  const values = data.flatMap((point) => [point.portfolio, point.nifty50]);
  const min = Math.min(...values, 96);
  const max = Math.max(...values, 104);
  const range = Math.max(1, max - min);
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const xStep = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth;

  const yFor = (value: number) => PAD.top + ((max - value) / range) * plotHeight;
  const toPoints = (key: "portfolio" | "nifty50") =>
    data.map((point, index) => ({
      x: PAD.left + index * xStep,
      y: yFor(point[key]),
      value: point[key],
      month: point.month,
    }));

  const portfolioPoints = toPoints("portfolio");
  const niftyPoints = toPoints("nifty50");
  const portfolioPath = makePath(portfolioPoints);
  const niftyPath = makePath(niftyPoints);
  const areaPath = `${portfolioPath} L ${portfolioPoints.at(-1)?.x ?? PAD.left} ${HEIGHT - PAD.bottom} L ${PAD.left} ${HEIGHT - PAD.bottom} Z`;
  const start = data[0];
  const end = data.at(-1);
  const delta = end && start ? end.portfolio - start.portfolio : 0;
  const benchmarkDelta = end && start ? end.nifty50 - start.nifty50 : 0;
  const yTicks = [max, min + range / 2, min];

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-paper-muted">
            Indexed to 100
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-display text-3xl text-paper">{delta >= 0 ? "+" : ""}{delta.toFixed(0)}%</span>
            <span className="text-sm text-paper-muted">vs. Nifty {benchmarkDelta >= 0 ? "+" : ""}{benchmarkDelta.toFixed(0)}%</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-2 text-paper">
            <span className="h-2 w-6 rounded-full bg-brass" />
            Portfolio
          </span>
          <span className="inline-flex items-center gap-2 text-paper-muted">
            <span className="h-px w-6 border-t border-dashed border-paper-muted" />
            Nifty 50
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-ink-hairline bg-ink/70 shadow-[0_0_70px_rgba(0,157,85,.08)]">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-[260px] w-full" role="img" aria-label="Portfolio growth chart compared with Nifty 50">
          <defs>
            <linearGradient id="portfolioArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#61DE8E" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#61DE8E" stopOpacity="0" />
            </linearGradient>
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {yTicks.map((tick) => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} stroke="#232A33" strokeDasharray="5 8" />
                <text x={18} y={y + 4} fill="#8B92A0" fontSize="12" fontFamily="JetBrains Mono, monospace">
                  {formatPoint(tick)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#portfolioArea)" />
          <path d={niftyPath} fill="none" stroke="#8B92A0" strokeDasharray="7 7" strokeLinecap="round" strokeWidth="3" />
          <path d={portfolioPath} fill="none" filter="url(#lineGlow)" stroke="#61DE8E" strokeLinecap="round" strokeWidth="5" />

          {portfolioPoints.map((point, index) => (
            <g key={point.month}>
              <line x1={point.x} x2={point.x} y1={HEIGHT - PAD.bottom} y2={HEIGHT - PAD.bottom + 5} stroke="#46515F" />
              <text
                x={point.x}
                y={HEIGHT - 16}
                fill={index === portfolioPoints.length - 1 ? "#E8E6E0" : "#8B92A0"}
                fontSize="12"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
              >
                {point.month}
              </text>
            </g>
          ))}

          {portfolioPoints.map((point, index) => (
            <circle
              key={`${point.month}-dot`}
              cx={point.x}
              cy={point.y}
              r={index === portfolioPoints.length - 1 ? 6 : 4}
              fill="#0B0F14"
              stroke="#61DE8E"
              strokeWidth="3"
            />
          ))}

          {end && (
            <>
              <text x={WIDTH - PAD.right + 8} y={(portfolioPoints.at(-1)?.y ?? PAD.top) + 4} fill="#61DE8E" fontSize="13" fontWeight="700">
                {end.portfolio}
              </text>
              <text x={WIDTH - PAD.right + 8} y={(niftyPoints.at(-1)?.y ?? PAD.top) + 4} fill="#8B92A0" fontSize="13" fontWeight="700">
                {end.nifty50}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
