'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Printer, 
  ArrowLeft, 
  ShieldCheck, 
  Gem,
  AlertCircle
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

interface OrderData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  orderDate: string;
  items: InvoiceItem[];
}

export default function LuxuryInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = (params?.orderNumber as string) || '';

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrderFromDatabase() {
      if (!orderNumber) return;

      try {
        setLoading(true);
        setError('');

        // Direct backend database API hit
        const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`);
        const data = await res.json();

        if (!res.ok || !data.order) {
          throw new Error(data.error || 'Acquisition record not found in database.');
        }

        setOrder(data.order);
      } catch (err: any) {
        setError(err.message || 'Unable to retrieve tax invoice.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrderFromDatabase();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#18181b] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#18181b] flex flex-col items-center justify-center px-4 text-center text-white">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold tracking-tight">Invoice Unavailable</h1>
        <p className="text-xs text-neutral-400 mt-2 max-w-sm">{error || 'Could not locate order details.'}</p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 rounded-full bg-white text-neutral-950 font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-all"
        >
          Return to Boutique
        </Link>
      </div>
    );
  }

  // 18% GST Calculations based on actual DB totalAmount
  const calculatedSubtotal = order.items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );
  const totalAmount = order.totalAmount > 0 ? order.totalAmount : calculatedSubtotal;
  const taxableValue = Math.round(totalAmount / 1.18);
  const totalGst = totalAmount - taxableValue;
  const cgst = Math.round(totalGst / 2);
  const sgst = totalGst - cgst;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#18181b] print:bg-white text-neutral-900 py-10 px-4 sm:px-6 flex flex-col items-center">
      
      {/* Top Floating Action Bar (Hidden in Print) */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Tax Invoice</span>
        </button>
      </div>

      {/* Luxury A4 Document Sheet */}
      <div 
        id="invoice-document"
        className="w-full max-w-4xl bg-white rounded-3xl print:rounded-none shadow-2xl print:shadow-none p-10 sm:p-14 border border-neutral-200/80 print:border-none relative overflow-hidden"
      >
        {/* Subtle Luxury Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] select-none">
          <span className="text-[12rem] font-black tracking-widest text-neutral-950 font-serif rotate-[-25deg]">
            SINHA&apos;S
          </span>
        </div>

        {/* 1. Header & Brand Identity */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b-2 border-neutral-950">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl font-black tracking-tighter text-neutral-950 font-sans">
                SINHA&apos;S.
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-950 text-amber-300 text-[9px] font-mono uppercase tracking-widest font-bold">
                Haute Horlogerie &amp; Atelier
              </span>
            </div>
            <p className="text-xs text-neutral-600 font-mono">
              Atelier Private Reserve Ltd. &bull; Connaught Place, New Delhi 110001
            </p>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              GSTIN: <span className="font-bold text-neutral-900">07AAAAA0000A1Z5</span> &bull; CIN: U74999DL2026PTC000112
            </p>
            <p className="text-xs text-neutral-500 font-mono">
              Email: concierge@sinhas.luxury &bull; Ph: +91 11 4982 0000
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="inline-block px-3 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-mono uppercase font-bold tracking-widest">
              Original For Recipient
            </span>
            <h1 className="text-2xl font-black tracking-tight text-neutral-950 uppercase mt-2">
              Tax Invoice
            </h1>
            <p className="text-xs font-mono text-neutral-500">
              Invoice Ref: <span className="font-bold text-neutral-900 font-mono">{order.orderId}</span>
            </p>
            <p className="text-xs font-mono text-neutral-500">
              Issue Date: <span className="font-bold text-neutral-900">{new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </p>
          </div>
        </div>

        {/* 2. Client & Dispatch Particulars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-neutral-200 text-xs">
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold">
              Billed &amp; Shipped To (Recipient)
            </p>
            <p className="text-sm font-bold text-neutral-950 font-mono uppercase tracking-wide">
              {order.customerName}
            </p>
            <p className="text-neutral-600 leading-relaxed max-w-sm">
              {order.shippingAddress || 'Registered Address'}
            </p>
            <p className="text-neutral-600 font-mono pt-1">
              Contact: <span className="text-neutral-900 font-medium">{order.customerPhone || 'Not provided'}</span>
            </p>
            <p className="text-neutral-600 font-mono">
              Email: <span className="text-neutral-900 font-medium">{order.customerEmail}</span>
            </p>
          </div>

          <div className="space-y-2 sm:text-right flex flex-col sm:items-end justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold">
                Logistics &amp; Payment Settlement
              </p>
              <p className="text-neutral-700">
                Courier: <span className="font-bold text-neutral-950">White-Glove Insured Air Express</span>
              </p>
              <p className="text-neutral-700">
                Payment Mode: <span className="font-bold text-neutral-950">Encrypted Digital Settlement (Prepaid)</span>
              </p>
              <p className="text-neutral-700">
                State Code: <span className="font-bold text-neutral-950 font-mono">07 (Delhi NCR Hub)</span>
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 font-medium font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Payment Realised &bull; Authorized Acquisition</span>
            </div>
          </div>
        </div>

        {/* 3. Itemized Acquisition Ledger Table */}
        <div className="py-8">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-950 font-mono text-[11px] uppercase tracking-wider text-neutral-600">
                <th className="py-3 px-2 w-10">#</th>
                <th className="py-3 px-2">Description of Pieces</th>
                <th className="py-3 px-2 text-center w-24">HSN/SAC</th>
                <th className="py-3 px-2 text-center w-16">Qty</th>
                <th className="py-3 px-2 text-right w-28">Unit Rate</th>
                <th className="py-3 px-2 text-right w-32">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {order.items.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="py-4 px-2 font-mono text-neutral-400">{String(index + 1).padStart(2, '0')}</td>
                  <td className="py-4 px-2">
                    <p className="font-bold text-neutral-950 text-sm">{item.title}</p>
                    <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      Bespoke Masterwork &bull; Certified Origin
                    </p>
                  </td>
                  <td className="py-4 px-2 text-center font-mono text-neutral-600">9102.1100</td>
                  <td className="py-4 px-2 text-center font-mono font-bold text-neutral-900">{item.quantity}</td>
                  <td className="py-4 px-2 text-right font-mono text-neutral-700">
                    ₹{Number(item.price).toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 px-2 text-right font-mono font-bold text-neutral-950">
                    ₹{(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Financial Calculations & Tax Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 pt-4 pb-8 border-t-2 border-neutral-950 items-start">
          
          <div className="sm:col-span-7 space-y-4">
            <div className="rounded-2xl bg-neutral-50 border border-neutral-200/80 p-4 space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 font-bold">
                Tax Split Schedule (18% Statutory GST)
              </p>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono border-b border-neutral-200 pb-2">
                <div>
                  <span className="text-neutral-500 block">Taxable Value</span>
                  <span className="font-bold text-neutral-900">₹{taxableValue.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">CGST (9%)</span>
                  <span className="font-bold text-neutral-900">₹{cgst.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">SGST (9%)</span>
                  <span className="font-bold text-neutral-900">₹{sgst.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <p className="text-[10px] text-neutral-500 italic">
                Tax invoice is generated under Rule 46 of the Central Goods and Services Tax Rules, 2017.
              </p>
            </div>

            <div className="text-[11px] text-neutral-500 leading-relaxed font-mono">
              <p className="font-bold text-neutral-800 uppercase mb-1 tracking-wider text-[10px]">Declaration:</p>
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </div>
          </div>

          <div className="sm:col-span-5 space-y-2.5 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>Taxable Subtotal</span>
              <span className="font-mono font-bold text-neutral-900">₹{taxableValue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Total Integrated Tax (GST)</span>
              <span className="font-mono font-bold text-neutral-900">₹{totalGst.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Courier Delivery</span>
              <span className="font-mono font-bold text-emerald-700">COMPLIMENTARY</span>
            </div>

            <div className="pt-3 border-t-2 border-neutral-950 flex justify-between items-baseline">
              <div>
                <span className="text-sm font-black text-neutral-950 uppercase tracking-tight block">Grand Total</span>
                <span className="text-[10px] text-neutral-400 font-mono">(INR Inclusive of all taxes)</span>
              </div>
              <span className="text-2xl font-black font-mono text-neutral-950">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

        </div>

        {/* 5. Luxury Authentication Stamp & Signature */}
        <div className="pt-8 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-end gap-8">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 max-w-sm">
            <Gem className="w-6 h-6 text-amber-700 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-amber-950 uppercase tracking-wider font-mono">
                Sinha&apos;s Authenticity Guarantee
              </p>
              <p className="text-[10px] text-amber-900/80 leading-snug">
                Backed by Atelier 2-year International Warranty and multi-point inspection pass.
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right space-y-1">
            <div className="h-14 flex items-end justify-end">
              <span className="font-serif italic text-xl font-bold text-neutral-800 tracking-wider">
                Sinha &amp; Co.
              </span>
            </div>
            <div className="w-48 border-t border-neutral-950 pt-1 ml-auto">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-950 font-bold">
                Authorized Signatory
              </p>
              <p className="text-[9px] font-mono text-neutral-400">
                For Sinha&apos;s Atelier India Ltd.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-neutral-100 text-center text-[10px] font-mono text-neutral-400">
          This is a computer-generated tax invoice verified from database records. Questions? Contact concierge@sinhas.luxury
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          #invoice-document {
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}