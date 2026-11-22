import { ImageResponse } from "next/og";
import { profile } from "@/data/portfolio";

export const alt = `${profile.name} — ${profile.roles.slice(0, 2).join(" & ")}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#07070A";
const PAPER = "#F4F4F6";
const MUTE = "#8B8B98";
const TECH = "#5B6CFF";
const EDIT = "#FF2E4D";

export default function OpengraphImage() {
  const [devRole = "Developer", editRole = "Video Editor"] = profile.roles;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: INK,
          backgroundImage: `radial-gradient(circle at 12% 110%, rgba(91,108,255,0.35), transparent 45%), radial-gradient(circle at 95% -10%, rgba(255,46,77,0.28), transparent 45%)`,
          color: PAPER,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: MUTE,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: EDIT }} />
            <span>Rec · Portfolio</span>
          </div>
          <div
            style={{
              display: "flex",
              width: 64,
              height: 64,
              borderRadius: 999,
              border: `2px solid rgba(244,244,246,0.25)`,
              alignItems: "center",
              justifyContent: "center",
              color: PAPER,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 0,
            }}
          >
            AA
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 132,
              fontWeight: 800,
              lineHeight: 0.9,
              letterSpacing: -6,
              textTransform: "uppercase",
            }}
          >
            {profile.firstName}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 132,
              fontWeight: 800,
              lineHeight: 0.9,
              letterSpacing: -6,
              textTransform: "uppercase",
              backgroundImage: `linear-gradient(100deg, ${TECH}, #9A52E6 50%, ${EDIT})`,
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {profile.lastName}
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 28, color: MUTE }}>{profile.tagline}</div>
          <div style={{ display: "flex", gap: 36, marginTop: 22, fontSize: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 12, height: 12, background: TECH }} />
              <span>{devRole}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 12, height: 12, background: EDIT }} />
              <span>{editRole}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 22, color: MUTE, letterSpacing: 4 }}>
          <span style={{ color: PAPER }}>00:00:00:00</span>
          <div
            style={{
              display: "flex",
              flex: 1,
              height: 3,
              backgroundImage: `linear-gradient(90deg, ${TECH}, ${EDIT})`,
            }}
          />
          <span style={{ textTransform: "uppercase" }}>{profile.location?.split(",")[0] ?? "Portfolio"}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
