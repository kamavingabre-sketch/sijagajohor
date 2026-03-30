'use client';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Fitur', href: '#fitur' },
    { label: 'Unit Kerja', href: '#unit' },
    { label: 'Kontak', href: '#kontak' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg shadow-blue-900/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-mj-blue rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-display font-black text-lg leading-none">SJ</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-mj-red rounded-sm"></div>
            </div>
            <div className="flex flex-col leading-tight">
              <span
                className={`font-display font-black text-xl tracking-wider uppercase ${
                  scrolled ? 'text-mj-blue' : 'text-white'
                }`}
              >
                SIJAGA JOHOR
              </span>
              <span
                className={`text-xs font-body font-medium tracking-wide ${
                  scrolled ? 'text-mj-blue/60' : 'text-white/70'
                }`}
              >
                Kecamatan Medan Johor
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`font-body font-semibold text-sm tracking-wide transition-colors relative group ${
                  scrolled ? 'text-mj-blue' : 'text-white'
                }`}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-mj-red group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
            <a
              href="/login"
              className="bg-mj-red text-white font-body font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-mj-red-dark transition-colors shadow-md shadow-red-900/20"
            >
              Masuk Sistem
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-mj-blue' : 'text-white'}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 shadow-xl rounded-b-2xl">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-4 py-3 font-body font-semibold text-mj-blue hover:bg-blue-50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="px-4 pt-2">
              <a
                href="/login"
                className="block w-full text-center bg-mj-red text-white font-body font-semibold py-3 rounded-xl hover:bg-mj-red-dark transition-colors"
              >
                Masuk Sistem
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
