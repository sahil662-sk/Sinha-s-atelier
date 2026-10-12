'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Printer, 
  ArrowLeft, 
  Loader2, 
  FileText 
} from 'lucide-react';
import { numberToWordsIndian } from '@/lib/numberToWords';

export default function InvoicePage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const resolvedParams = use(params);
  const orderNumber = resolvedParams.orderNumber;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        const data = await res.json();
        if (!res.ok || !data.order) {
          throw new Error(data.error || 'Invoice not found');
        }
        setOrder(data.order);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch invoice details.');
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderNumber]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-3 bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          Generating Tax Invoice...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <FileText className="w-10 h-10 text-neutral-300 mx-auto" />
        <h1 className="text-xl font-bold text-neutral-900">Invoice Unavailable</h1>
        <p className="text-xs text-neutral-500">{error || 'This order could not be located.'}</p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
        </Link>
      </div>
    );
  }

  const subtotal = Number(order.subtotal);
  const shipping = Number(order.shipping);
  const grandTotal = Number(order.total);

  // 18% GST Calculation (Inclusive): Taxable Value = Total / 1.18
  const taxableValue = subtotal / 1.18;
  const totalGst = subtotal - taxableValue;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;

  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-neutral-200/70 py-6 sm:py-10 print:bg-white print:p-0 print:m-0">
      {/* Floating Action Bar (Strictly hidden in print) */}
      <div className="max-w-[210mm] mx-auto px-4 mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 uppercase tracking-wider transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Orders
        </Link>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer shadow"
        >
          <Printer className="w-4 h-4" /> Print Tax Invoice (A4)
        </button>
      </div>

      {/* Standard A4 Paper Document Container */}
      <div className="max-w-[210mm] mx-auto bg-white border border-neutral-300 shadow-md p-8 sm:p-12 print:shadow-none print:border-none print:p-0 print:max-w-none text-neutral-900 font-sans">
        
        {/* Document Header */}
        <div className="border-b-2 border-neutral-900 pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-neutral-950">
              SINHA&apos;S LUXURY ATELIER PVT. LTD.
            </h1>
            <p className="text-[11px] text-neutral-600 leading-tight mt-1">
              Atelier Suite 402, Signature Towers, Connaught Place, New Delhi - 110001<br />
              <strong>GSTIN:</strong> 07AAACS1234F1Z8 &nbsp;|&nbsp; <strong>State:</strong> Delhi (07)<br />
              <strong>CIN:</strong> U74999DL2024PTC123456 &nbsp;|&nbsp; <strong>Email:</strong> concierge@sinhas.luxury
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-neutral-100 border border-neutral-300 text-xs font-mono font-bold uppercase tracking-wider">
              TAX INVOICE
            </span>
            <p className="text-xs font-mono mt-2">
              <strong>Original for Recipient</strong>
            </p>
          </div>
        </div>

        {/* Invoice Metadata & Client Details Grid */}
        <div className="grid grid-cols-2 border-b border-neutral-300 text-xs py-4">
          <div className="pr-4 border-r border-neutral-300 space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 font-bold">
              Billed To / Consignee:
            </p>
            <p className="font-bold text-sm text-neutral-900">{order.customerName}</p>
            <p className="text-neutral-700 leading-relaxed">
              {order.address}<br />
              {order.city}, {order.state} - {order.postalCode}<br />
              <strong>Email:</strong> {order.email}
            </p>
            <p className="text-[11px] text-neutral-500 pt-1">
              Place of Supply: <strong>{order.state || 'Delhi'}</strong>
            </p>
          </div>

          <div className="pl-4 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-neutral-500 uppercase">Invoice No:</span>
              <span className="font-bold text-neutral-900">INV-{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 uppercase">Invoice Date:</span>
              <span className="font-semibold text-neutral-900">{invoiceDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 uppercase">Order Ref:</span>
              <span className="text-neutral-900">#{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 uppercase">Payment Mode:</span>
              <span className="text-neutral-900 font-semibold">Prepaid / Electronic</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 uppercase">Status:</span>
              <span className="text-emerald-700 font-bold">{order.status}</span>
            </div>
          </div>
        </div>

        {/* Standard GST Items Table */}
        <div className="mt-4">
          <table className="w-full text-left text-xs border border-neutral-300 border-collapse">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-300 text-[10px] font-mono uppercase tracking-wider text-neutral-700">
                <th className="py-2.5 px-3 border-r border-neutral-300 w-8 text-center">#</th>
                <th className="py-2.5 px-3 border-r border-neutral-300">Description of Goods</th>
                <th className="py-2.5 px-3 border-r border-neutral-300 text-center w-20">HSN Code</th>
                <th className="py-2.5 px-3 border-r border-neutral-300 text-center w-12">Qty</th>
                <th className="py-2.5 px-3 border-r border-neutral-300 text-right w-24">Rate (₹)</th>
                <th className="py-2.5 px-3 border-r border-neutral-300 text-right w-24">Taxable (₹)</th>
                <th className="py-2.5 px-3 text-right w-28">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {order.items?.map((item: any, idx: number) => {
                const itemTotal = Number(item.price) * item.quantity;
                const itemTaxable = itemTotal / 1.18;
                const unitPrice = Number(item.price) / 1.18;

                return (
                  <tr key={item.id} className="text-neutral-900">
                    <td className="py-3 px-3 border-r border-neutral-200 text-center font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 border-r border-neutral-200">
                      <p className="font-semibold text-neutral-950">{item.title}</p>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        SKU: {item.productId.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 border-r border-neutral-200 text-center font-mono text-[11px] text-neutral-600">
                      9102 // 7113
                    </td>
                    <td className="py-3 px-3 border-r border-neutral-200 text-center font-mono font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 border-r border-neutral-200 text-right font-mono">
                      {unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 border-r border-neutral-200 text-right font-mono">
                      {itemTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      {itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* GST & Totals Summary Calculation */}
        <div className="grid grid-cols-2 border border-t-0 border-neutral-300 text-xs">
          {/* Amount in words & Declarations */}
          <div className="p-4 border-r border-neutral-300 flex flex-col justify-between space-y-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
                Invoice Total in Words:
              </p>
              <p className="text-xs font-semibold text-neutral-900 mt-1 italic">
                {numberToWordsIndian(grandTotal)}
              </p>
            </div>

            <div className="text-[10px] text-neutral-500 leading-tight border-t border-neutral-200 pt-3">
              <strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Goods once sold are backed by 2-Year Comprehensive Warranty.
            </div>
          </div>

          {/* Numbers Column */}
          <div className="divide-y divide-neutral-200 font-mono text-[11px]">
            <div className="flex justify-between py-2 px-4">
              <span className="text-neutral-600 font-sans">Total Taxable Value</span>
              <span className="font-semibold text-neutral-900">
                ₹{taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-2 px-4">
              <span className="text-neutral-600 font-sans">CGST (9.0%)</span>
              <span className="text-neutral-900">
                ₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-2 px-4">
              <span className="text-neutral-600 font-sans">SGST / UTGST (9.0%)</span>
              <span className="text-neutral-900">
                ₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-2 px-4">
              <span className="text-neutral-600 font-sans">Freight &amp; Insurance</span>
              <span className="text-neutral-900">
                {shipping === 0 ? 'Complimentary' : `₹${shipping.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </span>
            </div>
            <div className="flex justify-between py-3 px-4 bg-neutral-100 text-sm font-bold text-neutral-950">
              <span className="font-sans uppercase">Total Amount (INR)</span>
              <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Legal Footer & Signatory */}
        <div className="mt-8 pt-6 border-t border-neutral-300 flex justify-between items-end text-xs">
          <div className="text-[10px] text-neutral-400 space-y-1">
            <p>Subject to Delhi Jurisdiction only.</p>
            <p className="font-mono">Computer Generated Document • Authentication Verified</p>
          </div>

          <div className="text-center space-y-1">
            <div className="w-40 border-b border-neutral-400 pb-1 text-[11px] font-serif italic text-neutral-600">
              Sahil Sinha
            </div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
              For Sinha&apos;s Atelier Pvt. Ltd.
            </p>
            <p className="text-[9px] text-neutral-400">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}