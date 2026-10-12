'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, PackageCheck, ArrowRight, Home, FileText, Sparkles } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || searchParams.get('id') || 'SA-' + Math.floor(100000 + Math.random() * 900000);
  const paymentId = searchParams.get('paymentId');

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Clear cart on successful order landing
    try {
      localStorage.removeItem('sinhas_cart');
      localStorage.removeItem('cart');
      localStorage.removeItem('cart_items');
      window.dispatchEvent(new Event('cart-updated'));
    } catch {}
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full bg-gradient-to-b from-[#070d19] to-[#0c1527] border border-sky-400/20 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-2xl backdrop-blur-xl">
        
        {/* Verification Icon Badge */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-sky-500/20 blur-xl animate-pulse" />
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-400/30 rounded-full flex items-center justify-center text-emerald-400 relative z-10 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-[11px] font-mono uppercase tracking-widest font-semibold">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>Allocation Registered</span>
          </div>
          <h1 className="text-3xl font-serif text-white font-bold tracking-tight">
            Acquisition Confirmed
          </h1>
          <p className="text-xs text-slate-400 font-light max-w-md mx-auto leading-relaxed">
            Thank you for patronizing Sinha&apos;s Atelier. Your bespoke order has been registered in our archival ledger and handed over to private transit curators.
          </p>
        </div>

        {/* Ledger Details Card */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 text-left font-mono text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-slate-400">Order Reference</span>
            <span className="text-sky-300 font-bold tracking-wider">{orderId}</span>
          </div>

          {paymentId && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Payment Authorization</span>
              <span className="text-emerald-400 font-medium">{paymentId}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Transit Status</span>
            <span className="text-amber-300 font-medium flex items-center gap-1">
              <PackageCheck className="w-3.5 h-3.5" /> Handcrafted Packaging
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/orders"
            className="flex-1 py-3.5 px-5 rounded-full bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <FileText className="w-4 h-4" />
            <span>View Archival Orders</span>
          </Link>

          <Link
            href="/"
            className="flex-1 py-3.5 px-5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-slate-700"
          >
            <Home className="w-4 h-4" />
            <span>Return to Boutique</span>
          </Link>
        </div>

        <p className="text-[10px] text-slate-500 font-mono">
          An encrypted certificate of provenance has been dispatched to your registered address.
        </p>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030712] flex items-center justify-center text-slate-400 font-mono text-xs">
          Loading archival ledger...
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}