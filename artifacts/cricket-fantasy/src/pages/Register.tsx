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

  const focusStyle = "rgba(249,115,22,0.6)";
  const blurStyle = "rgba(255,255,255,0.12)";

  return (
    <div style={{
      minHeight: "100vh",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      overflow: "hidden",
    }}>
      {/* Full-screen background photo */}
      <img
        src="/register-bg.jpeg"
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

      {/* Dark overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 100%)",
      }} />

      {/* Floating form card */}
      <div style={{
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: 420,
        margin: "1rem",
        background: "rgba(10,10,14,0.7)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "2.5rem",
        backdropFilter: "blur(24px)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        {/* Logo */}
        <div style={{ marginBottom: "2.25rem" }}>
          <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Colosseum
          </div>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            IPL Fantasy
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: "1.75rem" }}>
          <p style={{ margin: 0, color: "#f97316", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
            Start for Free
          </p>
          <h1 style={{ margin: 0, fontSize: "2.25rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1, textTransform: "uppercase" }}>
            Create Account
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
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
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

          {/* Full Name */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Full Name
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Rohit Sharma"
                style={{ width: "100%", padding: "0.85rem 2.5rem 0.85rem 1rem", background: "rgba(255,255,255,0.07)", border: `1.5px solid ${blurStyle}`, borderRadius: 10, color: "#fff", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={e => (e.target.style.borderColor = focusStyle)}
                onBlur={e => (e.target.style.borderColor = blurStyle)}
              />
              <User style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", width: 16, height: 16 }} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Email
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{ width: "100%", padding: "0.85rem 2.5rem 0.85rem 1rem", background: "rgba(255,255,255,0.07)", border: `1.5px solid ${blurStyle}`, borderRadius: 10, color: "#fff", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={e => (e.target.style.borderColor = focusStyle)}
                onBlur={e => (e.target.style.borderColor = blurStyle)}
              />
              <Mail style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", width: 16, height: 16 }} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Min 8 characters"
                style={{ width: "100%", padding: "0.85rem 2.5rem 0.85rem 1rem", background: "rgba(255,255,255,0.07)", border: `1.5px solid ${blurStyle}`, borderRadius: 10, color: "#fff", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={e => (e.target.style.borderColor = focusStyle)}
                onBlur={e => (e.target.style.borderColor = blurStyle)}
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

          {/* Confirm Password */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Re-enter password"
                style={{ width: "100%", padding: "0.85rem 1rem", background: "rgba(255,255,255,0.07)", border: `1.5px solid ${blurStyle}`, borderRadius: 10, color: "#fff", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={e => (e.target.style.borderColor = focusStyle)}
                onBlur={e => (e.target.style.borderColor = blurStyle)}
              />
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
