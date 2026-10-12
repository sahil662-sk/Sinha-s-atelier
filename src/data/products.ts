export interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string;
  description: string;
  rating: number;
  reviews: number;
}

// 1. Exclusive Hero Carousel Products (Self-Scrolling Marquee)
export const FEATURED_DROPS: Product[] = [
  {
    id: 'drop_1',
    title: 'Leica Q3 Compact Full-Frame Camera',
    price: 549000,
    category: 'Optics',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900&auto=format&fit=crop&q=80',
    description: 'Bespoke full-frame compact camera with a 60MP BSI CMOS sensor and fixed Summilux 28mm f/1.7 ASPH lens. Built with weather-sealed magnesium chassis.',
    rating: 5.0,
    reviews: 62,
  },
  {
    id: 'drop_2',
    title: 'Rimowa Classic Cabin Aluminum Suitcase',
    price: 118000,
    category: 'Travel',
    image: 'https://images.unsplash.com/photo-1581553680321-4fffae59fccd?w=900&auto=format&fit=crop&q=80',
    description: 'High-end anodized aluminum luggage engineered in Germany. Fitted with high-precision Multiwheel system and TSA-approved locks.',
    rating: 4.9,
    reviews: 135,
  },
  {
    id: 'drop_3',
    title: 'Bang & Olufsen Beoplay EX True Wireless',
    price: 36900,
    category: 'Audio',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=900&auto=format&fit=crop&q=80',
    description: 'Waterproof luxury wireless earphones featuring 9.2mm neodymium drivers, glass touch interface, and adaptive active noise cancellation.',
    rating: 4.8,
    reviews: 98,
  },
  {
    id: 'drop_4',
    title: 'Teenage Engineering OP-1 Field Synthesizer',
    price: 185000,
    category: 'Instruments',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=900&auto=format&fit=crop&q=80',
    description: 'Ultra-portable synthesizer, sampler, and 4-track tape recorder encased in low-profile CNC anodized aluminum with hi-res tempered glass display.',
    rating: 4.9,
    reviews: 114,
  },
  {
    id: 'drop_5',
    title: 'Tom Dixon Precision Brass Desk Arch',
    price: 18200,
    category: 'Desk Gear',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900&auto=format&fit=crop&q=80',
    description: 'Sculptural desk organizer machined from solid spun brass with mirror polish and protective lacquer coat.',
    rating: 4.7,
    reviews: 45,
  },
  {
    id: 'drop_6',
    title: 'Porsche Design Chronotimer Series 1',
    price: 435000,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&auto=format&fit=crop&q=80',
    description: 'Titanium chronograph watch inspired by high-performance motorsport instruments with glare-proof sapphire crystal.',
    rating: 4.9,
    reviews: 73,
  },
];

// 2. Main Catalog Grid Products
export const PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    title: 'Sony WH-1000XM5 Wireless Headphones',
    price: 29990,
    category: 'Audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop&q=80',
    description: 'Industry-leading noise cancellation engineered with dual processors and eight microphones. Supports high-resolution wireless LDAC audio with up to 30 hours of battery life.',
    rating: 4.9,
    reviews: 248,
  },
  {
    id: 'prod_2',
    title: 'Minimalist Chronograph Leather Watch',
    price: 8499,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=900&auto=format&fit=crop&q=80',
    description: 'Brushed surgical-grade stainless steel casing fitted with genuine vegetable-tanned leather straps. Driven by a precise Japanese quartz movement with dual subdials.',
    rating: 4.7,
    reviews: 119,
  },
  {
    id: 'prod_3',
    title: 'Keychron Q1 Mechanical Keyboard',
    price: 14500,
    category: 'Desk Gear',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=900&auto=format&fit=crop&q=80',
    description: 'All-metal 75% CNC machined aluminum keyboard with double-gasket acoustic mounting, hot-swappable switches, screw-in stabilizers, and full QMK/VIA programmability.',
    rating: 4.9,
    reviews: 312,
  },
  {
    id: 'prod_4',
    title: 'Classic Leather Travel Duffel Bag',
    price: 6200,
    category: 'Travel',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&auto=format&fit=crop&q=80',
    description: 'Handcrafted weekend travel duffel bag made with premium full-grain leather, reinforced metal hardware, water-resistant interior lining, and dedicated compartments.',
    rating: 4.8,
    reviews: 94,
  },
  {
    id: 'prod_5',
    title: 'Beosound A1 Portable Bluetooth Speaker',
    price: 21900,
    category: 'Audio',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=900&auto=format&fit=crop&q=80',
    description: 'Rugged IP67 dust and waterproof aluminum Bluetooth speaker delivering punchy 360-degree True360 sound, Multipoint connectivity, and integrated voice assistance.',
    rating: 4.8,
    reviews: 176,
  },
  {
    id: 'prod_6',
    title: 'Solid Walnut Wood Monitor Stand',
    price: 11200,
    category: 'Desk Gear',
    image: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=900&auto=format&fit=crop&q=80',
    description: 'Ergonomic dual-monitor riser hand-finished from solid American walnut hardwood with heavy-gauge precision aluminum shelves for desktop organization.',
    rating: 4.9,
    reviews: 87,
  },
  {
    id: 'prod_7',
    title: 'Saint Laurent Tribute Leather Slide Sandals',
    price: 150000,
    category: 'Footwear',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&auto=format&fit=crop&q=80',
    description: 'Iconic Saint Laurent flat slide sandals crafted in Italy from 100% calfskin leather. Featuring interlocking woven straps, a squared open toe, and an embossed Saint Laurent Paris leather sole.',
    rating: 4.9,
    reviews: 142,
  },
  {
    id: 'prod_8',
    title: 'Slim Italian Leather Card Wallet',
    price: 3900,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=900&auto=format&fit=crop&q=80',
    description: 'Handcrafted ultra-slim cardholder made from Italian vegetable-tanned leather. Holds up to 6 cards comfortably with a center pocket for folded cash.',
    rating: 4.7,
    reviews: 58,
  },
];