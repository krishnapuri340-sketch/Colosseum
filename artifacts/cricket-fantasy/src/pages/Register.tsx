import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { signup } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
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
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #0a0f1e 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "2.5rem",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏏</div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#fff" }}>CricStrat</h1>
          <p style={{ margin: "0.5rem 0 0", color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
            Create your free account
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && (
            <div style={{
              padding: "0.75rem 1rem",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10,
              color: "#f87171",
              fontSize: "0.875rem",
            }}>
              {error}
            </div>
          )}

          {[
            { label: "Full Name", value: name, set: setName, type: "text", placeholder: "Virat Kohli" },
            { label: "Email", value: email, set: setEmail, type: "email", placeholder: "you@example.com" },
            { label: "Password", value: password, set: setPassword, type: "password", placeholder: "Min 8 characters" },
            { label: "Confirm Password", value: confirm, set: setConfirm, type: "password", placeholder: "Re-enter password" },
          ].map(({ label, value, set, type, placeholder }) => (
            <div key={label}>
              <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", marginBottom: "0.4rem", fontWeight: 500 }}>
                {label}
              </label>
              <input
                type={type}
                value={value}
                onChange={e => set(e.target.value)}
                required
                placeholder={placeholder}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.875rem",
              background: loading ? "rgba(0,212,255,0.3)" : "linear-gradient(135deg, #00d4ff, #0099cc)",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "0.5rem",
            }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
          Already have an account?{" "}
          <a
            href="/login"
            onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ color: "#00d4ff", textDecoration: "none", fontWeight: 600 }}
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
