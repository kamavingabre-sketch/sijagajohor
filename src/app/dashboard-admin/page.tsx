'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  LogOut, Shield, Users, MapPin, Camera, ClipboardList, UserPlus,
  Eye, Clock, CheckCircle, XCircle, AlertTriangle, Loader2,
  Navigation, RefreshCw, X, Search, Filter, ChevronDown,
  Phone, Leaf, Truck, Calendar, Activity
} from 'lucide-react';

type Tab = 'peta' | 'absensi' | 'foto' | 'petugas';

interface Petugas {
  id: string; nama: string; nip: string; unit: string;
  kelurahan: string; nomor_hp: string; username: string;
  aktif: boolean; created_at: string;
}
interface Absensi {
  id: string; petugas_id: string; tanggal: string;
  jam_masuk: string | null; jam_keluar: string | null;
  foto_bukti_url: string | null; status: string;
  petugas: { nama: string; unit: string; kelurahan: string; nip: string };
}
interface LokasiFresh {
  petugas_id: string; latitude: number; longitude: number;
  akurasi: number; timestamp: string;
  petugas: { nama: string; unit: string; kelurahan: string };
}
interface FotoBukti {
  id: string; petugas_id: string; url: string; keterangan: string;
  latitude: number | null; longitude: number | null; uploaded_at: string;
  petugas: { nama: string; unit: string };
}

