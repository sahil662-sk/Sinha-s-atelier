'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

interface ProductItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  stock?: number;
  image?: string | null;
  images?: string[];
}

interface ProductGridProps {
  products: ProductItem[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const router = useRouter();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Initial load and sync with Database + localStorage
  useEffect(() => {
    let email = '';
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        email = (u.email || '').trim().toLowerCase();
      }
    } catch {}

    const readLocalWishlist = () => {
      try {
        const raw = localStorage.getItem('sinhas_wishlist') || localStorage.getItem('wishlist');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const ids = parsed.map((item: any) => (typeof item === 'string' ? item : item?.id)).filter(Boolean);
            setWishlistIds(ids);
          }
        }
      } catch {}
    };

    readLocalWishlist();

    // Agar user logged in hai toh Database se fresh status sync karo
    if (email) {
      fetch(`/api/wishlist?email=${encodeURIComponent(email)}&t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.wishlist)) {
            const ids = data.wishlist.map((item: any) => (typeof item === 'string' ? item : item?.id)).filter(Boolean);
            setWishlistIds(ids);
            localStorage.setItem('sinhas_wishlist', JSON.stringify(ids));
            localStorage.setItem('wishlist', JSON.stringify(ids));
          }
        })
        .catch((e) => console.error('ProductGrid wishlist sync error:', e));
    }

    const handleSync = () => readLocalWishlist();
    window.addEventListener('wishlist-updated', handleSync);
    window.addEventListener('wishlist-change', handleSync);

    return () => {
      window.removeEventListener('wishlist-updated', handleSync);
      window.removeEventListener('wishlist-change', handleSync);
    };
  }, []);

  // Catalog se Wishlist toggle: Direct Database (Neon PostgreSQL) + LocalStorage Sync
  const handleToggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    let userEmail = '';
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        userEmail = (u.email || '').trim().toLowerCase();
      }
    } catch {}

    if (!userEmail) {
      alert('Please sign in to save pieces to your private wishlist.');
      router.push('/login');
      return;
    }

    const isCurrentlyIn = wishlistIds.includes(productId);
    const nextIds = isCurrentlyIn
      ? wishlistIds.filter((id) => id !== productId)
      : [...wishlistIds, productId];

    // Optimistic UI Update (Immediate response)
    setWishlistIds(nextIds);
    localStorage.setItem('sinhas_wishlist', JSON.stringify(nextIds));
    localStorage.setItem('wishlist', JSON.stringify(nextIds));
    window.dispatchEvent(new Event('wishlist-updated'));
    window.dispatchEvent(new Event('wishlist-change'));

    setLoadingId(productId);

    try {
      // Direct call to PostgreSQL DB API
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          productId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Revert on failure
        const rollbackIds = isCurrentlyIn ? [...nextIds, productId] : nextIds.filter((id) => id !== productId);
        setWishlistIds(rollbackIds);
        localStorage.setItem('sinhas_wishlist', JSON.stringify(rollbackIds));
        localStorage.setItem('wishlist', JSON.stringify(rollbackIds));
        window.dispatchEvent(new Event('wishlist-updated'));
      }
    } catch (err) {
      console.error('Catalog Wishlist Error:', err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product, index) => {
        const displayImage =
          product.image ||
          (product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg');

        const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0;
        const inWish = wishlistIds.includes(product.id);

        return (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group block rounded-2xl bg-white border border-neutral-200 p-4 transition duration-300 hover:shadow-lg hover:border-neutral-300 relative"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-100 mb-4">
              <Image
                src={displayImage}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                priority={index < 4}
                className={`object-cover transition duration-500 group-hover:scale-105 ${
                  isOutOfStock ? 'grayscale opacity-50' : ''
                }`}
              />

              {/* Status Badges */}
              {isOutOfStock ? (
                <div className="absolute top-2.5 left-2.5 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs z-10">
                  Sold Out
                </div>
              ) : product.stock && product.stock <= 3 ? (
                <div className="absolute top-2.5 left-2.5 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs z-10">
                  Only {product.stock} Left
                </div>
              ) : null}

              {/* Wishlist Heart Toggle (Direct DB Sync + Prevent Link Navigation) */}
              <button
                type="button"
                onClick={(e) => handleToggleWishlist(e, product.id)}
                disabled={loadingId === product.id}
                className={`absolute top-2.5 right-2.5 z-20 p-2 rounded-full transition-all cursor-pointer shadow-sm active:scale-90 ${
                  inWish
                    ? 'bg-neutral-900/90 text-rose-500 hover:bg-neutral-950'
                    : 'bg-white/85 text-neutral-600 hover:text-neutral-950 hover:bg-white'
                }`}
                aria-label={inWish ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart
                  className={`w-4 h-4 transition-transform ${
                    inWish ? 'fill-rose-500 text-rose-500 scale-105' : 'hover:scale-110'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                {product.category}
              </p>
              <h3 className="text-sm font-semibold text-neutral-900 truncate group-hover:underline">
                {product.title}
              </h3>
              <p className="text-sm font-bold text-neutral-900 pt-1 font-mono">
                ₹{product.price.toLocaleString('en-IN')}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}