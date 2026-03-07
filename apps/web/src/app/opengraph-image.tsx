import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Open Health — Open Source Health Tracking";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #ecfdf5 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 28,
            backgroundColor: "#16a34a",
            marginBottom: 40,
          }}
        >
          <span style={{ fontSize: 48, fontWeight: 700, color: "white", letterSpacing: -2 }}>
            OH
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 300,
            color: "#171717",
            letterSpacing: -1,
            marginBottom: 16,
          }}
        >
          Open Health
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 300,
            color: "#737373",
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Open Source Health Tracking & AI Nutrition Assistant
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: "#16a34a",
            marginTop: 32,
            letterSpacing: 2,
          }}
        >
          openhealth.blog
        </div>
      </div>
    ),
    { ...size }
  );
}
