'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';

export interface UserSession {
  id: string;
  nama: string;
  username: string;
  role: 'petugas' | 'admin';
  unit: string;
  kelurahan: string;
  nomor_hp: string;
  foto_profil?: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({}),
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('sijaga_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('petugas')
        .select('*')
        .eq('username', username.trim())
        .eq('password_hash', password)
        .eq('aktif', true)
        .single();

      if (error || !data) {
        return { error: 'Username atau password salah' };
      }

      const session: UserSession = {
        id: data.id,
        nama: data.nama,
        username: data.username,
        role: data.role,
        unit: data.unit,
        kelurahan: data.kelurahan,
        nomor_hp: data.nomor_hp || '',
        foto_profil: data.foto_profil,
      };

      setUser(session);
      localStorage.setItem('sijaga_user', JSON.stringify(session));
      return {};
    } catch {
      return { error: 'Terjadi kesalahan koneksi' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sijaga_user');
    localStorage.removeItem('sijaga_absensi_today');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
