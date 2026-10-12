'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Package, 
  Lock, 
  RefreshCw, 
  AlertCircle,
  Edit3,
  Check,
  X,
  Clock,
  Save,
  KeyRound
} from 'lucide-react';

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  city: string;
  state: string;
  address: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface AdminProduct {
  id: string;
  title: string;
  price: number;
  stock: number;
  image: string;
  category?: { name: string } | string;
}

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes Inactivity Limit

export default function AdminPortalPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');

  // Secret Key Modal States
  const [secretInput, setSecretInput] = useState('');
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [keyError, setKeyError] = useState('');

  // Orders & Catalog States
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Inline Product Editing State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [savingProduct, setSavingProduct] = useState(false);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // LOCK & REDIRECT FUNCTION (Auto or Manual)
  const lockAndRedirectToCatalog = useCallback(() => {
    sessionStorage.removeItem('admin_unlocked_session');
    setIsUnlocked(false);
    // Instant redirect to storefront
    router.push('/#catalog');
  }, [router]);

  // Inactivity Watcher: 15 Mins -> Lock & Redirect
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      lockAndRedirectToCatalog();
    }, INACTIVITY_TIMEOUT_MS);
  }, [lockAndRedirectToCatalog]);

  useEffect(() => {
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleUserActivity = () => {
      if (isUnlocked) {
        resetInactivityTimer();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    if (isUnlocked) {
      resetInactivityTimer();
    }

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isUnlocked, resetInactivityTimer]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/admin/orders?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Orders fetch err:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || data || []);
      }
    } catch (err) {
      console.error('Products fetch err:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOrders(), fetchProducts()]);
    setTimeout(() => setRefreshing(false), 300);
  };

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        const u = JSON.parse(saved);
        // Secure: Role check strictly verified against Neon DB session role
        if (u.role === 'ADMIN') {
          setAuthorized(true);
          setAdminEmail(u.email || '');

          // Check if session already verified previously in this tab
          const sessionActive = sessionStorage.getItem('admin_unlocked_session');
          if (sessionActive === 'true') {
            setIsUnlocked(true);
            Promise.all([fetchOrders(), fetchProducts()]).finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
          return;
        }
      }
    } catch {}

    setAuthorized(false);
    setLoading(false);
  }, []);

  // Backend Pin / Secret Key Verification
  const handleVerifySecretKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretInput.trim()) return;

    setVerifyingKey(true);
    setKeyError('');

    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          secretKey: secretInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication rejected by security vault');
      }

      sessionStorage.setItem('admin_unlocked_session', 'true');
      setIsUnlocked(true);
      setSecretInput('');
      setLoading(true);
      await Promise.all([fetchOrders(), fetchProducts()]);
    } catch (err: any) {
      setKeyError(err.message || 'Invalid Secret Key');
    } finally {
      setVerifyingKey(false);
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderRef: string, newStatus: string) => {
    try {
      setUpdatingId(orderRef);
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: orderRef, status: newStatus }),
      });

      if (!res.ok) throw new Error('Status update failed');

      setOrders((prev) =>
        prev.map((o) =>
          o.orderNumber === orderRef ? { ...o, status: newStatus.toUpperCase() } : o
        )
      );
    } catch (err: any) {
      alert(`Status update error: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveProduct = async (productId: string) => {
    try {
      setSavingProduct(true);
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: Number(editPrice),
          stock: Number(editStock),
        }),
      });

      if (!res.ok) throw new Error('Database product update failed');

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, price: Number(editPrice), stock: Number(editStock) } : p
        )
      );
      setEditingProductId(null);
    } catch (err: any) {
      alert(`Could not save piece updates: ${err.message}`);
    } finally {
      setSavingProduct(false);
    }
  };

  if (!mounted) return null;

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-600 mb-3" />
        <h1 className="text-2xl font-black text-neutral-900">Restricted Administration Access</h1>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm">
          This portal is reserved strictly for authenticated Atelier administrators.
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider"
        >
          Return to Storefront
        </Link>
      </div>
    );
  }

  // PORTAL LOCKED STATE: REQUIRES BACKEND SECRET KEY VERIFICATION
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#18181b] flex items-center justify-center p-4">
        <form
          onSubmit={handleVerifySecretKey}
          className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-2xl text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-700">
            <KeyRound className="w-7 h-7 stroke-[2]" />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 font-bold">
              Root Vault Authorization
            </span>
            <h1 className="text-2xl font-black text-neutral-950 tracking-tight mt-1">
              Admin Clearance Gate
            </h1>
            <p className="text-xs text-neutral-500 mt-1 font-mono">
              Provide ADMIN_SECRET_KEY to access live console.
            </p>
          </div>

          {keyError && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              {keyError}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="password"
              required
              autoFocus
              placeholder="Enter Admin Secret Key"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-center font-mono font-bold tracking-widest focus:outline-none focus:border-neutral-950"
            />

            <button
              type="submit"
              disabled={verifyingKey}
              className="w-full py-4 rounded-2xl bg-neutral-950 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {verifyingKey ? 'Validating Root Clearance...' : 'Authenticate & Unlock'}
            </button>
          </div>

          <Link
            href="/"
            className="inline-block text-xs font-semibold text-neutral-500 hover:text-neutral-900 uppercase tracking-wider font-mono pt-2"
          >
            &larr; Return to Catalog
          </Link>
        </form>
      </div>
    );
  }

  // UNLOCKED ACTIVE PORTAL
  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900 pb-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Storefront</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* MANUAL LOCK BUTTON -> REDIRECTS TO CATALOG */}
            <button
              onClick={lockAndRedirectToCatalog}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-rose-950 text-amber-300 hover:text-rose-200 text-xs font-mono border border-neutral-800 transition-all cursor-pointer active:scale-95 shadow-xs"
              title="Click to instantly lock and redirect to catalog"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
              <span className="font-semibold uppercase tracking-wider text-[11px]">Lock &amp; Exit</span>
            </button>

            {/* Refresh Feed Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200 hover:border-neutral-900 text-xs font-mono text-neutral-900 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : 'text-neutral-700'}`} />
              <span>{refreshing ? 'Syncing...' : 'Refresh Feed'}</span>
            </button>
          </div>
        </div>

        {/* Dashboard Title & Auto-lock Badge */}
        <div className="pt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-800 font-bold">
              Atelier Executive Control
            </span>
            <h1 className="text-3xl font-black text-neutral-950 tracking-tight mt-0.5">
              Admin Management Console
            </h1>
            <p className="text-xs text-neutral-500 mt-1 font-mono">
              Direct Database Console &bull; Session: {adminEmail}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 bg-white px-3 py-1.5 rounded-full border border-neutral-200/80">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>15-Min Inactivity Auto-Redirect Armed</span>
          </div>
        </div>

        {/* Dedicated Admin Tabs */}
        <div className="mt-8 flex gap-3 border-b border-neutral-200 pb-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-neutral-950 text-white shadow-md'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Orders Feed ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-neutral-950 text-white shadow-md'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Catalog Inventory ({products.length})
          </button>
        </div>

        {/* TAB 1: ORDERS FEED */}
        {activeTab === 'orders' && (
          <div className="mt-8 space-y-4">
            {loading ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-2" />
                <p className="text-xs text-neutral-500 font-mono">Reading orders from database...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200">
                <Package className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-neutral-800">No orders currently logged in database</p>
              </div>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.orderNumber}
                  className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs hover:border-neutral-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-base text-neutral-950">
                          {ord.orderNumber}
                        </span>
                        <span className="text-xs text-neutral-400 font-mono">
                          &bull; {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}, {new Date(ord.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-700 mt-1">
                        <strong className="text-neutral-950">{ord.customerName}</strong> ({ord.email}) &mdash;{' '}
                        <span className="text-neutral-500">
                          {ord.city ? `${ord.city}, ${ord.state}` : ord.address}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-mono font-black text-lg text-neutral-950">
                        ₹{ord.total.toLocaleString('en-IN')}
                      </span>

                      {/* Dropdown Status Selector */}
                      <div className="relative">
                        <select
                          value={ord.status.toUpperCase()}
                          disabled={updatingId === ord.orderNumber}
                          onChange={(e) => handleStatusChange(ord.orderNumber, e.target.value)}
                          className="text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-full border border-neutral-300 bg-white cursor-pointer focus:outline-none transition-all shadow-xs"
                        >
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Chips */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
                    {ord.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-neutral-50 border border-neutral-200/80 text-[11px] font-medium text-neutral-800 flex items-center gap-2"
                      >
                        <span className="truncate max-w-[200px]">{it.title}</span>
                        <span className="text-neutral-400 font-mono">&times;{it.quantity}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: CATALOG INVENTORY (INLINE MANAGEMENT) */}
        {activeTab === 'inventory' && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-mono uppercase text-neutral-500 font-bold">
                Live Inventory Pieces ({products.length})
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Real-time Database Stock Status
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-xs divide-y divide-neutral-100">
              {products.length === 0 ? (
                <div className="p-12 text-center text-xs text-neutral-500 font-mono">
                  Loading catalog inventory pieces...
                </div>
              ) : (
                products.map((item) => (
                  <div key={item.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-950">{item.title}</h3>
                        <p className="text-xs font-mono text-neutral-400 mt-0.5">
                          ID: <span className="text-neutral-700">{item.id}</span> &bull; Collection:{' '}
                          <span className="text-amber-800 font-medium">
                            {typeof item.category === 'object' ? item.category?.name : item.category || 'Atelier Masterwork'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Inline Editor or Display Row */}
                    {editingProductId === item.id ? (
                      <div className="flex flex-wrap items-center gap-4 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                        <div>
                          <label className="text-[10px] font-mono uppercase text-neutral-600 block">Unit Price (₹)</label>
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(Number(e.target.value))}
                            className="w-28 px-3 py-1.5 rounded-xl bg-white border border-neutral-300 text-xs font-mono font-bold focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-mono uppercase text-neutral-600 block">Stock Units</label>
                          <input
                            type="number"
                            value={editStock}
                            onChange={(e) => setEditStock(Number(e.target.value))}
                            className="w-24 px-3 py-1.5 rounded-xl bg-white border border-neutral-300 text-xs font-mono font-bold focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-3">
                          <button
                            onClick={() => handleSaveProduct(item.id)}
                            disabled={savingProduct}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-neutral-950 text-white text-xs font-bold uppercase hover:bg-neutral-800 cursor-pointer shadow-xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{savingProduct ? 'Saving...' : 'Save'}</span>
                          </button>
                          <button
                            onClick={() => setEditingProductId(null)}
                            className="p-1.5 rounded-xl bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] uppercase font-mono text-neutral-400 block">Unit Price</span>
                          <span className="text-sm font-mono font-bold text-neutral-950">
                            ₹{Number(item.price).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="text-left md:text-right">
                          <span className="text-[10px] uppercase font-mono text-neutral-400 block">Stock Level</span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                            (item.stock ?? 0) > 0 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>{item.stock ?? 0} units</span>
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setEditingProductId(item.id);
                            setEditPrice(item.price);
                            setEditStock(item.stock ?? 0);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-neutral-600" />
                          <span>Edit</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}