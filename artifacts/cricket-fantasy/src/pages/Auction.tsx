import { Layout } from "@/components/layout/Layout";
import { Gavel } from "lucide-react";

export default function Auction() {
  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1rem", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Gavel style={{ width: 28, height: 28, color: "#818cf8" }} />
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Auction</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.95rem", maxWidth: 360, margin: 0 }}>
          Player auctions are coming soon. Build your squad by bidding on your favourite IPL stars.
        </p>
      </div>
    </Layout>
  );
}
