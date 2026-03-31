'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import {
  LogOut, Shield, Users, MapPin, Camera, ClipboardList, UserPlus,
  Eye, CheckCircle, XCircle, AlertTriangle, Loader2,
  Navigation, RefreshCw, X, Search, Phone, Leaf, Truck,
  Download, Image, Calendar, ChevronDown, BarChart2,
  BellRing, BellOff, Send, Edit2, Save, Filter, SlidersHorizontal,
} from 'lucide-react';

// Dynamic import untuk MapPetugas (no SSR — Leaflet butuh window)
const MapPetugas = dynamic(() => import('@/components/admin/MapPetugas'), { ssr: false, loading: () => (
  <div className="h-96 flex items-center justify-center bg-blue-50 rounded-xl">
    <Loader2 size={28} className="animate-spin text-mj-blue/30" />
  </div>
)});

type Tab = 'peta' | 'absensi' | 'foto' | 'galeri' | 'petugas' | 'alert';

interface Petugas {
  id: string; nama: string; unit: string;
  kelurahan: string; nomor_hp: string; username: string;
  aktif: boolean; created_at: string; role: string;
}
interface Absensi {
  id: string; petugas_id: string; tanggal: string;
  jam_masuk: string | null; jam_keluar: string | null;
  foto_bukti_url: string | null; status: string;
  petugas: { nama: string; unit: string; kelurahan: string };
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
interface FotoKegiatan {
  id: string; petugas_id: string; url: string; deskripsi: string; uploaded_at: string;
  petugas: { nama: string; unit: string; kelurahan: string };
}

function exportToExcel(rows: Record<string, string>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: string) => String(v || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#1e3a5f" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF" ss:Bold="1"/></Style>
 </Styles>
 <Worksheet ss:Name="Data">
  <Table>
   <Row>${headers.map(h => `<Cell ss:StyleID="h"><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('')}</Row>
   ${rows.map(r => `<Row>${headers.map(h => `<Cell><Data ss:Type="String">${esc(r[h])}</Data></Cell>`).join('')}</Row>`).join('\n')}
  </Table>
 </Worksheet>
</Workbook>`;
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename + '.xls'; a.click();
  URL.revokeObjectURL(url);
}

const kelurahanList = ['Kwala Bekala', 'Gedung Johor', 'Kedai Durian', 'Suka Maju', 'Titi Kuning', 'Pangkalan Mansyur'];

export default function DashboardAdmin() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('peta');
  const [petugasList, setPetugasList] = useState<Petugas[]>([]);
  const [absensiList, setAbsensiList] = useState<Absensi[]>([]);
  const [fotoList, setFotoList] = useState<FotoBukti[]>([]);
  const [fotoKegiatanList, setFotoKegiatanList] = useState<FotoKegiatan[]>([]);
  const [lokasiList, setLokasiList] = useState<LokasiFresh[]>([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [loadingAbsensi, setLoadingAbsensi] = useState(false);
  const [loadingFoto, setLoadingFoto] = useState(false);
  const [loadingGaleri, setLoadingGaleri] = useState(false);
  const [loadingPetugas, setLoadingPetugas] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFoto, setSelectedFoto] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [time, setTime] = useState('');

  const [absensiMode, setAbsensiMode] = useState<'harian' | 'bulanan'>('harian');
  const [absensiDate, setAbsensiDate] = useState(new Date().toISOString().split('T')[0]);
  const [absensiMonth, setAbsensiMonth] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });

  // Filter states
  const [filterUnit, setFilterUnit] = useState('');
  const [filterKelurahan, setFilterKelurahan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAktif, setFilterAktif] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  // Create form
  const [form, setForm] = useState({ nama:'', unit:'melati', kelurahan:'Kwala Bekala', nomor_hp:'', username:'', password:'', role:'petugas' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit state
  const [editingPetugas, setEditingPetugas] = useState<Petugas | null>(null);
  const [editForm, setEditForm] = useState({ nama:'', unit:'melati', kelurahan:'Kwala Bekala', nomor_hp:'', username:'', password:'', role:'petugas' });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Alert state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTarget, setAlertTarget] = useState<'personal' | 'mass'>('personal');
  const [alertTargetId, setAlertTargetId] = useState('');
  const [alertDeskripsi, setAlertDeskripsi] = useState('');
  const [alertJudul, setAlertJudul] = useState('');
  const [sendingAlert, setSendingAlert] = useState(false);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' }));
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/dashboard-petugas'); return; }
  }, [user]);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  const resetFilters = () => {
    setSearch(''); setFilterUnit(''); setFilterKelurahan('');
    setFilterStatus(''); setFilterAktif(''); setShowFilter(false);
  };

  useEffect(() => {
    if (tab === 'peta') fetchLokasi();
    if (tab === 'absensi') fetchAbsensi();
    if (tab === 'foto') fetchFoto();
    if (tab === 'galeri') fetchFotoKegiatan();
    if (tab === 'petugas') fetchPetugas();
    resetFilters();
  }, [tab, absensiDate, absensiMonth, absensiMode]);

