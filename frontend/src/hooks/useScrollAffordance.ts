import { useCallback, useEffect, useRef, useState } from "react";

export interface ScrollAffordance {
  /** There is hidden content to the left (scrolled away from the start). */
  canScrollLeft: boolean;
  /** There is hidden content to the right (not yet at the end). */
  canScrollRight: boolean;
}

/**
 * Tracks horizontal overflow state of a scroll container so the UI can show
 * fade hints on the edges that still have hidden content. This is the
 * "scroll shadow" / "scroll affordance" pattern.
 *
 * Returns a ref to attach to the scrollable element plus the current state.
 * Recomputes on scroll, on resize of the element, and whenever `deps` change
 * (e.g. the data/columns rendered inside).
 */
export function useScrollAffordance<T extends HTMLElement>(
  deps: ReadonlyArray<unknown> = [],
): { ref: React.RefObject<T>; affordance: ScrollAffordance } {
  const ref = useRef<T>(null);
  const [affordance, setAffordance] = useState<ScrollAffordance>({
    canScrollLeft: false,
    canScrollRight: false,
  });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // 1px tolerance: sub-pixel layout rounding can leave scrollLeft at e.g.
    // 0.5 at the true end, which would otherwise keep the fade showing.
    const maxScroll = scrollWidth - clientWidth;
    const next: ScrollAffordance = {
      canScrollLeft: scrollLeft > 1,
      canScrollRight: scrollLeft < maxScroll - 1,
    };
    // Skip the state update (and re-render) when nothing changed — scroll
    // fires on every pixel, but the booleans only flip at the edges.
    setAffordance((prev) =>
      prev.canScrollLeft === next.canScrollLeft &&
      prev.canScrollRight === next.canScrollRight
        ? prev
        : next,
    );
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    measure();

    el.addEventListener("scroll", measure, { passive: true });
    // ResizeObserver catches container resizes (window resize, sidebar toggles,
    // font load) without a global resize listener.
    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);

  return { ref, affordance };
}
