import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Mail } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0b1f0e 0%, #142b17 40%, #1a3a1e 100%)",
      display: "flex",
      alignItems: "stretch",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Left panel — form */}
      <div style={{
        flex: "0 0 55%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "3rem 4rem",
        position: "relative",
        zIndex: 2,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "3rem" }}>
          <span style={{ fontSize: "1.8rem" }}>🏏</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
              CricStrat
            </div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              IPL Fantasy
            </div>
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ margin: 0, color: "#f97316", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Play for Free
          </p>
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, textTransform: "uppercase" }}>
            Sign In
          </h1>
          <p style={{ margin: "0.6rem 0 0", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}>
            Don't have an account?{" "}
            <a
              href="/register"
              onClick={e => { e.preventDefault(); navigate("/register"); }}
              style={{ color: "#f97316", textDecoration: "none", fontWeight: 700 }}
            >
              Create Account
            </a>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 380 }}>
          {error && (
            <div style={{
              padding: "0.7rem 1rem",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: 8,
              color: "#f87171",
              fontSize: "0.85rem",
            }}>
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Email or Username
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "0.85rem 2.5rem 0.85rem 1rem",
                  background: "rgba(255,255,255,0.08)",
                  border: "1.5px solid rgba(255,255,255,0.14)",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(249,115,22,0.6)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
              />
              <Mail style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", width: 16, height: 16 }} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                style={{
                  width: "100%",
                  padding: "0.85rem 2.5rem 0.85rem 1rem",
                  background: "rgba(255,255,255,0.08)",
                  border: "1.5px solid rgba(255,255,255,0.14)",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(249,115,22,0.6)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0, display: "flex" }}
              >
                {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.9rem",
              background: loading ? "rgba(249,115,22,0.4)" : "#f97316",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "0.25rem",
              transition: "opacity 0.2s, transform 0.1s",
              boxShadow: loading ? "none" : "0 4px 20px rgba(249,115,22,0.4)",
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget.style.opacity = "0.92"); }}
            onMouseLeave={e => { (e.currentTarget.style.opacity = "1"); }}
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>
      </div>

      {/* Right panel — photo art */}
      <div style={{
        flex: "0 0 45%",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Photo background */}
        <img
          src="/login-bg.jpeg"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        {/* Dark overlay so text reads well */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.15) 100%)",
        }} />

        {/* Content on top of photo */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "2.5rem",
          textAlign: "center",
        }}>
          {/* Tagline */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{
              fontSize: "clamp(1.3rem, 2.5vw, 2rem)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              lineHeight: 1.1,
              textShadow: "0 2px 30px rgba(0,0,0,0.8)",
            }}>
              Pick Your<br />Dream XI
            </div>
            <div style={{
              marginTop: "0.6rem",
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.05em",
              textShadow: "0 1px 10px rgba(0,0,0,0.9)",
            }}>
              Compete with cricket fans across India
            </div>
          </div>

          {/* Stats badges */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { val: "70+", label: "IPL Matches" },
              { val: "200+", label: "Players" },
              { val: "10", label: "Teams" },
            ].map(({ val, label }) => (
              <div key={label} style={{
                background: "rgba(0,0,0,0.45)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                padding: "0.65rem 1.1rem",
                textAlign: "center",
                backdropFilter: "blur(12px)",
              }}>
                <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#f97316" }}>{val}</div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
