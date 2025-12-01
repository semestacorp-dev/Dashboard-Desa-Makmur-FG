
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getProcessedData, VillageData } from './data/villageData';
import { rpjmdPrograms, missions, quickWins } from './data/rpjmdData';

// --- Type Declarations for External Libraries ---
declare global {
  interface Window {
    L: any;
    Chart: any;
  }
}

// --- Helpers ---
const fmtMoney = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

// --- Styles & Glass Components ---
const GlassCard = ({ children, className = "", hover = false }: { children: React.ReactNode, className?: string, hover?: boolean }) => (
  <div className={`
    relative bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden
    ${hover ? 'transition-all duration-300 hover:bg-slate-800/50 hover:border-white/20 hover:shadow-blue-500/20 hover:-translate-y-1' : ''}
    ${className}
  `}>
    {children}
  </div>
);

const NeonBadge = ({ children, color = "blue" }: { children: React.ReactNode, color?: "blue"|"green"|"purple"|"amber" }) => {
    const colors = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]",
        green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
    };
    return (
        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${colors[color] || colors.blue}`}>
            {children}
        </span>
    );
}

const InfoModal = ({ onClose }: { onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <GlassCard className="w-full max-w-lg p-6 !bg-slate-900/90 !border-white/20">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 flex items-center gap-2">
                        <i className="fa-solid fa-circle-info text-blue-500"></i> Metadata & Sumber Data
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-slate-300 hover:text-white">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                <div className="space-y-5 text-sm text-slate-300">
                    <div>
                        <h3 className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Judul Dataset</h3>
                        <div className="font-mono bg-black/40 p-3 rounded-lg text-emerald-400 border border-white/5 shadow-inner">ADMINISTRASI_AR_DESAKEL (Edisi Tahun 2023)</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Sumber (Owner)</h3>
                            <p className="font-semibold text-white">Badan Informasi Geospasial (BIG)</p>
                            <p className="text-xs text-slate-500">Pusat Pemetaan Batas Wilayah</p>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Tanggal Publikasi</h3>
                            <p className="font-semibold text-white">28 September 2023</p>
                        </div>
                    </div>

                    <div>
                         <h3 className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Akses Data</h3>
                         <a href="https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/Administrasi_AR_KelDesa_10K/MapServer?f=jsapi" target="_blank" rel="noopener noreferrer" 
                            className="group flex items-center gap-3 bg-blue-600/10 p-3 rounded-lg border border-blue-500/20 hover:bg-blue-600/20 hover:border-blue-500/50 transition duration-300">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition"><i className="fa-solid fa-layer-group"></i></div>
                            <span className="text-blue-300 text-xs font-medium group-hover:text-blue-200">ESRI MapServer (Administrasi_AR_KelDesa_10K)</span>
                            <i className="fa-solid fa-arrow-up-right-from-square text-[10px] ml-auto text-blue-500/50 group-hover:text-blue-400"></i>
                         </a>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-200/90 text-xs flex gap-3 items-start backdrop-blur-sm">
                        <i className="fa-solid fa-triangle-exclamation mt-0.5 text-amber-400 text-lg"></i>
                        <p className="leading-relaxed">Catatan: Dashboard ini menggunakan referensi administratif dari dataset di atas. Koordinat titik pada peta merupakan <strong>estimasi centroid</strong> karena data batas definitif desa sedang dalam proses pemutakhiran berkelanjutan oleh BIG.</p>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

const Navbar = ({ 
    kpi, 
    data, 
    view, 
    setView,
    searchTerm,
    setSearchTerm
}: { 
    kpi: { mandiri: number, maju: number, berkembang: number }, 
    data: VillageData[],
    view: string,
    setView: (v: string) => void,
    searchTerm: string,
    setSearchTerm: (s: string) => void
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
        setSearchTerm(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, setSearchTerm]);

  useEffect(() => {
      if(searchTerm !== localSearch) setLocalSearch(searchTerm);
  }, [searchTerm]);

  const handleExport = () => {
    if (data.length === 0) {
        alert("Tidak ada data untuk diekspor.");
        return;
    }
    const escape = (val: string | number) => typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
    const headers = ["No", "Kecamatan", "Kode Desa", "Nama Desa", "Status", "Skor Total", "DLD", "DS", "DE", "DL", "DA", "TK"];
    const rows = data.map((row, index) => [
        index + 1, escape(row.kec), escape(row.kode), escape(row.desa), escape(row.status), escape(row.skor),
        row.dimensi.dld, row.dimensi.ds, row.dimensi.de, row.dimensi.dl, row.dimensi.da, row.dimensi.dtkpd
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Data_Desa_Lamtim_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const navItems = [
    { id: 'map', label: 'Peta', icon: 'fa-map' },
    { id: 'table', label: 'Tabel', icon: 'fa-table' },
    { id: 'stats', label: 'Statistik', icon: 'fa-chart-pie' },
    { id: 'rpjmd', label: 'RPJMD', icon: 'fa-scroll' },
  ];

  return (
    <>
        <GlassCard className="h-20 px-6 shrink-0 z-50 flex items-center justify-between !bg-slate-900/60 !border-white/10 !backdrop-blur-xl">
            {/* Brand */}
            <div className="flex items-center gap-4 shrink-0">
                <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-60 transition duration-500 rounded-full"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 flex items-center justify-center text-blue-400 shadow-xl">
                        <i className="fa-solid fa-database text-xl"></i>
                    </div>
                </div>
                <div className="hidden sm:block">
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 tracking-tight">DATA INDEKS DESA 2025</h1>
                    <div className="flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                         <p className="text-[10px] text-blue-300/80 uppercase tracking-[0.2em] font-medium">Kabupaten Lampung Timur</p>
                    </div>
                </div>
            </div>

            {/* Navigation Pill */}
            <div className="hidden md:flex items-center bg-black/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-inner shrink-0">
                {navItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`
                            relative px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden group
                            ${view === item.id 
                                ? 'text-white shadow-lg' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        {view === item.id && (
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90"></div>
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                             <i className={`fa-solid ${item.icon} ${view === item.id ? 'animate-bounce-short' : ''}`}></i>
                             {item.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Global Search Bar */}
            <div className="hidden lg:flex relative group mx-4 flex-1 max-w-xs">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-search text-slate-400 group-focus-within:text-blue-400 transition"></i>
                 </div>
                 <input 
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Cari Desa/Kecamatan..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all shadow-inner"
                 />
            </div>

            {/* KPI & Actions */}
            <div className="flex gap-4 items-center shrink-0">
                {view !== 'rpjmd' && (
                    <div className="hidden xl:flex gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-sm shadow-inner">
                         <div className="flex flex-col items-center px-2">
                             <span className="text-[10px] text-slate-400 uppercase">Mandiri</span>
                             <span className="text-sm font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">{kpi.mandiri}</span>
                         </div>
                         <div className="w-px bg-white/10 mx-1"></div>
                         <div className="flex flex-col items-center px-2">
                             <span className="text-[10px] text-slate-400 uppercase">Maju</span>
                             <span className="text-sm font-bold text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">{kpi.maju}</span>
                         </div>
                         <div className="w-px bg-white/10 mx-1"></div>
                         <div className="flex flex-col items-center px-2">
                             <span className="text-[10px] text-slate-400 uppercase">Berkembang</span>
                             <span className="text-sm font-bold text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">{kpi.berkembang}</span>
                         </div>
                    </div>
                )}
                
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowInfo(true)} 
                        className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition flex items-center justify-center hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]" title="Metadata Info">
                        <i className="fa-solid fa-circle-info"></i>
                    </button>

                    {view !== 'rpjmd' && (
                        <button onClick={handleExport} 
                            className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/30 text-white text-xs font-bold transition flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transform hover:-translate-y-0.5">
                            <i className="fa-solid fa-file-csv"></i> 
                            <span className="hidden sm:inline">Export</span>
                        </button>
                    )}
                </div>
            </div>
        </GlassCard>
        {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </>
  );
};

const Sidebar = ({ 
  data, 
  filterStatus, 
  setFilterStatus, 
  onSelect,
  showList
}: { 
  data: VillageData[], 
  filterStatus: string, 
  setFilterStatus: (s: string) => void,
  onSelect: (v: VillageData) => void,
  showList: boolean
}) => {
  if (!showList) return null;

  return (
    <GlassCard className="w-80 flex flex-col shrink-0 z-40 transition-all duration-500">
      <div className="p-5 border-b border-white/10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Filter Status</h3>
        
        <div className="grid grid-cols-3 gap-2">
          {['ALL', 'MANDIRI', 'MAJU'].map((status) => {
              const active = filterStatus === status;
              let colors = 'border-white/10 text-slate-400 hover:bg-white/5 hover:text-white';
              
              if (active) {
                  if (status === 'ALL') {
                      colors = 'bg-slate-600 text-white border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.4)] ring-1 ring-slate-400/50 scale-[1.02]';
                  } else if (status === 'MANDIRI') {
                      colors = 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] ring-1 ring-emerald-400/50 scale-[1.02]';
                  } else if (status === 'MAJU') {
                      colors = 'bg-blue-500/20 text-blue-300 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] ring-1 ring-blue-400/50 scale-[1.02]';
                  }
              }

              return (
                  <button 
                    key={status}
                    onClick={() => setFilterStatus(status)} 
                    className={`text-[10px] font-bold py-2 rounded-lg border transition-all duration-300 uppercase tracking-wide ${colors}`}
                  >
                    {status === 'ALL' ? 'Semua' : status}
                  </button>
              )
          })}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        <div className="px-2 py-1 text-[10px] text-slate-500 uppercase tracking-wider flex justify-between">
            <span>Daftar Desa</span>
            <span>{data.length} Data</span>
        </div>
        {data.map(d => (
          <div key={d.id} onClick={() => onSelect(d)} 
            className="p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer group transition-all duration-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-200 group-hover:text-white transition">{d.desa}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${d.status === 'MANDIRI' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : d.status === 'MAJU' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                {d.skor}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <i className="fa-solid fa-location-dot text-[8px]"></i> {d.kec}
            </div>
          </div>
        ))}
        {data.length === 0 && (
            <div className="p-4 text-center text-slate-500 text-xs italic">
                Tidak ada data desa yang ditemukan.
            </div>
        )}
      </div>
    </GlassCard>
  );
};

const MapView = ({ data, onSelect }: { data: VillageData[], onSelect: (v: VillageData) => void }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersGroup = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || !window.L || mapInstance.current) return;

    const darkBasemap = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap, © CartoDB', maxZoom: 18
    });

    mapInstance.current = window.L.map(mapContainer.current, { 
        zoomControl: false,
        attributionControl: false,
        layers: [darkBasemap]
    }).setView([-5.10, 105.60], 10);

    const wmsLayer = window.L.tileLayer.wms('https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/Administrasi_AR_KelDesa_10K/MapServer/WMSServer', {
      layers: '0', format: 'image/png', transparent: true, version: '1.3.0'
    });
    wmsLayer.addTo(mapInstance.current);

    if (window.L.markerClusterGroup) {
        markersGroup.current = window.L.markerClusterGroup({
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          spiderfyOnMaxZoom: true,
          removeOutsideVisibleBounds: true,
          maxClusterRadius: 40,
        }).addTo(mapInstance.current);
    } else {
        markersGroup.current = window.L.layerGroup().addTo(mapInstance.current);
    }

    // Custom Zoom Control
    window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markersGroup.current) return;
    
    markersGroup.current.clearLayers();
    
    data.forEach(d => {
      // Glow colors for markers
      const colorClass = d.status === 'MANDIRI' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' 
        : (d.status === 'MAJU' ? 'bg-blue-500 shadow-[0_0_15px_#3b82f6]' : 'bg-amber-500 shadow-[0_0_15px_#f59e0b]');
      
      const icon = window.L.divIcon({
          className: '!bg-transparent !border-none',
          html: `<div class="w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${colorClass} transition-transform hover:scale-150"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          popupAnchor: [0, -7]
      });

      const marker = window.L.marker([d.lat, d.lng], { icon });
      
      // Popup Content built with strings but styled with CSS classes injected below
      const popupContent = `
        <div class="font-sans min-w-[220px]">
            <div class="flex items-center justify-between mb-2">
                 <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-slate-700 px-1.5 rounded">${d.kec}</span>
            </div>
            <div class="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-4 leading-tight">${d.desa}</div>
            
            <div class="grid grid-cols-2 gap-2 mb-4">
                <div class="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                    <div class="text-[9px] text-slate-500 uppercase mb-0.5">Status</div>
                    <div class="text-xs font-bold ${d.status === 'MANDIRI' ? 'text-emerald-400' : d.status === 'MAJU' ? 'text-blue-400' : 'text-amber-400'}">${d.status}</div>
                </div>
                <div class="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                    <div class="text-[9px] text-slate-500 uppercase mb-0.5">Skor IDM</div>
                    <div class="text-xs font-mono font-bold text-white">${d.skor}</div>
                </div>
            </div>

            <button id="btn-${d.id}" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 rounded-lg transition shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                <span>Lihat Detail</span> <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 260, className: 'glass-popup' });
      marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-${d.id}`);
          if(btn) btn.onclick = () => onSelect(d);
      });
      
      // Tooltip
      const tooltipContent = `
        <div class="flex items-center gap-2 px-1">
            <span class="w-2 h-2 rounded-full ${d.status === 'MANDIRI' ? 'bg-emerald-500' : d.status === 'MAJU' ? 'bg-blue-500' : 'bg-amber-500'} animate-pulse"></span>
            <span class="font-bold text-slate-100 text-xs tracking-wide">${d.desa}</span>
        </div>
      `;

      marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -10], opacity: 1, className: 'glass-tooltip' });
      marker.on('click', () => {
          mapInstance.current.flyTo([d.lat, d.lng], 15, { duration: 1.5, easeLinearity: 0.25 });
      });
      
      marker.addTo(markersGroup.current);
    });
  }, [data, onSelect]);

  return (
    <GlassCard className="flex-1 relative z-0 !bg-slate-900/80 !border-white/5">
      <div ref={mapContainer} className="w-full h-full z-0 rounded-2xl"></div>
      
      {/* Floating Legend */}
      <div className="absolute bottom-6 right-6 z-[400] bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl w-48 animate-slide-up">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-white/10">Status Desa</h4>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 group">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] group-hover:scale-125 transition"></span> 
              <span className="text-xs text-slate-300 font-medium">Mandiri</span>
          </div>
          <div className="flex items-center gap-3 group">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6] group-hover:scale-125 transition"></span> 
              <span className="text-xs text-slate-300 font-medium">Maju</span>
          </div>
          <div className="flex items-center gap-3 group">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b] group-hover:scale-125 transition"></span> 
              <span className="text-xs text-slate-300 font-medium">Berkembang</span>
          </div>
        </div>
      </div>
      
      <style>{`
        .glass-popup .leaflet-popup-content-wrapper {
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(16px);
            color: #f8fafc;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .glass-popup .leaflet-popup-tip {
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glass-tooltip {
            background-color: rgba(15, 23, 42, 0.8) !important;
            backdrop-filter: blur(8px) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: #f1f5f9 !important;
            border-radius: 8px !important;
            padding: 6px 10px !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
        }
        .glass-tooltip:before { display: none; }
      `}</style>
    </GlassCard>
  );
};

const TableView = ({ data, onSelect }: { data: VillageData[], onSelect: (v: VillageData) => void }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const getValue = (item: VillageData, path: string) => {
          if (path.includes('.')) return path.split('.').reduce((acc: any, part) => acc && acc[part], item);
          return item[path as keyof VillageData];
      };
      let aVal = getValue(a, sortConfig.key);
      let bVal = getValue(b, sortConfig.key);
      if (sortConfig.key === 'skor') {
         aVal = parseFloat(String(aVal).replace(',', '.'));
         bVal = parseFloat(String(bVal).replace(',', '.'));
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: string }) => {
      if (sortConfig?.key !== column) return <i className="fa-solid fa-sort text-slate-600 ml-1.5 text-[10px]"></i>;
      return <i className={`fa-solid fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} text-blue-400 ml-1.5`}></i>;
  };

  const Th = ({ label, column, className = "" }: { label: string, column: string, className?: string }) => (
      <th className={`p-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition select-none ${className}`} onClick={() => handleSort(column)}>
          <div className={`flex items-center gap-1 ${className.includes('text-center') ? 'justify-center' : ''}`}>
            {label} <SortIcon column={column} />
          </div>
      </th>
  );

  return (
    <GlassCard className="flex-1 flex flex-col overflow-hidden !bg-slate-900/60">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md shadow-md">
            <tr>
              <Th label="Kode" column="kode" />
              <Th label="Kecamatan" column="kec" />
              <Th label="Desa" column="desa" />
              <Th label="Status" column="status" className="text-center" />
              <Th label="Skor" column="skor" className="text-center" />
              <Th label="DLD" column="dimensi.dld" className="text-center text-blue-400" />
              <Th label="DS" column="dimensi.ds" className="text-center text-purple-400" />
              <Th label="DE" column="dimensi.de" className="text-center text-emerald-400" />
              <Th label="DL" column="dimensi.dl" className="text-center text-teal-400" />
              <Th label="DA" column="dimensi.da" className="text-center text-orange-400" />
              <Th label="TK" column="dimensi.dtkpd" className="text-center text-pink-400" />
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedData.map((d, idx) => (
              <tr key={d.id} className={`hover:bg-white/5 transition duration-150 group ${idx % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                <td className="p-4 text-slate-500 font-mono text-xs">{d.kode}</td>
                <td className="p-4 text-xs font-medium text-slate-300">{d.kec}</td>
                <td className="p-4 text-sm font-bold text-white group-hover:text-blue-300 transition">{d.desa}</td>
                <td className="p-4 text-center">
                  <NeonBadge color={d.status === 'MANDIRI' ? 'green' : d.status === 'MAJU' ? 'blue' : 'amber'}>{d.status}</NeonBadge>
                </td>
                <td className="p-4 text-center">
                    <span className="font-mono font-bold text-white bg-white/10 px-2 py-1 rounded border border-white/10">{d.skor}</span>
                </td>
                <td className="p-2 text-center text-xs text-blue-400/80 font-mono">{d.dimensi.dld}</td>
                <td className="p-2 text-center text-xs text-purple-400/80 font-mono">{d.dimensi.ds}</td>
                <td className="p-2 text-center text-xs text-emerald-400/80 font-mono">{d.dimensi.de}</td>
                <td className="p-2 text-center text-xs text-teal-400/80 font-mono">{d.dimensi.dl}</td>
                <td className="p-2 text-center text-xs text-orange-400/80 font-mono">{d.dimensi.da}</td>
                <td className="p-2 text-center text-xs text-pink-400/80 font-mono">{d.dimensi.dtkpd}</td>
                <td className="p-4 text-center">
                   <button onClick={() => onSelect(d)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-blue-600 hover:text-white text-slate-400 transition flex items-center justify-center">
                       <i className="fa-solid fa-eye"></i>
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};

const StatsView = ({ data }: { data: VillageData[] }) => {
  const chartStatusRef = useRef<HTMLCanvasElement>(null);
  const chartDimRef = useRef<HTMLCanvasElement>(null);
  const chartKecRef = useRef<HTMLCanvasElement>(null);
  const statusChart = useRef<any>(null);
  const dimChart = useRef<any>(null);
  const kecChart = useRef<any>(null);

  useEffect(() => {
    if (!window.Chart) return;
    window.Chart.defaults.color = '#94a3b8';
    window.Chart.defaults.font.family = "'Inter', sans-serif";

    if (statusChart.current) statusChart.current.destroy();
    const m = data.filter(x => x.status === 'MANDIRI').length;
    const ma = data.filter(x => x.status === 'MAJU').length;
    const b = data.filter(x => x.status === 'BERKEMBANG').length;
    
    if (chartStatusRef.current) {
        statusChart.current = new window.Chart(chartStatusRef.current, {
            type: 'doughnut',
            data: {
                labels: ['Mandiri', 'Maju', 'Berkembang'],
                datasets: [{
                    data: [m, ma, b],
                    backgroundColor: ['#10B981', '#3B82F6', '#F59E0B'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false, cutout: '70%',
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } } 
            }
        });
    }

    if (dimChart.current) dimChart.current.destroy();
    const sums = { dld:0, ds:0, de:0, dl:0, da:0, dtkpd:0 };
    data.forEach(d => {
        sums.dld += d.dimensi.dld; sums.ds += d.dimensi.ds; sums.de += d.dimensi.de;
        sums.dl += d.dimensi.dl; sums.da += d.dimensi.da; sums.dtkpd += d.dimensi.dtkpd;
    });
    const len = data.length || 1;
    
    if (chartDimRef.current) {
        const gradient = chartDimRef.current.getContext('2d')?.createLinearGradient(0,0,0,300);
        gradient?.addColorStop(0, '#3b82f6');
        gradient?.addColorStop(1, '#6366f1');

        dimChart.current = new window.Chart(chartDimRef.current, {
            type: 'bar',
            data: {
                labels: ['Layanan', 'Sosial', 'Ekonomi', 'Lingkungan', 'Akses', 'Tata Kelola'],
                datasets: [{
                    label: 'Rata-rata Skor',
                    data: [sums.dld/len, sums.ds/len, sums.de/len, sums.dl/len, sums.da/len, sums.dtkpd/len],
                    backgroundColor: gradient || '#3B82F6',
                    borderRadius: 6,
                    barThickness: 24
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false, 
                plugins: { legend: { display: false } }, 
                scales: { 
                    y: { beginAtZero: true, grid: { color: '#ffffff10', drawBorder: false } }, 
                    x: { grid: { display: false } } 
                } 
            }
        });
    }

    if (kecChart.current) kecChart.current.destroy();
    const kecStats: Record<string, {sum: number, count: number}> = {};
    data.forEach(d => {
        if(!kecStats[d.kec]) kecStats[d.kec] = {sum:0, count:0};
        kecStats[d.kec].sum += parseFloat(d.skor.replace(',','.'));
        kecStats[d.kec].count++;
    });
    const sortedKec = Object.keys(kecStats)
        .map(k => ({name:k, avg:kecStats[k].sum/kecStats[k].count}))
        .sort((a,b)=>b.avg - a.avg);

    if (chartKecRef.current) {
        const gradient = chartKecRef.current.getContext('2d')?.createLinearGradient(0,0,400,0);
        gradient?.addColorStop(0, '#10b981');
        gradient?.addColorStop(1, '#3b82f6');

        kecChart.current = new window.Chart(chartKecRef.current, {
            type: 'bar',
            data: {
                labels: sortedKec.map(k=>k.name),
                datasets: [{ label: 'Rata-rata Skor', data: sortedKec.map(k=>k.avg), backgroundColor: gradient || '#10B981', borderRadius: 4 }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                scales: { 
                    x: { min: 60, grid: { color: '#ffffff10' } }, 
                    y: { grid: { display:false }, ticks: { font: { size: 10 } } } 
                }, 
                plugins: { legend: { display: false } } 
            }
        });
    }
  }, [data]);

  return (
    <div className="flex-1 p-2 overflow-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <GlassCard className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sebaran Status IDM</h3>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center"><i className="fa-solid fa-chart-pie text-emerald-400"></i></div>
                </div>
                <div className="h-64"><canvas ref={chartStatusRef}></canvas></div>
            </GlassCard>
            <GlassCard className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Rata-rata Skor per Dimensi</h3>
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center"><i className="fa-solid fa-chart-simple text-blue-400"></i></div>
                </div>
                <div className="h-64"><canvas ref={chartDimRef}></canvas></div>
            </GlassCard>
        </div>
        <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Peringkat Kecamatan (Skor Rata-rata)</h3>
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center"><i className="fa-solid fa-ranking-star text-purple-400"></i></div>
            </div>
            <div className="h-96"><canvas ref={chartKecRef}></canvas></div>
        </GlassCard>
    </div>
  );
};

const SyncStrategyView = () => {
    return (
        <div className="space-y-6 pb-10">
            {/* Hero Alert */}
            <GlassCard className="p-8 relative !bg-gradient-to-r !from-blue-900/40 !to-indigo-900/40 !border-blue-500/30">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                        <i className="fa-solid fa-right-left text-3xl text-white"></i>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-3">Sinkronisasi RPJMD dengan Indeks Desa (6 Dimensi)</h2>
                        <p className="text-blue-100/80 text-sm leading-relaxed max-w-3xl">
                            Transformasi strategis dari IDM (3 Pilar) menuju <strong>Indeks Desa</strong> (Permendes PDTT No. 9/2024). Dokumen ini memandu penyesuaian indikator kinerja pembangunan desa untuk memastikan kepatuhan regulasi dan keberlanjutan target.
                        </p>
                    </div>
                </div>
            </GlassCard>

            {/* 6 Dimensions Grid */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full"></div>
                    Matriks Transformasi Indikator
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { name: "Layanan Dasar", icon: "fa-hand-holding-medical", desc: "Pendidikan, kesehatan, utilitas dasar", color: "blue" },
                        { name: "Sosial", icon: "fa-users", desc: "Aktivitas masyarakat, solidaritas", color: "purple" },
                        { name: "Ekonomi", icon: "fa-chart-line", desc: "Produksi, pasar, keuangan desa", color: "emerald" },
                        { name: "Lingkungan", icon: "fa-leaf", desc: "Sampah, limbah, kebencanaan", color: "teal" },
                        { name: "Aksesibilitas", icon: "fa-road", desc: "Jalan, transportasi, listrik, internet", color: "amber", highlight: true },
                        { name: "Tata Kelola", icon: "fa-gavel", desc: "Transparansi, akuntabilitas, layanan", color: "rose", highlight: true },
                    ].map((dim, idx) => (
                        <div key={idx} className={`relative p-5 rounded-xl border transition group hover:bg-white/5 ${dim.highlight ? 'bg-amber-500/5 border-amber-500/30' : 'bg-white/5 border-white/5'}`}>
                            {dim.highlight && <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/20">BARU</span>}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-lg bg-${dim.color}-500/20 text-${dim.color}-400 shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
                                <i className={`fa-solid ${dim.icon}`}></i>
                            </div>
                            <h4 className="text-sm font-bold text-white mb-1">{dim.name}</h4>
                            <p className="text-xs text-slate-400">{dim.desc}</p>
                        </div>
                    ))}
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Options */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full"></div>
                        Opsi Strategis
                    </h3>
                    <div className="space-y-4">
                         <div className="p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-sm font-bold text-white">Opsi 1: Transisi Administrasi</h4>
                                <NeonBadge color="blue">CEPAT</NeonBadge>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">Penerbitan SK Kepala Daerah (Bridging) dan penggunaan dua lajur pengukuran selama 1 tahun.</p>
                         </div>
                         <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition cursor-pointer relative overflow-hidden">
                            <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-[9px] font-bold rounded-bl-xl shadow-lg">REKOMENDASI</div>
                            <h4 className="text-sm font-bold text-white mb-2">Opsi 2: Revisi Perda RPJMD</h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">Perubahan formal dokumen RPJMD 2025-2029 (Pasal 342 Permendagri 86/2017) untuk audit-proof.</p>
                            <div className="flex gap-2 text-[10px] text-emerald-400 font-bold">
                                <span><i className="fa-solid fa-check"></i> Audit Kinerja Aman</span>
                                <span><i className="fa-solid fa-check"></i> Konsisten RPJPN</span>
                            </div>
                         </div>
                    </div>
                </GlassCard>

                {/* Timeline */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full"></div>
                        Roadmap 90 Hari
                    </h3>
                    <div className="space-y-0 pl-2">
                        {[
                            { step: "1", title: "SK Kepala Daerah", desc: "Penetapan kebijakan transisi (Permendes 9/2024)", lead: "Bappeda" },
                            { step: "2", title: "Crosswalk Indikator", desc: "Pemetaan gap indikator lama vs baru", lead: "Bappeda & OPD" },
                            { step: "3", title: "Baseline 2025", desc: "Pengambilan data baseline & target 2026", lead: "DPMD" },
                            { step: "4", title: "Integrasi SIPD", desc: "Update kode program Renja OPD", lead: "TAPD" },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 pb-6 last:pb-0 relative">
                                <div className="absolute top-0 left-3.5 bottom-0 w-px bg-white/10 -z-10 last:hidden"></div>
                                <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-xs font-bold text-white shadow-lg shrink-0 z-10">
                                    {item.step}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                                    <p className="text-xs text-slate-400 mb-1">{item.desc}</p>
                                    <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{item.lead}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

const RpjmdView = () => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'sync'>('matrix');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-2">
        {/* Header Tab Switcher */}
        <GlassCard className="mb-6 p-2 flex justify-between items-center sticky top-0 z-30">
            <div className="px-4">
                <h1 className="text-lg font-bold text-white">E-RPJMD 2025-2029</h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Monitoring & Evaluasi</p>
            </div>
            <div className="flex bg-black/20 rounded-xl p-1">
                <button onClick={() => setActiveTab('matrix')} className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeTab === 'matrix' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                    <i className="fa-solid fa-list-check"></i> Matrix
                </button>
                <button onClick={() => setActiveTab('sync')} className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeTab === 'sync' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                    <i className="fa-solid fa-rotate"></i> Sinkronisasi
                </button>
            </div>
        </GlassCard>

        {activeTab === 'sync' ? (
            <SyncStrategyView />
        ) : (
            <div className="space-y-8 animate-fade-in pb-10">
                {/* Quick Wins */}
                <div>
                    <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-1">
                        <i className="fa-solid fa-bolt"></i> Program Unggulan (Quick Wins)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {quickWins.map((qw, idx) => (
                            <GlassCard key={idx} className="p-5 hover" hover={true}>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 flex items-center justify-center text-lg border border-white/5">
                                        <i className={`fa-solid ${qw.icon}`}></i>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-1">{qw.title}</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">{qw.desc}</p>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>

                {/* Programs */}
                <div>
                    <h2 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-1">
                        <i className="fa-solid fa-bullseye"></i> Target Kinerja & Anggaran
                    </h2>
                    <div className="space-y-6">
                        {rpjmdPrograms.map((prog) => {
                             const years = [2026, 2027, 2028, 2029, 2030];
                             const budgets = years.map(y => prog.targets[y].pagu);
                             const maxBudget = Math.max(...budgets);
                             const isExpanded = expandedId === prog.id;

                             return (
                                <GlassCard key={prog.id} className="overflow-visible transition-all duration-300">
                                    <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between gap-4 relative">
                                        <div className="flex-1 pr-10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-white/10 text-white text-[9px] px-2 py-0.5 rounded font-mono">{prog.id}</span>
                                                {prog.isQuickWin && <NeonBadge color="amber">UNGGULAN</NeonBadge>}
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wide">{prog.opd}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-1">{prog.program}</h3>
                                            <p className="text-xs text-slate-400"><span className="text-slate-500 font-semibold">Indikator:</span> {prog.indicator}</p>
                                        </div>
                                        <div className="text-right hidden md:block">
                                            <div className="text-[10px] text-slate-500 uppercase mb-1">Baseline 2024</div>
                                            <div className="text-2xl font-bold text-white font-mono">{prog.baseline2024}</div>
                                        </div>
                                        
                                        {/* Toggle Button */}
                                        <button 
                                            onClick={() => toggleExpand(prog.id)}
                                            className={`absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 text-slate-300 hover:text-white ${isExpanded ? 'rotate-180 bg-white/10' : ''}`}
                                        >
                                            <i className="fa-solid fa-chevron-down"></i>
                                        </button>
                                    </div>

                                    {/* Expanded Detail View */}
                                    {isExpanded && (
                                        <div className="p-6 border-b border-white/5 bg-black/20 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in relative z-10">
                                            <div>
                                                <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-2 tracking-widest flex items-center gap-2">
                                                    <i className="fa-solid fa-file-lines"></i> Deskripsi Program
                                                </h4>
                                                <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                                                    Program strategis yang dilaksanakan oleh <strong>{prog.opd}</strong>. 
                                                    Bertujuan untuk meningkatkan <em>{prog.indicator.toLowerCase()}</em> sebagai bagian dari pencapaian Misi {prog.missionId} RPJMD 2025-2029.
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold text-emerald-400 uppercase mb-2 tracking-widest flex items-center gap-2">
                                                    <i className="fa-solid fa-crosshairs"></i> Target Spesifik
                                                </h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                                                        <span className="text-[10px] text-slate-400">Target Akhir (2030)</span>
                                                        <span className="text-sm font-bold text-white">{prog.targets[2030].target}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                                                        <span className="text-[10px] text-slate-400">Target Terdekat (2026)</span>
                                                        <span className="text-sm font-bold text-white">{prog.targets[2026].target}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold text-amber-400 uppercase mb-2 tracking-widest flex items-center gap-2">
                                                    <i className="fa-solid fa-spinner"></i> Capaian Aktual
                                                </h4>
                                                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs text-slate-300">Status</span>
                                                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">ON TRACK</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                                                        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 w-[35%] rounded-full relative">
                                                            <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/20 animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-slate-500">
                                                        <span>Basis: {prog.baseline2024}</span>
                                                        <span>Menuju: {prog.targets[2026].target}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6 bg-black/10">
                                        <div className="grid grid-cols-5 gap-2 md:gap-4">
                                            {years.map(year => {
                                                const t = prog.targets[year];
                                                const heightPct = (t.pagu / maxBudget) * 100;
                                                return (
                                                    <div key={year} className="flex flex-col items-center group relative">
                                                        <div className="mb-2 bg-slate-800 border border-slate-600 rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-300 shadow-sm z-10 group-hover:scale-110 transition group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500">
                                                            {t.target}
                                                        </div>
                                                        <div className="w-full h-24 bg-white/5 rounded-t-lg relative flex items-end justify-center overflow-visible">
                                                            <div 
                                                                className="w-full mx-1 bg-gradient-to-t from-blue-600 to-indigo-500 opacity-80 hover:opacity-100 rounded-t transition-all duration-500 relative group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                                                                style={{ height: `${heightPct}%` }}
                                                            >
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-slate-900/95 backdrop-blur-xl text-white text-xs rounded-xl p-3 border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none scale-90 group-hover:scale-100 origin-bottom">
                                                                    <div className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider text-center">{year}</div>
                                                                    <div className="flex justify-between items-center py-1 border-b border-white/10">
                                                                        <span className="text-slate-400">Target</span>
                                                                        <span className="font-bold text-emerald-400">{t.target}</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center py-1">
                                                                        <span className="text-slate-400">Pagu</span>
                                                                        <span className="font-mono text-amber-400 text-[10px]">{fmtMoney(t.pagu)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 text-[10px] font-mono text-slate-500 w-full text-center pt-1 border-t border-white/5 group-hover:text-blue-400 transition">
                                                            {year}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </GlassCard>
                             );
                        })}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

// Main App Component
const App = () => {
  const [data, setData] = useState<VillageData[]>([]);
  const [view, setView] = useState('map'); 
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<VillageData | null>(null);

  useEffect(() => { setData(getProcessedData()); }, []);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchStatus = filterStatus === 'ALL' || d.status === filterStatus;
      const matchSearch = searchTerm === '' || d.desa.toLowerCase().includes(searchTerm.toLowerCase()) || d.kec.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [data, filterStatus, searchTerm]);

  const kpi = useMemo(() => ({
    mandiri: data.filter(d => d.status === 'MANDIRI').length,
    maju: data.filter(d => d.status === 'MAJU').length,
    berkembang: data.filter(d => d.status === 'BERKEMBANG').length,
  }), [data]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0f172a] text-slate-100 font-inter selection:bg-blue-500/30">
        {/* Animated Background Orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-600/20 blur-[100px] animate-blob mix-blend-screen"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-purple-600/20 blur-[100px] animate-blob animation-delay-2000 mix-blend-screen"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-emerald-600/20 blur-[100px] animate-blob animation-delay-4000 mix-blend-screen"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        </div>

        {/* Floating Layout */}
        <div className="relative z-10 h-full flex flex-col p-4 gap-4 max-w-[1920px] mx-auto">
            <Navbar 
                kpi={kpi} 
                data={filteredData} 
                view={view} 
                setView={setView} 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
            />
            
            <div className="flex flex-1 gap-4 overflow-hidden">
                {(view === 'map' || view === 'table') && (
                    <Sidebar 
                        data={filteredData} 
                        filterStatus={filterStatus} 
                        setFilterStatus={setFilterStatus}
                        onSelect={setSelectedVillage} 
                        showList={true}
                    />
                )}
                
                <main className="flex-1 relative flex flex-col min-w-0 animate-fade-in-up">
                    {view === 'map' && <MapView data={filteredData} onSelect={setSelectedVillage} />}
                    {view === 'table' && <TableView data={filteredData} onSelect={setSelectedVillage} />}
                    {view === 'stats' && <StatsView data={data} />}
                    {view === 'rpjmd' && <RpjmdView />}
                </main>
            </div>
        </div>
        
        {/* Global Styles for Animations */}
        <style>{`
            @keyframes blob {
                0% { transform: translate(0px, 0px) scale(1); }
                33% { transform: translate(30px, -50px) scale(1.1); }
                66% { transform: translate(-20px, 20px) scale(0.9); }
                100% { transform: translate(0px, 0px) scale(1); }
            }
            .animate-blob { animation: blob 10s infinite; }
            .animation-delay-2000 { animation-delay: 2s; }
            .animation-delay-4000 { animation-delay: 4s; }
            
            @keyframes fade-in-up {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up { animation: fade-in-up 0.5s ease-out; }

            @keyframes slide-up {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
            
            @keyframes bounce-short {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
            }
            .animate-bounce-short { animation: bounce-short 0.5s ease-in-out; }

            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .animate-fade-in { animation: fade-in 0.3s ease-in-out; }
        `}</style>
    </div>
  );
};

export default App;
