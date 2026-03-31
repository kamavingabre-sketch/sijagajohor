'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  LogOut, MapPin, Camera, Clock, CheckCircle, AlertTriangle,
  Loader2, Navigation, WifiOff, Upload, X, HardHat, Zap,
  ClipboardCheck, ImageIcon, Info, Image, PenLine, Trash2,
} from 'lucide-react';

interface AbsensiToday {
  id: string; jam_masuk: string | null; jam_keluar: string | null;
  foto_bukti_url: string | null; status: string;
}
interface Coords { lat: number; lng: number; acc: number; }
interface FotoKegiatan {
  id: string; url: string; deskripsi: string; uploaded_at: string;
}

export default function DashboardPetugas() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [absensi, setAbsensi] = useState<AbsensiToday | null>(null);
  const [loadingAbsensi, setLoadingAbsensi] = useState(true);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [gpsActive, setGpsActive] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [absenMasukLoading, setAbsenMasukLoading] = useState(false);
  const [absenKeluarLoading, setAbsenKeluarLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [time, setTime] = useState('');

  // Foto Kegiatan states
  const [fotoKegiatanList, setFotoKegiatanList] = useState<FotoKegiatan[]>([]);
  const [fotoKegiatanPreview, setFotoKegiatanPreview] = useState<string | null>(null);
  const [fotoKegiatanFile, setFotoKegiatanFile] = useState<File | null>(null);
  const [deskripsiKegiatan, setDeskripsiKegiatan] = useState('');
  const [uploadingKegiatan, setUploadingKegiatan] = useState(false);
  const [loadingKegiatan, setLoadingKegiatan] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const trackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileKegiatanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'petugas') { router.push('/dashboard-admin'); return; }
    fetchAbsensiHari();
    fetchFotoKegiatan();
  }, [user]);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAbsensiHari = async () => {
    if (!user) return;
    setLoadingAbsensi(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('absensi').select('*')
      .eq('petugas_id', user.id).eq('tanggal', today).single();
    setAbsensi(data || null);
    setLoadingAbsensi(false);
  };

  const fetchFotoKegiatan = async () => {
    if (!user) return;
    setLoadingKegiatan(true);
    const { data } = await supabase.from('foto_kegiatan').select('*')
      .eq('petugas_id', user.id)
      .order('uploaded_at', { ascending: false })
      .limit(20);
    setFotoKegiatanList(data || []);
    setLoadingKegiatan(false);
  };

  const startGPS = useCallback(() => {
    if (!navigator.geolocation) { setGpsError('Browser tidak mendukung GPS'); return; }
    setGpsError('');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy });
        setGpsActive(true); setGpsError('');
      },
      (err) => {
        setGpsActive(false);
        if (err.code === 1) setGpsError('Izin GPS ditolak.');
        else if (err.code === 2) setGpsError('Sinyal GPS tidak tersedia.');
        else setGpsError('GPS timeout. Pastikan GPS aktif.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  }, []);

  const stopGPS = useCallback(() => {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    setGpsActive(false); setTracking(false);
    if (trackIntervalRef.current) clearInterval(trackIntervalRef.current);
  }, []);

  const startTracking = useCallback(() => {
    if (!user || !coords) return;
    setTracking(true);
    const sendLoc = async () => {
      if (!coords) return;
      await supabase.from('lokasi_petugas').insert({ petugas_id: user.id, latitude: coords.lat, longitude: coords.lng, akurasi: coords.acc });
    };
    sendLoc();
    trackIntervalRef.current = setInterval(sendLoc, 30000);
  }, [user, coords]);

  useEffect(() => { startGPS(); return () => { stopGPS(); }; }, []);

  const handleAbsenMasuk = async () => {
    if (!user || !coords) { showToast('GPS harus aktif sebelum absen masuk!', 'err'); return; }
    setAbsenMasukLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('absensi').insert({
      petugas_id: user.id, tanggal: today, jam_masuk: new Date().toISOString(), status: 'hadir',
    }).select().single();
    if (error) { showToast('Gagal absen masuk: ' + error.message, 'err'); }
    else { setAbsensi(data); startTracking(); showToast('Absen masuk berhasil! GPS tracking dimulai.', 'ok'); }
    setAbsenMasukLoading(false);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Ukuran foto max 5MB', 'err'); return; }
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setFotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadFoto = async () => {
    if (!fotoFile || !absensi || !user) return;
    setUploadingFoto(true);
    try {
      const fileName = `${user.id}/${absensi.id}_${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage.from('foto-bukti').upload(fileName, fotoFile, { contentType: fotoFile.type, upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('foto-bukti').getPublicUrl(fileName);
      const fotoUrl = urlData.publicUrl;
      await supabase.from('foto_bukti').insert({ petugas_id: user.id, absensi_id: absensi.id, url: fotoUrl, latitude: coords?.lat, longitude: coords?.lng, keterangan: 'Bukti tugas kebersihan' });
      await supabase.from('absensi').update({ foto_bukti_url: fotoUrl }).eq('id', absensi.id);
      setAbsensi({ ...absensi, foto_bukti_url: fotoUrl });
      setFotoPreview(null); setFotoFile(null);
      showToast('Foto bukti berhasil dikirim!', 'ok');
    } catch (err: any) { showToast('Gagal upload foto: ' + err.message, 'err'); }
    setUploadingFoto(false);
  };

  const handleFotoKegiatanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('Ukuran foto max 10MB', 'err'); return; }
    setFotoKegiatanFile(file);
    const reader = new FileReader();
    reader.onload = ev => setFotoKegiatanPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadFotoKegiatan = async () => {
    if (!fotoKegiatanFile || !user) return;
    if (!deskripsiKegiatan.trim()) { showToast('Deskripsi kegiatan wajib diisi!', 'err'); return; }
    setUploadingKegiatan(true);
    try {
      const fileName = `kegiatan/${user.id}/${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage.from('foto-bukti').upload(fileName, fotoKegiatanFile, { contentType: fotoKegiatanFile.type, upsert: false });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('foto-bukti').getPublicUrl(fileName);
      const fotoUrl = urlData.publicUrl;
      const { error: insertErr } = await supabase.from('foto_kegiatan').insert({
        petugas_id: user.id, url: fotoUrl, deskripsi: deskripsiKegiatan.trim(),
      });
      if (insertErr) throw insertErr;
      setFotoKegiatanPreview(null); setFotoKegiatanFile(null); setDeskripsiKegiatan('');
      if (fileKegiatanRef.current) fileKegiatanRef.current.value = '';
      showToast('Foto kegiatan berhasil dikirim!', 'ok');
      fetchFotoKegiatan();
    } catch (err: any) { showToast('Gagal upload foto kegiatan: ' + err.message, 'err'); }
    setUploadingKegiatan(false);
  };

  const handleAbsenKeluar = async () => {
    if (!absensi) return;
    if (!absensi.foto_bukti_url) { showToast('Wajib upload foto bukti tugas sebelum absen keluar!', 'err'); return; }
    setAbsenKeluarLoading(true);
    const { data, error } = await supabase.from('absensi').update({ jam_keluar: new Date().toISOString() }).eq('id', absensi.id).select().single();
    if (error) { showToast('Gagal absen keluar: ' + error.message, 'err'); }
    else { setAbsensi(data); stopGPS(); showToast('Absen keluar berhasil! Terima kasih sudah bertugas.', 'ok'); }
    setAbsenKeluarLoading(false);
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };
  const formatUploadTime = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (!user) return null;

  const sudahMasuk = !!absensi?.jam_masuk;
  const sudahKeluar = !!absensi?.jam_keluar;
  const sudahFoto = !!absensi?.foto_bukti_url;

  return (
    <div className="min-h-screen bg-mj-cream">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl font-body text-sm font-semibold transition-all ${
          toast.type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-mj-red text-white'
        }`}>
          {toast.type === 'ok' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div className="bg-mj-blue shadow-xl shadow-blue-900/20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <HardHat className="text-white" size={20} />
            </div>
            <div>
              <p className="font-display font-black text-white text-sm uppercase tracking-wider">Portal Petugas</p>
              <p className="text-white/55 text-xs font-body">{user.nama}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="font-display font-bold text-white text-lg tracking-wider">{time}</p>
              <p className="text-white/45 text-xs font-body">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <button onClick={handleLogout} className="w-9 h-9 bg-white/10 hover:bg-mj-red rounded-xl flex items-center justify-center transition-colors">
              <LogOut size={16} className="text-white" />
            </button>
          </div>
        </div>
        <div className="bg-white/10 h-1">
          <div className={`h-full bg-mj-red transition-all duration-700 ${sudahKeluar ? 'w-full' : sudahFoto ? 'w-3/4' : sudahMasuk ? 'w-1/2' : 'w-1/4'}`} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* PROFIL CARD */}
        <div className="bg-mj-blue rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute bottom-0 right-4 text-white/5 text-8xl font-display font-black pointer-events-none">{user.unit.toUpperCase()}</div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-white/50 text-xs font-body font-semibold uppercase tracking-widest mb-1">Selamat Datang</p>
              <p className="font-display font-black text-2xl uppercase tracking-wide">{user.nama}</p>
              <p className="text-white/60 text-sm font-body mt-0.5">NIP: {user.nip}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  user.unit === 'melati' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-orange-500/20 text-orange-300'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />{user.unit}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-xs font-body text-white/70">
                  <MapPin size={10} /> {user.kelurahan}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* STATUS TUGAS */}
        <div className="bg-white rounded-2xl p-5 border border-blue-50 shadow-sm">
          <p className="font-display font-bold text-mj-blue text-sm uppercase tracking-wide mb-4">Status Tugas Hari Ini</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Absen Masuk', done: sudahMasuk, val: formatTime(absensi?.jam_masuk || null), icon: ClipboardCheck },
              { label: 'Foto Bukti', done: sudahFoto, val: sudahFoto ? 'Terkirim ✓' : 'Belum', icon: ImageIcon },
              { label: 'Absen Keluar', done: sudahKeluar, val: formatTime(absensi?.jam_keluar || null), icon: CheckCircle },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className={`rounded-xl p-3 border text-center transition-all ${s.done ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                  <Icon size={18} className={`mx-auto mb-1.5 ${s.done ? 'text-emerald-500' : 'text-gray-300'}`} />
                  <p className={`text-xs font-body font-semibold mb-0.5 ${s.done ? 'text-emerald-700' : 'text-gray-400'}`}>{s.label}</p>
                  <p className={`text-xs font-body ${s.done ? 'text-emerald-600' : 'text-gray-300'}`}>{s.val}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* GPS STATUS */}
        <div className={`rounded-2xl p-4 border flex items-center justify-between ${gpsActive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gpsActive ? 'bg-emerald-500' : 'bg-mj-red'}`}>
              {gpsActive ? <Navigation size={18} className="text-white" /> : <WifiOff size={18} className="text-white" />}
            </div>
            <div>
              <p className={`font-body font-bold text-sm ${gpsActive ? 'text-emerald-700' : 'text-red-700'}`}>
                {gpsActive ? 'GPS Aktif' : 'GPS Tidak Aktif'}
              </p>
              {gpsActive && coords && (
                <p className="text-emerald-600 text-xs font-body font-mono">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} ±{Math.round(coords.acc)}m</p>
              )}
              {gpsError && <p className="text-red-600 text-xs font-body">{gpsError}</p>}
            </div>
          </div>
          {!gpsActive && (
            <button onClick={startGPS} className="bg-mj-red text-white text-xs font-body font-bold px-3 py-2 rounded-lg hover:bg-mj-red-dark transition-colors">Aktifkan</button>
          )}
          {gpsActive && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-600 text-xs font-body font-semibold">Live</span>
            </div>
          )}
        </div>

        {/* ABSEN MASUK */}
        {!sudahMasuk && (
          <div className="bg-white rounded-2xl p-5 border border-blue-50 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-mj-blue/10 rounded-xl flex items-center justify-center shrink-0">
                <ClipboardCheck size={18} className="text-mj-blue" />
              </div>
              <div>
                <p className="font-display font-bold text-mj-blue uppercase tracking-wide">Absen Masuk</p>
                <p className="text-mj-blue/50 text-xs font-body mt-0.5">GPS harus aktif untuk absen masuk</p>
              </div>
            </div>
            <button onClick={handleAbsenMasuk} disabled={absenMasukLoading || !gpsActive}
              className="w-full flex items-center justify-center gap-2 bg-mj-blue hover:bg-mj-blue-mid text-white font-body font-bold py-4 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-900/15">
              {absenMasukLoading ? <><Loader2 size={17} className="animate-spin" /> Memproses...</> : <><Zap size={17} /> Absen Masuk Sekarang</>}
            </button>
            {!gpsActive && (
              <div className="flex items-center gap-2 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <Info size={13} className="text-amber-600 shrink-0" />
                <p className="text-amber-700 text-xs font-body">Aktifkan GPS terlebih dahulu untuk absen masuk</p>
              </div>
            )}
          </div>
        )}

        {/* UPLOAD FOTO BUKTI */}
        {sudahMasuk && !sudahKeluar && (
          <div className="bg-white rounded-2xl p-5 border border-blue-50 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                <Camera size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="font-display font-bold text-mj-blue uppercase tracking-wide">Foto Bukti Tugas</p>
                <p className="text-mj-blue/50 text-xs font-body mt-0.5">
                  {sudahFoto ? 'Foto bukti sudah dikirim ✓' : 'Wajib sebelum absen keluar'}
                </p>
              </div>
              {sudahFoto && <CheckCircle size={20} className="text-emerald-500 ml-auto shrink-0 mt-1" />}
            </div>
            {fotoPreview && (
              <div className="relative mb-3">
                <img src={fotoPreview} alt="preview" className="w-full h-48 object-cover rounded-xl border border-gray-100" />
                <button onClick={() => { setFotoPreview(null); setFotoFile(null); }} className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center">
                  <X size={13} className="text-white" />
                </button>
              </div>
            )}
            {sudahFoto && absensi?.foto_bukti_url && !fotoPreview && (
              <img src={absensi.foto_bukti_url} alt="bukti" className="w-full h-40 object-cover rounded-xl border border-emerald-100 mb-3" />
            )}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFotoChange} className="hidden" />
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-mj-blue text-mj-blue/60 hover:text-mj-blue font-body font-semibold text-sm py-3 rounded-xl transition-all">
                <Camera size={16} /> {sudahFoto ? 'Ganti Foto' : 'Ambil / Pilih Foto'}
              </button>
              {fotoFile && (
                <button onClick={handleUploadFoto} disabled={uploadingFoto}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-body font-bold text-sm py-3 rounded-xl transition-all disabled:opacity-60">
                  {uploadingFoto ? <><Loader2 size={15} className="animate-spin" /> Upload...</> : <><Upload size={15} /> Kirim Foto</>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ABSEN KELUAR */}
        {sudahMasuk && !sudahKeluar && (
          <div className={`bg-white rounded-2xl p-5 border shadow-sm ${sudahFoto ? 'border-blue-50' : 'border-red-100 bg-red-50/30'}`}>
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sudahFoto ? 'bg-mj-red/10' : 'bg-red-100'}`}>
                <CheckCircle size={18} className={sudahFoto ? 'text-mj-red' : 'text-red-300'} />
              </div>
              <div>
                <p className="font-display font-bold text-mj-blue uppercase tracking-wide">Absen Keluar</p>
                <p className="text-mj-blue/50 text-xs font-body mt-0.5">
                  {sudahFoto ? 'Foto bukti sudah ada, siap absen keluar' : 'Upload foto bukti dahulu'}
                </p>
              </div>
            </div>
            {!sudahFoto && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                <p className="text-amber-700 text-xs font-body font-medium">Wajib upload foto bukti tugas selesai sebelum absen keluar!</p>
              </div>
            )}
            <button onClick={handleAbsenKeluar} disabled={absenKeluarLoading || !sudahFoto}
              className="w-full flex items-center justify-center gap-2 bg-mj-red hover:bg-mj-red-dark text-white font-body font-bold py-4 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-red-900/15">
              {absenKeluarLoading ? <><Loader2 size={17} className="animate-spin" /> Memproses...</> : <><CheckCircle size={17} /> Absen Keluar</>}
            </button>
          </div>
        )}

        {/* SELESAI */}
        {sudahKeluar && (
          <div className="bg-emerald-600 rounded-2xl p-6 text-white text-center">
            <CheckCircle size={40} className="mx-auto mb-3 text-white" />
            <p className="font-display font-black text-xl uppercase tracking-wide mb-1">Tugas Selesai!</p>
            <p className="text-white/70 text-sm font-body mb-3">
              Masuk: {formatTime(absensi?.jam_masuk || null)} — Keluar: {formatTime(absensi?.jam_keluar || null)}
            </p>
            <p className="text-white/60 text-xs font-body">Terima kasih telah menjaga kebersihan Medan Johor hari ini. 🌿</p>
          </div>
        )}

        {loadingAbsensi && (
          <div className="flex justify-center py-8"><Loader2 size={28} className="animate-spin text-mj-blue/40" /></div>
        )}

        {/* ══ FOTO KEGIATAN HARIAN ══ */}
        <div className="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 p-5 border-b border-gray-50">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
              <Image size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="font-display font-bold text-mj-blue uppercase tracking-wide">Foto Kegiatan Harian</p>
              <p className="text-mj-blue/50 text-xs font-body mt-0.5">Dokumentasi kegiatan kerja dengan deskripsi</p>
            </div>
          </div>

          {/* Form upload */}
          <div className="p-5 space-y-3">
            {/* Preview */}
            {fotoKegiatanPreview && (
              <div className="relative">
                <img src={fotoKegiatanPreview} alt="preview kegiatan" className="w-full h-52 object-cover rounded-xl border border-gray-100" />
                <button onClick={() => { setFotoKegiatanPreview(null); setFotoKegiatanFile(null); if (fileKegiatanRef.current) fileKegiatanRef.current.value = ''; }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center">
                  <X size={13} className="text-white" />
                </button>
              </div>
            )}

            {/* File input trigger */}
            <input ref={fileKegiatanRef} type="file" accept="image/*" capture="environment" onChange={handleFotoKegiatanChange} className="hidden" />
            <button onClick={() => fileKegiatanRef.current?.click()}
              className={`w-full flex items-center justify-center gap-2 border-2 border-dashed font-body font-semibold text-sm py-3 rounded-xl transition-all ${
                fotoKegiatanPreview
                  ? 'border-violet-300 text-violet-600 hover:border-violet-500'
                  : 'border-gray-300 text-gray-500 hover:border-violet-400 hover:text-violet-600'
              }`}>
              <Camera size={16} /> {fotoKegiatanPreview ? 'Ganti Foto Kegiatan' : 'Ambil / Pilih Foto Kegiatan'}
            </button>

            {/* Deskripsi */}
            <div>
              <label className="block font-body font-semibold text-mj-blue text-xs mb-1.5 uppercase tracking-wide">
                <PenLine size={12} className="inline mr-1" /> Deskripsi Kegiatan
              </label>
              <textarea
                value={deskripsiKegiatan}
                onChange={e => setDeskripsiKegiatan(e.target.value)}
                placeholder="Contoh: Pembersihan selokan di Jl. Sei Sikambing, pengangkutan sampah organik dari 12 rumah..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-body text-sm text-mj-blue placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 resize-none transition-all"
              />
            </div>

            {/* Submit button */}
            <button
              onClick={handleUploadFotoKegiatan}
              disabled={uploadingKegiatan || !fotoKegiatanFile || !deskripsiKegiatan.trim()}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-body font-bold py-3.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-violet-900/15">
              {uploadingKegiatan ? <><Loader2 size={16} className="animate-spin" /> Mengirim...</> : <><Upload size={16} /> Kirim Foto Kegiatan</>}
            </button>
          </div>

          {/* List foto kegiatan */}
          {loadingKegiatan ? (
            <div className="flex justify-center py-6 px-5"><Loader2 size={22} className="animate-spin text-violet-400" /></div>
          ) : fotoKegiatanList.length === 0 ? (
            <div className="px-5 pb-5 text-center">
              <p className="text-gray-300 text-sm font-body">Belum ada foto kegiatan yang dikirim.</p>
            </div>
          ) : (
            <div className="px-5 pb-5 space-y-3">
              <p className="font-body font-semibold text-mj-blue/50 text-xs uppercase tracking-wide">Riwayat Foto Kegiatan</p>
              {fotoKegiatanList.map((foto) => (
                <div key={foto.id} className="flex gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <img src={foto.url} alt="kegiatan" className="w-20 h-20 object-cover rounded-lg shrink-0 border border-gray-200" />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-mj-blue text-sm leading-snug line-clamp-3">{foto.deskripsi}</p>
                    <p className="text-gray-400 text-xs font-body mt-1.5">{formatUploadTime(foto.uploaded_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
