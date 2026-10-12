'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  LogOut, 
  ShoppingBag, 
  User, 
  MapPin, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function ClientProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('user');
      if (!saved) {
        router.push('/login');
        return;
      }
      const u = JSON.parse(saved);
      const cleanEmail = (u.email || '').trim().toLowerCase();
      setEmail(cleanEmail);

      // Fetch permanent address from database
      fetch(`/api/user/profile?email=${encodeURIComponent(cleanEmail)}&t=${Date.now()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.profile) {
            setName(data.profile.name || u.name || '');
            setPhone(data.profile.phone || u.phone || '');
            setAddress(data.profile.address || '');
            setCity(data.profile.city || '');
            setStateName(data.profile.state || '');
            setPostalCode(data.profile.postalCode || '');

            // Keep local storage synchronized
            const updatedUser = {
              ...u,
              name: data.profile.name || u.name,
              phone: data.profile.phone || u.phone,
              address: data.profile.address || '',
              city: data.profile.city || '',
              state: data.profile.state || '',
              postalCode: data.profile.postalCode || '',
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        })
        .catch((err) => console.error('Failed to load profile from DB:', err))
        .finally(() => setLoading(false));
    } catch {
      router.push('/login');
    }
  }, [router]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          phone,
          address,
          city,
          state: stateName,
          postalCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save address');
      }

      // Sync updated profile to localStorage
      const saved = localStorage.getItem('user');
      const currentUser = saved ? JSON.parse(saved) : {};
      const updatedUser = {
        ...currentUser,
        name,
        phone,
        address,
        city,
        state: stateName,
        postalCode,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('auth-updated'));

      setSuccessMsg('Address and credentials successfully recorded in database.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save profile updates');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('admin_unlocked_session');
    window.dispatchEvent(new Event('auth-updated'));
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>

          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200 text-xs font-mono font-bold text-neutral-900 hover:border-neutral-900 transition-all shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-neutral-700" />
            <span>View My Orders</span>
          </Link>
        </div>

        {/* Title Header */}
        <div className="pt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-neutral-950 tracking-tight">
              Client Profile &amp; Address Book
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Manage your personal credentials and default delivery destinations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-950 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSaveChanges} className="mt-8 space-y-8">
          
          {/* Section 1: Personal Credentials */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <User className="w-4 h-4 text-amber-800" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-bold">
                Personal Information
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-bold block mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-neutral-900 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-bold block mb-1.5">
                  Registered Email
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-100/60 border border-neutral-200 text-xs font-mono text-neutral-500 cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-bold block mb-1.5">
                  Phone Number (10-Digit Indian Number) *
                </label>
                <div className="flex gap-2">
                  <span className="px-3.5 py-3 rounded-2xl bg-neutral-100 border border-neutral-200 text-xs font-mono text-neutral-500 font-bold flex items-center">
                    +91
                  </span>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9102817211"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-mono focus:bg-white focus:outline-none focus:border-neutral-900 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Default Shipping Destination */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <MapPin className="w-4 h-4 text-amber-800" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-bold">
                Default Shipping Destination
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-bold block mb-1.5">
                  Street Address &amp; Suite / Flat / Floor *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 402 Silver Arch, 14th Main Road"
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-neutral-900 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-bold block mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-neutral-900 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-bold block mb-1.5">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-neutral-900 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-bold block mb-1.5">
                    Postal Code (PIN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 400050"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:border-neutral-900 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}