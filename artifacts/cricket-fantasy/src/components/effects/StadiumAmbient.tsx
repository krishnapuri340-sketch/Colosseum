/**
 * StadiumAmbient — fixed-position background layer that adds drifting
 * aurora glows and slow "floodlight" sweeps behind all page content.
 * Mounts once inside Layout. Pure CSS animations — no JS overhead.
 */
export function StadiumAmbient() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Crimson aurora — top-left, drifts slowly */}
      <div
        className="ambient-blob ambient-blob-a"
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "65vw",
          height: "65vh",
          background:
            "radial-gradient(ellipse at center, rgba(192,25,44,0.22) 0%, rgba(192,25,44,0.06) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {/* Indigo aurora — bottom-right counterweight */}
      <div
        className="ambient-blob ambient-blob-b"
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-15%",
          width: "60vw",
          height: "60vh",
          background:
            "radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.04) 40%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      {/* Stadium floodlight beam — sweeps gently */}
      <div
        className="floodlight-beam"
        style={{
          position: "absolute",
          top: "-40%",
          left: "30%",
          width: "30vw",
          height: "140vh",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 80%)",
          transformOrigin: "top center",
          mixBlendMode: "screen",
        }}
      />
      {/* Pitch seam — thin horizontal accent line near bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "8vh",
          left: "10%",
          right: "10%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.18) 30%, rgba(34,197,94,0.18) 70%, transparent 100%)",
          opacity: 0.6,
        }}
      />
    </div>
  );
}
