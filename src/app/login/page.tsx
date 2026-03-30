'use client';
import { useState } from 'react';
import { Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-mj-blue via-[#0d4a96] to-[#0a2d5e] flex items-center justify-center px-4">
      {/* Background dots */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white font-body text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Beranda
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-black/40">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-mj-blue rounded-2xl mb-4 relative">
              <span className="text-white font-display font-black text-2xl">SJ</span>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-mj-red rounded-sm"></div>
            </div>
            <h1 className="font-display font-black text-mj-blue text-2xl uppercase tracking-wide">
              SIJAGA JOHOR
            </h1>
            <p className="font-body text-mj-blue/50 text-sm mt-1">
              Masuk ke sistem pemantauan
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block font-body text-mj-blue font-semibold text-sm mb-2">
                Username / NIP
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mj-blue/40" />
                <input
                  type="text"
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl font-body text-sm text-mj-blue placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mj-blue/30 focus:border-mj-blue transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-body text-mj-blue font-semibold text-sm mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mj-blue/40" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl font-body text-sm text-mj-blue placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mj-blue/30 focus:border-mj-blue transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mj-blue/40 hover:text-mj-blue transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              className="w-full bg-mj-blue hover:bg-mj-blue-mid text-white font-body font-bold py-3.5 rounded-xl transition-all duration-200 mt-2 shadow-lg shadow-blue-900/20"
            >
              Masuk Sistem
            </button>

            <div className="relative flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-gray-400 text-xs font-body">atau</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <button
              type="button"
              className="w-full bg-mj-red hover:bg-mj-red-dark text-white font-body font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-red-900/20"
            >
              Masuk sebagai Petugas
            </button>
          </div>

          <p className="text-center font-body text-gray-400 text-xs mt-6">
            Lupa password? Hubungi admin kecamatan.
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-white/30 text-xs font-body mt-6">
          SIJAGA JOHOR — Kecamatan Medan Johor © 2025
        </p>
      </div>
    </div>
  );
}
