"use client";

import { useEffect } from "react";

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function toPercent(value01: number): string {
  return `${Math.round(clamp01(value01) * 1000) / 10}%`;
}

export function PointerGlow() {
  useEffect(() => {
    let raf = 0;

    function onMove(event: PointerEvent) {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const x = window.innerWidth ? event.clientX / window.innerWidth : 0.5;
        const y = window.innerHeight ? event.clientY / window.innerHeight : 0.2;
        document.documentElement.style.setProperty("--pointer-x", toPercent(x));
        document.documentElement.style.setProperty("--pointer-y", toPercent(y));
      });
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}

