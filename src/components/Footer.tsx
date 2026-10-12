import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative w-full bg-gradient-to-b from-[#070d19] via-[#0d162a] to-[#040812] text-slate-300 border-t border-slate-800/80 mt-28 overflow-hidden">
      {/* Ambient Sapphire Glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 bg-sky-500/10 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#38bdf80a_1px,transparent_1px)] [background-size:28px_28px] opacity-40" />

      {/* Top Perks Bar */}
      <div className="relative z-10 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono uppercase tracking-wider text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-slate-200">2-Year Comprehensive Warranty</span>
          </div>
          <div className="flex items-center gap-2.5 md:justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-slate-200">Carbon-Neutral Global Delivery</span>
          </div>
          <div className="flex items-center gap-2.5 md:justify-end">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-slate-200">30-Day Bespoke Returns</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-3">
          <Link href="/" className="inline-block group">
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-sky-200 to-slate-200 bg-clip-text text-transparent group-hover:via-sky-300 transition-all">
              SINHA&apos;S.
            </span>
          </Link>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed font-light">
            Curated essentials engineered for enduring utility and minimal aesthetics.
          </p>
        </div>

        <div className="md:col-span-2 space-y-3 text-xs">
          <p className="font-mono font-bold uppercase tracking-wider text-sky-300">Catalog</p>
          <ul className="space-y-2 text-slate-400">
            <li>
              <Link href="/" className="hover:text-sky-300 transition-colors">
                All Products
              </Link>
            </li>
            <li>
              <Link href="/?category=Audio" className="hover:text-sky-300 transition-colors">
                Audio
              </Link>
            </li>
            <li>
              <Link href="/?category=Desk Gear" className="hover:text-sky-300 transition-colors">
                Desk Elements
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2 space-y-3 text-xs">
          <p className="font-mono font-bold uppercase tracking-wider text-sky-300">Client Care</p>
          <ul className="space-y-2 text-slate-400">
            <li>
              <Link href="/orders" className="hover:text-sky-300 transition-colors">
                Tracking
              </Link>
            </li>
            <li>
              <span className="hover:text-sky-300 transition-colors cursor-pointer">
                Warranty
              </span>
            </li>
            <li>
              <span className="hover:text-sky-300 transition-colors cursor-pointer">
                Returns
              </span>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3 space-y-3 text-xs">
          <p className="font-mono font-bold uppercase tracking-wider text-sky-300">Concierge</p>
          <p className="text-slate-400 font-mono">Mon — Fri: 09:00 — 18:00 IST</p>
          <a
            href="mailto:concierge@sinhas.store"
            className="inline-block text-sky-300 hover:text-sky-200 font-medium transition-colors"
          >
            concierge@sinhas.store
          </a>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="relative z-10 border-t border-slate-800/80 py-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400">© 2026 SINHA&apos;S. All rights reserved.</p>
          <p className="text-slate-400">Verified SSL 256-Bit Checkout</p>
        </div>
      </div>
    </footer>
  );
}