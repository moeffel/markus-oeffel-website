export type PlausibleEventProps = Record<
  string,
  string | number | boolean | null | undefined
>;

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

export function trackPlausibleEvent(
  eventName: string,
  props?: PlausibleEventProps,
): void {
  if (typeof window === "undefined") return;
  const plausible = window.plausible;
  if (typeof plausible !== "function") return;

  try {
    plausible(eventName, props ? { props } : undefined);
  } catch {
    // ignore
  }
}

