import { ImageResponse } from "next/og";

import { getCaseStudyBySlug } from "@/lib/content";
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
  params: Promise<{ lang: Language; slug: string }>;
}) {
  const { lang, slug } = await params;

  const cs = await getCaseStudyBySlug(slug).catch(() => null);
  const title = cs?.title?.[lang] ?? (lang === "de" ? "Projekt" : "Project");
  const summary =
    cs?.summary?.[lang] ??
    (lang === "de"
      ? "Case Study aus meinem Portfolio."
      : "A case study from my portfolio.");

  const badge =
    cs?.confidentialityLevel === "redacted"
      ? "REDACTED"
      : cs
        ? "PUBLIC"
        : "";

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
            "radial-gradient(circle at 15% 15%, rgba(34, 211, 238, 0.32) 0%, rgba(10, 10, 10, 0) 46%), radial-gradient(circle at 85% 70%, rgba(59, 130, 246, 0.25) 0%, rgba(10, 10, 10, 0) 46%), radial-gradient(circle at 70% 20%, rgba(168, 85, 247, 0.26) 0%, rgba(10, 10, 10, 0) 46%)",
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
            Markus Öffel · Case Study
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {badge ? (
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: "0.08em",
                  padding: "8px 12px",
                  borderRadius: 999,
                  background:
                    badge === "REDACTED"
                      ? "rgba(245, 158, 11, 0.14)"
                      : "rgba(16, 185, 129, 0.14)",
                  border:
                    badge === "REDACTED"
                      ? "1px solid rgba(245, 158, 11, 0.25)"
                      : "1px solid rgba(16, 185, 129, 0.25)",
                }}
              >
                {badge}
              </div>
            ) : null}
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
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 64,
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

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 18,
            opacity: 0.7,
          }}
        >
          <div>{slug}</div>
          <div>markus-oeffel</div>
        </div>
      </div>
    ),
    size,
  );
}
