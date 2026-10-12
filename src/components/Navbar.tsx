'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, User, Heart, ShoppingBag, Shield, Package, LogOut, Settings, X } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [cartCount, setCartCount] = useState<number>(0);
  const [searchVal, setSearchVal] = useState<string>('');
  const [userDropdown, setUserDropdown] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const syncState = () => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      } else {
        setCurrentUser(null);
      }

      const savedWishlist = localStorage.getItem('sinhas_wishlist') || localStorage.getItem('wishlist');
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        setWishlistCount(Array.isArray(parsed) ? parsed.length : 0);
      } else {
        setWishlistCount(0);
      }

      const savedCart = 
        localStorage.getItem('sinhas_cart') || 
        localStorage.getItem('cart') || 
        localStorage.getItem('cart_items');

      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          const total = parsed.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
          setCartCount(total);
        } else if (parsed && Array.isArray(parsed.items)) {
          const total = parsed.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
          setCartCount(total);
        } else {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    } catch {
      setWishlistCount(0);
      setCartCount(0);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    syncState();

    const handleWishlistChange = () => syncState();
    const handleCartChange = () => syncState();
    const handleAuthChange = () => syncState();

    window.addEventListener('wishlist-updated', handleWishlistChange);
    window.addEventListener('cart-updated', handleCartChange);
    window.addEventListener('auth-updated', handleAuthChange);
    window.addEventListener('storage', syncState);

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistChange);
      window.removeEventListener('cart-updated', handleCartChange);
      window.removeEventListener('auth-updated', handleAuthChange);
      window.removeEventListener('storage', syncState);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Broadcast real-time search value to the Catalog
  const triggerSearch = (query: string) => {
    setSearchVal(query);

    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('catalog-search', { detail: query }));
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchVal.trim();

    if (pathname !== '/') {
      router.push(`/?search=${encodeURIComponent(trimmed)}#catalog`);
    } else {
      window.dispatchEvent(new CustomEvent('catalog-search', { detail: trimmed }));
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleClearSearch = () => {
    setSearchVal('');
    window.dispatchEvent(new CustomEvent('catalog-search', { detail: '' }));
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setUserDropdown(false);
    window.dispatchEvent(new Event('auth-updated'));
    router.push('/login');
  };

  const userEmail = (currentUser?.email || '').trim().toLowerCase();
  const isAdmin = userEmail === 'skforfreelance0@gmail.com';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-1 shrink-0 group">
            <span className="text-2xl font-black tracking-tight text-neutral-950 font-sans group-hover:text-amber-800 transition-colors">
              SINHA&apos;S.
            </span>
          </Link>

          {/* Single Global Search Bar */}
          <div className="flex-1 max-w-lg hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search catalog pieces, audio, horology..."
                value={searchVal}
                onChange={(e) => triggerSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 text-xs rounded-full bg-neutral-100/90 border border-neutral-200/80 focus:bg-white focus:outline-none focus:border-neutral-900 transition-all placeholder:text-neutral-400"
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Right Navigation Actions */}
          <div className="flex items-center gap-2 sm:gap-6">
            <Link
              href="/orders"
              className="text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-neutral-950 transition-colors hidden md:block"
            >
              Track Orders
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdown(!userDropdown)}
                className="p-2 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-full transition-all cursor-pointer"
                aria-label="User Account"
              >
                <User className="w-5 h-5" />
              </button>

              {userDropdown && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white border border-neutral-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 font-bold">
                      Account Access
                    </p>
                    <p className="text-xs font-bold text-neutral-900 truncate mt-0.5">
                      {currentUser?.name || 'Guest Client'}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {currentUser?.email || 'Not logged in'}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      <Settings className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Address Book &amp; Profile</span>
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      <Package className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Order History</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        <span>Admin Portal</span>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-neutral-100 pt-1">
                    {currentUser ? (
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out / Switch User</span>
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-neutral-50"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Sign In / Register</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="relative p-2 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-full transition-all"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-rose-600 text-white text-[10px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag / Cart Link */}
            <Link
              href="/cart"
              className="relative p-2 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-full transition-all"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-neutral-950 text-white text-[10px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>

          </div>
        </div>
      </div>
    </header>
  );
}