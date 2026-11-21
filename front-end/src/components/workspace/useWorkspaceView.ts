"use client";

import { useSearchParams } from "next/navigation";
import type { MouseEvent } from "react";

/** Native history keeps tab changes local while supporting links and Back. */
export function useWorkspaceView<T extends string>(
  views: readonly T[],
  fallback: T,
) {
  const params = useSearchParams();
  const candidate = params.get("vista");
  const view = views.find((item) => item === candidate) ?? fallback;

  function navigate(next: T) {
    if (next === view) return;
    const url = new URL(window.location.href);
    url.searchParams.set("vista", next);
    window.history.pushState(null, "", url);
  }

  function follow(event: MouseEvent<HTMLAnchorElement>, next: T) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.defaultPrevented
    )
      return;
    event.preventDefault();
    navigate(next);
  }

  return { view, navigate, follow };
}
