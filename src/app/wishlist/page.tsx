'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  image: string;
  category?: any;
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);

    let userEmail = '';
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        userEmail = (u.email || '').trim().toLowerCase();
      }
    } catch {}

    async function fetchWishlistData() {
      try {
        setLoading(true);

        // Priority 1: Agar user logged in hai, toh Neon PostgreSQL database se fetch karo
        if (userEmail) {
          try {
            const dbRes = await fetch(`/api/wishlist?email=${encodeURIComponent(userEmail)}&t=${Date.now()}`, {
              cache: 'no-store',
            });
            if (dbRes.ok) {
              const dbData = await dbRes.json();
              if (dbData.success && Array.isArray(dbData.wishlist)) {
                setWishlistItems(dbData.wishlist);
                // Sirf tab update karo jab data mila ho, kabhi empty wipe mat karo
                if (dbData.wishlist.length > 0) {
                  const idList = dbData.wishlist.map((item: any) => item.id);
                  localStorage.setItem('sinhas_wishlist', JSON.stringify(idList));
                  localStorage.setItem('wishlist', JSON.stringify(idList));
                  window.dispatchEvent(new Event('wishlist-updated'));
                }
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.error('Failed to fetch from DB wishlist:', e);
          }
        }

        // Priority 2: Fallback to LocalStorage (Guests ya offline session)
        const savedRaw = localStorage.getItem('sinhas_wishlist') || localStorage.getItem('wishlist');
        if (!savedRaw) {
          setWishlistItems([]);
          setLoading(false);
          return;
        }

        let parsed: any[] = [];
        try {
          parsed = JSON.parse(savedRaw);
          if (!Array.isArray(parsed)) parsed = [];
        } catch {
          parsed = [];
        }

        if (parsed.length === 0) {
          setWishlistItems([]);
          setLoading(false);
          return;
        }

        // Check if items are already full objects
        const areFullObjects = parsed.every(
          (item: any) => typeof item === 'object' && item !== null && item.title && item.price !== undefined
        );

        if (areFullObjects) {
          setWishlistItems(parsed);
          setLoading(false);
          return;
        }

        // Extract ID strings safely
        const rawIds = parsed.map((item: any) => (typeof item === 'string' ? item : item?.id)).filter(Boolean);

        if (rawIds.length === 0) {
          setWishlistItems([]);
          setLoading(false);
          return;
        }

        // Fetch product details for matching IDs
        const prodRes = await fetch('/api/products?t=' + Date.now(), { cache: 'no-store' });
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const allProducts: Product[] = prodData.products || [];
          const matched = allProducts.filter((p) => rawIds.includes(p.id));
          setWishlistItems(matched);
        }
      } catch (err) {
        console.error('Wishlist loading error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWishlistData();
  }, []);

  // 1-Click Instant Permanent Delete
  const removeFromWishlist = async (id: string) => {
    // 1. Instant optimistic state update
    const nextItems = wishlistItems.filter((item) => item.id !== id);
    setWishlistItems(nextItems);

    // 2. LocalStorage IDs update for Navbar
    const nextIds = nextItems.map((item) => item.id);
    localStorage.setItem('sinhas_wishlist', JSON.stringify(nextIds));
    localStorage.setItem('wishlist', JSON.stringify(nextIds));
    window.dispatchEvent(new Event('wishlist-updated'));
    window.dispatchEvent(new Event('wishlist-change'));

    // 3. Database permanent removal
    const activeEmail = currentUser?.email || '';
    if (activeEmail) {
      try {
        await fetch(`/api/wishlist?email=${encodeURIComponent(activeEmail)}&productId=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to remove from DB:', err);
      }
    }
  };

  const moveToCart = (product: Product) => {
    try {
      const savedCart = localStorage.getItem('sinhas_cart') || localStorage.getItem('cart');
      let cart: any[] = [];
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        cart = Array.isArray(parsed) ? parsed : (parsed.items || []);
      }

      const existingIndex = cart.findIndex((item: any) => item.id === product.id);

      if (existingIndex > -1) {
        cart[existingIndex].quantity = (Number(cart[existingIndex].quantity) || 1) + 1;
      } else {
        cart.push({
          id: product.id,
          title: product.title,
          price: Number(product.price),
          quantity: 1,
          image: product.image,
        });
      }

      localStorage.setItem('sinhas_cart', JSON.stringify(cart));
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));

      removeFromWishlist(product.id);
    } catch (err) {
      console.error('Failed to move item to cart:', err);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-[70vh] bg-[#faf8f5] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#faf8f5] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-200/70 flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-neutral-400" />
        </div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Your Wishlist is Empty</h1>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm">
          Save your favorite luxury pieces here to easily find and add them to your cart later.
        </p>
        <Link
          href="/"
          className="mt-6 px-7 py-3.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
        >
          Explore Catalog &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Boutique</span>
        </Link>

        <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-amber-800 font-bold">Curated Selection</p>
            <h1 className="text-3xl font-black text-neutral-950 tracking-tight mt-0.5">Saved Pieces</h1>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-500">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-8">
          {wishlistItems.map((product) => (
            <div
              key={product.id}
              className="flex flex-col justify-between rounded-3xl bg-white border border-neutral-200/80 hover:shadow-xl transition-all p-4 group"
            >
              <div>
                <div className="relative aspect-square w-full rounded-2xl bg-neutral-100 overflow-hidden mb-4">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-3 right-3 p-2.5 rounded-full bg-white/95 backdrop-blur-md text-neutral-700 hover:text-rose-600 transition-colors shadow-sm cursor-pointer z-10"
                    aria-label="Remove from Wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-neutral-900 line-clamp-1">{product.title}</h3>
                  {product.description && (
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">{product.description}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 block font-mono">Price</span>
                  <span className="text-base font-black text-neutral-950 font-mono">
                    ₹{Number(product.price).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => moveToCart(product)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold tracking-wider transition-colors cursor-pointer shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move to Bag</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}