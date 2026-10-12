'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowRight, 
  ArrowUpRight,
  SlidersHorizontal,
  ShoppingBag,
  Heart,
  Clock,
  Sparkles,
  ShieldCheck,
  Award,
  Gem
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: {
    id: string;
    name: string;
  } | null | string;
  stock: number;
}

interface Category {
  id: string;
  name: string;
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(urlSearch);
  const [loading, setLoading] = useState<boolean>(true);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const syncWishlistFromStorage = () => {
    try {
      const saved = localStorage.getItem('sinhas_wishlist') || localStorage.getItem('wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const ids = parsed.map((item: any) => (typeof item === 'string' ? item : item?.id)).filter(Boolean);
          setWishlist(ids);
          return;
        }
      }
      setWishlist([]);
    } catch {
      setWishlist([]);
    }
  };

  useEffect(() => {
    let email = '';
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        email = (u.email || '').trim().toLowerCase();
      }
    } catch {}

    async function loadCatalog() {
      try {
        setLoading(true);

        const res = await fetch('/api/products?t=' + Date.now(), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setCategories(data.categories || []);
        }

        if (email) {
          try {
            const wishRes = await fetch(`/api/wishlist?email=${encodeURIComponent(email)}&t=${Date.now()}`, {
              cache: 'no-store',
            });
            if (wishRes.ok) {
              const wishData = await wishRes.json();
              if (wishData.success && Array.isArray(wishData.wishlist)) {
                const ids = wishData.wishlist.map((item: any) => (typeof item === 'string' ? item : item?.id)).filter(Boolean);
                setWishlist(ids);
                localStorage.setItem('sinhas_wishlist', JSON.stringify(ids));
                localStorage.setItem('wishlist', JSON.stringify(ids));
                window.dispatchEvent(new Event('wishlist-updated'));
                return;
              }
            }
          } catch (wErr) {
            console.error('Failed to sync DB wishlist on catalog load:', wErr);
          }
        }

        syncWishlistFromStorage();
      } catch (err) {
        console.error('Catalog fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();

    const handleSync = () => syncWishlistFromStorage();
    const handleGlobalSearch = (e: any) => {
      setSearchQuery(e.detail || '');
    };

    window.addEventListener('wishlist-updated', handleSync);
    window.addEventListener('wishlist-change', handleSync);
    window.addEventListener('catalog-search', handleGlobalSearch);

    return () => {
      window.removeEventListener('wishlist-updated', handleSync);
      window.removeEventListener('wishlist-change', handleSync);
      window.removeEventListener('catalog-search', handleGlobalSearch);
    };
  }, []);

  const toggleWishlist = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let email = '';
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        email = (u.email || '').trim().toLowerCase();
      }
    } catch {}

    if (!email) {
      alert('Please sign in to save pieces to your private wishlist.');
      router.push('/login');
      return;
    }

    const isCurrentlyWishlisted = wishlist.includes(id);
    const updatedList = isCurrentlyWishlisted
      ? wishlist.filter((item) => item !== id)
      : [...wishlist, id];

    setWishlist(updatedList);
    localStorage.setItem('sinhas_wishlist', JSON.stringify(updatedList));
    localStorage.setItem('wishlist', JSON.stringify(updatedList));
    window.dispatchEvent(new Event('wishlist-updated'));
    window.dispatchEvent(new Event('wishlist-change'));

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, productId: id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const rolledBack = isCurrentlyWishlisted ? [...updatedList, id] : updatedList.filter((item) => item !== id);
        setWishlist(rolledBack);
        localStorage.setItem('sinhas_wishlist', JSON.stringify(rolledBack));
        localStorage.setItem('wishlist', JSON.stringify(rolledBack));
        window.dispatchEvent(new Event('wishlist-updated'));
      }
    } catch (err) {
      console.error('Error persisting wishlist to DB:', err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const pCategory = typeof p.category === 'object' && p.category !== null ? p.category.name : (p.category || '');
    const matchesCategory = 
      selectedCategory === 'all' || 
      pCategory.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = 
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const featureBig = products.find((p) => p.price > 50000) || products[0];
  const featureMini1 = products.find((p) => p.id !== featureBig?.id) || products[1];
  const featureMini2 = products.find((p) => p.id !== featureBig?.id && p.id !== featureMini1?.id) || products[2];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 pb-28">
      
      {/* TOP HERO WRAPPER WITH SAPPHIRE LUXURY GLOW */}
      <div className="relative bg-[#030712] text-slate-100 pt-6 pb-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 overflow-hidden">
        
        {/* Ambient Sapphire Lighting */}
        <div className="pointer-events-none absolute -top-40 -left-40 w-[42rem] h-[42rem] bg-indigo-600/20 rounded-full blur-[160px]" />
        <div className="pointer-events-none absolute top-1/3 -right-40 w-[38rem] h-[38rem] bg-sky-500/15 rounded-full blur-[150px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#38bdf80e_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* EDITORIAL HERO SECTION */}
          <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#070d19]/95 via-[#0d162a]/95 to-[#040812]/95 border border-slate-800/80 shadow-[0_30px_70px_-20px_rgba(2,6,23,0.8)] backdrop-blur-2xl">
            
            <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl" />

            <div className="relative z-10 px-6 sm:px-10 lg:px-14 py-10 lg:py-14">
              
              {/* Status Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-sky-300">
                    Sinha&apos;s Design Studio &bull; Autumn / Winter 2026
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-6 text-[11px] font-mono text-slate-400">
                  <span>Edition: <strong className="text-sky-200">04 of 25</strong></span>
                  <span>Origin: <strong className="text-sky-200">New Delhi Atelier</strong></span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Vault Open
                  </span>
                </div>
              </div>

              {/* Main Editorial Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pt-8 items-center">
                
                {/* Left Column */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-sky-300 bg-sky-500/15 px-3.5 py-1 rounded-full border border-sky-400/30">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Quiet Luxury &bull; Limited Run
                    </span>
                    
                    <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-serif font-normal text-slate-100 tracking-tight leading-[1.06]">
                      Objects made to be <br />
                      <span className="font-sans font-black italic bg-gradient-to-r from-sky-200 via-amber-200 to-rose-200 bg-clip-text text-transparent">
                        cherished, not replaced.
                      </span>
                    </h1>
                  </div>

                  <p className="text-slate-300/80 text-sm sm:text-base max-w-xl font-light leading-relaxed">
                    Industrial instruments, machined timepieces, and tactile acoustics produced in strictly numbered batches. Delivered in bespoke velvet-lined wooden chests with signed certificates.
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <a
                      href="#catalog"
                      className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-xl shadow-sky-500/25 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span>Acquire Pieces</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </a>

                    <Link
                      href="/orders"
                      className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white/5 hover:bg-white/10 text-sky-100 text-xs font-bold uppercase tracking-wider border border-sky-400/20 hover:border-sky-400/40 transition-all shadow-sm"
                    >
                      <Clock className="w-4 h-4 text-sky-300" />
                      <span>Track Provenance</span>
                    </Link>
                  </div>

                  {/* Micro Stats */}
                  <div className="pt-8 grid grid-cols-3 gap-4 border-t border-slate-800/80 text-slate-300">
                    <div>
                      <p className="text-base sm:text-lg font-black font-mono text-sky-200">100%</p>
                      <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">Hallmarked Metals</p>
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-black font-mono text-sky-200">48h</p>
                      <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">Insured Dispatch</p>
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-black font-mono text-sky-200">24h</p>
                      <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mt-0.5"> Customer Support</p>
                    </div>
                  </div>
                </div>

                {/* Right Column (Hero Collage) */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                  {featureBig && (
                    <Link
                      href={`/product/${featureBig.id}`}
                      className="col-span-2 group relative overflow-hidden rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-sky-400/50 p-4 shadow-xl backdrop-blur-xl transition-all duration-500"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-950 mb-3">
                        <img
                          src={featureBig.image}
                          alt={featureBig.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider text-sky-300 font-bold border border-sky-400/30">
                          Featured Archive
                        </span>
                        <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 font-mono font-bold text-xs shadow-xs border border-amber-400/30">
                          ₹{Number(featureBig.price).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <h3 className="font-bold text-sm text-slate-100 group-hover:text-sky-300 transition-colors truncate max-w-[220px]">
                            {featureBig.title}
                          </h3>
                          <p className="text-xs text-slate-400 font-mono">Bespoke Masterwork</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-slate-800/60 border border-slate-700 group-hover:bg-sky-400 group-hover:text-slate-950 flex items-center justify-center transition-all">
                          <ArrowUpRight className="w-4 h-4 text-sky-300 group-hover:text-slate-950" />
                        </div>
                      </div>
                    </Link>
                  )}

                  {featureMini1 && (
                    <Link
                      href={`/product/${featureMini1.id}`}
                      className="group relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sky-400/40 p-3 shadow-md backdrop-blur-xl transition-all"
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-950 mb-2">
                        <img
                          src={featureMini1.image}
                          alt={featureMini1.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 truncate">{featureMini1.title}</h4>
                      <p className="text-[11px] font-mono text-sky-300 font-bold">₹{Number(featureMini1.price).toLocaleString('en-IN')}</p>
                    </Link>
                  )}

                  {featureMini2 && (
                    <Link
                      href={`/product/${featureMini2.id}`}
                      className="group relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sky-400/40 p-3 shadow-md backdrop-blur-xl transition-all"
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-950 mb-2">
                        <img
                          src={featureMini2.image}
                          alt={featureMini2.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 truncate">{featureMini2.title}</h4>
                      <p className="text-[11px] font-mono text-sky-300 font-bold">₹{Number(featureMini2.price).toLocaleString('en-IN')}</p>
                    </Link>
                  )}
                </div>

              </div>

            </div>
          </section>

        </div>
      </div>

      {/* LIGHT-COLOURED CATALOG SECTION (Clean, Tactile & High-Contrast) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <section id="catalog" className="space-y-8 scroll-mt-24">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-amber-800 font-bold">
                Bespoke Registry
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight mt-1">
                The Atelier Catalog
              </h2>
            </div>

            {searchQuery && (
              <div className="flex items-center gap-2 text-xs font-mono text-stone-600 bg-white px-3.5 py-1.5 rounded-full border border-stone-200 shadow-2xs">
                <span>Filtering by: <strong className="text-stone-950">&quot;{searchQuery}&quot;</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    window.dispatchEvent(new CustomEvent('catalog-search', { detail: '' }));
                  }}
                  className="text-stone-400 hover:text-stone-900 font-bold ml-1 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Category Tabs (Light Luxury Styling) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-stone-950 text-white shadow-md'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              All Pieces
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.name.toLowerCase()
                    ? 'bg-stone-950 text-white shadow-md'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid (Crisp Light Cards) */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-96 rounded-3xl bg-stone-200/60 animate-pulse border border-stone-200" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
              <SlidersHorizontal className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-900">No pieces match your search</h3>
              <p className="text-xs text-stone-500 mt-1">Try another term in the Navbar search or switch categories.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  window.dispatchEvent(new CustomEvent('catalog-search', { detail: '' }));
                }}
                className="mt-4 px-6 py-2.5 text-xs font-semibold bg-stone-950 text-white rounded-full cursor-pointer hover:bg-stone-800 transition-colors font-bold uppercase tracking-wider"
              >
                Reset Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
              {filteredProducts.map((product) => {
                const isWishlisted = wishlist.includes(product.id);
                const categoryLabel = typeof product.category === 'object' && product.category !== null 
                  ? product.category.name 
                  : (product.category || 'Atelier Masterpiece');

                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col justify-between rounded-3xl bg-white border border-stone-200 hover:border-stone-400/80 transition-all duration-300 hover:shadow-xl overflow-hidden p-4 shadow-2xs"
                  >
                    <div>
                      {/* Product Image Frame */}
                      <Link href={`/product/${product.id}`} className="block">
                        <div className="relative aspect-square w-full rounded-2xl bg-stone-100 overflow-hidden mb-4 border border-stone-100">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                          />

                          {/* Category Badge */}
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-950/70 backdrop-blur-md text-[10px] font-mono tracking-wider uppercase text-amber-200 border border-white/10 font-bold">
                            {categoryLabel}
                          </span>

                          {/* Wishlist Heart Toggle */}
                          <button
                            type="button"
                            onClick={(e) => toggleWishlist(product.id, e)}
                            className="absolute top-3 right-3 p-2.5 rounded-full bg-stone-950/70 backdrop-blur-md text-white/80 hover:text-rose-500 transition-colors border border-white/10 z-10 cursor-pointer active:scale-90"
                            aria-label="Wishlist toggle"
                          >
                            <Heart
                              className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`}
                            />
                          </button>
                        </div>

                        {/* Title and Description */}
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm text-stone-900 line-clamp-1 group-hover:text-amber-800 transition-colors">
                            {product.title}
                          </h3>
                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                      </Link>
                    </div>

                    {/* Price and Acquire Link */}
                    <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-400 block font-mono">Price</span>
                        <span className="text-base font-black text-stone-950 font-mono">
                          ₹{Number(product.price).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <Link
                        href={`/product/${product.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold tracking-wider transition-colors cursor-pointer shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Acquire</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}