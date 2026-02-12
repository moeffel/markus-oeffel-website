import { ImageResponse } from "next/og";

import { getCaseStudyBySlug, getThesis } from "@/lib/content";
import type { Language } from "@/lib/i18n";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;

  const [thesis, cs] = await Promise.all([
    getThesis().catch(() => null),
    getCaseStudyBySlug("thesis").catch(() => null),
  ]);

  const title = thesis?.title?.[lang] ?? "Thesis";
  const summary =
    cs?.summary?.[lang] ??
    thesis?.summary?.[lang] ??
    (lang === "de"
      ? "Masterarbeit als flagship case study."
      : "Master’s thesis as a flagship case study.");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 18% 18%, rgba(168, 85, 247, 0.34) 0%, rgba(10, 10, 10, 0) 46%), radial-gradient(circle at 80% 75%, rgba(34, 211, 238, 0.28) 0%, rgba(10, 10, 10, 0) 48%)",
          color: "#ededed",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 22,
              opacity: 0.9,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "linear-gradient(90deg, #22d3ee, #a855f7)",
              }}
            />
            Markus Öffel · Thesis
          </div>
          <div
            style={{
              fontSize: 16,
              opacity: 0.65,
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: 999,
              padding: "8px 14px",
            }}
          >
            {lang.toUpperCase()}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 62,
              lineHeight: 1.08,
              fontWeight: 750,
              letterSpacing: "-0.04em",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 26, opacity: 0.78, maxWidth: 980 }}>
            {summary}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["PDF", "Notebook", "Methods"].map((tag) => (
            <div
              key={tag}
              style={{
                fontSize: 18,
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
