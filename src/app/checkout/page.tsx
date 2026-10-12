'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, CreditCard, Lock, CheckCircle2 } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  useEffect(() => {
    setMounted(true);

    try {
      const raw = localStorage.getItem('sinhas_cart') || localStorage.getItem('cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        setCart(Array.isArray(parsed) ? parsed : (parsed.items || []));
      }

      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.name) setName(u.name);
        if (u.email) setEmail(u.email);
        if (u.phone) setPhone(u.phone);
      }

      const savedAddress = localStorage.getItem('sinhas_address');
      if (savedAddress) {
        const addr = JSON.parse(savedAddress);
        if (addr.address) setAddress(addr.address);
        if (addr.city) setCity(addr.city);
        if (addr.pincode) setPincode(addr.pincode);
        if (addr.phone && !phone) setPhone(addr.phone);
      }
    } catch {}
  }, []);

  if (!mounted) return null;

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  const shipping = subtotal > 50000 || subtotal === 0 ? 0 : 2500;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#faf8f5] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Your Bag is Empty</h1>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm">Add pieces to your bag before proceeding to checkout.</p>
        <Link href="/#catalog" className="mt-6 px-7 py-3.5 rounded-full bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const orderPayload = {
      customerName: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: 'Delhi',
      postalCode: pincode.trim(),
      subtotal,
      shipping,
      total,
      items: cart.map(item => ({
        id: item.id,
        title: item.title,
        price: Number(item.price),
        quantity: Number(item.quantity) || 1,
        image: item.image || '',
      })),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to persist order in database.');
      }

      const confirmedOrderId = data.orderId || data.order?.orderNumber;

      // Clear Cart
      localStorage.removeItem('sinhas_cart');
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cart-updated'));

      // Redirect to DB-backed invoice
      router.push(`/order-success/${confirmedOrderId}`);
    } catch (err: any) {
      alert(`Order placement failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <Link href="/cart" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shopping Bag</span>
        </Link>

        <h1 className="text-3xl font-black text-neutral-950 tracking-tight mb-8">Checkout &amp; Settlement</h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl bg-white border border-neutral-200 p-6 sm:p-8 space-y-5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-600 font-bold pb-3 border-b border-neutral-100">
                1. Delivery Destination
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">Full Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">Email Address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium focus:outline-none font-mono" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">Phone Number (+91)</label>
                  <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium focus:outline-none font-mono" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">Street Address</label>
                  <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">City</label>
                  <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">PIN Code</label>
                  <input type="text" required value={pincode} onChange={(e) => setPincode(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium focus:outline-none font-mono" />
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-neutral-200 p-6 sm:p-8 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-600 font-bold pb-3 border-b border-neutral-100">
                2. Settlement Method
              </h2>
              <div className="p-4 rounded-2xl border-2 border-neutral-900 bg-neutral-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-neutral-900" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900">Encrypted Acquisition Protocol</p>
                    <p className="text-[10px] text-neutral-500">Automated Tax Invoice &amp; Courier Dispatch</p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-neutral-900" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-white border border-neutral-200 p-6 sm:p-7 space-y-6">
              <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-600 font-bold pb-3 border-b border-neutral-100">
                Summary ({cart.reduce((s, i) => s + (Number(i.quantity) || 1), 0)} Pieces)
              </h2>

              <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-2 border-b border-neutral-50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-100">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 line-clamp-1">{item.title}</p>
                        <p className="text-neutral-500 font-mono text-[11px]">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-neutral-900">
                      ₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-100 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-neutral-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Insured Delivery</span>
                  <span className="font-mono text-neutral-900">
                    {shipping === 0 ? <span className="text-emerald-700 font-bold">Complimentary</span> : `₹${shipping.toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-neutral-950">Grand Total</span>
                  <span className="text-xl font-black font-mono text-neutral-950">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Lock className="w-4 h-4" />
                <span>{submitting ? 'Confirming Acquisition...' : 'Complete Acquisition'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}