'use client';
import { Truck, Leaf, CheckCircle } from 'lucide-react';

const units = [
  {
    name: 'MELATI',
    icon: Leaf,
    color: 'mj-blue',
    tagline: 'Gerobak Motor Kebersihan',
    desc: 'Unit petugas kebersihan dengan gerobak motor yang bertugas membersihkan dan mengangkut sampah dari gang-gang kecil, TPS liar, dan lingkungan permukiman di setiap kelurahan.',
    tugas: [
      'Pengangkutan sampah dari rumah ke TPS',
      'Penyapuan jalan lingkungan & gang kecil',
      'Pembersihan parit dan drainase ringan',
      'Pelaporan titik sampah liar',
    ],
    shift: '05.30 – 12.00 WIB',
    coverage: '6 Kelurahan',
  },
  {
    name: 'BESTARI',
    icon: Truck,
    color: 'mj-red',
    tagline: 'Armada Dump Truck Kebersihan',
    desc: 'Unit armada kendaraan besar yang bertugas mengangkut sampah dari TPS ke TPA, serta melakukan pembersihan jalan utama dan kawasan strategis di Kecamatan Medan Johor.',
    tugas: [
      'Pengangkutan sampah TPS ke TPA',
      'Penyapuan jalan arteri dan protokol',
      'Pembersihan pasca kegiatan/bencana',
      'Koordinasi dengan Dinas Kebersihan Kota',
    ],
    shift: '06.00 – 14.00 WIB',
    coverage: 'Seluruh Kecamatan',
  },
];

const kelurahan = [
  'Kwala Bekala',
  'Gedung Johor',
  'Kedai Durian',
  'Suka Maju',
  'Titi Kuning',
  'Pangkalan Mansyur',
];

export default function UnitSection() {
  return (
    <section id="unit" className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-mj-red/10 rounded-full px-4 py-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-mj-red"></div>
            <span className="text-mj-red text-sm font-body font-semibold tracking-widest uppercase">
              Unit Kebersihan
            </span>
          </div>
          <h2 className="font-display font-black text-mj-blue text-4xl sm:text-5xl uppercase tracking-wide mb-4">
            Dua Garda Terdepan
          </h2>
          <p className="font-body text-mj-blue/60 text-lg max-w-xl mx-auto">
            Kecamatan Medan Johor memiliki dua unit kebersihan yang bekerja bersama
            menjaga kebersihan dan keindahan kota.
          </p>
        </div>

        {/* Units grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {units.map((unit) => {
            const Icon = unit.icon;
            const isBlue = unit.color === 'mj-blue';
            return (
              <div
                key={unit.name}
                className={`relative rounded-3xl overflow-hidden ${
                  isBlue ? 'bg-mj-blue' : 'bg-mj-red'
                }`}
              >
                {/* Decoration */}
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full border border-white/10" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full border border-white/10" />
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                  }}
                />

                <div className="relative z-10 p-8">
                  {/* Unit badge */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center">
                      <Icon className="text-white" size={32} />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-body font-semibold uppercase tracking-widest mb-1">
                        {unit.tagline}
                      </p>
                      <h3 className="font-display font-black text-white text-4xl uppercase tracking-wider">
                        {unit.name}
                      </h3>
                    </div>
                  </div>

                  <p className="font-body text-white/75 text-sm leading-relaxed mb-6">
                    {unit.desc}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {unit.tugas.map((t, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle size={14} className="text-white/80 mt-0.5 shrink-0" />
                        <span className="font-body text-white/80 text-sm">{t}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-4">
                    <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-white/60 text-xs font-body mb-0.5">Jam Operasional</p>
                      <p className="text-white font-display font-bold text-sm">{unit.shift}</p>
                    </div>
                    <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-white/60 text-xs font-body mb-0.5">Cakupan</p>
                      <p className="text-white font-display font-bold text-sm">{unit.coverage}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Kelurahan list */}
        <div className="bg-mj-cream rounded-3xl p-8">
          <h3 className="font-display font-black text-mj-blue text-2xl uppercase tracking-wide text-center mb-6">
            Wilayah Kelurahan Yang Dilayani
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {kelurahan.map((kel, i) => (
              <div
                key={i}
                className="bg-white border border-blue-100 rounded-xl p-4 text-center hover:border-mj-blue hover:shadow-md transition-all duration-200"
              >
                <div className="w-8 h-8 bg-mj-blue/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="font-display font-black text-mj-blue text-sm">{i + 1}</span>
                </div>
                <p className="font-body font-semibold text-mj-blue text-xs leading-tight">{kel}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
