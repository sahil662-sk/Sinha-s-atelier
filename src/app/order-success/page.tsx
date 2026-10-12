'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Download, ArrowRight, ShieldCheck, FileText, Printer } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'ORD-982144';
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sinhas_last_order');
      if (saved) {
        setOrder(JSON.parse(saved));
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-amber-800 font-bold">
            Atelier Transaction Settled
          </span>
          <h1 className="text-3xl font-black text-neutral-950 tracking-tight">
            Acquisition Confirmed
          </h1>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Your piece is being prepared under white-glove packaging. A digital tax invoice and courier tracking dispatch have been sent to your email.
          </p>
        </div>

        {/* Invoice Summary Card */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 shadow-xl space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
            <div>
              <p className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Order Reference</p>
              <p className="font-mono font-bold text-sm text-neutral-950">{orderId}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Acquisition Date</p>
              <p className="text-xs font-bold text-neutral-900">{new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          {order && (
            <div className="space-y-4">
              <div className="space-y-2 divide-y divide-neutral-100 text-xs">
                {(order.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between pt-2">
                    <span className="text-neutral-800 font-medium">
                      {item.title} <span className="text-neutral-400 font-mono">x{item.quantity}</span>
                    </span>
                    <span className="font-mono font-bold text-neutral-900">
                      ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Shipping Destination</span>
                  <span className="text-neutral-900 font-medium text-right max-w-xs">{order.shippingAddress}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Registered Client</span>
                  <span className="text-neutral-900 font-medium">{order.customerName} ({order.customerEmail})</span>
                </div>
                <div className="flex justify-between text-base font-bold text-neutral-950 pt-2 border-t border-neutral-100">
                  <span>Total Settled</span>
                  <span className="font-mono font-black">₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            {/* Direct Link to Slay Tax Invoice */}
            <Link
              href={`/order-success/${orderId}`}
              className="flex-1 py-3.5 px-6 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>View &amp; Print Official Tax Invoice</span>
            </Link>

            <Link
              href="/"
              className="py-3.5 px-6 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-neutral-200 text-center"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-400 font-mono uppercase pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>GST Verified &bull; Official Digital Tax Record</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}