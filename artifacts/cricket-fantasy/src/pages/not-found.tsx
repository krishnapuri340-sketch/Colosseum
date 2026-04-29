import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Home, Gavel, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-8xl font-black text-white/5 select-none mb-2" style={{ fontSize:"8rem", lineHeight:1 }}>404</div>
        <div className="text-5xl mb-4">🏏</div>
        <h1 className="text-2xl font-black text-white mb-2">Page not found</h1>
        <p className="text-white/40 text-base mb-8 max-w-sm">
          This page got bowled out. Head back to the dashboard or start an auction.
        </p>
        <div className="flex gap-3">
          <Link href="/">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all cursor-pointer hover:scale-[1.03]"
              style={{ background:"rgba(192,25,44,0.15)", border:"1px solid rgba(192,25,44,0.3)", color:"#f87171" }}>
              <Home className="w-4 h-4" /> Dashboard
            </div>
          </Link>
          <Link href="/auction">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all cursor-pointer hover:scale-[1.03]"
              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)" }}>
              <Gavel className="w-4 h-4" /> Auction
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
