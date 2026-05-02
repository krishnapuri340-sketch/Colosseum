import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
}

/**
 * AnimatedNumber — easeOutCubic count-up that respects user's
 * reduced-motion preference and re-runs whenever `value` changes.
 */
export function AnimatedNumber({
  value,
  duration = 900,
  format,
  prefix = "",
  suffix = "",
}: Props) {
  const [display, setDisplay] = useState<number>(0);
  const fromRef = useRef<number>(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const start = performance.now();
    const from = fromRef.current;
    const delta = value - from;
    let raf = 0;

    function step(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(from + delta * eased);
      if (t < 1) raf = requestAnimationFrame(step);
      else fromRef.current = value;
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const rendered = format
    ? format(Math.round(display))
    : Math.round(display).toLocaleString();
  return (
    <>
      {prefix}
      {rendered}
      {suffix}
    </>
  );
}
