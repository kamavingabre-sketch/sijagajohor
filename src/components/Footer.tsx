'use client';
import { ArrowRight, Phone, Mail, MapPin, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <>
      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-mj-blue via-mj-blue-mid to-mj-blue-light">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-1 bg-mj-red" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display font-black text-white text-4xl sm:text-5xl uppercase tracking-wide mb-4">
            Siap Memulai?
          </h2>
          <p className="font-body text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Hubungi kami untuk informasi akses sistem dan pelatihan penggunaan SIJAGA JOHOR
            bagi petugas dan supervisor di lingkungan Kecamatan Medan Johor.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/login"
              className="inline-flex items-center gap-2 bg-mj-red hover:bg-mj-red-dark text-white font-body font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-xl shadow-black/20 hover:-translate-y-0.5"
            >
              Masuk Sistem
              <ArrowRight size={18} />
            </a>
            <a
              href="#kontak"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-body font-bold px-8 py-4 rounded-xl transition-all duration-200"
            >
              Hubungi Kami
            </a>
          </div>
        </div>
      </section>

      {/* Contact + Footer */}
      <footer id="kontak" className="bg-mj-blue py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10 pb-12 border-b border-white/10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
                    <span className="text-white font-display font-black text-lg">SJ</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-mj-red rounded-sm"></div>
                </div>
                <div>
                  <p className="text-white font-display font-black text-xl tracking-wider uppercase">
                    SIJAGA JOHOR
                  </p>
                  <p className="text-white/50 text-xs font-body">Medan Johor Bersih &amp; Rapi</p>
                </div>
              </div>
              <p className="font-body text-white/60 text-sm leading-relaxed">
                Sistem informasi pemantauan petugas kebersihan Kecamatan Medan Johor.
                Bagian dari program MEDAN UNTUK SEMUA.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-display font-bold text-white uppercase tracking-wide mb-4">
                Tautan
              </h4>
              <ul className="space-y-2">
                {['Beranda', 'Fitur Sistem', 'Unit Kebersihan', 'Masuk Sistem'].map((l) => (
                  <li key={l}>
                    <a href="#" className="font-body text-white/60 hover:text-white text-sm transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display font-bold text-white uppercase tracking-wide mb-4">
                Kontak
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin size={15} className="text-mj-red mt-0.5 shrink-0" />
                  <span className="font-body text-white/60 text-sm">
                    Jl. Karya Jaya No. 1, Medan Johor, Kota Medan, Sumatera Utara
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={15} className="text-mj-red shrink-0" />
                  <span className="font-body text-white/60 text-sm">(061) 7363xxx</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={15} className="text-mj-red shrink-0" />
                  <span className="font-body text-white/60 text-sm">johor@pemkomedan.go.id</span>
                </li>
                <li className="flex items-center gap-3">
                  <Globe size={15} className="text-mj-red shrink-0" />
                  <span className="font-body text-white/60 text-sm">medanuntuksemua.id</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-body text-white/40 text-sm text-center sm:text-left">
              © 2025 Kecamatan Medan Johor. Hak Cipta Dilindungi.
            </p>
            <div className="flex items-center gap-2">
              <span className="font-body text-white/30 text-xs">Bagian dari</span>
              <span className="font-display font-black text-mj-red text-sm tracking-widest uppercase">
                MEDAN UNTUK SEMUA
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
