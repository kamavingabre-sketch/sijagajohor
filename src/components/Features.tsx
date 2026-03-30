'use client';
import { MapPin, Clock, Bell, BarChart2, ShieldCheck, Smartphone } from 'lucide-react';

const features = [
  {
    icon: MapPin,
    title: 'Lokasi Real-Time',
    desc: 'Pantau posisi setiap petugas kebersihan secara langsung di peta interaktif. Update otomatis setiap 5 menit.',
    color: 'text-mj-red',
    bg: 'bg-red-50',
    border: 'border-red-100',
  },
  {
    icon: Clock,
    title: 'Riwayat Aktivitas',
    desc: 'Lacak jalur dan jadwal kerja petugas. Lihat rekam jejak pergerakan harian, mingguan, dan bulanan.',
    color: 'text-mj-blue',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: Bell,
    title: 'Notifikasi Instan',
    desc: 'Terima peringatan otomatis jika petugas keluar dari zona kerja atau belum check-in tepat waktu.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    icon: BarChart2,
    title: 'Laporan & Statistik',
    desc: 'Dashboard analitik lengkap untuk supervisor. Pantau kinerja tim kebersihan per kelurahan dan unit.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: ShieldCheck,
    title: 'Keamanan Data',
    desc: 'Data tersimpan aman menggunakan Supabase dengan enkripsi end-to-end. Hanya akses terotorisasi.',
    color: 'text-mj-blue-light',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: Smartphone,
    title: 'Ramah Mobile',
    desc: 'Petugas cukup menggunakan HP untuk check-in lokasi. Tidak perlu aplikasi khusus — semua lewat browser.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
];

export default function Features() {
  return (
    <section id="fitur" className="py-20 md:py-28 bg-mj-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-mj-blue/10 rounded-full px-4 py-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-mj-red"></div>
            <span className="text-mj-blue text-sm font-body font-semibold tracking-widest uppercase">
              Fitur Unggulan
            </span>
          </div>
          <h2 className="font-display font-black text-mj-blue text-4xl sm:text-5xl uppercase tracking-wide mb-4">
            Semua Yang Anda Butuhkan
          </h2>
          <p className="font-body text-mj-blue/60 text-lg max-w-2xl mx-auto">
            SIJAGA JOHOR dirancang khusus untuk kebutuhan pemantauan dan manajemen
            petugas kebersihan di lingkungan pemerintahan kecamatan.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className={`group relative bg-white rounded-2xl p-6 border ${f.border} hover:shadow-xl hover:shadow-blue-900/8 transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
              >
                {/* Decoration corner */}
                <div className={`absolute top-0 right-0 w-20 h-20 ${f.bg} rounded-bl-[4rem] opacity-60`} />

                <div className={`relative z-10 w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={f.color} size={22} />
                </div>

                <h3 className="relative z-10 font-display font-bold text-mj-blue text-xl uppercase tracking-wide mb-2">
                  {f.title}
                </h3>
                <p className="relative z-10 font-body text-mj-blue/60 text-sm leading-relaxed">
                  {f.desc}
                </p>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full ${f.bg} transition-all duration-500`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
