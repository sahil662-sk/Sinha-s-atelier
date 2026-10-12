'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Package, 
  Search, 
  FileText, 
  Share2, 
  User, 
  Truck
} from 'lucide-react';

interface OrderItem {
  id?: string;
  productId?: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderRecord {
  orderId: string;
  customerName: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  fullAddress: string;
  total: number;
  orderDate: string;
  status: string;
  items: OrderItem[];
}

function TrackOrdersContent() {
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get('id');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [sharedOrder, setSharedOrder] = useState<OrderRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to format currency accurately
  const formatINR = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-IN');
  };

  // Helper function to render accurate order status badge
  const renderStatusBadge = (rawStatus: string) => {
    const s = (rawStatus || 'CONFIRMED').toUpperCase().trim();

    if (s === 'DELIVERED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold font-mono border border-emerald-200">
          DELIVERED
        </span>
      );
    }

    if (s === 'SHIPPED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-[10px] font-bold font-mono border border-sky-200">
          SHIPPED &bull; In Transit
        </span>
      );
    }

    if (s === 'CANCELLED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[10px] font-bold font-mono border border-rose-200">
          CANCELLED
        </span>
      );
    }

    // Default: CONFIRMED or pending in workshop
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold font-mono border border-amber-200">
        CONFIRMED &bull; Processing
      </span>
    );
  };

  useEffect(() => {
    let activeEmail = '';

    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        const u = JSON.parse(saved);
        setCurrentUser(u);
        activeEmail = (u.email || '').trim().toLowerCase();
      }
    } catch {}

    async function loadOrdersFromDatabase() {
      try {
        setLoading(true);

        const endpoint = activeEmail 
          ? `/api/orders?email=${encodeURIComponent(activeEmail)}`
          : '/api/orders';

        const res = await fetch(endpoint);
        const data = await res.json();

        if (res.ok && Array.isArray(data.orders)) {
          const mappedOrders: OrderRecord[] = data.orders.map((o: any) => {
            const parts = [o.address, o.city, o.state, o.postalCode].filter(Boolean);
            const addressString = parts.length > 0 
              ? parts.join(', ') 
              : (o.shippingAddress || 'Atelier Registered Destination');

            const finalTotal = Number(o.total ?? o.totalAmount ?? 0);

            return {
              orderId: o.orderNumber || o.id,
              customerName: o.customerName || 'Valued Client',
              email: o.email || o.customerEmail || activeEmail,
              address: o.address || '',
              city: o.city || '',
              state: o.state || '',
              postalCode: o.postalCode || '',
              fullAddress: addressString,
              total: !isNaN(finalTotal) && finalTotal > 0 ? finalTotal : 0,
              orderDate: o.createdAt || o.orderDate || new Date().toISOString(),
              status: o.status || 'CONFIRMED',
              items: (o.items || []).map((it: any) => ({
                id: it.id || it.productId,
                title: it.title || 'Atelier Bespoke Piece',
                price: Number(it.price || 0),
                quantity: Number(it.quantity || 1),
                image: it.image || '',
              })),
            };
          });

          setOrders(mappedOrders);

          if (queryOrderId) {
            const match = mappedOrders.find(
              (x) => x.orderId.toLowerCase() === queryOrderId.trim().toLowerCase()
            );
            if (match) setSharedOrder(match);
          }
        }
      } catch (err) {
        console.error('Failed to load orders from database:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrdersFromDatabase();
  }, [queryOrderId]);

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const trimmed = searchQuery.trim();

    const existing = orders.find((o) => o.orderId.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setSharedOrder(existing);
      return;
    }

    try {
      const res = await fetch(`/api/orders?orderId=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (res.ok && data.orders && data.orders.length > 0) {
        const o = data.orders[0];
        const parts = [o.address, o.city, o.state, o.postalCode].filter(Boolean);

        setSharedOrder({
          orderId: o.orderNumber || o.id,
          customerName: o.customerName,
          email: o.email,
          address: o.address,
          fullAddress: parts.join(', ') || o.shippingAddress,
          total: Number(o.total ?? o.totalAmount ?? 0),
          orderDate: o.createdAt,
          status: o.status || 'CONFIRMED',
          items: o.items || [],
        });
        return;
      }
    } catch {}

    alert(`No order found matching reference: ${trimmed}`);
  };

  const handleShareLink = (orderId: string) => {
    const url = `${window.location.origin}/orders?id=${orderId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>

          {currentUser && (
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-600 bg-white px-3 py-1.5 rounded-full border border-neutral-200/80">
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span>{currentUser.email}</span>
            </div>
          )}
        </div>

        {/* Header & Shared Search */}
        <div className="pt-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-800 font-bold">
              Atelier Logistics Ledger
            </span>
            <h1 className="text-3xl font-black text-neutral-950 tracking-tight mt-0.5">
              Acquisition &amp; Order Tracking
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Review personal acquisitions or track orders shared with you via reference ID.
            </p>
          </div>

          <form onSubmit={handleSearchOrder} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Track ref (e.g. ORD-123)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full bg-white border border-neutral-200 focus:outline-none focus:border-neutral-900 font-mono transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-neutral-950 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all cursor-pointer shrink-0"
            >
              Track
            </button>
          </form>
        </div>

        {/* SHARED ORDER VIEW */}
        {sharedOrder && (
          <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-5 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-500/20">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-900 text-amber-100 text-[10px] font-mono uppercase font-bold tracking-wider">
                  Shared Acquisition View
                </span>
                <h2 className="text-lg font-black text-neutral-950 font-mono mt-1">
                  Reference: {sharedOrder.orderId}
                </h2>
              </div>
              <Link
                href={`/order-success/${sharedOrder.orderId}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 hover:underline uppercase tracking-wider"
              >
                <FileText className="w-4 h-4 text-amber-700" />
                <span>Open Tax Invoice</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="text-neutral-500 block">Acquired For</span>
                <span className="font-bold text-neutral-900">{sharedOrder.customerName}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Dispatch Hub</span>
                <span className="font-bold text-neutral-900">White-Glove Insured Air Express</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Settlement Value</span>
                <span className="font-bold text-neutral-950">₹{formatINR(sharedOrder.total)}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-amber-700" />
                <div>
                  <p className="text-xs font-bold text-neutral-900">
                    {sharedOrder.status === 'DELIVERED' 
                      ? 'Package Delivered' 
                      : sharedOrder.status === 'CANCELLED'
                      ? 'Acquisition Cancelled'
                      : 'In Transit • Under Courier Custody'}
                  </p>
                  <p className="text-[10px] text-neutral-500">Destination: {sharedOrder.fullAddress}</p>
                </div>
              </div>
              {renderStatusBadge(sharedOrder.status)}
            </div>
          </div>
        )}

        {/* LOGGED IN USER ORDERS LIST */}
        <div className="mt-10 space-y-6">
          <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-bold">
            Personal Atelier Orders ({orders.length})
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-neutral-200 p-8">
              <Package className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-900">No acquisitions recorded in database</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Your acquired bespoke timepieces and items will appear here immediately after checkout.
              </p>
              <Link
                href="/#catalog"
                className="mt-5 inline-block px-6 py-2.5 rounded-full bg-neutral-950 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all cursor-pointer"
              >
                Explore Catalog
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.orderId}
                  className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-7 space-y-5 shadow-xs hover:border-neutral-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-neutral-950">
                          {ord.orderId}
                        </span>
                        {renderStatusBadge(ord.status)}
                      </div>
                      <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        Acquired on {new Date(ord.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShareLink(ord.orderId)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold uppercase tracking-wider border border-neutral-200 transition-colors cursor-pointer"
                        title="Share tracking with someone else"
                      >
                        <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{copiedId === ord.orderId ? 'Link Copied!' : 'Share'}</span>
                      </button>

                      <Link
                        href={`/order-success/${ord.orderId}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tax Invoice</span>
                      </Link>
                    </div>
                  </div>

                  {/* Order Items with Exact DB Values */}
                  <div className="space-y-3">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-100 overflow-hidden shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-neutral-400 m-2.5" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900">{item.title}</p>
                            <p className="text-neutral-500 font-mono text-[11px]">Quantity: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-neutral-900">
                          ₹{formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Destination & Total Footer */}
                  <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-500 gap-2">
                    <p className="truncate max-w-md">
                      <strong>Destination:</strong> {ord.fullAddress}
                    </p>
                    <p className="font-mono text-neutral-950 font-bold text-sm">
                      Total: ₹{formatINR(ord.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function TrackOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin" />
        </div>
      }
    >
      <TrackOrdersContent />
    </Suspense>
  );
}