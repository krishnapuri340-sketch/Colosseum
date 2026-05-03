import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Check, AlertCircle } from "lucide-react";
import { apiJson } from "@/lib/api";

const ACCENT = "#c0192c";

export default function ResetPassword() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const token = new URLSearchParams(search).get("token") ?? "";

  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    if (!token) setError("Invalid or missing reset link. Please request a new one.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPw.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      await apiJson("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: newPw }),
      });
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
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
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
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
        style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>

        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: "0 auto 1rem",
            overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
          }}>
            <img src="/logo.png" alt="Colosseum" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
            Colosseum
          </h1>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
            IPL 2026 Fantasy Auction
          </p>
        </div>

        <div style={{
          background: "rgba(19,23,38,0.8)",
          backdropFilter: "blur(32px) saturate(200%)",
          WebkitBackdropFilter: "blur(32px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 24, padding: "2rem",
          boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
        }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1rem",
              }}>
                <Check size={24} style={{ color: "#4ade80" }} />
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>
                Password updated!
              </h3>
              <p style={{ margin: 0, fontSize: "0.83rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                Redirecting you to sign in…
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
                Set a new password
              </h2>
              <p style={{ margin: "0 0 1.5rem", fontSize: "0.83rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                Choose something strong — at least 8 characters.
              </p>

              {error && !token ? (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "0.85rem 1rem", borderRadius: 12,
                  background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)",
                  fontSize: "0.83rem", color: "#f87171",
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {/* New password */}
                  <div style={{ position: "relative" }}>
                    <label style={{
                      display: "block", fontSize: "0.68rem", fontWeight: 700,
                      letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase", marginBottom: 6,
                    }}>New Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPw ? "text" : "password"}
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        placeholder="At least 8 characters"
                        style={{
                          width: "100%", height: 52, boxSizing: "border-box",
                          background: "rgba(255,255,255,0.04)",
                          border: "1.5px solid rgba(255,255,255,0.1)",
                          borderRadius: 14, padding: "0 3rem 0 1rem",
                          color: "#fff", fontSize: "0.95rem", outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        style={{
                          position: "absolute", right: "0.9rem", top: "50%",
                          transform: "translateY(-50%)", background: "none", border: "none",
                          cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: 4,
                        }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label style={{
                      display: "block", fontSize: "0.68rem", fontWeight: 700,
                      letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase", marginBottom: 6,
                    }}>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      placeholder="Repeat new password"
                      style={{
                        width: "100%", height: 52, boxSizing: "border-box",
                        background: "rgba(255,255,255,0.04)",
                        border: "1.5px solid rgba(255,255,255,0.1)",
                        borderRadius: 14, padding: "0 1rem",
                        color: "#fff", fontSize: "0.95rem", outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  {error && (
                    <div style={{
                      padding: "0.7rem 0.9rem", borderRadius: 10,
                      background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)",
                      fontSize: "0.8rem", color: "#f87171",
                    }}>
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="btn-primary press"
                    style={{ width: "100%", height: 52, marginTop: "0.25rem", fontSize: "0.95rem", borderRadius: 14 }}>
                    {loading
                      ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                      : "Update Password"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.78rem", color: "rgba(255,255,255,0.25)" }}>
          Remember it now?{" "}
          <button onClick={() => navigate("/login")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(192,25,44,0.9)", fontFamily: "inherit",
              fontSize: "0.78rem", fontWeight: 700,
            }}>
            Sign in
          </button>
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
