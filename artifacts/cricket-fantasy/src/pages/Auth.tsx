import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Mail, User } from "lucide-react";

const ACCENT = "#c0192c";
const ACCENT_GLOW = "rgba(192,25,44,0.45)";
const ACCENT_DIM = "rgba(192,25,44,0.35)";
const focusBorder = "rgba(192,25,44,0.7)";
const blurBorder = "rgba(255,255,255,0.12)";

function Field({
  label, type, value, onChange, placeholder, icon, toggle,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon?: React.ReactNode;
  toggle?: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ display: "block", color: "rgba(255,255,255,0.45)", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: icon || toggle ? "0.85rem 2.5rem 0.85rem 1rem" : "0.85rem 1rem",
            background: "rgba(255,255,255,0.06)",
            border: `1.5px solid ${blurBorder}`,
            borderRadius: 10,
            color: "#fff",
            fontSize: "0.92rem",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.2s, background 0.2s",
          }}
          onFocus={e => {
            e.target.style.borderColor = focusBorder;
            e.target.style.background = "rgba(255,255,255,0.09)";
          }}
          onBlur={e => {
            e.target.style.borderColor = blurBorder;
            e.target.style.background = "rgba(255,255,255,0.06)";
          }}
        />
        {(icon || toggle) && (
          <div style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.28)", display: "flex" }}>
            {toggle ?? icon}
          </div>
        )}
      </div>
    </div>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
    <>
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ margin: 0, color: ACCENT, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
          Play for Free
        </p>
        <h1 style={{ margin: 0, fontSize: "2.1rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1, textTransform: "uppercase" }}>
          Sign In
        </h1>
        <p style={{ margin: "0.55rem 0 0", color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>
          Don't have an account?{" "}
          <button onClick={onSwitch} style={{ background: "none", border: "none", color: ACCENT, fontWeight: 700, cursor: "pointer", fontSize: "0.875rem", padding: 0 }}>
            Create Account
          </button>
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {error && <div style={{ padding: "0.7rem 1rem", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#f87171", fontSize: "0.83rem" }}>{error}</div>}
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<Mail style={{ width: 15, height: 15 }} />} />
        <Field
          label="Password" type={showPw ? "text" : "password"} value={password} onChange={setPassword} placeholder="••••••••••••"
          toggle={
            <button type="button" onClick={() => setShowPw(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.28)", padding: 0, display: "flex" }}>
              {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
            </button>
          }
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.9rem",
            background: loading ? ACCENT_DIM : `linear-gradient(135deg, #c0192c 0%, #9b1222 100%)`,
            border: "none",
            borderRadius: 10,
            color: "#fff",
            fontSize: "0.9rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "0.35rem",
            boxShadow: loading ? "none" : `0 4px 24px ${ACCENT_GLOW}`,
            transition: "opacity 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = "0.88"; } }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>
    </>
  );
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { signup } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
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

  return (
    <>
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ margin: 0, color: ACCENT, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
          Start for Free
        </p>
        <h1 style={{ margin: 0, fontSize: "2.1rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1, textTransform: "uppercase" }}>
          Create Account
        </h1>
        <p style={{ margin: "0.55rem 0 0", color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>
          Already a member?{" "}
          <button onClick={onSwitch} style={{ background: "none", border: "none", color: ACCENT, fontWeight: 700, cursor: "pointer", fontSize: "0.875rem", padding: 0 }}>
            Log In
          </button>
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {error && <div style={{ padding: "0.7rem 1rem", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#f87171", fontSize: "0.83rem" }}>{error}</div>}
        <Field label="Full Name" type="text" value={name} onChange={setName} placeholder="Rohit Sharma" icon={<User style={{ width: 15, height: 15 }} />} />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<Mail style={{ width: 15, height: 15 }} />} />
        <Field
          label="Password" type={showPw ? "text" : "password"} value={password} onChange={setPassword} placeholder="Min 8 characters"
          toggle={
            <button type="button" onClick={() => setShowPw(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.28)", padding: 0, display: "flex" }}>
              {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
            </button>
          }
        />
        <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="Re-enter password" />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.9rem",
            background: loading ? ACCENT_DIM : `linear-gradient(135deg, #c0192c 0%, #9b1222 100%)`,
            border: "none",
            borderRadius: 10,
            color: "#fff",
            fontSize: "0.9rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "0.35rem",
            boxShadow: loading ? "none" : `0 4px 24px ${ACCENT_GLOW}`,
            transition: "opacity 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = "0.88"; } }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>
    </>
  );
}

export default function AuthPages({ mode }: { mode: "login" | "register" }) {
  const [, navigate] = useLocation();
  const [animating, setAnimating] = useState(false);

  const switchTo = (next: "login" | "register") => {
    setAnimating(true);
    setTimeout(() => {
      navigate(next === "login" ? "/login" : "/register");
      setAnimating(false);
    }, 160);
  };

  return (
    <div style={{
      minHeight: "100vh",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Card */}
      <div style={{
        position: "relative",
        zIndex: 2,
        width: "calc(100% - 2rem)",
        maxWidth: 480,
        margin: "1rem",
        /* Premium glass layers */
        background: "linear-gradient(160deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderTop: "1px solid rgba(255,255,255,0.22)",
        borderRadius: 20,
        padding: "clamp(1.5rem, 6vw, 2.75rem)",
        backdropFilter: "blur(32px) saturate(160%)",
        WebkitBackdropFilter: "blur(32px) saturate(160%)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.08) inset, 0 -1px 0 rgba(0,0,0,0.3) inset",
        transition: "opacity 0.16s ease",
        opacity: animating ? 0 : 1,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: "2.1rem" }}>
          <div style={{ fontWeight: 900, fontSize: "1.05rem", color: "#fff", letterSpacing: "-0.01em", lineHeight: 1 }}>Colosseum</div>
          <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em", textTransform: "uppercase" }}>IPL Fantasy</div>
        </div>

        {mode === "login"
          ? <LoginForm onSwitch={() => switchTo("register")} />
          : <RegisterForm onSwitch={() => switchTo("login")} />
        }
      </div>
    </div>
  );
}