export default function DashboardAdmin() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('peta');
  const [petugasList, setPetugasList] = useState<Petugas[]>([]);
  const [absensiList, setAbsensiList] = useState<Absensi[]>([]);
  const [fotoList, setFotoList] = useState<FotoBukti[]>([]);
  const [lokasiList, setLokasiList] = useState<LokasiFresh[]>([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [loadingAbsensi, setLoadingAbsensi] = useState(false);
  const [loadingFoto, setLoadingFoto] = useState(false);
  const [loadingPetugas, setLoadingPetugas] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFoto, setSelectedFoto] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [time, setTime] = useState('');
  const [absensiDate, setAbsensiDate] = useState(new Date().toISOString().split('T')[0]);

  // Create account form
  const [form, setForm] = useState({
    nama: '', nip: '', unit: 'melati', kelurahan: 'Siti Rejo I',
    nomor_hp: '', username: '', password: '', role: 'petugas'
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Clock
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Auth guard
  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/dashboard-petugas'); return; }
  }, [user]);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load data based on tab
  useEffect(() => {
    if (tab === 'peta') fetchLokasi();
    if (tab === 'absensi') fetchAbsensi();
    if (tab === 'foto') fetchFoto();
    if (tab === 'petugas') fetchPetugas();
  }, [tab, absensiDate]);

  // Realtime subscription for lokasi
  useEffect(() => {
    const channel = supabase.channel('lokasi-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lokasi_petugas' },
        () => { if (tab === 'peta') fetchLokasi(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tab]);

  const fetchLokasi = async () => {
    setLoadingMap(true);
    const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('lokasi_petugas')
      .select('*, petugas(nama, unit, kelurahan)')
      .gte('timestamp', since)
      .order('timestamp', { ascending: false });

    // Keep only latest per petugas
    const latest = new Map<string, LokasiFresh>();
    (data || []).forEach((l: any) => {
      if (!latest.has(l.petugas_id)) latest.set(l.petugas_id, l);
    });
    setLokasiList(Array.from(latest.values()));
    setLoadingMap(false);
  };

  const fetchAbsensi = async () => {
    setLoadingAbsensi(true);
    const { data } = await supabase
      .from('absensi')
      .select('*, petugas(nama, unit, kelurahan, nip)')
      .eq('tanggal', absensiDate)
      .order('jam_masuk', { ascending: false });
    setAbsensiList(data || []);
    setLoadingAbsensi(false);
  };

  const fetchFoto = async () => {
    setLoadingFoto(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('foto_bukti')
      .select('*, petugas(nama, unit)')
      .gte('uploaded_at', today + 'T00:00:00')
      .order('uploaded_at', { ascending: false });
    setFotoList(data || []);
    setLoadingFoto(false);
  };

  const fetchPetugas = async () => {
    setLoadingPetugas(true);
    const { data } = await supabase.from('petugas').select('*').order('nama');
    setPetugasList(data || []);
    setLoadingPetugas(false);
  };

  const handleCreatePetugas = async () => {
    setCreateError('');
    if (!form.nama || !form.nip || !form.username || !form.password) {
      setCreateError('Semua field wajib diisi.'); return;
    }
    setCreating(true);
    const { error } = await supabase.from('petugas').insert({
      nama: form.nama, nip: form.nip, unit: form.unit,
      kelurahan: form.kelurahan, nomor_hp: form.nomor_hp,
      username: form.username, password_hash: form.password,
      role: form.role, aktif: true,
    });
    setCreating(false);
    if (error) { setCreateError('Gagal: ' + (error.message.includes('duplicate') ? 'Username/NIP sudah ada' : error.message)); return; }
    showToast('Akun petugas berhasil dibuat!', 'ok');
    setShowCreateForm(false);
    setForm({ nama: '', nip: '', unit: 'melati', kelurahan: 'Siti Rejo I', nomor_hp: '', username: '', password: '', role: 'petugas' });
    fetchPetugas();
  };

  const toggleAktifPetugas = async (id: string, aktif: boolean) => {
    await supabase.from('petugas').update({ aktif: !aktif }).eq('id', id);
    fetchPetugas();
    showToast(`Petugas ${!aktif ? 'diaktifkan' : 'dinonaktifkan'}`, 'ok');
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };
  const formatTimestamp = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

  const filteredAbsensi = absensiList.filter(a =>
    a.petugas?.nama?.toLowerCase().includes(search.toLowerCase()) ||
    a.petugas?.nip?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPetugas = petugasList.filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase()) ||
    p.nip.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: absensiList.length,
    hadir: absensiList.filter(a => a.jam_masuk).length,
    selesai: absensiList.filter(a => a.jam_keluar).length,
    foto: absensiList.filter(a => a.foto_bukti_url).length,
  };

  if (!user) return null;

  const kelurahanList = ['Siti Rejo I', 'Siti Rejo II', 'Siti Rejo III', 'Pangkalan Masyhur', 'Titi Kuning', 'Kwala Bekala'];

  return (
    <div className="min-h-screen bg-mj-cream">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl font-body text-sm font-semibold ${
          toast.type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-mj-red text-white'
        }`}>
          {toast.type === 'ok' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Foto Modal */}
      {selectedFoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedFoto(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedFoto(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white">
              <X size={24} />
            </button>
            <img src={selectedFoto} alt="Bukti" className="w-full rounded-2xl" />
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-mj-blue shadow-xl shadow-blue-900/20 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-mj-red rounded-xl flex items-center justify-center">
              <Shield className="text-white" size={17} />
            </div>
            <div>
              <p className="font-display font-black text-white text-sm uppercase tracking-wider">Admin Panel</p>
              <p className="text-white/45 text-xs font-body hidden sm:block">{user.nama}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-display font-bold text-white text-base tracking-wider hidden md:block">{time}</p>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-mj-red text-white text-xs font-body font-semibold px-3 py-2 rounded-xl transition-colors">
              <LogOut size={13} /> Keluar
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="max-w-6xl mx-auto px-4 flex gap-0 overflow-x-auto">
          {([
            { key: 'peta', label: 'Peta Live', icon: MapPin },
            { key: 'absensi', label: 'Absensi', icon: ClipboardList },
            { key: 'foto', label: 'Bukti Foto', icon: Camera },
            { key: 'petugas', label: 'Data Petugas', icon: Users },
          ] as { key: Tab; label: string; icon: any }[]).map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-body font-semibold whitespace-nowrap border-b-2 transition-all ${
                  active ? 'border-mj-red text-white bg-white/8' : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}>
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ══════ TAB: PETA LIVE ══════ */}
        {tab === 'peta' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-black text-mj-blue text-2xl uppercase tracking-wide">Lokasi Real-Time</h2>
                <p className="text-mj-blue/50 text-sm font-body">Update otomatis setiap 30 detik</p>
              </div>
              <button onClick={fetchLokasi} disabled={loadingMap}
                className="flex items-center gap-2 bg-mj-blue text-white text-xs font-body font-bold px-4 py-2.5 rounded-xl hover:bg-mj-blue-mid transition-colors">
                <RefreshCw size={13} className={loadingMap ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {/* Map area - embed Google Maps with markers */}
            <div className="bg-white rounded-2xl border border-blue-50 overflow-hidden shadow-sm">
              {lokasiList.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center text-center p-8">
                  {loadingMap ? (
                    <Loader2 size={32} className="animate-spin text-mj-blue/30 mb-3" />
                  ) : (
                    <>
                      <MapPin size={40} className="text-mj-blue/20 mb-3" />
                      <p className="font-display font-bold text-mj-blue/40 text-lg uppercase">Belum Ada Petugas Aktif</p>
                      <p className="text-mj-blue/30 text-sm font-body mt-1">Lokasi petugas akan muncul saat mereka mulai bertugas</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Embed map via iframe (OpenStreetMap) */}
                  <div className="relative h-80 bg-blue-50">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=98.60,3.52,98.75,3.62&layer=mapnik&marker=${lokasiList[0]?.latitude},${lokasiList[0]?.longitude}`}
                      className="w-full h-full border-0"
                      title="Peta Lokasi Petugas"
                    />
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs font-body font-semibold text-gray-700">{lokasiList.length} Petugas Live</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Petugas cards */}
            {lokasiList.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {lokasiList.map((l, i) => (
                  <div key={l.petugas_id} className="bg-white rounded-xl p-4 border border-blue-50 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${l.petugas?.unit === 'melati' ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                          {l.petugas?.unit === 'melati' ? <Leaf size={15} className="text-emerald-600" /> : <Truck size={15} className="text-orange-600" />}
                        </div>
                        <div>
                          <p className="font-body font-bold text-mj-blue text-sm">{l.petugas?.nama}</p>
                          <p className="text-mj-blue/40 text-xs">{l.petugas?.kelurahan}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-emerald-600 text-xs font-body font-semibold">Live</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs font-mono text-gray-500">
                      {l.latitude.toFixed(5)}, {l.longitude.toFixed(5)}
                    </div>
                    <p className="text-gray-400 text-xs font-body mt-1.5">
                      Update: {formatTimestamp(l.timestamp)}
                    </p>
                    <a href={`https://maps.google.com/?q=${l.latitude},${l.longitude}`} target="_blank" rel="noopener noreferrer"
                      className="mt-2 flex items-center justify-center gap-1.5 text-mj-blue text-xs font-body font-semibold bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors">
                      <Navigation size={11} /> Buka di Google Maps
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════ TAB: ABSENSI ══════ */}
        {tab === 'absensi' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-black text-mj-blue text-2xl uppercase tracking-wide">Data Absensi</h2>
                <p className="text-mj-blue/50 text-sm font-body">Rekap kehadiran petugas harian</p>
              </div>
              <input type="date" value={absensiDate} onChange={e => setAbsensiDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm text-mj-blue focus:outline-none focus:ring-2 focus:ring-mj-blue/20" />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total', val: stats.total, color: 'bg-blue-50 text-mj-blue' },
                { label: 'Hadir', val: stats.hadir, color: 'bg-emerald-50 text-emerald-700' },
                { label: 'Selesai', val: stats.selesai, color: 'bg-violet-50 text-violet-700' },
                { label: 'Foto ✓', val: stats.foto, color: 'bg-amber-50 text-amber-700' },
              ].map((s, i) => (
                <div key={i} className={`${s.color} rounded-xl p-3 text-center`}>
                  <p className="font-display font-black text-2xl">{s.val}</p>
                  <p className="text-xs font-body font-semibold opacity-70">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Cari nama atau NIP petugas..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20" />
            </div>

            {loadingAbsensi ? (
              <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-mj-blue/30" /></div>
            ) : filteredAbsensi.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-blue-50">
                <ClipboardList size={36} className="mx-auto text-mj-blue/20 mb-3" />
                <p className="font-display font-bold text-mj-blue/40 uppercase">Belum Ada Data Absensi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAbsensi.map(a => (
                  <div key={a.id} className="bg-white rounded-xl p-4 border border-blue-50 shadow-sm flex flex-wrap items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      a.petugas?.unit === 'melati' ? 'bg-emerald-100' : 'bg-orange-100'
                    }`}>
                      {a.petugas?.unit === 'melati'
                        ? <Leaf size={18} className="text-emerald-600" />
                        : <Truck size={18} className="text-orange-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-bold text-mj-blue text-sm truncate">{a.petugas?.nama}</p>
                      <p className="text-mj-blue/40 text-xs font-body">{a.petugas?.nip} · {a.petugas?.kelurahan}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-body">
                      <div className="text-center">
                        <p className="text-gray-400 mb-0.5">Masuk</p>
                        <p className={`font-bold ${a.jam_masuk ? 'text-emerald-600' : 'text-gray-300'}`}>{formatTime(a.jam_masuk)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 mb-0.5">Keluar</p>
                        <p className={`font-bold ${a.jam_keluar ? 'text-mj-blue' : 'text-gray-300'}`}>{formatTime(a.jam_keluar)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 mb-0.5">Foto</p>
                        {a.foto_bukti_url
                          ? <button onClick={() => setSelectedFoto(a.foto_bukti_url!)}><CheckCircle size={16} className="text-emerald-500 mx-auto" /></button>
                          : <XCircle size={16} className="text-gray-300 mx-auto" />
                        }
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      a.jam_keluar ? 'bg-emerald-100 text-emerald-700' :
                      a.jam_masuk ? 'bg-blue-100 text-mj-blue' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {a.jam_keluar ? 'Selesai' : a.jam_masuk ? 'Bertugas' : 'Belum Absen'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════ TAB: BUKTI FOTO ══════ */}
        {tab === 'foto' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-black text-mj-blue text-2xl uppercase tracking-wide">Bukti Foto Tugas</h2>
              <p className="text-mj-blue/50 text-sm font-body">Foto bukti yang dikirim petugas hari ini</p>
            </div>

            {loadingFoto ? (
              <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-mj-blue/30" /></div>
            ) : fotoList.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-blue-50">
                <Camera size={36} className="mx-auto text-mj-blue/20 mb-3" />
                <p className="font-display font-bold text-mj-blue/40 uppercase">Belum Ada Foto Hari Ini</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fotoList.map(f => (
                  <div key={f.id} className="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden group">
                    <div className="relative cursor-pointer" onClick={() => setSelectedFoto(f.url)}>
                      <img src={f.url} alt="bukti" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${f.petugas?.unit === 'melati' ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                          {f.petugas?.unit === 'melati' ? <Leaf size={12} className="text-emerald-600" /> : <Truck size={12} className="text-orange-600" />}
                        </div>
                        <p className="font-body font-bold text-mj-blue text-sm">{f.petugas?.nama}</p>
                      </div>
                      <p className="text-gray-400 text-xs font-body">{formatTimestamp(f.uploaded_at)}</p>
                      {f.latitude && (
                        <a href={`https://maps.google.com/?q=${f.latitude},${f.longitude}`} target="_blank" rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-1 text-mj-blue text-xs font-body hover:underline">
                          <MapPin size={10} /> Lihat Lokasi
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════ TAB: DATA PETUGAS ══════ */}
        {tab === 'petugas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-display font-black text-mj-blue text-2xl uppercase tracking-wide">Data Petugas</h2>
                <p className="text-mj-blue/50 text-sm font-body">{petugasList.length} petugas terdaftar</p>
              </div>
              <button onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 bg-mj-red hover:bg-mj-red-dark text-white font-body font-bold text-sm px-5 py-3 rounded-xl transition-colors shadow-md shadow-red-900/15">
                <UserPlus size={15} /> Tambah Petugas
              </button>
            </div>

            {/* Create form */}
            {showCreateForm && (
              <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <p className="font-display font-black text-mj-blue uppercase tracking-wide text-lg">Buat Akun Petugas Baru</p>
                  <button onClick={() => setShowCreateForm(false)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
                </div>
                {createError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
                    <AlertTriangle size={14} className="text-mj-red" />
                    <p className="text-red-700 text-sm font-body">{createError}</p>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Nama Lengkap', key: 'nama', type: 'text', placeholder: 'Budi Santoso' },
                    { label: 'NIP', key: 'nip', type: 'text', placeholder: '198501012010011001' },
                    { label: 'Nomor HP', key: 'nomor_hp', type: 'tel', placeholder: '0812xxxx' },
                    { label: 'Username (untuk login)', key: 'username', type: 'text', placeholder: 'budi.santoso' },
                    { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block font-body font-semibold text-mj-blue text-xs mb-1.5 uppercase tracking-wide">{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder}
                        value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20 text-mj-blue" />
                    </div>
                  ))}
                  <div>
                    <label className="block font-body font-semibold text-mj-blue text-xs mb-1.5 uppercase tracking-wide">Unit</label>
                    <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20 text-mj-blue">
                      <option value="melati">Melati</option>
                      <option value="bestari">Bestari</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-body font-semibold text-mj-blue text-xs mb-1.5 uppercase tracking-wide">Kelurahan</label>
                    <select value={form.kelurahan} onChange={e => setForm({ ...form, kelurahan: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20 text-mj-blue">
                      {kelurahanList.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-body font-semibold text-mj-blue text-xs mb-1.5 uppercase tracking-wide">Role</label>
                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20 text-mj-blue">
                      <option value="petugas">Petugas</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowCreateForm(false)}
                    className="flex-1 border border-gray-200 text-gray-500 font-body font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                    Batal
                  </button>
                  <button onClick={handleCreatePetugas} disabled={creating}
                    className="flex-1 flex items-center justify-center gap-2 bg-mj-red text-white font-body font-bold py-3 rounded-xl hover:bg-mj-red-dark transition-colors text-sm disabled:opacity-60">
                    {creating ? <><Loader2 size={15} className="animate-spin" /> Membuat...</> : <><UserPlus size={15} /> Buat Akun</>}
                  </button>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Cari nama atau NIP..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20" />
            </div>

            {loadingPetugas ? (
              <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-mj-blue/30" /></div>
            ) : (
              <div className="space-y-2">
                {filteredPetugas.map(p => (
                  <div key={p.id} className="bg-white rounded-xl p-4 border border-blue-50 shadow-sm flex flex-wrap items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      p.unit === 'melati' ? 'bg-emerald-100' : 'bg-orange-100'
                    }`}>
                      {p.unit === 'melati' ? <Leaf size={18} className="text-emerald-600" /> : <Truck size={18} className="text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-bold text-mj-blue text-sm">{p.nama}</p>
                      <p className="text-mj-blue/40 text-xs font-body">{p.nip} · @{p.username} · {p.kelurahan}</p>
                    </div>
                    {p.nomor_hp && (
                      <a href={`tel:${p.nomor_hp}`} className="flex items-center gap-1 text-xs text-mj-blue/50 hover:text-mj-blue font-body">
                        <Phone size={11} /> {p.nomor_hp}
                      </a>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                      p.unit === 'melati' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}>{p.unit}</span>
                    <button onClick={() => toggleAktifPetugas(p.id, p.aktif)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-body font-bold transition-colors ${
                        p.aktif ? 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                      }`}>
                      {p.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
