'use client';
import { useEffect, useState } from 'react';
import { MapPin, Activity, Users, ChevronDown } from 'lucide-react';

const TICKER_ITEMS = [
  '🗑️ Petugas Melati aktif beroperasi di 6 kelurahan',
  '🚛 Bestari beroperasi setiap hari pukul 06.00 – 14.00 WIB',
  '📍 Pemantauan lokasi real-time tersedia',
  '✅ Data terbarui setiap 5 menit',
  '🏙️ Melayani Kecamatan Medan Johor dengan sepenuh hati',
];

export default function Hero() {
  const [count, setCount] = useState({ petugas: 0, titik: 0, kelurahan: 0 });

  useEffect(() => {
    const targets = { petugas: 48, titik: 120, kelurahan: 6 };
    const duration = 1800;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount({
        petugas: Math.round(targets.petugas * ease),
        titik: Math.round(targets.titik * ease),
        kelurahan: Math.round(targets.kelurahan * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="beranda"
      className="relative min-h-screen flex flex-col overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-mj-blue via-[#0d4a96] to-[#0a2d5e] z-0" />

      {/* Geometric decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Large circle top right */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full border border-white/5" />
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full border border-white/5" />

        {/* Red accent shapes */}
        <div className="absolute top-1/4 right-12 w-3 h-40 bg-mj-red/40 rounded-full transform rotate-12" />
        <div className="absolute top-1/3 right-24 w-2 h-24 bg-white/20 rounded-full transform -rotate-6" />

        {/* Grid dots */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Bottom diagonal */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-mj-cream to-transparent" />
      </div>

      {/* Ticker bar */}
      <div className="relative z-10 bg-mj-red/90 backdrop-blur-sm mt-16 md:mt-20 py-2.5 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center text-white text-sm font-body font-medium mx-8">
              {item}
              <span className="mx-8 text-white/40">|</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main hero content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                </span>
                <span className="text-white/90 text-sm font-body font-semibold tracking-wide">
                  Sistem Aktif — Pemantauan Real-Time
                </span>
              </div>

              <h1 className="font-display font-black text-white leading-none mb-4">
                <span className="text-5xl sm:text-6xl lg:text-7xl block tracking-wide uppercase">
                  SIJAGA
                </span>
                <span className="text-5xl sm:text-6xl lg:text-7xl block tracking-wide uppercase text-mj-red">
                  JOHOR
                </span>
              </h1>

              <p className="font-display font-semibold text-white/80 text-xl sm:text-2xl uppercase tracking-widest mb-4">
                Sistem Informasi Jaga Kebersihan
              </p>

              <p className="font-body text-white/70 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                Platform pemantauan lokasi dan aktivitas petugas kebersihan{' '}
                <strong className="text-white">Melati</strong> dan{' '}
                <strong className="text-white">Bestari</strong> di seluruh wilayah
                Kecamatan Medan Johor secara real-time.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 bg-mj-red hover:bg-mj-red-dark text-white font-body font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-xl shadow-red-900/30 hover:shadow-red-900/50 hover:-translate-y-0.5"
                >
                  <Activity size={18} />
                  Pantau Sekarang
                </a>
                <a
                  href="#fitur"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-body font-bold px-8 py-4 rounded-xl transition-all duration-200"
                >
                  Pelajari Fitur
                  <ChevronDown size={18} />
                </a>
              </div>
            </div>

            {/* Right: Stats cards */}
            <div className="grid grid-cols-1 gap-4">
              {/* Main map card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 card-shine">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white/60 font-body text-sm font-medium mb-1">Peta Pemantauan</p>
                    <p className="text-white font-display font-bold text-lg uppercase tracking-wide">
                      Kecamatan Medan Johor
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-mj-red/20 rounded-xl flex items-center justify-center">
                    <MapPin className="text-mj-red" size={20} />
                  </div>
                </div>

                {/* Fake map preview */}
                <div className="relative bg-mj-blue-mid/30 rounded-xl h-36 overflow-hidden border border-white/10">
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
                      `,
                      backgroundSize: '24px 24px',
                    }}
                  />
                  {/* Fake location pins */}
                  {[
                    { top: '30%', left: '20%', color: 'bg-green-400' },
                    { top: '55%', left: '45%', color: 'bg-green-400' },
                    { top: '25%', left: '65%', color: 'bg-yellow-400' },
                    { top: '65%', left: '75%', color: 'bg-green-400' },
                    { top: '40%', left: '55%', color: 'bg-red-400' },
                  ].map((pin, i) => (
                    <div
                      key={i}
                      className={`absolute w-3 h-3 ${pin.color} rounded-full border-2 border-white shadow-lg pulse-ring`}
                      style={{ top: pin.top, left: pin.left }}
                    />
                  ))}
                  <div className="absolute bottom-2 right-2 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                    <span className="text-white text-xs font-body font-semibold">Live</span>
                  </div>
                </div>
              </div>

              {/* 3 stats mini cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center card-shine">
                  <div className="w-8 h-8 bg-blue-400/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Users size={16} className="text-blue-300" />
                  </div>
                  <p className="font-display font-black text-3xl text-white">{count.petugas}</p>
                  <p className="text-white/60 text-xs font-body mt-1">Petugas</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center card-shine">
                  <div className="w-8 h-8 bg-red-400/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <MapPin size={16} className="text-red-300" />
                  </div>
                  <p className="font-display font-black text-3xl text-white">{count.titik}</p>
                  <p className="text-white/60 text-xs font-body mt-1">Titik Pantau</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center card-shine">
                  <div className="w-8 h-8 bg-green-400/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Activity size={16} className="text-green-300" />
                  </div>
                  <p className="font-display font-black text-3xl text-white">{count.kelurahan}</p>
                  <p className="text-white/60 text-xs font-body mt-1">Kelurahan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="relative z-10">
        <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" className="w-full block">
          <path d="M0,80 L0,40 Q360,0 720,40 Q1080,80 1440,40 L1440,80 Z" fill="#F5F7FA" />
        </svg>
      </div>
    </section>
  );
}
