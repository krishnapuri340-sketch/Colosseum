import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { ArrowLeft, Plus } from "lucide-react";

const ACCENT = "#c0192c";
const blurBorder = "rgba(255,255,255,0.1)";
const focusBorder = "rgba(192,25,44,0.6)";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <label style={{
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.4)",
        }}>
          {label}
        </label>
        {hint && (
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)" }}>{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        padding: "0.85rem 1rem",
        background: "rgba(255,255,255,0.05)",
        border: `1.5px solid ${focused ? focusBorder : blurBorder}`,
        borderRadius: 10,
        color: "#fff",
        fontSize: "0.92rem",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.2s, background 0.2s",
        ...(focused ? { background: "rgba(255,255,255,0.07)" } : {}),
      }}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        padding: "0.85rem 1rem",
        background: "rgba(20,20,35,0.9)",
        border: `1.5px solid ${focused ? focusBorder : blurBorder}`,
        borderRadius: 10,
        color: "#fff",
        fontSize: "0.92rem",
        outline: "none",
        boxSizing: "border-box",
        cursor: "pointer",
        appearance: "none",
        transition: "border-color 0.2s",
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} style={{ background: "#141427" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function CreateAuction() {
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [managers, setManagers] = useState("8");
  const [budget, setBudget] = useState("100");
  const [timer, setTimer] = useState("60");
  const [squadSize, setSquadSize] = useState("11");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    navigate("/auction");
  };

  return (
    <Layout>
      <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => navigate("/auction")}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: "0.5rem 0.75rem",
              color: "rgba(255,255,255,0.5)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.35rem",
              fontSize: "0.8rem", fontWeight: 600,
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)";
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Back
          </button>
          <div>
            <p style={{ margin: 0, color: ACCENT, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Auction
            </p>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Create New Auction
            </h1>
          </div>
        </div>

        <form
          onSubmit={handleCreate}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          <Field label="Auction Name" hint="Required">
            <TextInput
              value={name}
              onChange={setName}
              placeholder="e.g. Friday Night Draft"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Managers" hint="2–12">
              <SelectInput
                value={managers}
                onChange={setManagers}
                options={["2","3","4","5","6","7","8","9","10","11","12"].map(v => ({ label: `${v} managers`, value: v }))}
              />
            </Field>
            <Field label="Squad Size">
              <SelectInput
                value={squadSize}
                onChange={setSquadSize}
                options={[
                  { label: "11 players", value: "11" },
                  { label: "15 players", value: "15" },
                  { label: "18 players", value: "18" },
                ]}
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Budget per manager" hint="in crores">
              <TextInput
                value={budget}
                onChange={setBudget}
                placeholder="100"
                type="number"
              />
            </Field>
            <Field label="Bid timer" hint="seconds">
              <SelectInput
                value={timer}
                onChange={setTimer}
                options={[
                  { label: "30 seconds", value: "30" },
                  { label: "60 seconds", value: "60" },
                  { label: "90 seconds", value: "90" },
                  { label: "120 seconds", value: "120" },
                ]}
              />
            </Field>
          </div>

          <div style={{ paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              style={{
                width: "100%",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                padding: "0.9rem 1.5rem",
                background: !name.trim() ? "rgba(192,25,44,0.2)" : ACCENT,
                border: `1.5px solid ${!name.trim() ? "rgba(192,25,44,0.25)" : ACCENT}`,
                borderRadius: 12,
                color: !name.trim() ? "rgba(255,255,255,0.3)" : "#fff",
                fontWeight: 800, fontSize: "0.92rem",
                cursor: name.trim() ? "pointer" : "default",
                transition: "all 0.2s",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={e => {
                if (name.trim()) (e.currentTarget as HTMLButtonElement).style.background = "#a8172a";
              }}
              onMouseLeave={e => {
                if (name.trim()) (e.currentTarget as HTMLButtonElement).style.background = ACCENT;
              }}
            >
              {loading ? (
                <span style={{ opacity: 0.7 }}>Creating…</span>
              ) : (
                <>
                  <Plus style={{ width: 16, height: 16 }} />
                  Create Auction Room
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </Layout>
  );
}