  useEffect(() => {
    const channel = supabase.channel('lokasi-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lokasi_petugas' }, () => { if (tab === 'peta') fetchLokasi(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tab]);

  const fetchLokasi = async () => {
    setLoadingMap(true);
    const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase.from('lokasi_petugas').select('*, petugas(nama, unit, kelurahan)').gte('timestamp', since).order('timestamp', { ascending: false });
    const latest = new Map<string, LokasiFresh>();
    (data || []).forEach((l: any) => { if (!latest.has(l.petugas_id)) latest.set(l.petugas_id, l); });
    setLokasiList(Array.from(latest.values())); setLoadingMap(false);
  };

  const fetchAbsensi = async () => {
    setLoadingAbsensi(true);
    let query = supabase.from('absensi').select('*, petugas(nama, unit, kelurahan)').order('tanggal', { ascending: false }).order('jam_masuk', { ascending: false });
    if (absensiMode === 'harian') { query = query.eq('tanggal', absensiDate); }
    else {
      const [y, m] = absensiMonth.split('-');
      const from = `${y}-${m}-01`;
      const lastDay = new Date(Number(y), Number(m), 0).getDate();
      query = query.gte('tanggal', from).lte('tanggal', `${y}-${m}-${String(lastDay).padStart(2,'0')}`);
    }
    const { data } = await query;
    setAbsensiList(data || []); setLoadingAbsensi(false);
  };

  const fetchFoto = async () => {
    setLoadingFoto(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('foto_bukti').select('*, petugas(nama, unit)').gte('uploaded_at', today + 'T00:00:00').order('uploaded_at', { ascending: false });
    setFotoList(data || []); setLoadingFoto(false);
  };

  const fetchFotoKegiatan = async () => {
    setLoadingGaleri(true);
    const { data } = await supabase.from('foto_kegiatan').select('*, petugas(nama, unit, kelurahan)').order('uploaded_at', { ascending: false }).limit(60);
    setFotoKegiatanList(data || []); setLoadingGaleri(false);
  };

  const fetchPetugas = async () => {
    setLoadingPetugas(true);
    const { data } = await supabase.from('petugas').select('*').order('nama');
    setPetugasList(data || []); setLoadingPetugas(false);
  };

  const handleCreatePetugas = async () => {
    setCreateError('');
    if (!form.nama || !form.username || !form.password) { setCreateError('Nama, username, dan password wajib diisi.'); return; }
    setCreating(true);
    const { error } = await supabase.from('petugas').insert({ nama: form.nama, unit: form.unit, kelurahan: form.kelurahan, nomor_hp: form.nomor_hp, username: form.username, password_hash: form.password, role: form.role, aktif: true });
    setCreating(false);
    if (error) { setCreateError('Gagal: ' + (error.message.includes('duplicate') ? 'Username sudah ada' : error.message)); return; }
    showToast('Akun petugas berhasil dibuat!', 'ok');
    setShowCreateForm(false);
    setForm({ nama:'', unit:'melati', kelurahan:'Kwala Bekala', nomor_hp:'', username:'', password:'', role:'petugas' });
    fetchPetugas();
  };

  const openEdit = (p: Petugas) => {
    setEditingPetugas(p);
    setEditForm({ nama: p.nama, unit: p.unit, kelurahan: p.kelurahan, nomor_hp: p.nomor_hp || '', username: p.username, password: '', role: p.role || 'petugas' });
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editingPetugas) return;
    setEditError('');
    if (!editForm.nama || !editForm.username) { setEditError('Nama dan username wajib diisi.'); return; }
    setSaving(true);
    const updateData: any = { nama: editForm.nama, unit: editForm.unit, kelurahan: editForm.kelurahan, nomor_hp: editForm.nomor_hp, username: editForm.username, role: editForm.role };
    if (editForm.password.trim()) updateData.password_hash = editForm.password.trim();
    const { error } = await supabase.from('petugas').update(updateData).eq('id', editingPetugas.id);
    setSaving(false);
    if (error) { setEditError('Gagal: ' + (error.message.includes('duplicate') ? 'Username sudah digunakan' : error.message)); return; }
    showToast('Data akun berhasil diperbarui!', 'ok');
    setEditingPetugas(null); fetchPetugas();
  };

  const toggleAktifPetugas = async (id: string, aktif: boolean) => {
    await supabase.from('petugas').update({ aktif: !aktif }).eq('id', id);
    fetchPetugas(); showToast(`Petugas ${!aktif ? 'diaktifkan' : 'dinonaktifkan'}`, 'ok');
  };

  const handleSendAlert = async () => {
    if (!alertDeskripsi.trim()) { showToast('Deskripsi alert wajib diisi!', 'err'); return; }
    if (alertTarget === 'personal' && !alertTargetId) { showToast('Pilih petugas yang akan di-alert!', 'err'); return; }
    setSendingAlert(true);
    const { error } = await supabase.from('alerts').insert({ admin_id: user!.id, judul: alertJudul.trim() || 'Alert dari Admin', deskripsi: alertDeskripsi.trim(), target_type: alertTarget, target_petugas_id: alertTarget === 'personal' ? alertTargetId : null, dibaca: false });
    setSendingAlert(false);
    if (error) { showToast('Gagal mengirim alert: ' + error.message, 'err'); return; }
    showToast(alertTarget === 'mass' ? 'Mass alert berhasil dikirim!' : 'Alert berhasil dikirim!', 'ok');
    setShowAlertModal(false); setAlertDeskripsi(''); setAlertJudul(''); setAlertTargetId(''); setAlertTarget('personal');
  };

  const handleLogout = () => { logout(); router.push('/login'); };
  const formatTime = (iso: string | null) => !iso ? '—' : new Date(iso).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
  const formatTimestamp = (iso: string) => new Date(iso).toLocaleString('id-ID', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
  const calcDurasi = (masuk: string|null, keluar: string|null) => {
    if (!masuk || !keluar) return '—';
    const diff = (new Date(keluar).getTime() - new Date(masuk).getTime()) / 60000;
    return `${Math.floor(diff/60) > 0 ? Math.floor(diff/60)+'j ' : ''}${Math.round(diff%60)}m`;
  };

  // Filtered data
  const filteredAbsensi = absensiList.filter(a => {
    const s = search.toLowerCase();
    return (!search || a.petugas?.nama?.toLowerCase().includes(s))
      && (!filterUnit || a.petugas?.unit === filterUnit)
      && (!filterKelurahan || a.petugas?.kelurahan === filterKelurahan)
      && (!filterStatus || (filterStatus==='selesai'&&a.jam_keluar)||(filterStatus==='bertugas'&&a.jam_masuk&&!a.jam_keluar)||(filterStatus==='belum'&&!a.jam_masuk));
  });

  const filteredPetugas = petugasList.filter(p => {
    const s = search.toLowerCase();
    return (!search || p.nama.toLowerCase().includes(s) || p.username.toLowerCase().includes(s) || p.kelurahan?.toLowerCase().includes(s) || p.nomor_hp?.includes(s))
      && (!filterUnit || p.unit === filterUnit)
      && (!filterKelurahan || p.kelurahan === filterKelurahan)
      && (!filterAktif || (filterAktif==='aktif'?p.aktif:!p.aktif));
  });

  const filteredFoto = fotoList.filter(f => (!search || f.petugas?.nama?.toLowerCase().includes(search.toLowerCase())) && (!filterUnit || f.petugas?.unit === filterUnit));
  const filteredGaleri = fotoKegiatanList.filter(f => {
    const s = search.toLowerCase();
    return (!search || f.petugas?.nama?.toLowerCase().includes(s) || f.deskripsi?.toLowerCase().includes(s))
      && (!filterUnit || f.petugas?.unit === filterUnit)
      && (!filterKelurahan || f.petugas?.kelurahan === filterKelurahan);
  });
  const filteredLokasi = lokasiList.filter(l => (!search || l.petugas?.nama?.toLowerCase().includes(search.toLowerCase())) && (!filterUnit || l.petugas?.unit === filterUnit));

  const activeFilterCount = [filterUnit, filterKelurahan, filterStatus, filterAktif].filter(Boolean).length;

  const handleExportExcel = () => {
    if (filteredAbsensi.length === 0) { showToast('Tidak ada data untuk diekspor', 'err'); return; }
    const rows = filteredAbsensi.map(a => ({ 'Tanggal': a.tanggal||'', 'Nama': a.petugas?.nama||'', 'Unit': a.petugas?.unit||'', 'Kelurahan': a.petugas?.kelurahan||'', 'Jam Masuk': formatTime(a.jam_masuk), 'Jam Keluar': formatTime(a.jam_keluar), 'Durasi': calcDurasi(a.jam_masuk, a.jam_keluar), 'Foto': a.foto_bukti_url?'Ya':'Tidak', 'Status': a.jam_keluar?'Selesai':a.jam_masuk?'Bertugas':'Belum Absen' }));
    exportToExcel(rows, `Absensi-SijagaJohor-${absensiMode==='harian'?absensiDate:absensiMonth}`);
    showToast('Data berhasil diekspor!', 'ok');
  };

  if (!user) return null;

  // ── Reusable search+filter bar component ──
  const SearchFilterBar = ({ showStatusFilter = false, showAktifFilter = false, placeholder = 'Cari...' }: { showStatusFilter?: boolean; showAktifFilter?: boolean; placeholder?: string }) => (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder={placeholder} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-3 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={14} /></button>}
        </div>
        <button onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-body font-semibold transition-all ${showFilter || activeFilterCount > 0 ? 'border-mj-blue bg-blue-50 text-mj-blue' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && <span className="bg-mj-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{activeFilterCount}</span>}
        </button>
      </div>

      {showFilter && (
        <div className="bg-white border border-blue-100 rounded-xl p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-body font-semibold text-mj-blue/60 uppercase tracking-wide mb-1.5">Unit</label>
            <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 font-body text-sm text-mj-blue focus:outline-none focus:ring-2 focus:ring-mj-blue/20">
              <option value="">Semua Unit</option>
              <option value="melati">Melati</option>
              <option value="bestari">Bestari</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-body font-semibold text-mj-blue/60 uppercase tracking-wide mb-1.5">Kelurahan</label>
            <select value={filterKelurahan} onChange={e => setFilterKelurahan(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 font-body text-sm text-mj-blue focus:outline-none focus:ring-2 focus:ring-mj-blue/20">
              <option value="">Semua Kelurahan</option>
              {kelurahanList.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          {showStatusFilter && (
            <div>
              <label className="block text-xs font-body font-semibold text-mj-blue/60 uppercase tracking-wide mb-1.5">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 font-body text-sm text-mj-blue focus:outline-none focus:ring-2 focus:ring-mj-blue/20">
                <option value="">Semua Status</option>
                <option value="selesai">Selesai</option>
                <option value="bertugas">Sedang Bertugas</option>
                <option value="belum">Belum Absen</option>
              </select>
            </div>
          )}
          {showAktifFilter && (
            <div>
              <label className="block text-xs font-body font-semibold text-mj-blue/60 uppercase tracking-wide mb-1.5">Status Akun</label>
              <select value={filterAktif} onChange={e => setFilterAktif(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 font-body text-sm text-mj-blue focus:outline-none focus:ring-2 focus:ring-mj-blue/20">
                <option value="">Semua</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button onClick={() => { setFilterUnit(''); setFilterKelurahan(''); setFilterStatus(''); setFilterAktif(''); }}
              className="w-full border border-gray-200 text-gray-500 font-body font-semibold py-2 rounded-lg hover:bg-gray-50 text-sm transition-colors">
              Reset Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-mj-cream">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl font-body text-sm font-semibold ${toast.type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-mj-red text-white'}`}>
          {toast.type === 'ok' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {toast.msg}
        </div>
      )}

      {/* ══ EDIT MODAL ══ */}
      {editingPetugas && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-mj-blue rounded-xl flex items-center justify-center">
                  <Edit2 size={17} className="text-white" />
                </div>
                <div>
                  <p className="font-display font-black text-mj-blue text-base uppercase tracking-wide">Edit Akun Petugas</p>
                  <p className="text-mj-blue/40 text-xs font-body">@{editingPetugas.username}</p>
                </div>
              </div>
              <button onClick={() => setEditingPetugas(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {editError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <AlertTriangle size={14} className="text-mj-red" />
                  <p className="text-red-700 text-sm font-body">{editError}</p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Nama Lengkap', key: 'nama', type: 'text', placeholder: 'Budi Santoso' },
                  { label: 'Nomor HP', key: 'nomor_hp', type: 'tel', placeholder: '0812xxxx' },
                  { label: 'Username (login)', key: 'username', type: 'text', placeholder: 'budi.santoso' },
                  { label: 'Password Baru (kosongkan jika tidak ingin ganti)', key: 'password', type: 'password', placeholder: '••••••••' },
                ].map(f => (
                  <div key={f.key} className={f.key === 'password' ? 'sm:col-span-2' : ''}>
                    <label className="block font-body font-semibold text-mj-blue text-xs mb-1.5 uppercase tracking-wide">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={(editForm as any)[f.key]} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20 text-mj-blue" />
                  </div>
                ))}
                <div>
                  <label className="block font-body font-semibold text-mj-blue text-xs mb-1.5 uppercase tracking-wide">Unit</label>
                  <select value={editForm.unit} onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20 text-mj-blue">
                    <option value="melati">Melati</option><option value="bestari">Bestari</option>
                  </select>
                </div>
                <div>
                  <label className="block font-body font-semibold text-mj-blue text-xs mb-1.5 uppercase tracking-wide">Kelurahan</label>
                  <select value={editForm.kelurahan} onChange={e => setEditForm({ ...editForm, kelurahan: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20 text-mj-blue">
                    {kelurahanList.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-body font-semibold text-mj-blue text-xs mb-1.5 uppercase tracking-wide">Role</label>
                  <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20 text-mj-blue">
                    <option value="petugas">Petugas</option><option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setEditingPetugas(null)} className="flex-1 border border-gray-200 text-gray-500 font-body font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">Batal</button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-mj-blue text-white font-body font-bold py-3 rounded-xl hover:bg-mj-blue-mid transition-colors text-sm disabled:opacity-60">
                {saving ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</> : <><Save size={15} /> Simpan Perubahan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ALERT MODAL ══ */}
      {showAlertModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-mj-red rounded-xl flex items-center justify-center"><BellRing size={18} className="text-white" /></div>
                <div>
                  <p className="font-display font-black text-mj-blue text-base uppercase tracking-wide">Alert Petugas</p>
                  <p className="text-mj-blue/40 text-xs font-body">Kirim notifikasi darurat ke petugas</p>
                </div>
              </div>
              <button onClick={() => setShowAlertModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block font-body font-semibold text-mj-blue text-xs mb-2 uppercase tracking-wide">Jenis Alert</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setAlertTarget('personal')} className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-body font-semibold transition-all ${alertTarget==='personal'?'border-mj-blue bg-blue-50 text-mj-blue':'border-gray-200 text-gray-400 hover:border-gray-300'}`}><Users size={15} /> Petugas Tertentu</button>
                  <button onClick={() => { setAlertTarget('mass'); setAlertTargetId(''); }} className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-body font-semibold transition-all ${alertTarget==='mass'?'border-mj-red bg-red-50 text-mj-red':'border-gray-200 text-gray-400 hover:border-gray-300'}`}><BellRing size={15} /> Mass Alert</button>
                </div>
                {alertTarget === 'mass' && <p className="mt-2 text-xs text-mj-red/70 font-body bg-red-50 rounded-lg px-3 py-2">⚠️ Semua petugas aktif (kecuali admin) akan menerima notifikasi ini.</p>}
              </div>
              {alertTarget === 'personal' && (
                <div>
                  <label className="block font-body font-semibold text-mj-blue text-xs mb-2 uppercase tracking-wide">Pilih Petugas</label>
                  <select value={alertTargetId} onChange={e => setAlertTargetId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm text-mj-blue focus:outline-none focus:ring-2 focus:ring-mj-blue/20">
                    <option value="">— Pilih petugas —</option>
                    {petugasList.filter(p => p.aktif && p.id !== user!.id).map(p => <option key={p.id} value={p.id}>{p.nama} ({p.unit} · {p.kelurahan})</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block font-body font-semibold text-mj-blue text-xs mb-2 uppercase tracking-wide">Judul Alert</label>
                <input type="text" value={alertJudul} onChange={e => setAlertJudul(e.target.value)} placeholder="Contoh: Perintah Segera..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm text-mj-blue focus:outline-none focus:ring-2 focus:ring-mj-blue/20" />
              </div>
              <div>
                <label className="block font-body font-semibold text-mj-blue text-xs mb-2 uppercase tracking-wide">Deskripsi / Pesan</label>
                <textarea value={alertDeskripsi} onChange={e => setAlertDeskripsi(e.target.value)} placeholder="Tuliskan instruksi atau alasan alert di sini..." rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm text-mj-blue focus:outline-none focus:ring-2 focus:ring-mj-blue/20 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setShowAlertModal(false)} className="flex-1 border border-gray-200 text-gray-500 font-body font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">Batal</button>
              <button onClick={handleSendAlert} disabled={sendingAlert} className="flex-1 flex items-center justify-center gap-2 bg-mj-red text-white font-body font-bold py-3 rounded-xl hover:bg-mj-red-dark transition-colors text-sm disabled:opacity-60">
                {sendingAlert ? <><Loader2 size={15} className="animate-spin" /> Mengirim...</> : <><Send size={15} /> Kirim Alert</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Foto Modal */}
      {selectedFoto && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedFoto(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedFoto(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white"><X size={24} /></button>
            <img src={selectedFoto} alt="Bukti" className="w-full rounded-2xl" />
          </div>
        </div>
      )}

      {/* HEADER — z-40 supaya lebih tinggi dari Leaflet (z-index: 0) */}
      <div className="bg-mj-blue shadow-xl shadow-blue-900/20 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-mj-red rounded-xl flex items-center justify-center"><Shield className="text-white" size={17} /></div>
            <div>
              <p className="font-display font-black text-white text-sm uppercase tracking-wider">Admin Panel</p>
              <p className="text-white/45 text-xs font-body hidden sm:block">{user.nama}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-display font-bold text-white text-base tracking-wider hidden md:block">{time}</p>
            <button onClick={() => { setShowAlertModal(true); fetchPetugas(); }} className="flex items-center gap-1.5 bg-mj-red hover:bg-mj-red-dark text-white text-xs font-body font-semibold px-3 py-2 rounded-xl transition-colors">
              <BellRing size={13} /> Alert Petugas
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 bg-white/10 hover:bg-mj-red text-white text-xs font-body font-semibold px-3 py-2 rounded-xl transition-colors">
              <LogOut size={13} /> Keluar
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 flex gap-0 overflow-x-auto">
          {([
            { key: 'peta', label: 'Peta Live', icon: MapPin },
            { key: 'absensi', label: 'Absensi', icon: ClipboardList },
            { key: 'foto', label: 'Bukti Foto', icon: Camera },
            { key: 'galeri', label: 'Galeri Kegiatan', icon: Image },
            { key: 'petugas', label: 'Data Petugas', icon: Users },
          ] as { key: Tab; label: string; icon: any }[]).map(t => {
            const Icon = t.icon; const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-body font-semibold whitespace-nowrap border-b-2 transition-all ${active ? 'border-mj-red text-white bg-white/8' : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'}`}>
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ══ TAB: PETA LIVE ══ */}
        {tab === 'peta' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-black text-mj-blue text-2xl uppercase tracking-wide">Lokasi Real-Time</h2>
                <p className="text-mj-blue/50 text-sm font-body">Update otomatis setiap 30 detik · Hover/klik pin untuk detail</p>
              </div>
              <button onClick={fetchLokasi} disabled={loadingMap} className="flex items-center gap-2 bg-mj-blue text-white text-xs font-body font-bold px-4 py-2.5 rounded-xl hover:bg-mj-blue-mid transition-colors">
                <RefreshCw size={13} className={loadingMap ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {/* MAP — isolation:isolate mencegah Leaflet z-index bleed ke header */}
            <div className="bg-white rounded-2xl border border-blue-50 overflow-hidden shadow-sm" style={{ isolation: 'isolate' }}>
              {lokasiList.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center text-center p-8">
                  {loadingMap ? <Loader2 size={32} className="animate-spin text-mj-blue/30 mb-3" /> : (
                    <><MapPin size={40} className="text-mj-blue/20 mb-3" /><p className="font-display font-bold text-mj-blue/40 text-lg uppercase">Belum Ada Petugas Aktif</p><p className="text-mj-blue/30 text-sm font-body mt-1">Lokasi petugas akan muncul saat mereka mulai bertugas</p></>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <MapPetugas locations={lokasiList} />
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-lg" style={{ zIndex: 10 }}>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-body font-semibold text-gray-700">{lokasiList.length} Petugas Live</span>
                  </div>
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-lg space-y-1" style={{ zIndex: 10 }}>
                    <p className="text-gray-500 text-xs font-body font-semibold uppercase tracking-wide mb-1">Unit</p>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-xs font-body text-gray-600">Melati</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-500" /><span className="text-xs font-body text-gray-600">Bestari</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Search petugas di peta */}
            {lokasiList.length > 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Cari nama petugas..." value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full pl-10 pr-9 py-3 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={14} /></button>}
                  </div>
                  <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm text-mj-blue focus:outline-none focus:ring-2 focus:ring-mj-blue/20">
                    <option value="">Semua Unit</option>
                    <option value="melati">Melati</option>
                    <option value="bestari">Bestari</option>
                  </select>
                </div>
                {filteredLokasi.length === 0 ? (
                  <p className="text-center text-mj-blue/40 font-body text-sm py-4">Tidak ada petugas yang sesuai pencarian</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredLokasi.map(l => (
                      <div key={l.petugas_id} className="bg-white rounded-xl p-4 border border-blue-50 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${l.petugas?.unit==='melati'?'bg-emerald-100':'bg-orange-100'}`}>
                              {l.petugas?.unit==='melati'?<Leaf size={15} className="text-emerald-600"/>:<Truck size={15} className="text-orange-600"/>}
                            </div>
                            <div>
                              <p className="font-body font-bold text-mj-blue text-sm">{l.petugas?.nama}</p>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${l.petugas?.unit==='melati'?'bg-emerald-100 text-emerald-700':'bg-orange-100 text-orange-700'}`}>{l.petugas?.unit==='melati'?'Melati':'Bestari'}</span>
                                <p className="text-mj-blue/40 text-xs">{l.petugas?.kelurahan}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/><span className="text-emerald-600 text-xs font-body font-semibold">Live</span></div>
                        </div>
                        <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs font-mono text-gray-500">{l.latitude.toFixed(5)}, {l.longitude.toFixed(5)}</div>
                        <p className="text-gray-400 text-xs font-body mt-1.5">Update: {formatTimestamp(l.timestamp)}</p>
                        <a href={`https://maps.google.com/?q=${l.latitude},${l.longitude}`} target="_blank" rel="noopener noreferrer"
                          className="mt-2 flex items-center justify-center gap-1.5 text-mj-blue text-xs font-body font-semibold bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors">
                          <Navigation size={11}/> Buka di Google Maps
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: ABSENSI ══ */}
        {tab === 'absensi' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display font-black text-mj-blue text-2xl uppercase tracking-wide">Data Absensi</h2>
                <p className="text-mj-blue/50 text-sm font-body">{absensiMode==='harian'?'Rekap kehadiran harian':'Rekap kehadiran bulanan'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
                  <button onClick={() => setAbsensiMode('harian')} className={`px-3 py-1.5 rounded-lg text-xs font-body font-semibold transition-all ${absensiMode==='harian'?'bg-mj-blue text-white':'text-gray-400 hover:text-mj-blue'}`}>Harian</button>
                  <button onClick={() => setAbsensiMode('bulanan')} className={`px-3 py-1.5 rounded-lg text-xs font-body font-semibold transition-all ${absensiMode==='bulanan'?'bg-mj-blue text-white':'text-gray-400 hover:text-mj-blue'}`}>Bulanan</button>
                </div>
                {absensiMode==='harian'
                  ? <input type="date" value={absensiDate} onChange={e => setAbsensiDate(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm text-mj-blue focus:outline-none focus:ring-2 focus:ring-mj-blue/20"/>
                  : <input type="month" value={absensiMonth} onChange={e => setAbsensiMonth(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm text-mj-blue focus:outline-none focus:ring-2 focus:ring-mj-blue/20"/>
                }
                <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-body font-bold px-4 py-2.5 rounded-xl transition-colors">
                  <Download size={13}/> Export Excel
                </button>
              </div>
            </div>

            {/* Stats (dinamis berdasarkan filter) */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Tampil', val: filteredAbsensi.length, color: 'bg-blue-50 text-mj-blue' },
                { label: 'Hadir', val: filteredAbsensi.filter(a=>a.jam_masuk).length, color: 'bg-emerald-50 text-emerald-700' },
                { label: 'Selesai', val: filteredAbsensi.filter(a=>a.jam_keluar).length, color: 'bg-violet-50 text-violet-700' },
                { label: 'Foto ✓', val: filteredAbsensi.filter(a=>a.foto_bukti_url).length, color: 'bg-amber-50 text-amber-700' },
              ].map((s,i) => (
                <div key={i} className={`${s.color} rounded-xl p-3 text-center`}>
                  <p className="font-display font-black text-2xl">{s.val}</p>
                  <p className="text-xs font-body font-semibold opacity-70">{s.label}</p>
                </div>
              ))}
            </div>

            <SearchFilterBar showStatusFilter placeholder="Cari nama petugas..." />

            {loadingAbsensi ? (
              <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-mj-blue/30"/></div>
            ) : filteredAbsensi.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-blue-50">
                <ClipboardList size={36} className="mx-auto text-mj-blue/20 mb-3"/>
                <p className="font-display font-bold text-mj-blue/40 uppercase">{search||activeFilterCount>0?'Tidak ada data yang sesuai filter':'Belum Ada Data Absensi'}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-body font-semibold text-gray-400 uppercase tracking-wide">
                  <div className="col-span-3">Nama</div>
                  {absensiMode==='bulanan'&&<div className="col-span-2">Tanggal</div>}
                  <div className={absensiMode==='bulanan'?'col-span-2':'col-span-3'}>Masuk / Keluar</div>
                  <div className="col-span-1">Durasi</div>
                  <div className="col-span-2">Unit</div>
                  <div className="col-span-1">Foto</div>
                  <div className="col-span-2">Status</div>
                </div>
                <div className="divide-y divide-gray-50">
                  {filteredAbsensi.map(a => (
                    <div key={a.id} className="flex flex-wrap md:grid md:grid-cols-12 gap-2 items-center px-4 py-3 hover:bg-gray-50/60 transition-colors">
                      <div className="col-span-3 flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${a.petugas?.unit==='melati'?'bg-emerald-100':'bg-orange-100'}`}>
                          {a.petugas?.unit==='melati'?<Leaf size={13} className="text-emerald-600"/>:<Truck size={13} className="text-orange-600"/>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body font-bold text-mj-blue text-sm truncate">{a.petugas?.nama}</p>
                          <p className="text-mj-blue/40 text-xs">{a.petugas?.kelurahan}</p>
                        </div>
                      </div>
                      {absensiMode==='bulanan'&&<div className="col-span-2 text-xs font-body text-gray-500">{formatDate(a.tanggal)}</div>}
                      <div className={`${absensiMode==='bulanan'?'col-span-2':'col-span-3'} text-xs font-body`}>
                        <span className={a.jam_masuk?'text-emerald-600 font-bold':'text-gray-300'}>{formatTime(a.jam_masuk)}</span>
                        <span className="text-gray-300 mx-1">→</span>
                        <span className={a.jam_keluar?'text-mj-blue font-bold':'text-gray-300'}>{formatTime(a.jam_keluar)}</span>
                      </div>
                      <div className="col-span-1 text-xs font-body font-mono text-gray-400">{calcDurasi(a.jam_masuk,a.jam_keluar)}</div>
                      <div className="col-span-2 text-xs font-body">
                        <span className={`px-1.5 py-0.5 rounded-full font-bold text-xs ${a.petugas?.unit==='melati'?'bg-emerald-100 text-emerald-700':'bg-orange-100 text-orange-700'}`}>{a.petugas?.unit}</span>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{a.petugas?.kelurahan}</p>
                      </div>
                      <div className="col-span-1">
                        {a.foto_bukti_url?<button onClick={()=>setSelectedFoto(a.foto_bukti_url!)}><CheckCircle size={16} className="text-emerald-500"/></button>:<XCircle size={16} className="text-gray-300"/>}
                      </div>
                      <div className="col-span-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${a.jam_keluar?'bg-emerald-100 text-emerald-700':a.jam_masuk?'bg-blue-100 text-mj-blue':'bg-gray-100 text-gray-400'}`}>
                          {a.jam_keluar?'Selesai':a.jam_masuk?'Bertugas':'Belum Absen'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-body text-gray-400">{filteredAbsensi.length} record ditampilkan{(search||activeFilterCount>0)?` dari ${absensiList.length} total`:''}</p>
                  <button onClick={handleExportExcel} className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 text-xs font-body font-semibold transition-colors">
                    <Download size={12}/> Download Excel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: BUKTI FOTO ══ */}
        {tab === 'foto' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-black text-mj-blue text-2xl uppercase tracking-wide">Bukti Foto Tugas</h2>
              <p className="text-mj-blue/50 text-sm font-body">Foto bukti yang dikirim petugas hari ini</p>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input type="text" placeholder="Cari nama petugas..." value={search} onChange={e=>setSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-3 border border-gray-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20"/>
                {search&&<button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={14}/></button>}
              </div>
              <select value={filterUnit} onChange={e=>setFilterUnit(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm text-mj-blue focus:outline-none focus:ring-2 focus:ring-mj-blue/20">
                <option value="">Semua Unit</option>
                <option value="melati">Melati</option>
                <option value="bestari">Bestari</option>
              </select>
            </div>
            {loadingFoto ? (
              <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-mj-blue/30"/></div>
            ) : filteredFoto.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-blue-50">
                <Camera size={36} className="mx-auto text-mj-blue/20 mb-3"/>
                <p className="font-display font-bold text-mj-blue/40 uppercase">{search||filterUnit?'Tidak ada foto yang sesuai filter':'Belum Ada Foto Hari Ini'}</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-body text-gray-400">{filteredFoto.length} foto ditampilkan{(search||filterUnit)?` dari ${fotoList.length} total`:''}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFoto.map(f => (
                    <div key={f.id} className="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden group">
                      <div className="relative cursor-pointer" onClick={()=>setSelectedFoto(f.url)}>
                        <img src={f.url} alt="bukti" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"/>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity"/>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${f.petugas?.unit==='melati'?'bg-emerald-100':'bg-orange-100'}`}>
                            {f.petugas?.unit==='melati'?<Leaf size={12} className="text-emerald-600"/>:<Truck size={12} className="text-orange-600"/>}
                          </div>
                          <p className="font-body font-bold text-mj-blue text-sm">{f.petugas?.nama}</p>
                        </div>
                        <p className="text-gray-400 text-xs font-body">{formatTimestamp(f.uploaded_at)}</p>
                        {f.latitude&&<a href={`https://maps.google.com/?q=${f.latitude},${f.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-mj-blue text-xs font-body hover:underline"><MapPin size={10}/> Lihat Lokasi</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ TAB: GALERI KEGIATAN ══ */}
        {tab === 'galeri' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-display font-black text-mj-blue text-2xl uppercase tracking-wide">Galeri Foto Kegiatan</h2>
                <p className="text-mj-blue/50 text-sm font-body">Dokumentasi kegiatan harian seluruh petugas</p>
              </div>
              <button onClick={fetchFotoKegiatan} className="flex items-center gap-2 bg-mj-blue text-white text-xs font-body font-bold px-4 py-2.5 rounded-xl hover:bg-mj-blue-mid transition-colors">
                <RefreshCw size={13} className={loadingGaleri?'animate-spin':''}/> Refresh
              </button>
            </div>

            <SearchFilterBar placeholder="Cari nama petugas atau deskripsi..." />

            {loadingGaleri ? (
              <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-mj-blue/30"/></div>
            ) : filteredGaleri.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-blue-50">
                <Image size={36} className="mx-auto text-mj-blue/20 mb-3"/>
                <p className="font-display font-bold text-mj-blue/40 uppercase">{search||activeFilterCount>0?'Tidak ada foto yang sesuai filter':'Belum Ada Foto Kegiatan'}</p>
                {!(search||activeFilterCount>0)&&<p className="text-mj-blue/30 text-sm font-body mt-1">Petugas belum mengirim foto kegiatan</p>}
              </div>
            ) : (
              <>
                <p className="text-xs font-body text-gray-400">{filteredGaleri.length} foto ditampilkan{(search||activeFilterCount>0)?` dari ${fotoKegiatanList.length} total`:''}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGaleri.map(f => (
                    <div key={f.id} className="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden group">
                      <div className="relative cursor-pointer" onClick={()=>setSelectedFoto(f.url)}>
                        <img src={f.url} alt="kegiatan" className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"/>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                          <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity"/>
                        </div>
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow ${f.petugas?.unit==='melati'?'bg-emerald-600':'bg-orange-500'}`}>
                          {f.petugas?.unit==='melati'?'Melati':'Bestari'}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${f.petugas?.unit==='melati'?'bg-emerald-100':'bg-orange-100'}`}>
                            {f.petugas?.unit==='melati'?<Leaf size={13} className="text-emerald-600"/>:<Truck size={13} className="text-orange-600"/>}
                          </div>
                          <div>
                            <p className="font-body font-bold text-mj-blue text-sm">{f.petugas?.nama}</p>
                            <p className="text-mj-blue/40 text-xs">{f.petugas?.kelurahan}</p>
                          </div>
                        </div>
                        <p className="font-body text-gray-600 text-sm leading-snug line-clamp-3 mb-2">{f.deskripsi}</p>
                        <div className="flex items-center gap-1 text-gray-400"><Calendar size={11}/><p className="text-xs font-body">{formatTimestamp(f.uploaded_at)}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ TAB: DATA PETUGAS ══ */}
        {tab === 'petugas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-display font-black text-mj-blue text-2xl uppercase tracking-wide">Data Petugas</h2>
                <p className="text-mj-blue/50 text-sm font-body">{filteredPetugas.length} dari {petugasList.length} petugas ditampilkan</p>
              </div>
              <button onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 bg-mj-red hover:bg-mj-red-dark text-white font-body font-bold text-sm px-5 py-3 rounded-xl transition-colors shadow-md shadow-red-900/15">
                <UserPlus size={15}/> Tambah Petugas
              </button>
            </div>

            {showCreateForm && (
              <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <p className="font-display font-black text-mj-blue uppercase tracking-wide text-lg">Buat Akun Petugas Baru</p>
                  <button onClick={() => setShowCreateForm(false)}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
                </div>
                {createError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4"><AlertTriangle size={14} className="text-mj-red"/><p className="text-red-700 text-sm font-body">{createError}</p></div>}
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Nama Lengkap', key: 'nama', type: 'text', placeholder: 'Budi Santoso' },
                    { label: 'Nomor HP', key: 'nomor_hp', type: 'tel', placeholder: '0812xxxx' },
                    { label: 'Username (untuk login)', key: 'username', type: 'text', placeholder: 'budi.santoso' },
                    { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block font-body font-semibold text-mj-blue text-xs mb-1.5 uppercase tracking-wide">{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20 text-mj-blue"/>
                    </div>
                  ))}
                  <div>
                    <label className="block font-body font-semibold text-mj-blue text-xs mb-1.5 uppercase tracking-wide">Unit</label>
                    <select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20 text-mj-blue">
                      <option value="melati">Melati</option><option value="bestari">Bestari</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-body font-semibold text-mj-blue text-xs mb-1.5 uppercase tracking-wide">Kelurahan</label>
                    <select value={form.kelurahan} onChange={e=>setForm({...form,kelurahan:e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20 text-mj-blue">
                      {kelurahanList.map(k=><option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-body font-semibold text-mj-blue text-xs mb-1.5 uppercase tracking-wide">Role</label>
                    <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-mj-blue/20 text-mj-blue">
                      <option value="petugas">Petugas</option><option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowCreateForm(false)} className="flex-1 border border-gray-200 text-gray-500 font-body font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">Batal</button>
                  <button onClick={handleCreatePetugas} disabled={creating}
                    className="flex-1 flex items-center justify-center gap-2 bg-mj-red text-white font-body font-bold py-3 rounded-xl hover:bg-mj-red-dark transition-colors text-sm disabled:opacity-60">
                    {creating?<><Loader2 size={15} className="animate-spin"/> Membuat...</>:<><UserPlus size={15}/> Buat Akun</>}
                  </button>
                </div>
              </div>
            )}

            <SearchFilterBar showAktifFilter placeholder="Cari nama, username, nomor HP, atau kelurahan..." />

            {loadingPetugas ? (
              <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-mj-blue/30"/></div>
            ) : filteredPetugas.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-blue-50">
                <Users size={36} className="mx-auto text-mj-blue/20 mb-3"/>
                <p className="font-display font-bold text-mj-blue/40 uppercase">Tidak ada petugas yang sesuai</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPetugas.map(p => (
                  <div key={p.id} className="bg-white rounded-xl p-4 border border-blue-50 shadow-sm flex flex-wrap items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.unit==='melati'?'bg-emerald-100':'bg-orange-100'}`}>
                      {p.unit==='melati'?<Leaf size={18} className="text-emerald-600"/>:<Truck size={18} className="text-orange-600"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-body font-bold text-mj-blue text-sm">{p.nama}</p>
                        {!p.aktif&&<span className="text-xs bg-red-100 text-red-500 font-bold px-2 py-0.5 rounded-full">Nonaktif</span>}
                        {p.role==='admin'&&<span className="text-xs bg-blue-100 text-mj-blue font-bold px-2 py-0.5 rounded-full">Admin</span>}
                      </div>
                      <p className="text-mj-blue/40 text-xs font-body">@{p.username} · {p.kelurahan}</p>
                    </div>
                    {p.nomor_hp&&<a href={`tel:${p.nomor_hp}`} className="flex items-center gap-1 text-xs text-mj-blue/50 hover:text-mj-blue font-body"><Phone size={11}/> {p.nomor_hp}</a>}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${p.unit==='melati'?'bg-emerald-100 text-emerald-700':'bg-orange-100 text-orange-700'}`}>{p.unit}</span>
                    {/* Edit button */}
                    <button onClick={()=>openEdit(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-body font-bold bg-blue-50 text-mj-blue hover:bg-blue-100 transition-colors">
                      <Edit2 size={12}/> Edit
                    </button>
                    <button onClick={()=>toggleAktifPetugas(p.id,p.aktif)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-body font-bold transition-colors ${p.aktif?'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600':'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}>
                      {p.aktif?'Nonaktifkan':'Aktifkan'}
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
