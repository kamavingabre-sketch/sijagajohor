'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  Eye, EyeOff, ArrowLeft, Shield, HardHat,
  Lock, User, AlertCircle, Loader2,
} from 'lucide-react';
import Link from 'next/link';

type Role = 'petugas' | 'admin';

// ─────────────────────────────────────────────────────────────────
// BUG FIX: SelectorContent & FormContent HARUS di luar LoginPage.
// Kalau didefinisikan di dalam → setiap render state baru
// React anggap component baru → remount → input kehilangan focus.
// ─────────────────────────────────────────────────────────────────

interface SelectorProps {
  role: Role | null;
  onSelectRole: (r: Role) => void;
}

function SelectorContent({ role, onSelectRole }: SelectorProps) {
  return (
    <div className="flex flex-col min-h-full px-6 py-8 md:px-8">
      <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-body transition-colors">
        <ArrowLeft size={14} /> Kembali ke Beranda
      </Link>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-8">
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
        <p className="text-white/60 font-body text-xs font-semibold uppercase tracking-widest mb-5">Masuk sebagai</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => onSelectRole('petugas')}
            className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
              role === 'petugas' ? 'border-white bg-white/15 shadow-xl' : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
            }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${role === 'petugas' ? 'bg-mj-red' : 'bg-white/10'}`}>
              <HardHat size={22} className="text-white" />
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-white text-base uppercase tracking-wide">Petugas</p>
              <p className="text-white/50 text-xs font-body mt-0.5">Melati / Bestari</p>
            </div>
            {role === 'petugas' && <div className="w-6 h-1 bg-mj-red rounded-full" />}
          </button>
          <button onClick={() => onSelectRole('admin')}
            className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
              role === 'admin' ? 'border-white bg-white/15 shadow-xl' : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
            }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${role === 'admin' ? 'bg-mj-red' : 'bg-white/10'}`}>
              <Shield size={22} className="text-white" />
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-white text-base uppercase tracking-wide">Admin</p>
              <p className="text-white/50 text-xs font-body mt-0.5">Supervisor / Staff</p>
            </div>
            {role === 'admin' && <div className="w-6 h-1 bg-mj-red rounded-full" />}
          </button>
        </div>
        <div className="bg-white/8 border border-white/15 rounded-xl p-4">
          {role === 'petugas' ? (
            <><p className="font-body font-semibold text-white text-sm mb-1">Portal Petugas Kebersihan</p>
            <p className="font-body text-white/55 text-xs leading-relaxed">Absensi, kirim bukti foto, dan bagikan lokasi kerja secara real-time.</p></>
          ) : role === 'admin' ? (
            <><p className="font-body font-semibold text-white text-sm mb-1">Portal Admin / Supervisor</p>
            <p className="font-body text-white/55 text-xs leading-relaxed">Pantau absensi, lokasi live, bukti foto, dan kelola akun petugas.</p></>
          ) : (
            <><p className="font-body font-semibold text-white text-sm mb-1">Pilih peran Anda</p>
            <p className="font-body text-white/55 text-xs leading-relaxed">Klik salah satu kartu di atas untuk melanjutkan ke halaman login.</p></>
          )}
        </div>
      </div>
      <p className="text-white/20 text-xs font-body text-center pb-4">SIJAGA JOHOR © 2025</p>
    </div>
  );
}

interface FormProps {
  role: Role;
  username: string; onUsernameChange: (v: string) => void;
  password: string; onPasswordChange: (v: string) => void;
  showPass: boolean; onToggleShowPass: () => void;
  loading: boolean; error: string;
  onLogin: () => void; onBack: () => void; onSwitchRole: () => void;
}

