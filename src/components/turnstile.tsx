"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-turnstile="true"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("load_failed")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("load_failed"));
    document.head.appendChild(script);
  });
}

export function TurnstileWidget(props: {
  siteKey: string;
  onToken: (token: string) => void;
  resetKey?: string | number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void loadTurnstileScript()
      .then(() => {
        if (cancelled) return;
        const container = containerRef.current;
        const t = window.turnstile;
        if (!container || !t) return;

        if (widgetIdRef.current) {
          try {
            t.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
          widgetIdRef.current = null;
        }

        widgetIdRef.current = t.render(container, {
          sitekey: props.siteKey,
          callback: (token: string) => props.onToken(token),
          "expired-callback": () => props.onToken(""),
          "error-callback": () => props.onToken(""),
        });
      })
      .catch(() => {
        props.onToken("");
      });

    return () => {
      cancelled = true;
      const t = window.turnstile;
      if (t && widgetIdRef.current) {
        try {
          t.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
      widgetIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.siteKey, props.resetKey]);

  return <div ref={containerRef} className="min-h-[66px]" />;
}

