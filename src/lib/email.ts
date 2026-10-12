import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface OrderEmailProps {
  to: string;
  customerName: string;
  orderNumber: string;
  items: Array<{
    title: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderNumber,
  items,
  subtotal,
  shipping,
  total,
  address,
  city,
  state,
  postalCode,
}: OrderEmailProps) {
  // If email credentials are not configured, log a graceful message without breaking checkout
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured in .env. Skipping automated confirmation email.');
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const invoiceUrl = `${baseUrl}/orders/${orderNumber}/invoice`;

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #1a1a1a;">
          <strong>${item.title}</strong>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 13px; color: #666;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-size: 13px; font-weight: 600; color: #1a1a1a;">
          ₹${(item.price * item.quantity).toLocaleString('en-IN')}
        </td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 20px; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #eaeaea; border-radius: 16px; overflow: hidden; }
        .header { background: #0a0a0a; color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 900; }
        .header p { margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #a3a3a3; }
        .body { padding: 32px 24px; }
        .greeting { font-size: 15px; margin-bottom: 20px; }
        .meta-box { background: #f9f9f9; border: 1px solid #eeeeee; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
        .meta-box table { width: 100%; font-size: 12px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .table th { text-align: left; font-size: 11px; text-transform: uppercase; color: #888; padding-bottom: 8px; border-bottom: 2px solid #1a1a1a; }
        .totals { margin-top: 20px; width: 100%; }
        .totals td { padding: 6px 0; font-size: 13px; }
        .total-row { font-size: 16px; font-weight: bold; border-top: 2px solid #1a1a1a; padding-top: 10px !important; }
        .btn { display: inline-block; background: #0a0a0a; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 30px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px; text-align: center; }
        .footer { background: #f9f9f9; border-top: 1px solid #eaeaea; padding: 20px 24px; text-align: center; font-size: 11px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SINHA'S</h1>
          <p>Order Acquisition Confirmed</p>
        </div>
        <div class="body">
          <p class="greeting">Dear <strong>${customerName}</strong>,</p>
          <p style="font-size: 13px; line-height: 1.6; color: #555;">
            Thank you for your acquisition. We have recorded your order in our atelier ledger. Our concierge team is preparing your package with white-glove precision.
          </p>

          <div class="meta-box">
            <table>
              <tr>
                <td style="color: #666;">Order Reference:</td>
                <td style="text-align: right; font-weight: bold; font-family: monospace;">#${orderNumber}</td>
              </tr>
              <tr>
                <td style="color: #666; padding-top: 8px;">Delivery Destination:</td>
                <td style="text-align: right; font-weight: 500; padding-top: 8px;">
                  ${address}, ${city}, ${state} - ${postalCode}
                </td>
              </tr>
            </table>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="totals">
            <tr>
              <td style="color: #666;">Subtotal</td>
              <td style="text-align: right; font-family: monospace;">₹${subtotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="color: #666;">Shipping &amp; Logistics</td>
              <td style="text-align: right; font-family: monospace;">
                ${shipping === 0 ? 'Complimentary' : `₹${shipping.toLocaleString('en-IN')}`}
              </td>
            </tr>
            <tr>
              <td class="total-row">Total Amount Paid</td>
              <td class="total-row" style="text-align: right; font-family: monospace;">₹${total.toLocaleString('en-IN')}</td>
            </tr>
          </table>

          <div style="text-align: center;">
            <a href="${invoiceUrl}" class="btn" target="_blank">View / Print Tax Invoice</a>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0;">Sinha's Luxury Atelier Pvt. Ltd. &bull; Connaught Place, New Delhi</p>
          <p style="margin: 4px 0 0 0;">Need concierge assistance? Reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Sinha's Luxury Atelier" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Order Confirmed: #${orderNumber} — Sinha's Luxury Atelier`,
      html: htmlContent,
    });
    console.log(`Order confirmation email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
  }
}