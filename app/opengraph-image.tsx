import { ImageResponse } from "next/og";
export const runtime = "nodejs";
export const alt = "FVI — A closer look at your holdings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        background: "#0B1210",
        color: "#E8F0EB",
        padding: "60px 72px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #334038",
          paddingBottom: 26,
        }}
      >
        <span style={{ fontSize: 50, fontWeight: 700 }}>fvi.</span>
        <span style={{ fontSize: 18, color: "#AAB8AF" }}>
          FOLLOW VERIFIED INVESTORS
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 76, letterSpacing: -4, lineHeight: 1.12 }}>
          Find the weak spots.
        </span>
        <span
          style={{
            fontSize: 76,
            letterSpacing: -4,
            lineHeight: 1.12,
            color: "#34D399",
          }}
        >
          Keep the conviction.
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 22, color: "#AAB8AF" }}>
          A free portfolio roast. Estimates with context.
        </span>
        <span style={{ fontSize: 18, color: "#AAB8AF" }}>
          fvi-ochre.vercel.app
        </span>
      </div>
    </div>,
    size,
  );
}
