import { useCallback, useEffect, useRef, useState } from "react";

export interface ScrollAffordance {
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

// deps trzeba przekazać gdy zawartość kontenera zmienia rozmiar bez zmiany
// samego elementu (np. nowe kolumny) — ResizeObserver tego nie wyłapie
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
    // 1px margines na subpikselowe zaokrąglenia — bez tego cień zostaje
    // widoczny gdy scrollLeft wynosi np. 0.5 zamiast dokładnego 0
    const maxScroll = scrollWidth - clientWidth;
    const next: ScrollAffordance = {
      canScrollLeft: scrollLeft > 1,
      canScrollRight: scrollLeft < maxScroll - 1,
    };
    // scroll odpala się na każdy piksel — aktualizujemy stan tylko gdy
    // faktycznie zmienia się który cień jest widoczny
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
