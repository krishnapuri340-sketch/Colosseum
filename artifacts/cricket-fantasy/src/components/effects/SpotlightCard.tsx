import { useRef, type CSSProperties, type ReactNode, type MouseEvent } from "react";

interface Props {
  children: ReactNode;
  /** Hex/rgb color for the spotlight — defaults to crimson */
  color?: string;
  /** Spotlight radius in px */
  radius?: number;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

/**
 * SpotlightCard — wraps children with a cursor-tracking radial glow.
 * Adds the `.spotlight-card` class so the global ::after pseudo
 * (defined in index.css) renders the glow. Updates --mx / --my on
 * mousemove and --spot-color from the color prop.
 */
export function SpotlightCard({
  children,
  color = "192,25,44",
  radius = 360,
  className = "",
  style,
  onClick,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  // Allow `color` to be either "r,g,b" or a hex/css color
  const isCsv = /^\d+\s*,\s*\d+\s*,\s*\d+$/.test(color);
  const spotColor = isCsv ? color : color;

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onClick={onClick}
      className={`spotlight-card ${className}`}
      style={
        {
          ...style,
          ["--spot-color" as string]: spotColor,
          ["--spot-radius" as string]: `${radius}px`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
