'use client';
import { useEffect, useRef } from 'react';

interface LokasiFresh {
  petugas_id: string;
  latitude: number;
  longitude: number;
  akurasi: number;
  timestamp: string;
  petugas: { nama: string; unit: string; kelurahan: string };
}

export default function MapPetugas({ locations }: { locations: LokasiFresh[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const initDone = useRef(false);

  // Load Leaflet CSS + JS from CDN once
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (!mapRef.current || initDone.current) return;
      initDone.current = true;
      const L = (window as any).L;

      const center: [number, number] = [3.5686, 98.6658]; // Medan Johor
      mapInstance.current = L.map(mapRef.current, {
        center,
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapInstance.current);

      markersLayer.current = L.layerGroup().addTo(mapInstance.current);
    };

    if ((window as any).L) {
      initMap();
    } else if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      // Script already added but might still loading
      const waitForL = setInterval(() => {
        if ((window as any).L) { clearInterval(waitForL); initMap(); }
      }, 100);
    }

    return () => {
      // Don't destroy map on re-render, only on real unmount
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    const tryUpdate = () => {
      if (!mapInstance.current || !(window as any).L) return false;
      const L = (window as any).L;
      markersLayer.current?.clearLayers();

      locations.forEach((loc) => {
        const isMelati = loc.petugas?.unit === 'melati';
        const color = isMelati ? '#10b981' : '#f97316';
        const unitLabel = isMelati ? 'Melati' : 'Bestari';

        const svgIcon = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 44" width="36" height="44">
            <ellipse cx="18" cy="42" rx="6" ry="2" fill="rgba(0,0,0,0.2)"/>
            <path d="M18 0C10.3 0 4 6.3 4 14c0 9.9 14 28 14 28s14-18.1 14-28C32 6.3 25.7 0 18 0z" fill="${color}" stroke="white" stroke-width="2"/>
            <circle cx="18" cy="14" r="6" fill="white"/>
          </svg>`;

        const icon = L.divIcon({
          html: svgIcon,
          iconSize: [36, 44],
          iconAnchor: [18, 44],
          popupAnchor: [0, -44],
          className: '',
        });

        const marker = L.marker([loc.latitude, loc.longitude], { icon });
        marker.addTo(markersLayer.current);

        // Tooltip (muncul saat hover)
        marker.bindTooltip(
          `<div style="font-family:sans-serif;font-size:12px;line-height:1.5;">
            <strong style="color:#1e3a5f;">${loc.petugas?.nama || 'Petugas'}</strong><br/>
            <span style="background:${color};color:white;padding:1px 7px;border-radius:10px;font-size:10px;font-weight:bold;">${unitLabel}</span>
            &nbsp;<span style="color:#666;">${loc.petugas?.kelurahan || ''}</span>
          </div>`,
          { direction: 'top', sticky: false, permanent: false }
        );

        // Popup (muncul saat klik)
        const minsAgo = Math.round((Date.now() - new Date(loc.timestamp).getTime()) / 60000);
        marker.bindPopup(
          `<div style="font-family:sans-serif;min-width:170px;padding:4px;">
            <p style="font-weight:800;font-size:14px;color:#1e3a5f;margin:0 0 5px;">${loc.petugas?.nama || 'Petugas'}</p>
            <span style="background:${color};color:white;padding:2px 9px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase;">${unitLabel}</span>
            <p style="color:#555;font-size:12px;margin:7px 0 3px;">📍 ${loc.petugas?.kelurahan || ''}</p>
            <p style="color:#888;font-size:11px;margin:0;">🕒 ${minsAgo < 2 ? 'Baru saja' : `${minsAgo} menit lalu`}</p>
            <p style="color:#aaa;font-size:10px;font-family:monospace;margin:5px 0 0;">
              ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}
            </p>
            <a href="https://maps.google.com/?q=${loc.latitude},${loc.longitude}" target="_blank"
              style="display:block;text-align:center;margin-top:8px;padding:5px;background:#1e3a5f;color:white;border-radius:8px;font-size:11px;font-weight:600;text-decoration:none;">
              Buka Google Maps ↗
            </a>
          </div>`,
          { maxWidth: 220 }
        );
      });

      if (locations.length > 0) {
        const latlngs = locations.map((l) => [l.latitude, l.longitude] as [number, number]);
        const bounds = L.latLngBounds(latlngs);
        mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
      return true;
    };

    if (!tryUpdate()) {
      // Leaflet not ready yet, retry
      const interval = setInterval(() => {
        if (tryUpdate()) clearInterval(interval);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [locations]);

  return (
    <div
      ref={mapRef}
      style={{ height: '380px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}
    />
  );
}
