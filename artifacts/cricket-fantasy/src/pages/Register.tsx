import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Mail, User } from "lucide-react";

export default function RegisterPage() {
  const { signup } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (focused: boolean = false): React.CSSProperties => ({
    width: "100%",
    padding: "0.8rem 2.5rem 0.8rem 1rem",
    background: "rgba(255,255,255,0.08)",
    border: `1.5px solid ${focused ? "rgba(249,115,22,0.6)" : "rgba(255,255,255,0.14)"}`,
    borderRadius: 10,
    color: "#fff",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0b1f0e 0%, #142b17 40%, #1a3a1e 100%)",
      display: "flex",
      alignItems: "stretch",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Right panel — cricket visual (flipped for register) */}
      <div style={{
        flex: "0 0 42%",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg, #2d6b35 0%, #1e4d24 50%, #0f2912 100%)",
      }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 500 700" preserveAspectRatio="xMidYMid slice">
          <polygon points="0,0 0,300 250,150" fill="rgba(255,255,255,0.04)" />
          <polygon points="500,700 200,700 350,400" fill="rgba(255,255,255,0.04)" />
          <polygon points="400,0 100,100 300,280" fill="rgba(255,255,255,0.03)" />
          <polygon points="0,450 150,700 0,700" fill="rgba(255,255,255,0.05)" />
          <circle cx="100" cy="150" r="160" fill="rgba(255,255,255,0.03)" />
          <circle cx="400" cy="580" r="130" fill="rgba(255,255,255,0.03)" />
        </svg>

        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            fontSize: "clamp(6rem, 14vw, 11rem)",
            lineHeight: 1,
            filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.5))",
            marginBottom: "1.25rem",
            userSelect: "none",
          }}>
            🏆
          </div>

          <div style={{ textAlign: "center", padding: "0 2rem" }}>
            <div style={{
              fontSize: "clamp(1rem, 2.2vw, 1.6rem)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              lineHeight: 1.1,
              textShadow: "0 2px 20px rgba(0,0,0,0.4)",
            }}>
              Build Your<br />Legacy
            </div>
            <div style={{
              marginTop: "0.75rem",
              fontSize: "0.82rem",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.05em",
            }}>
              Draft players. Score points. Win glory.
            </div>
          </div>

          {/* Feature list */}
          <div style={{ marginTop: "2.5rem", padding: "0 2rem", width: "100%" }}>
            {[
              { icon: "⚡", text: "Real-time IPL scoring" },
              { icon: "🎯", text: "Strategic team building" },
              { icon: "🥇", text: "Compete on leaderboards" },
            ].map(({ icon, text }) => (
              <div key={text} style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.6rem 0",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>
                <span style={{ fontSize: "1.1rem" }}>{icon}</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Left panel — form */}
      <div style={{
        flex: "0 0 58%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "2.5rem 4rem",
        position: "relative",
        zIndex: 2,
        overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "2.5rem" }}>
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
        <div style={{ marginBottom: "1.75rem" }}>
          <p style={{ margin: 0, color: "#f97316", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Start for Free
          </p>
          <h1 style={{ margin: 0, fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, textTransform: "uppercase" }}>
            Create New Account
          </h1>
          <p style={{ margin: "0.5rem 0 0", color: "rgba(255,255,255,0.45)", fontSize: "0.875rem" }}>
            Already a member?{" "}
            <a
              href="/login"
              onClick={e => { e.preventDefault(); navigate("/login"); }}
              style={{ color: "#f97316", textDecoration: "none", fontWeight: 700 }}
            >
              Log In
            </a>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem", maxWidth: 440 }}>
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

          {/* Name row */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
              Full Name
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Rohit Sharma"
                style={inputStyle()}
                onFocus={e => (e.target.style.borderColor = "rgba(249,115,22,0.6)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
              />
              <User style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", width: 15, height: 15 }} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
              Email
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={inputStyle()}
                onFocus={e => (e.target.style.borderColor = "rgba(249,115,22,0.6)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
              />
              <Mail style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", width: 15, height: 15 }} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Min 8 characters"
                style={inputStyle()}
                onFocus={e => (e.target.style.borderColor = "rgba(249,115,22,0.6)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0, display: "flex" }}
              >
                {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Re-enter password"
                style={inputStyle()}
                onFocus={e => (e.target.style.borderColor = "rgba(249,115,22,0.6)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.14)")}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.875rem",
              background: loading ? "rgba(249,115,22,0.4)" : "#f97316",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: "0.9rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "0.25rem",
              boxShadow: loading ? "none" : "0 4px 20px rgba(249,115,22,0.4)",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget.style.opacity = "0.9"); }}
            onMouseLeave={e => { (e.currentTarget.style.opacity = "1"); }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
