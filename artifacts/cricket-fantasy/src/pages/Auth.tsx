import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

const ACCENT = "#c0192c";
const ACCENT_DIM = "rgba(192,25,44,0.15)";

function FloatingInput({
  label, type = "text", value, onChange, error
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const raised = focused || value.length > 0;

  return (
    <div style={{ position: "relative", marginBottom: error ? 4 : 0 }}>
      <label style={{
        position: "absolute", left: "1rem",
        top: raised ? "0.4rem" : "50%",
        transform: raised ? "none" : "translateY(-50%)",
        fontSize: raised ? "0.65rem" : "0.9rem",
        fontWeight: raised ? 700 : 500,
        color: focused ? ACCENT : "rgba(255,255,255,0.35)",
        transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: "none", letterSpacing: raised ? "0.06em" : "0",
        textTransform: raised ? "uppercase" : "none",
        zIndex: 1,
      }}>
        {label}
      </label>
      <input
        type={type === "password" ? (showPwd ? "text" : "password") : type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", height: 58,
          background: "rgba(255,255,255,0.04)",
          border: `1.5px solid ${error ? "rgba(220,38,38,0.6)" : focused ? ACCENT : "rgba(255,255,255,0.1)"}`,
          borderRadius: 14, paddingTop: "1.2rem",
          paddingLeft: "1rem", paddingRight: type === "password" ? "3rem" : "1rem",
          color: "#fff", fontSize: "0.95rem", outline: "none",
          fontFamily: "inherit", transition: "border-color 0.2s",
          boxSizing: "border-box",
          boxShadow: focused ? `0 0 0 3px ${ACCENT}22` : "none",
        }}
      />
      {type === "password" && (
        <button type="button" onClick={() => setShowPwd(v => !v)}
          style={{
            position: "absolute", right: "0.9rem", top: "50%",
            transform: "translateY(-50%)", background: "none", border: "none",
            cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: 4,
          }}>
          {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
      {error && (
        <div style={{ fontSize: "0.72rem", color: "#f87171", marginTop: 4, paddingLeft: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default function Auth() {
  const [mode, setMode]           = useState<"login" | "register">("login");
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [, navigate]              = useLocation();
  const { login, register }       = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "1.5rem",
      background: "radial-gradient(ellipse 100% 60% at 50% -10%, rgba(192,25,44,0.18), transparent 65%), #090c18",
    }}>
      {/* Background orbs */}
      <div style={{
        position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none",
      }}>
        <div style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(192,25,44,0.12) 0%, transparent 70%)",
          top: "-10%", left: "-10%",
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(192,25,44,0.08) 0%, transparent 70%)",
          bottom: "0%", right: "-5%",
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "100%", maxWidth: 400, position: "relative", zIndex: 1,
        }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18, margin: "0 auto 1rem",
            background: "linear-gradient(135deg, #c0192c, #8c0f1e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(192,25,44,0.45)",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
            Colosseum
          </h1>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
            IPL 2026 Fantasy Auction
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(19,23,38,0.8)",
          backdropFilter: "blur(32px) saturate(200%)",
          WebkitBackdropFilter: "blur(32px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 24, padding: "2rem",
          boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
        }}>

          {/* Mode tabs */}
          <div className="tab-bar" style={{ marginBottom: "1.75rem" }}>
            <button className={`tab-item ${mode === "login" ? "active" : ""}`}
              onClick={() => { setMode("login"); setError(""); }}>
              Sign In
            </button>
            <button className={`tab-item ${mode === "register" ? "active" : ""}`}
              onClick={() => { setMode("register"); setError(""); }}>
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div key="name"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}>
                  <FloatingInput label="Full Name" value={name} onChange={setName} />
                </motion.div>
              )}
            </AnimatePresence>

            <FloatingInput label="Email Address" type="email" value={email} onChange={setEmail} />
            <FloatingInput label="Password" type="password" value={password} onChange={setPassword} />

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: "0.75rem 1rem", borderRadius: 12,
                  background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)",
                  fontSize: "0.82rem", color: "#f87171",
                }}>
                {error}
              </motion.div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary press"
              style={{
                width: "100%", height: 52, marginTop: "0.35rem",
                fontSize: "0.95rem", borderRadius: 14,
              }}>
              {loading
                ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                : <>
                    {mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight size={16} />
                  </>}
            </button>
          </form>

          {mode === "login" && (
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "0.8rem", color: "rgba(192,25,44,0.85)",
                fontFamily: "inherit",
              }}>
                Forgot password?
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.78rem", color: "rgba(255,255,255,0.25)" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(192,25,44,0.9)", fontFamily: "inherit",
              fontSize: "0.78rem", fontWeight: 700,
            }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
