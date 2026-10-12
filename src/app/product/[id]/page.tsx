'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Check, 
  ShoppingBag, 
  Star, 
  MessageSquare, 
  BadgeCheck, 
  Lock,
  Heart,
  Edit3
} from 'lucide-react';

interface Review {
  id: string;
  author: string;
  email?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Wishlist state (Database backed + localStorage synced)
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Review states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(false);
  const [userExistingReview, setUserExistingReview] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    let email = '';
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        email = (u.email || '').trim().toLowerCase();
      }

      // Initial check from localStorage (Support both string ID and object forms safely)
      const rawWish = localStorage.getItem('sinhas_wishlist') || localStorage.getItem('wishlist');
      if (rawWish) {
        const parsed = JSON.parse(rawWish);
        if (Array.isArray(parsed)) {
          setInWishlist(parsed.some((item: any) => (typeof item === 'string' ? item : item?.id) === productId));
        }
      }
    } catch {}

    async function loadData() {
      try {
        setLoading(true);

        // 1. Fetch Product Details
        const prodRes = await fetch(`/api/products/${productId}?t=${Date.now()}`, { cache: 'no-store' });
        if (prodRes.ok) {
          const data = await prodRes.json();
          setProduct(data);
        }

        // 2. Fetch Wishlist status from DB
        if (email) {
          try {
            const wishRes = await fetch(`/api/wishlist?email=${encodeURIComponent(email)}&t=${Date.now()}`, { cache: 'no-store' });
            if (wishRes.ok) {
              const wishData = await wishRes.json();
              if (wishData.wishlist && Array.isArray(wishData.wishlist)) {
                const hasItem = wishData.wishlist.some((w: any) => (w.id || w) === productId);
                setInWishlist(hasItem);

                // Save strictly clean ID strings array to keep Navbar and Catalog in harmony
                const cleanIds = wishData.wishlist.map((w: any) => (typeof w === 'string' ? w : w.id)).filter(Boolean);
                localStorage.setItem('sinhas_wishlist', JSON.stringify(cleanIds));
                localStorage.setItem('wishlist', JSON.stringify(cleanIds));
                window.dispatchEvent(new Event('wishlist-updated'));
                window.dispatchEvent(new Event('wishlist-change'));
              }
            }
          } catch (e) {
            console.error('Wishlist fetch error:', e);
          }
        }

        // 3. Fetch Reviews & Verified Buyer Status (Must be DELIVERED)
        const reviewUrl = email 
          ? `/api/reviews?productId=${encodeURIComponent(productId)}&email=${encodeURIComponent(email)}&t=${Date.now()}`
          : `/api/reviews?productId=${encodeURIComponent(productId)}&t=${Date.now()}`;

        const revRes = await fetch(reviewUrl, { cache: 'no-store' });
        if (revRes.ok) {
          const revData = await revRes.json();
          setReviews(revData.reviews || []);
          setIsVerifiedBuyer(!!revData.isVerifiedBuyer);
          if (revData.userExistingReview) {
            setUserExistingReview(revData.userExistingReview);
            setRating(revData.userExistingReview.rating);
            setComment(revData.userExistingReview.comment);
          }
        }
      } catch (e) {
        console.error('Failed to load product details or reviews:', e);
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      loadData();
    }
  }, [productId]);

  // Wishlist Toggle: Synchronizes BOTH Database & Catalog LocalStorage
  const handleToggleWishlist = async () => {
    if (!currentUser?.email) {
      alert('Please sign in to save pieces to your private wishlist.');
      router.push('/login');
      return;
    }

    setWishlistLoading(true);
    try {
      // 1. Call Database API
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          productId: product.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const nextState = data.inWishlist;
        setInWishlist(nextState);

        // 2. Synchronize localStorage as clean ID array (Standardized across Catalog & Navbar)
        const rawWish = localStorage.getItem('sinhas_wishlist') || localStorage.getItem('wishlist') || '[]';
        let currentIds: string[] = [];
        try {
          const parsed = JSON.parse(rawWish);
          if (Array.isArray(parsed)) {
            currentIds = parsed.map((item: any) => (typeof item === 'string' ? item : item?.id)).filter(Boolean);
          }
        } catch {
          currentIds = [];
        }

        if (nextState) {
          if (!currentIds.includes(product.id)) {
            currentIds.push(product.id);
          }
        } else {
          currentIds = currentIds.filter((id) => id !== product.id);
        }

        localStorage.setItem('sinhas_wishlist', JSON.stringify(currentIds));
        localStorage.setItem('wishlist', JSON.stringify(currentIds));

        // 3. Dispatch events to immediately notify Navbar badge
        window.dispatchEvent(new Event('wishlist-updated'));
        window.dispatchEvent(new Event('wishlist-change'));
      }
    } catch (e) {
      console.error('Wishlist toggle error:', e);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || Number(product.stock ?? 0) <= 0) {
      alert('This piece is currently out of stock.');
      return;
    }

    setAdding(true);

    try {
      const raw = localStorage.getItem('sinhas_cart') || localStorage.getItem('cart');
      let cart: any[] = [];
      if (raw) {
        const parsed = JSON.parse(raw);
        cart = Array.isArray(parsed) ? parsed : (parsed.items || []);
      }

      const existingIndex = cart.findIndex((i) => i.id === product.id);
      if (existingIndex > -1) {
        const currentQty = Number(cart[existingIndex].quantity) || 1;
        if (currentQty >= Number(product.stock)) {
          alert(`Cannot add more than available units.`);
          setAdding(false);
          return;
        }
        cart[existingIndex].quantity = currentQty + 1;
      } else {
        cart.push({
          id: product.id,
          title: product.title,
          price: Number(product.price),
          image: product.image,
          quantity: 1,
        });
      }

      localStorage.setItem('sinhas_cart', JSON.stringify(cart));
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmittingReview(true);
    try {
      const activeEmail = (currentUser?.email || '').trim().toLowerCase();
      const activeName = (currentUser?.name || 'Verified Collector').trim();

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          reviewId: userExistingReview?.id,
          customerName: activeName,
          email: activeEmail,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit appraisal');
      }

      if (data.isEdit) {
        setReviews(reviews.map((r) => (r.id === data.review.id ? data.review : r)));
        setReviewSuccess('Your appraisal has been successfully updated.');
        setIsEditing(false);
      } else {
        setReviews([data.review, ...reviews]);
        setReviewSuccess('Your verified appraisal has been recorded in the database ledger.');
      }

      setUserExistingReview(data.review);
      setTimeout(() => setReviewSuccess(''), 4000);
    } catch (err: any) {
      alert(`Could not post appraisal: ${err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-black text-neutral-900">Piece not found in collection</h1>
        <Link href="/" className="mt-6 px-6 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const stockNum = Number(product.stock ?? 0);
  const isOutOfStock = stockNum <= 0;
  const isLowStock = stockNum > 0 && stockNum <= 3;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Collection</span>
        </Link>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-6">
            <div className="aspect-square rounded-3xl bg-neutral-100 overflow-hidden border border-neutral-200 relative group">
              <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-800 font-bold">
                {typeof product.category === 'object' ? product.category?.name : product.category || 'Atelier Masterpiece'}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight mt-1">
                {product.title}
              </h1>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black font-mono text-neutral-950">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-neutral-400 font-mono">(Inclusive of all atelier taxes)</span>
            </div>

            {/* Refined Stock Privacy Indicator */}
            <div>
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                  ARCHIVED &bull; OUT OF STOCK
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  ONLY {stockNum} {stockNum === 1 ? 'PIECE' : 'PIECES'} REMAINING
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  IN STOCK
                </span>
              )}
            </div>

            <p className="text-sm text-neutral-600 leading-relaxed font-light">
              {product.description || 'Precision crafted with meticulous attention to detail.'}
            </p>

            {/* Action Buttons: Add to Bag + Wishlist Toggle */}
            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || adding}
                className={`flex-1 py-4 px-8 rounded-full font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
                    : added
                    ? 'bg-emerald-700 text-white'
                    : 'bg-neutral-950 text-white hover:bg-neutral-800 shadow-md cursor-pointer active:scale-[0.99]'
                }`}
              >
                {isOutOfStock ? (
                  <span>Out of Stock &bull; Acquisition Closed</span>
                ) : added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Shopping Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Shopping Bag</span>
                  </>
                )}
              </button>

              {/* Wishlist Button (Dual-synced: Neon DB + Catalog Navbar State) */}
              <button
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`p-4 rounded-full border transition-all cursor-pointer shadow-xs active:scale-95 ${
                  inWishlist
                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-950 hover:border-neutral-950'
                }`}
                title={inWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-200 text-center">
              <div className="p-4 rounded-2xl bg-white border border-neutral-200/80">
                <ShieldCheck className="w-5 h-5 mx-auto text-neutral-800 mb-1" />
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">100% Genuine</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-neutral-200/80">
                <Truck className="w-5 h-5 mx-auto text-neutral-800 mb-1" />
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Insured Transit</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-neutral-200/80">
                <RotateCcw className="w-5 h-5 mx-auto text-neutral-800 mb-1" />
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">White-Glove</span>
              </div>
            </div>
          </div>
        </div>

        {/* VERIFIED REVIEWS & APPRAISAL LEDGER */}
        <div className="mt-20 pt-12 border-t border-neutral-200 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-800 font-bold">
                Collector Impressions
              </span>
              <h2 className="text-2xl font-black text-neutral-950 tracking-tight mt-0.5">
                Reviews &amp; Client Appraisals ({reviews.length})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {isVerifiedBuyer ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Owner (Delivered Order)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200 text-xs font-mono">
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Appraisal restricted to delivered owners</span>
                </span>
              )}
            </div>
          </div>

          {/* Review Submission Form: Only for Verified Buyers with Delivered Piece */}
          {isVerifiedBuyer && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-900">
                  {userExistingReview && !isEditing
                    ? 'Your Verified Atelier Appraisal'
                    : userExistingReview && isEditing
                    ? 'Edit Your Appraisal'
                    : 'Leave a Verified Atelier Appraisal'}
                </h3>

                {userExistingReview && !isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:underline cursor-pointer uppercase font-mono"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Appraisal</span>
                  </button>
                )}
              </div>

              {reviewSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-mono">
                  ✓ {reviewSuccess}
                </div>
              )}

              {(!userExistingReview || isEditing) ? (
                <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
                  {/* Star Rating Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase text-neutral-500">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="cursor-pointer focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= rating
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-mono font-bold text-neutral-700 ml-2">
                      {rating} of 5 Stars
                    </span>
                  </div>

                  <div>
                    <textarea
                      rows={3}
                      required
                      placeholder="Share your detailed impressions regarding the craftsmanship, packaging, and tactile quality..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium focus:outline-none focus:border-neutral-900 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 py-3 rounded-full bg-neutral-950 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {submittingReview
                        ? 'Recording...'
                        : isEditing
                        ? 'Update Appraisal'
                        : 'Submit Appraisal'}
                    </button>

                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setRating(userExistingReview.rating);
                          setComment(userExistingReview.comment);
                        }}
                        className="px-5 py-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs uppercase tracking-wider cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= userExistingReview.rating ? 'text-amber-500 fill-amber-500' : 'text-neutral-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-mono text-neutral-500 ml-2 font-bold">
                      Your recorded rating
                    </span>
                  </div>
                  <p className="text-xs text-neutral-800 leading-relaxed">
                    {userExistingReview.comment}
                  </p>
                </div>
              )}
            </div>
          )}

          {!isVerifiedBuyer && (
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 flex items-center gap-4 text-xs text-neutral-500">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-neutral-400" />
              </div>
              <p>
                Only clients with a successfully <strong>DELIVERED</strong> order in the database registry may post or edit reviews for this piece.
              </p>
            </div>
          )}

          {/* List of Existing Reviews */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400 font-mono">
                No appraisals recorded yet. Be the first verified owner to share an impression.
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-6 bg-white rounded-3xl border border-neutral-200/80 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-950">{rev.author}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <BadgeCheck className="w-3 h-3 text-emerald-600" />
                        Verified Acquisition
                      </span>
                    </div>

                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-neutral-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-700 leading-relaxed pt-1">
                    {rev.comment}
                  </p>

                  <span className="text-[10px] text-neutral-400 font-mono block pt-1">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}