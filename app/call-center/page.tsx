"use client";

import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallCenterContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") || "your site";

  return (
    <main className="min-h-screen bg-[#030712] text-[#e2e8f0] flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-block text-[#0ea5e9] text-xs font-mono border border-[#0ea5e930] px-3 py-1 rounded bg-[#0ea5e910] mb-6 tracking-widest uppercase">
            Nexus Infrastructure & Sales
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Let's plug the leak on <span className="text-[#ef4444] block mt-2">{url}</span>
          </h1>
          <p className="text-[#94a3b8] text-lg mb-8 leading-relaxed">
            We don't just speed up code. We rebuild your landing page, optimize your ad placements, and plug our White-Label Call Center directly into your traffic stream to close your leads for you.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="w-full bg-[#080d17] border border-[#1e293b] rounded-xl flex flex-col items-center justify-center gap-4 p-12">
          <div className="text-4xl">📅</div>
          <p className="text-[#0ea5e9] font-mono text-xs tracking-widest uppercase">Booking — Coming Soon</p>
          <p className="text-[#64748b] font-mono text-sm text-center max-w-sm leading-relaxed">
            One-to-one sessions will be available here shortly. In the meantime, email us at{" "}
            <a href="mailto:hello@nexus-diagnostics.com" className="text-[#0ea5e9] underline">hello@nexus-diagnostics.com</a>
            {" "}to book a call.
          </p>
        </motion.div>
      </div>
    </main>
  );
}

export default function CallCenterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030712]" />}>
      <CallCenterContent />
    </Suspense>
  );
}