function FormContent({ role, username, onUsernameChange, password, onPasswordChange, showPass, onToggleShowPass, loading, error, onLogin, onBack, onSwitchRole }: FormProps) {
  const isPetugas = role === 'petugas';
  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className={`h-1 w-full ${isPetugas ? 'bg-mj-blue' : 'bg-mj-red'}`} />
      <button onClick={onBack} className="md:hidden flex items-center gap-1.5 text-mj-blue/60 hover:text-mj-blue text-sm font-body font-semibold transition-colors px-5 pt-5 pb-2">
        <ArrowLeft size={14} /> Ganti Role
      </button>
      <div className="flex-1 flex flex-col justify-center px-6 py-8 md:px-12 max-w-md mx-auto w-full">
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
            <label className="block font-body font-semibold text-mj-blue text-sm mb-2">Username</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mj-blue/30" />
              <input
                type="text"
                value={username}
                onChange={e => onUsernameChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onLogin()}
                placeholder={isPetugas ? 'Masukkan username Anda' : 'Masukkan username admin'}
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl font-body text-sm text-mj-blue placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-mj-blue/20 focus:border-mj-blue transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block font-body font-semibold text-mj-blue text-sm mb-2">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mj-blue/30" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => onPasswordChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onLogin()}
                placeholder="Masukkan password"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3.5 border border-gray-200 rounded-xl font-body text-sm text-mj-blue placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-mj-blue/20 focus:border-mj-blue transition-all"
              />
              <button type="button" onClick={onToggleShowPass}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mj-blue/30 hover:text-mj-blue transition-colors">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button onClick={onLogin} disabled={loading}
            className={`w-full flex items-center justify-center gap-2 text-white font-body font-bold py-4 rounded-xl transition-all duration-200 mt-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
              isPetugas ? 'bg-mj-blue hover:bg-mj-blue-mid shadow-blue-900/15' : 'bg-mj-red hover:bg-mj-red-dark shadow-red-900/15'
            }`}>
            {loading ? <><Loader2 size={17} className="animate-spin" /> Memverifikasi...</> : isPetugas ? '🏗️ Masuk sebagai Petugas' : '🛡️ Masuk sebagai Admin'}
          </button>
        </div>
        <div className="hidden md:block mt-8 pt-6 border-t border-gray-100">
          <p className="text-center text-mj-blue/35 text-xs font-body mb-3">Atau masuk dengan peran berbeda</p>
          <button onClick={onSwitchRole}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 text-mj-blue/50 hover:text-mj-blue hover:border-mj-blue font-body font-semibold text-sm py-3 rounded-xl transition-all">
            {isPetugas ? <><Shield size={14} /> Masuk sebagai Admin</> : <><HardHat size={14} /> Masuk sebagai Petugas</>}
          </button>
        </div>
        <p className="text-center font-body text-gray-300 text-xs mt-8">Lupa password? Hubungi admin kecamatan.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [mobileStep, setMobileStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setError(''); setUsername(''); setPassword(''); setShowPass(false); };

  const selectRole = (r: Role) => { setRole(r); reset(); setMobileStep(2); };
  const backToSelect = () => { setMobileStep(1); reset(); };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) { setError('Username dan password wajib diisi.'); return; }
    setLoading(true); setError('');
    const result = await login(username, password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    const stored = localStorage.getItem('sijaga_user');
    if (stored) {
      const u = JSON.parse(stored);
      router.push(u.role === 'admin' ? '/dashboard-admin' : '/dashboard-petugas');
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* DESKTOP */}
      <div className="hidden md:flex md:w-1/2 relative flex-col bg-gradient-to-br from-mj-blue via-[#0d4a96] to-[#0a2d5e] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-white/8 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full border border-white/5 -translate-x-1/2 translate-y-1/2 pointer-events-none" />
        <div className="relative z-10 flex-1 flex flex-col">
          <SelectorContent role={role} onSelectRole={selectRole} />
        </div>
      </div>
      <div className="hidden md:flex md:w-1/2 relative flex-col overflow-hidden">
        {role ? (
          <FormContent
            role={role} username={username} onUsernameChange={setUsername}
            password={password} onPasswordChange={setPassword}
            showPass={showPass} onToggleShowPass={() => setShowPass(p => !p)}
            loading={loading} error={error} onLogin={handleLogin}
            onBack={backToSelect} onSwitchRole={() => selectRole(role === 'petugas' ? 'admin' : 'petugas')}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 px-12 text-center">
            <div className="w-20 h-20 bg-mj-blue/8 rounded-2xl flex items-center justify-center mb-5">
              <HardHat size={36} className="text-mj-blue/25" />
            </div>
            <p className="font-display font-bold text-mj-blue/30 text-xl uppercase tracking-wide mb-2">Pilih Role Dahulu</p>
            <p className="font-body text-mj-blue/25 text-sm">Klik Petugas atau Admin di panel kiri untuk melanjutkan.</p>
          </div>
        )}
      </div>

      {/* MOBILE */}
      <div className={`md:hidden w-full bg-gradient-to-br from-mj-blue via-[#0d4a96] to-[#0a2d5e] overflow-hidden ${mobileStep === 1 ? 'flex flex-col' : 'hidden'}`}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="relative z-10 flex-1 flex flex-col min-h-screen">
          <SelectorContent role={role} onSelectRole={selectRole} />
        </div>
      </div>
      <div className={`md:hidden w-full min-h-screen overflow-y-auto ${mobileStep === 2 && role ? 'flex flex-col' : 'hidden'}`}>
        {role && (
          <FormContent
            role={role} username={username} onUsernameChange={setUsername}
            password={password} onPasswordChange={setPassword}
            showPass={showPass} onToggleShowPass={() => setShowPass(p => !p)}
            loading={loading} error={error} onLogin={handleLogin}
            onBack={backToSelect} onSwitchRole={() => selectRole(role === 'petugas' ? 'admin' : 'petugas')}
          />
        )}
      </div>
    </div>
  );
}
