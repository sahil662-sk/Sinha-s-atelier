'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadCart = () => {
    try {
      const raw = 
        localStorage.getItem('sinhas_cart') || 
        localStorage.getItem('cart') || 
        localStorage.getItem('cart_items');

      if (!raw) {
        setCart([]);
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setCart(parsed);
      } else if (parsed && Array.isArray(parsed.items)) {
        setCart(parsed.items);
      } else if (typeof parsed === 'object') {
        setCart(Object.values(parsed) as CartItem[]);
      } else {
        setCart([]);
      }
    } catch {
      setCart([]);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadCart();

    const handleSync = () => loadCart();
    window.addEventListener('cart-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('cart-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const saveCart = (next: CartItem[]) => {
    setCart(next);
    const str = JSON.stringify(next);
    localStorage.setItem('sinhas_cart', str);
    localStorage.setItem('cart', str);
    localStorage.setItem('cart_items', str);
    window.dispatchEvent(new Event('cart-updated'));
  };

  const updateQuantity = (id: string, delta: number) => {
    const next = cart
      .map((item) => {
        if (item.id === id) {
          const q = (Number(item.quantity) || 1) + delta;
          return q > 0 ? { ...item, quantity: q } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];
    saveCart(next);
  };

  const removeItem = (id: string) => {
    const next = cart.filter((item) => item.id !== id);
    saveCart(next);
  };

  const clearCart = () => {
    saveCart([]);
  };

  if (!mounted) return null;

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  const shipping = subtotal > 50000 || subtotal === 0 ? 0 : 2500;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#faf8f5] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-200/70 flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-neutral-400" />
        </div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Your Shopping Bag is Empty</h1>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm">
          Discover our curated collection and add bespoke pieces to your bag.
        </p>
        <Link
          href="/#catalog"
          className="mt-6 px-7 py-3.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-amber-800 font-bold">Acquisitions</p>
            <h1 className="text-3xl font-black text-neutral-950 tracking-tight mt-0.5">Your Shopping Bag</h1>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-neutral-400 hover:text-rose-600 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
          >
            Clear Bag
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-8 items-start">
          
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-xs gap-4"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-20 h-20 rounded-2xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-100">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                      alt={item.title}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-neutral-900 line-clamp-1">{item.title}</h3>
                    <p className="font-mono text-sm font-black text-neutral-950">
                      ₹{Number(item.price).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                  <div className="flex items-center border border-neutral-200 rounded-full bg-neutral-50 px-2 py-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 hover:text-neutral-950 text-neutral-500 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-mono font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 hover:text-neutral-950 text-neutral-500 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="font-mono text-sm font-bold text-right min-w-[5rem]">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 space-y-6 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900 pb-3 border-b border-neutral-100 uppercase tracking-wider text-xs">
                Ledger Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Bag Subtotal</span>
                  <span className="font-mono font-bold text-neutral-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Insured Shipping</span>
                  <span className="font-mono font-bold text-neutral-900">
                    {shipping === 0 ? <span className="text-emerald-700 font-bold">Complimentary</span> : `₹${shipping.toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>GST (18% Included)</span>
                  <span className="font-mono text-neutral-500">₹{Math.round((subtotal * 18) / 118).toLocaleString('en-IN')}</span>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-neutral-950">Total Payable</span>
                  <span className="text-xl font-black font-mono text-neutral-950">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full py-4 px-6 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-400 uppercase tracking-widest pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>256-Bit Encrypted Atelier Protocol</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}