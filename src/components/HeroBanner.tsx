'use client';

import Link from 'next/link';
import { 
  ArrowRight, 
  ArrowUpRight, 
  Sparkles, 
  ShieldCheck, 
  Compass, 
  Clock, 
  SlidersHorizontal 
} from 'lucide-react';

export default function HeroBanner() {
  return (
    <section className="relative my-8 overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-[#f7f5f0] via-[#fbfaf8] to-[#f5f2eb] border border-stone-200/90 shadow-sm">
      
      {/* Subtle Architectural Grid Lines */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative z-10 px-6 sm:px-10 lg:px-14 py-12 lg:py-16">
        
        {/* Top Header Tagline & Live Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-stone-200/80">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-amber-600 animate-ping" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-stone-800">
              Sinha&apos;s Design Studio &bull; Autumn / Winter 2026
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-[11px] font-mono text-stone-500">
            <span>Edition: <strong>04 of 25</strong></span>
            <span>Origin: <strong>New Delhi Atelier</strong></span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Vault Open
            </span>
          </div>
        </div>

        {/* Main Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pt-10 items-center">
          
          {/* Left Column: Bold Organic Typography */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="space-y-3">
              <span className="inline-block text-xs font-mono font-bold tracking-widest uppercase text-amber-800/90 bg-amber-100/70 px-3 py-1 rounded-full border border-amber-200">
                Quiet Luxury &bull; Limited Run
              </span>
              
              <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-serif font-normal text-stone-950 tracking-tight leading-[1.08]">
                Objects made to be <br />
                <span className="font-sans font-black italic bg-gradient-to-r from-amber-700 via-stone-900 to-amber-900 bg-clip-text text-transparent">
                  cherished, not replaced.
                </span>
              </h1>
            </div>

            <p className="text-stone-600 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
              Industrial instruments, machined timepieces, and tactile acoustics produced in strictly numbered batches. Delivered in bespoke velvet-lined wooden chests with signed certificates.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <a
                href="#catalog"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-stone-950/15 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Acquire Pieces</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </a>

              <Link
                href="/orders"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold uppercase tracking-wider border border-stone-300 transition-all hover:border-stone-400 shadow-xs"
              >
                <Clock className="w-4 h-4 text-stone-500" />
                <span>Track Provenance</span>
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="pt-8 grid grid-cols-3 gap-4 border-t border-stone-200/80 text-stone-700">
              <div>
                <p className="text-base sm:text-lg font-black font-mono text-stone-950">100%</p>
                <p className="text-[11px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">Hallmarked Metals</p>
              </div>
              <div>
                <p className="text-base sm:text-lg font-black font-mono text-stone-950">48h</p>
                <p className="text-[11px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">Insured Dispatch</p>
              </div>
              <div>
                <p className="text-base sm:text-lg font-black font-mono text-stone-950">GST</p>
                <p className="text-[11px] font-mono text-stone-500 uppercase tracking-wider mt-0.5">Official Invoices</p>
              </div>
            </div>

          </div>

          {/* Right Column: High-End Asymmetrical Showcase Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            
            {/* Card 1: Chronograph Watch Feature (Large) */}
            <Link
              href="/#catalog"
              className="col-span-2 group relative overflow-hidden rounded-3xl bg-white border border-stone-200/90 p-5 shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-stone-100 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=900&auto=format&fit=crop"
                  alt="Precision Timepiece"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-950/80 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                  Featured Archive
                </span>
                <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-stone-950 font-mono font-bold text-xs shadow-xs">
                  ₹1,25,000
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-stone-950 group-hover:text-amber-800 transition-colors">
                    Porsche Design Chronotimer
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">Titanium &bull; Sapphire Glass</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-stone-100 group-hover:bg-stone-950 group-hover:text-white flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Card 2: Acoustic Speaker (Mini) */}
            <Link
              href="/#catalog"
              className="group relative overflow-hidden rounded-2xl bg-white border border-stone-200/90 p-3 shadow-xs hover:shadow-md transition-all"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-stone-100 mb-2">
                <img
                  src="https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=600&auto=format&fit=crop"
                  alt="Acoustic Masterpiece"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h4 className="text-xs font-bold text-stone-900 truncate">A1 Bluetooth</h4>
              <p className="text-[11px] font-mono text-amber-800 font-bold">₹21,900</p>
            </Link>

            {/* Card 3: Brass Architecture (Mini) */}
            <Link
              href="/#catalog"
              className="group relative overflow-hidden rounded-2xl bg-white border border-stone-200/90 p-3 shadow-xs hover:shadow-md transition-all"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-stone-100 mb-2">
                <img
                  src="https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600&auto=format&fit=crop"
                  alt="Brass Architecture"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h4 className="text-xs font-bold text-stone-900 truncate">Brass Arch</h4>
              <p className="text-[11px] font-mono text-amber-800 font-bold">₹18,200</p>
            </Link>

          </div>

        </div>

      </div>
    </section>
  );
}