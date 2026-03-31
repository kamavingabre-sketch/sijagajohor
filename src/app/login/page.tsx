'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Eye, EyeOff, ArrowLeft, Shield, HardHat, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

type Panel = 'petugas' | 'admin';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [panel, setPanel] = useState<Panel>('petugas');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(username, password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    const stored = localStorage.getItem('sijaga_user');
    if (stored) {
      const u = JSON.parse(stored);
      router.push(u.role === 'admin' ? '/dashboard-admin' : '/dashboard-petugas');
    }
  };

  const isPetugas = panel === 'petugas';

  const switchPanel = (p: Panel) => {
    setPanel(p); setError(''); setUsername(''); setPassword('');
  };

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ══════════ LEFT — SELECTOR PANEL ══════════ */}
      <div
        className={`relative flex-col transition-all duration-500 bg-gradient-to-br from-mj-blue via-[#0d4a96] to-[#0a2d5e] overflow-hidden ${
          isPetugas ? 'flex w-full md:w-1/2' : 'hidden md:flex md:w-1/2'
        }`}
      >
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-white/8 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full border border-white/5 -translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col min-h-screen px-8 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-body transition-colors">
            <ArrowLeft size={14} /> Kembali ke Beranda
          </Link>

          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            <div className="flex items-center gap-3 mb-10">
              <div className="relative w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <span className="font-display font-black text-white text-xl">SJ</span>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-mj-red rounded-sm" />
              </div>
              <div>
                <p className="font-display font-black text-white text-xl tracking-widest uppercase">SIJAGA JOHOR</p>
                <p className="text-white/40 text-xs font-body">Kecamatan Medan Johor</p>
              </div>
            </div>

            <p className="text-white/60 font-body text-xs font-semibold uppercase tracking-widest mb-4">Masuk sebagai</p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <button onClick={() => switchPanel('petugas')}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 ${
                  isPetugas ? 'border-white bg-white/15 shadow-xl' : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
                }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isPetugas ? 'bg-mj-red' : 'bg-white/10'}`}>
                  <HardHat size={22} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="font-display font-bold text-white text-base uppercase tracking-wide">Petugas</p>
                  <p className="text-white/50 text-xs font-body mt-0.5">Melati / Bestari</p>
                </div>
                {isPetugas && <div className="w-6 h-1 bg-mj-red rounded-full" />}
              </button>

              <button onClick={() => switchPanel('admin')}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 ${
                  !isPetugas ? 'border-white bg-white/15 shadow-xl' : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
                }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${!isPetugas ? 'bg-mj-red' : 'bg-white/10'}`}>
                  <Shield size={22} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="font-display font-bold text-white text-base uppercase tracking-wide">Admin</p>
                  <p className="text-white/50 text-xs font-body mt-0.5">Supervisor / Staff</p>
                </div>
                {!isPetugas && <div className="w-6 h-1 bg-mj-red rounded-full" />}
              </button>
            </div>

            <div className="bg-white/8 border border-white/15 rounded-xl p-4">
              {isPetugas ? (
                <><p className="font-body font-semibold text-white text-sm mb-1">Portal Petugas Kebersihan</p>
                <p className="font-body text-white/55 text-xs leading-relaxed">Absensi, kirim bukti foto, dan bagikan lokasi kerja secara real-time.</p></>
              ) : (
                <><p className="font-body font-semibold text-white text-sm mb-1">Portal Admin / Supervisor</p>
                <p className="font-body text-white/55 text-xs leading-relaxed">Pantau absensi, lokasi live, bukti foto, dan kelola akun petugas.</p></>
              )}
            </div>
          </div>

          <p className="text-white/20 text-xs font-body text-center mt-auto pt-8">SIJAGA JOHOR © 2025</p>
        </div>
      </div>

      {/* ══════════ RIGHT — FORM PANEL ══════════ */}
      <div className={`relative flex-col transition-all duration-500 bg-white overflow-hidden ${
        isPetugas ? 'hidden md:flex md:w-1/2' : 'flex w-full md:w-1/2'
      }`}>
        <div className={`absolute top-0 left-0 right-0 h-1 ${isPetugas ? 'bg-mj-blue' : 'bg-mj-red'}`} />

        {/* Mobile back */}
        <button onClick={() => switchPanel(isPetugas ? 'admin' : 'petugas')}
          className="md:hidden absolute top-5 left-4 flex items-center gap-1.5 text-mj-blue/60 hover:text-mj-blue text-sm font-body font-semibold transition-colors z-10">
          <ArrowLeft size={14} /> Ganti Role
        </button>

        <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-16 max-w-md mx-auto w-full">
          <div className="mb-8">
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 ${isPetugas ? 'bg-mj-blue' : 'bg-mj-red'}`}>
              {isPetugas ? <HardHat className="text-white" size={26} /> : <Shield className="text-white" size={26} />}
            </div>
            <h2 className="font-display font-black text-mj-blue text-3xl uppercase tracking-wide mb-1">
              {isPetugas ? 'Login Petugas' : 'Login Admin'}
            </h2>
            <p className="font-body text-mj-blue/45 text-sm">
              {isPetugas ? 'Masuk ke portal kebersihan Anda' : 'Masuk ke panel administrasi sistem'}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <AlertCircle size={15} className="text-mj-red shrink-0" />
              <p className="font-body text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block font-body font-semibold text-mj-blue text-sm mb-2">Username / NIP</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mj-blue/30" />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder={isPetugas ? 'Masukkan NIP Anda' : 'Masukkan username admin'}
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl font-body text-sm text-mj-blue placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-mj-blue/20 focus:border-mj-blue transition-all" />
              </div>
            </div>

            <div>
              <label className="block font-body font-semibold text-mj-blue text-sm mb-2">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mj-blue/30" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-10 py-3.5 border border-gray-200 rounded-xl font-body text-sm text-mj-blue placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-mj-blue/20 focus:border-mj-blue transition-all" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mj-blue/30 hover:text-mj-blue transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button onClick={handleLogin} disabled={loading}
              className={`w-full flex items-center justify-center gap-2 text-white font-body font-bold py-4 rounded-xl transition-all duration-200 mt-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                isPetugas ? 'bg-mj-blue hover:bg-mj-blue-mid shadow-blue-900/15' : 'bg-mj-red hover:bg-mj-red-dark shadow-red-900/15'
              }`}>
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> Memverifikasi...</>
                : isPetugas ? '🏗️ Masuk sebagai Petugas' : '🛡️ Masuk sebagai Admin'
              }
            </button>
          </div>

          <div className="hidden md:block mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-mj-blue/35 text-xs font-body mb-3">Atau masuk dengan peran berbeda</p>
            <button onClick={() => switchPanel(isPetugas ? 'admin' : 'petugas')}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-mj-blue/50 hover:text-mj-blue hover:border-mj-blue font-body font-semibold text-sm py-3 rounded-xl transition-all">
              {isPetugas ? <><Shield size={14} /> Masuk sebagai Admin</> : <><HardHat size={14} /> Masuk sebagai Petugas</>}
            </button>
          </div>

          <p className="text-center font-body text-gray-300 text-xs mt-8">
            Lupa password? Hubungi admin kecamatan.
          </p>
        </div>
      </div>
    </div>
  );
}
