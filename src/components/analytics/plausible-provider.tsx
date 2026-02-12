"use client";

import { useEffect } from "react";

import type { PlausibleEventProps } from "@/lib/analytics/plausible";
import { trackPlausibleEvent } from "@/lib/analytics/plausible";

function parseProps(value: string | null): PlausibleEventProps | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object") return parsed as PlausibleEventProps;
  } catch {
    // ignore
  }
  return undefined;
}

export function PlausibleProvider() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;

      const el = target.closest<HTMLElement>("[data-plausible-event]");
      if (!el) return;

      const eventName = el.dataset.plausibleEvent;
      if (!eventName) return;

      const props = parseProps(el.dataset.plausibleProps ?? null);
      trackPlausibleEvent(eventName, props);
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}

export function PlausibleEvent(props: {
  eventName: string;
  eventProps?: PlausibleEventProps;
}) {
  const key = JSON.stringify(props.eventProps ?? {});

  useEffect(() => {
    trackPlausibleEvent(props.eventName, props.eventProps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.eventName, key]);

  return null;
}

