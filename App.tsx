
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

// --- Constants ---
const INDICATOR_NAMES = [
  "Akses Pendidikan", "Partisipasi Sekolah", "Kualitas Sekolah", "Akses Kesehatan", "Posyandu", "Nakes Desa", "BPJS", "Air Bersih", "Sanitasi", "RTLH", "Listrik", "Internet", "Info Publik", // DLD
  "Gotong Royong", "Ruang Publik", "Keamanan", "Konflik", "Ormas", "Olahraga", "Budaya", "Toleransi", // DS
  "Produksi", "Akses Pasar", "Toko/Warung", "BUMDes", "Kinerja BUMDes", "Kredit", "Logistik", "Jalan Desa", "Digital", "Produk Unggulan", "Pasar Desa", // DE
  "Air Sungai", "Sampah", "Pencemaran", "Bencana", "Tanggap Bencana", // DL
  "Angkutan", "Jalan Poros", "Jembatan", "Waktu Kec", "Waktu Kab", // DA
  "Musyawarah", "Transparansi", "Kinerja", "Aset", "Regulasi" // DTKPD
];

// --- Helpers ---
const fmtMoney = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

// --- Components ---

const InfoModal = ({ onClose }: { onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl p-6">
                <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <i className="fa-solid fa-circle-info text-blue-500"></i> Metadata & Sumber Data
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition"><i className="fa-solid fa-xmark text-lg"></i></button>
                </div>
                
                <div className="space-y-4 text-sm text-slate-300">
                    <div>
                        <h3 className="text-xs font-bold uppercase text-slate-500 mb-1">Judul Dataset</h3>
                        <p className="font-mono bg-slate-900/50 p-2 rounded text-white border border-slate-700">ADMINISTRASI_AR_DESAKEL (Edisi Tahun 2023)</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-xs font-bold uppercase text-slate-500 mb-1">Sumber (Owner)</h3>
                            <p className="font-semibold">Badan Informasi Geospasial (BIG)</p>
                            <p className="text-xs text-slate-400">Pusat Pemetaan Batas Wilayah</p>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase text-slate-500 mb-1">Tanggal Publikasi</h3>
                            <p>28 September 2023</p>
                        </div>
                    </div>

                    <div>
                         <h3 className="text-xs font-bold uppercase text-slate-500 mb-1">Abstrak</h3>
                         <p className="text-xs leading-relaxed text-slate-400">
                             Geodatabase batas wilayah administrasi desa/kelurahan skala 1:10.000. Pemutakhiran September 2023 mencakup hasil verifikasi teknis batas wilayah, penyelarasan batas kabupaten/kota, dan sinkronisasi Kepmendagri 100.1.1-6117 Tahun 2022.
                         </p>
                    </div>
                    
                    <div>
                         <h3 className="text-xs font-bold uppercase text-slate-500 mb-1">Akses Data</h3>
                         <a href="https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/Administrasi_AR_KelDesa_10K/MapServer?f=jsapi" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-700 hover:border-blue-500 transition">
                            <i className="fa-solid fa-layer-group"></i> 
                            <span>ESRI MapServer (Administrasi_AR_KelDesa_10K)</span>
                            <i className="fa-solid fa-external-link-alt text-[10px] ml-auto"></i>
                         </a>
                    </div>

                    <div className="mt-4 bg-yellow-900/20 border border-yellow-700/50 p-3 rounded text-yellow-200/80 text-xs flex gap-2 items-start">
                        <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                        <p>Catatan: Dashboard ini menggunakan referensi administratif dari dataset di atas. Koordinat titik pada peta merupakan <strong>estimasi centroid</strong> karena data batas definitif desa sedang dalam proses pemutakhiran berkelanjutan oleh BIG.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Navbar = ({ kpi, data }: { kpi: { mandiri: number, maju: number, berkembang: number }, data: VillageData[] }) => {
  const [showInfo, setShowInfo] = useState(false);

  const handleExport = () => {
    if (data.length === 0) {
        alert("Tidak ada data untuk diekspor.");
        return;
    }

    // Helper to escape CSV fields
    const escape = (val: string | number) => {
        if (typeof val === 'string') {
            return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
    };

    // CSV Header
    const headers = [
        "No", "Kecamatan", "Kode Desa", "Nama Desa", "Status", "Skor Total",
        "Layanan Dasar (DLD)", "Sosial (DS)", "Ekonomi (DE)", 
        "Lingkungan (DL)", "Aksesibilitas (DA)", "Tata Kelola (TK)"
    ];

    // Map data to rows
    const rows = data.map((row, index) => [
        index + 1,
        escape(row.kec),
        escape(row.kode),
        escape(row.desa),
        escape(row.status),
        escape(row.skor),
        row.dimensi.dld,
        row.dimensi.ds,
        row.dimensi.de,
        row.dimensi.dl,
        row.dimensi.da,
        row.dimensi.dtkpd
    ]);

    // Combine header and rows
    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n");

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Desa_Lamtim_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
        <nav className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 z-20 shadow-lg">
        <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-2 rounded-lg text-blue-500">
            <i className="fa-solid fa-database text-xl"></i>
            </div>
            <div>
            <h1 className="text-lg font-bold text-white tracking-wide">DATA INDEKS DESA 2025</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Kabupaten Lampung Timur</p>
            </div>
        </div>
        <div className="flex gap-4 items-center">
            <div className="hidden lg:flex bg-slate-700 px-3 py-1 rounded-full text-xs gap-3">
            <span className="text-green-400 font-bold">Mandiri: {kpi.mandiri}</span>
            <span className="w-px bg-slate-600"></span>
            <span className="text-blue-400 font-bold">Maju: {kpi.maju}</span>
            <span className="w-px bg-slate-600"></span>
            <span className="text-yellow-400 font-bold">Berkembang: {kpi.berkembang}</span>
            </div>
            
            <button onClick={() => setShowInfo(true)} className="text-slate-400 hover:text-white transition" title="Metadata Info">
                 <i className="fa-solid fa-circle-info text-lg"></i>
            </button>

            <button onClick={handleExport} className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded text-xs font-bold transition flex items-center gap-2" title="Unduh data difilter (CSV)">
            <i className="fa-solid fa-file-csv"></i> Export
            </button>
        </div>
        </nav>
        {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </>
  );
};

const Sidebar = ({ 
  data, 
  filterStatus, 
  setFilterStatus, 
  searchTerm, 
  setSearchTerm, 
  onSelect,
  showList
}: { 
  data: VillageData[], 
  filterStatus: string, 
  setFilterStatus: (s: string) => void,
  searchTerm: string,
  setSearchTerm: (s: string) => void,
  onSelect: (v: VillageData) => void,
  showList: boolean
}) => {
  // Use local state for immediate input feedback
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Sync local state if parent state changes (e.g., clear search)
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // Debounce logic: Update parent searchTerm only after user stops typing for 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearch, setSearchTerm]);

  if (!showList) return null;

  return (
    <aside className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0 z-10">
      <div className="p-4 border-b border-slate-700">
        <div className="relative">
          <input 
            type="text" 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Cari Desa / Kecamatan..." 
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-xs text-white focus:border-blue-500 outline-none pl-8"
          />
          <i className="fa-solid fa-search absolute left-2.5 top-2.5 text-slate-500 text-xs"></i>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button 
            onClick={() => setFilterStatus('ALL')} 
            className={`text-[10px] py-1 rounded transition ${filterStatus === 'ALL' ? 'bg-slate-600 text-white ring-2 ring-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            Semua
          </button>
          <button 
            onClick={() => setFilterStatus('MANDIRI')} 
            className={`text-[10px] py-1 rounded transition border border-green-900 ${filterStatus === 'MANDIRI' ? 'bg-green-900/50 text-green-400 ring-2 ring-white' : 'bg-slate-900 text-green-400 hover:bg-green-900/20'}`}
          >
            Mandiri
          </button>
          <button 
            onClick={() => setFilterStatus('MAJU')} 
            className={`text-[10px] py-1 rounded transition border border-blue-900 ${filterStatus === 'MAJU' ? 'bg-blue-900/50 text-blue-400 ring-2 ring-white' : 'bg-slate-900 text-blue-400 hover:bg-blue-900/20'}`}
          >
            Maju
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {data.map(d => (
          <div key={d.id} onClick={() => onSelect(d)} className="p-2 hover:bg-slate-700/50 rounded cursor-pointer group">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200">{d.desa}</span>
              <span className={`text-[10px] font-bold px-1.5 rounded ${d.status === 'MANDIRI' ? 'bg-green-900/30 text-green-400' : d.status === 'MAJU' ? 'bg-blue-900/30 text-blue-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                {d.skor}
              </span>
            </div>
            <div className="text-[10px] text-slate-500">{d.kec}</div>
          </div>
        ))}
      </div>
    </aside>
  );
};

const MapView = ({ data, onSelect }: { data: VillageData[], onSelect: (v: VillageData) => void }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersGroup = useRef<any>(null);
  const layersControl = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (!window.L) return;

    if (!mapInstance.current) {
      // Base Layers
      const darkBasemap = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap, © CartoDB', maxZoom: 18
      });

      const satelliteBasemap = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community', maxZoom: 18
      });

      const streetBasemap = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 18
      });

      mapInstance.current = window.L.map(mapContainer.current, { 
          zoomControl: false,
          layers: [darkBasemap] // Default layer
      }).setView([-5.10, 105.60], 10);

      // WMS Overlay
      const wmsLayer = window.L.tileLayer.wms('https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/Administrasi_AR_KelDesa_10K/MapServer/WMSServer', {
        layers: '0', 
        format: 'image/png',
        transparent: true,
        version: '1.3.0',
        attribution: 'Badan Informasi Geospasial'
      });
      // Add overlay by default
      wmsLayer.addTo(mapInstance.current);

      // Layer Control
      const baseMaps = {
          "Dark Mode": darkBasemap,
          "Satellite": satelliteBasemap,
          "Street": streetBasemap
      };

      const overlayMaps = {
          "Batas Administrasi (BIG)": wmsLayer
      };

      layersControl.current = window.L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(mapInstance.current);

      window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
      markersGroup.current = window.L.layerGroup().addTo(mapInstance.current);
    }
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markersGroup.current) return;
    
    markersGroup.current.clearLayers();
    
    data.forEach(d => {
      let color = d.status === 'MANDIRI' ? '#10B981' : (d.status === 'MAJU' ? '#0EA5E9' : '#F59E0B');
      const marker = window.L.circleMarker([d.lat, d.lng], {
        radius: 6, fillColor: color, color: "#fff", weight: 1, opacity: 0.8, fillOpacity: 0.7
      });
      
      // Enhanced Interactive Popup
      const popupNode = document.createElement('div');
      popupNode.className = "min-w-[200px]";
      
      popupNode.innerHTML = `
        <div class="font-sans text-slate-200">
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">${d.kec}</div>
            <div class="text-lg font-bold text-white mb-3 leading-tight">${d.desa}</div>
            
            <div class="grid grid-cols-2 gap-2 mb-4">
                <div class="flex flex-col bg-slate-800/50 p-2 rounded border border-slate-700">
                    <span class="text-[9px] text-slate-500 uppercase">Status</span>
                    <span class="text-xs font-bold ${d.status === 'MANDIRI' ? 'text-green-400' : d.status === 'MAJU' ? 'text-blue-400' : 'text-yellow-400'}">${d.status}</span>
                </div>
                <div class="flex flex-col bg-slate-800/50 p-2 rounded border border-slate-700">
                    <span class="text-[9px] text-slate-500 uppercase">Skor IDM</span>
                    <span class="text-xs font-mono font-bold text-white">${d.skor}</span>
                </div>
            </div>

            ${d.coordinateStatus === 'ESTIMATED' ? `
            <div class="flex items-start gap-1.5 text-[9px] text-amber-500/80 bg-amber-900/10 p-2 rounded border border-amber-900/20 mb-3">
                <i class="fa-solid fa-triangle-exclamation mt-0.5"></i>
                <span class="leading-tight">Lokasi estimasi (Centroid).</span>
            </div>` : ''}
        </div>
      `;

      const btn = document.createElement('button');
      btn.className = "w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-2 shadow-lg";
      btn.innerHTML = '<span>Lihat Detail</span> <i class="fa-solid fa-arrow-right"></i>';
      btn.onclick = (e) => {
          e.stopPropagation();
          onSelect(d);
          marker.closePopup();
      };
      popupNode.appendChild(btn);

      marker.bindPopup(popupNode, {
          maxWidth: 240,
          className: 'custom-popup-dark'
      });
      
      // Tooltip
      marker.bindTooltip(d.desa, {
        direction: 'top', 
        offset: [0, -5],
        opacity: 0.9,
        className: 'font-bold text-xs bg-slate-800 text-slate-200 border-slate-600 px-2 py-1' 
      });
      
      marker.addTo(markersGroup.current);
    });
  }, [data, onSelect]);

  return (
    <div className="flex-1 relative">
      <div ref={mapContainer} className="w-full h-full z-0"></div>
      <div className="absolute bottom-6 right-6 z-[500] bg-slate-800/90 backdrop-blur p-3 rounded-lg border border-slate-700 shadow-xl w-40">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Legenda</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> <span className="text-gray-300">Mandiri</span></div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> <span className="text-gray-300">Maju</span></div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> <span className="text-gray-300">Berkembang</span></div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-700 space-y-1 text-xs">
             <div className="flex items-center gap-2"><span className="w-2 h-0.5 bg-gray-400"></span> <span className="text-gray-400 text-[10px]">Batas Admin (BIG)</span></div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-700">
             <div className="text-[9px] text-slate-500 text-center">Sumber: Badan Informasi Geospasial</div>
        </div>
      </div>
    </div>
  );
};

const TableView = ({ data, onSelect }: { data: VillageData[], onSelect: (v: VillageData) => void }) => {
  return (
    <div className="flex-1 bg-slate-900 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-800 text-slate-400 sticky top-0 z-10 shadow-md uppercase">
            <tr>
              <th className="p-3 border-b border-slate-700">Kode</th>
              <th className="p-3 border-b border-slate-700">Kecamatan</th>
              <th className="p-3 border-b border-slate-700">Desa</th>
              <th className="p-3 border-b border-slate-700 text-center">Status</th>
              <th className="p-3 border-b border-slate-700 text-center font-bold text-white bg-slate-700/50">Skor</th>
              <th className="p-3 border-b border-slate-700 text-center text-blue-400">DLD</th>
              <th className="p-3 border-b border-slate-700 text-center text-purple-400">DS</th>
              <th className="p-3 border-b border-slate-700 text-center text-green-400">DE</th>
              <th className="p-3 border-b border-slate-700 text-center text-teal-400">DL</th>
              <th className="p-3 border-b border-slate-700 text-center text-orange-400">DA</th>
              <th className="p-3 border-b border-slate-700 text-center text-pink-400">TK</th>
              <th className="p-3 border-b border-slate-700"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {data.map(d => (
              <tr key={d.id} className="hover:bg-slate-800/50 border-b border-slate-800/50 transition">
                <td className="p-4 text-slate-500">{d.kode}</td>
                <td className="p-4 font-medium">{d.kec}</td>
                <td className="p-4 font-bold text-white">{d.desa}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${d.status === 'MANDIRI' ? 'bg-green-900/30 text-green-400 border-green-900' : d.status === 'MAJU' ? 'bg-blue-900/30 text-blue-400 border-blue-900' : 'bg-yellow-900/30 text-yellow-400 border-yellow-900'}`}>
                    {d.status}
                  </span>
                </td>
                <td className="p-4 text-center font-mono font-bold text-white bg-slate-800 border-x border-slate-700">{d.skor}</td>
                <td className="p-2 text-center text-blue-400">{d.dimensi.dld}</td>
                <td className="p-2 text-center text-purple-400">{d.dimensi.ds}</td>
                <td className="p-2 text-center text-green-400">{d.dimensi.de}</td>
                <td className="p-2 text-center text-teal-400">{d.dimensi.dl}</td>
                <td className="p-2 text-center text-orange-400">{d.dimensi.da}</td>
                <td className="p-2 text-center text-pink-400">{d.dimensi.dtkpd}</td>
                <td className="p-4 text-center">
                   <button onClick={() => onSelect(d)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-eye"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatsView = ({ data }: { data: VillageData[] }) => {
  const chartStatusRef = useRef<HTMLCanvasElement>(null);
  const chartDimRef = useRef<HTMLCanvasElement>(null);
  const chartKecRef = useRef<HTMLCanvasElement>(null);
  
  // Instance refs to destroy old charts
  const statusChart = useRef<any>(null);
  const dimChart = useRef<any>(null);
  const kecChart = useRef<any>(null);

  useEffect(() => {
    if (!window.Chart) return;

    // 1. Status Doughnut
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
                    backgroundColor: ['#10B981', '#0EA5E9', '#F59E0B'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } } }
        });
    }

    // 2. Dimensions Bar
    if (dimChart.current) dimChart.current.destroy();
    // Calculate avgs
    const sums = { dld:0, ds:0, de:0, dl:0, da:0, dtkpd:0 };
    data.forEach(d => {
        sums.dld += d.dimensi.dld;
        sums.ds += d.dimensi.ds;
        sums.de += d.dimensi.de;
        sums.dl += d.dimensi.dl;
        sums.da += d.dimensi.da;
        sums.dtkpd += d.dimensi.dtkpd;
    });
    const len = data.length || 1;
    
    if (chartDimRef.current) {
        dimChart.current = new window.Chart(chartDimRef.current, {
            type: 'bar',
            data: {
                labels: ['Layanan', 'Sosial', 'Ekonomi', 'Lingkungan', 'Akses', 'Tata Kelola'],
                datasets: [{
                    label: 'Rata-rata Skor',
                    data: [sums.dld/len, sums.ds/len, sums.de/len, sums.dl/len, sums.da/len, sums.dtkpd/len],
                    backgroundColor: '#3B82F6',
                    borderRadius: 4
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } }, 
                scales: { 
                    y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, 
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } } 
                } 
            }
        });
    }

    // 3. Kecamatan Ranking
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
        kecChart.current = new window.Chart(chartKecRef.current, {
            type: 'bar',
            data: {
                labels: sortedKec.map(k=>k.name),
                datasets: [{ label: 'Rata-rata Skor', data: sortedKec.map(k=>k.avg), backgroundColor: '#10B981', borderRadius: 4 }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    x: { ticks: { color: '#94A3B8', font: {size:9} }, grid: { display:false } }, 
                    y: { min: 60, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } } 
                }, 
                plugins: { legend: { display: false } } 
            }
        });
    }

  }, [data]);

  return (
    <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="glass p-5 rounded-xl">
                <h3 className="text-sm font-bold text-white mb-4">Sebaran Status IDM</h3>
                <div className="h-64"><canvas ref={chartStatusRef}></canvas></div>
            </div>
            <div className="glass p-5 rounded-xl">
                <h3 className="text-sm font-bold text-white mb-4">Rata-rata Skor per Dimensi</h3>
                <div className="h-64"><canvas ref={chartDimRef}></canvas></div>
            </div>
        </div>
        <div className="glass p-5 rounded-xl">
            <h3 className="text-sm font-bold text-white mb-4">Peringkat Kecamatan (Berdasarkan Rata-rata Skor)</h3>
            <div className="h-80"><canvas ref={chartKecRef}></canvas></div>
        </div>
    </div>
  );
};

const RpjmdView = () => {
  const [filterMission, setFilterMission] = useState<string>('ALL');

  const filteredPrograms = useMemo(() => {
    if (filterMission === 'ALL') return rpjmdPrograms;
    return rpjmdPrograms.filter(p => p.missionId.toString() === filterMission);
  }, [filterMission]);

  return (
    <div className="flex-1 p-6 overflow-auto bg-slate-900">
       {/* Quick Wins Section */}
       <div className="mb-8">
         <div className="flex items-center gap-2 mb-4">
            <div className="bg-green-500/20 p-2 rounded-lg text-green-400"><i className="fa-solid fa-bolt"></i></div>
            <h2 className="text-xl font-bold text-white">Program Hasil Terbaik Cepat (Quick Wins)</h2>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickWins.map((win, idx) => (
                <div key={idx} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-start gap-3 hover:bg-slate-800 transition group">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-lg group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
                        <i className={`fa-solid ${win.icon}`}></i>
                    </div>
                    <div>
                        <span className="text-sm font-bold text-slate-200 block mb-0.5">{win.title}</span>
                        <span className="text-[11px] text-slate-400 leading-tight block">{win.desc}</span>
                    </div>
                </div>
            ))}
         </div>
       </div>

       {/* Matrix Filter */}
       <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <i className="fa-solid fa-list-check text-blue-500"></i> Matriks Kinerja RPJMD 2025-2029
          </h2>
          <select 
            className="bg-slate-800 text-slate-200 text-xs sm:text-sm rounded-lg border border-slate-600 p-2.5 focus:ring-blue-500 focus:border-blue-500 outline-none min-w-[240px]"
            value={filterMission}
            onChange={(e) => setFilterMission(e.target.value)}
          >
            <option value="ALL">Semua Misi Pembangunan</option>
            {missions.map(m => (
                <option key={m.id} value={m.id.toString()}>Misi {m.id}: {m.title}</option>
            ))}
          </select>
       </div>

       {/* Matrix Content */}
       <div className="space-y-4">
         {filteredPrograms.map(prog => (
             <div key={prog.id} className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden hover:bg-slate-800/50 transition group">
                 <div className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left: Program Info */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-800/50">
                                        MISI {prog.missionId}
                                    </span>
                                    {prog.isQuickWin && (
                                        <span className="text-[10px] font-bold bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-800/50 flex items-center gap-1">
                                            <i className="fa-solid fa-bolt text-[9px]"></i> QUICK WIN
                                        </span>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-base font-bold text-white mb-1">{prog.program}</h3>
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-3">
                                <i className="fa-solid fa-building-columns text-[10px]"></i> {prog.opd}
                            </p>
                            
                            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 font-semibold">Indikator Kinerja</p>
                                <p className="text-sm text-slate-200 font-medium">{prog.indicator}</p>
                            </div>
                        </div>

                        {/* Right: Targets & Budget */}
                        <div className="lg:w-1/2 flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/30">
                                    <p className="text-[10px] text-slate-500 uppercase mb-1">Kondisi Awal (2024)</p>
                                    <p className="text-lg font-bold text-white">{prog.baseline2024}</p>
                                </div>
                                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/30">
                                    <p className="text-[10px] text-slate-500 uppercase mb-1">Target Akhir (2030)</p>
                                    <p className="text-lg font-bold text-green-400">{prog.targets[2030].target}</p>
                                </div>
                            </div>
                            
                            <div className="mt-auto">
                                <div className="flex justify-between items-end mb-2">
                                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Proyeksi Anggaran (5 Tahun)</p>
                                    <p className="text-sm font-mono font-bold text-blue-300">
                                        {fmtMoney(Object.values(prog.targets).reduce((sum: number, t: any) => sum + t.pagu, 0))}
                                    </p>
                                </div>
                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                                    {Object.entries(prog.targets).map(([year, t]: [string, any], idx) => (
                                        <div 
                                            key={year} 
                                            className={`h-full ${idx%2===0 ? 'bg-blue-500' : 'bg-blue-600'}`} 
                                            style={{width: '20%'}} 
                                            title={`Tahun ${year}: ${fmtMoney(t.pagu)}`}
                                        ></div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-600 mt-1 font-mono">
                                    <span>2026</span><span>2027</span><span>2028</span><span>2029</span><span>2030</span>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
             </div>
         ))}
       </div>
    </div>
  );
};

const DetailModal = ({ d, onClose }: { d: VillageData, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'dimensions' | 'indicators'>('summary');

  // Grouping configuration with dynamic offset calculation
  const dimensions = useMemo(() => {
      const rawDims = [
          { id: 'dld', name: 'Layanan Dasar (DLD)', color: 'bg-blue-500', text: 'text-blue-400', items: d.indikator.dld, score: d.dimensi.dld },
          { id: 'ds', name: 'Sosial (DS)', color: 'bg-purple-500', text: 'text-purple-400', items: d.indikator.ds, score: d.dimensi.ds },
          { id: 'de', name: 'Ekonomi (DE)', color: 'bg-green-500', text: 'text-green-400', items: d.indikator.de, score: d.dimensi.de },
          { id: 'dl', name: 'Lingkungan (DL)', color: 'bg-teal-500', text: 'text-teal-400', items: d.indikator.dl, score: d.dimensi.dl }, 
          { id: 'da', name: 'Aksesibilitas (DA)', color: 'bg-orange-500', text: 'text-orange-400', items: d.indikator.da, score: d.dimensi.da }, 
          { id: 'dtkpd', name: 'Tata Kelola (TK)', color: 'bg-pink-500', text: 'text-pink-400', items: d.indikator.dtkpd, score: d.dimensi.dtkpd },
      ];

      let currentOffset = 0;
      return rawDims.map(dim => {
          const offset = currentOffset;
          currentOffset += dim.items.length;
          return { ...dim, offset };
      });
  }, [d]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] transform transition-all">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-start bg-slate-900/50 rounded-t-xl shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-white">{d.desa}</h2>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">{d.kec} <span className="mx-1">•</span> {d.kode}</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white p-1 hover:bg-slate-700 rounded-full transition"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-700 bg-slate-800/50">
                <button 
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 py-3 text-xs font-bold tracking-wide uppercase transition flex items-center justify-center gap-2 ${activeTab === 'summary' ? 'text-white border-b-2 border-blue-500 bg-slate-700/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/10'}`}
                >
                    <i className="fa-solid fa-clipboard-list"></i> Ringkasan
                </button>
                <button 
                    onClick={() => setActiveTab('dimensions')}
                    className={`flex-1 py-3 text-xs font-bold tracking-wide uppercase transition flex items-center justify-center gap-2 ${activeTab === 'dimensions' ? 'text-white border-b-2 border-blue-500 bg-slate-700/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/10'}`}
                >
                    <i className="fa-solid fa-layer-group"></i> Dimensi
                </button>
                <button 
                    onClick={() => setActiveTab('indicators')}
                    className={`flex-1 py-3 text-xs font-bold tracking-wide uppercase transition flex items-center justify-center gap-2 ${activeTab === 'indicators' ? 'text-white border-b-2 border-blue-500 bg-slate-700/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/10'}`}
                >
                    <i className="fa-solid fa-list-check"></i> Indikator
                </button>
            </div>
            
            <div className="p-5 overflow-y-auto custom-scrollbar bg-slate-900/30 flex-1">
                
                {/* Tab Content: Summary */}
                {activeTab === 'summary' && (
                    <div className="space-y-6 animate-slide-in">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700/50 text-center shadow-sm hover:border-slate-600 transition">
                                <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <i className="fa-solid fa-award text-lg"></i>
                                </div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Status IDM</p>
                                <p className={`text-2xl font-extrabold ${d.status === 'MANDIRI' ? 'text-green-500' : d.status === 'MAJU' ? 'text-blue-500' : 'text-yellow-500'}`}>{d.status}</p>
                            </div>
                            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700/50 text-center shadow-sm hover:border-slate-600 transition">
                                <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <i className="fa-solid fa-chart-line text-lg"></i>
                                </div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Skor Total</p>
                                <p className="text-2xl font-extrabold text-white">{d.skor}</p>
                            </div>
                            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700/50 text-center shadow-sm hover:border-slate-600 transition">
                                <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <i className="fa-solid fa-fingerprint text-lg"></i>
                                </div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Kode Wilayah</p>
                                <p className="text-2xl font-mono font-bold text-white">{d.kode}</p>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-900/20 to-slate-800/50 border border-blue-800/30 rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
                            <h4 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2"><i className="fa-solid fa-circle-info"></i> Informasi Desa</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Desa <strong>{d.desa}</strong> secara administratif berada di Kecamatan {d.kec}. 
                                Berdasarkan penilaian Indeks Desa Membangun (IDM) tahun 2025, desa ini diklasifikasikan sebagai desa <strong>{d.status}</strong> dengan skor akhir <strong>{d.skor}</strong>. 
                                Pencapaian ini mencerminkan ketersediaan akses layanan dasar, infrastruktur, serta tata kelola pemerintahan yang {d.status === 'MANDIRI' ? 'sangat optimal dan berkelanjutan' : d.status === 'MAJU' ? 'sudah baik namun perlu ditingkatkan' : 'sedang berkembang menuju kemandirian'}.
                            </p>
                        </div>
                    </div>
                )}

                {/* Tab Content: Dimensions */}
                {activeTab === 'dimensions' && (
                    <div className="space-y-4 animate-slide-in">
                        {dimensions.map((dim) => (
                            <div key={dim.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700/60 hover:border-slate-600 transition">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg ${dim.color} bg-opacity-20 flex items-center justify-center`}>
                                            <span className={`font-bold ${dim.text} text-xs`}>{dim.name.match(/\(([^)]+)\)/)?.[1]}</span>
                                        </div>
                                        <h5 className={`text-sm font-bold text-slate-200`}>{dim.name.split('(')[0]}</h5>
                                    </div>
                                    <span className="text-lg font-bold text-white">{dim.score}</span>
                                </div>
                                {/* Visualization bar relative to a hypothetical max score */}
                                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/30">
                                    <div className={`${dim.color} h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]`} style={{width: `${Math.min(100, (dim.score / 170) * 100)}%`}}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab Content: Indicators */}
                {activeTab === 'indicators' && (
                    <div className="space-y-8 animate-slide-in">
                        {dimensions.map((dim) => (
                            <div key={dim.id}>
                                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-slate-800/95 backdrop-blur py-2 z-10 border-b border-slate-700/50">
                                    <div className={`w-2.5 h-2.5 rounded-full ${dim.color} shadow-[0_0_8px_currentColor]`}></div>
                                    <h5 className={`text-xs font-bold uppercase tracking-widest ${dim.text}`}>{dim.name}</h5>
                                </div>
                                
                                {/* Compact Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {dim.items.map((val, i) => {
                                        const globalIdx = dim.offset + i;
                                        const name = INDICATOR_NAMES[globalIdx] || `Indikator ${globalIdx + 1}`;
                                        const v = Math.min(5, Math.max(1, Math.round(val)));
                                        const barColor = v >= 4 ? 'bg-green-500' : (v >= 3 ? 'bg-blue-500' : 'bg-yellow-500');
                                        const scoreColor = v >= 4 ? 'text-green-400 border-green-900/50 bg-green-900/20' : (v >= 3 ? 'text-blue-400 border-blue-900/50 bg-blue-900/20' : 'text-yellow-400 border-yellow-900/50 bg-yellow-900/20');
                                        
                                        return (
                                            <div key={i} className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/40 hover:border-slate-600 hover:bg-slate-800/60 transition-all group flex flex-col justify-between h-full relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-2 gap-2">
                                                    <span className="text-[11px] text-slate-400 group-hover:text-slate-200 font-medium leading-tight line-clamp-2" title={name}>
                                                        {name}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${scoreColor} shrink-0`}>
                                                        {v}
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-auto border border-slate-800">
                                                    <div className={`${barColor} h-full rounded-full transition-all duration-500`} style={{width: `${v*20}%`}}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
        <style>{`
            .animate-fade-in { animation: fadeIn 0.2s ease-out; }
            .animate-slide-in { animation: slideIn 0.3s ease-out; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [data, setData] = useState<VillageData[]>([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'map' | 'table' | 'stats' | 'rpjmd'>('map');
  const [selectedVillage, setSelectedVillage] = useState<VillageData | null>(null);

  useEffect(() => {
    setData(getProcessedData());
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(d => {
        const matchStatus = filterStatus === 'ALL' || d.status === filterStatus;
        const matchSearch = searchTerm === '' || 
                            d.desa.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            d.kec.toLowerCase().includes(searchTerm.toLowerCase());
        return matchStatus && matchSearch;
    });
  }, [data, filterStatus, searchTerm]);

  const kpi = useMemo(() => {
    return {
        mandiri: filteredData.filter(x => x.status === 'MANDIRI').length,
        maju: filteredData.filter(x => x.status === 'MAJU').length,
        berkembang: filteredData.filter(x => x.status === 'BERKEMBANG').length
    }
  }, [filteredData]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-900 text-slate-100 font-inter">
      <Navbar kpi={kpi} data={filteredData} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar is only needed for data views, not strategic RPJMD view */}
        <Sidebar 
            data={filteredData} 
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSelect={(v) => {
                setSelectedVillage(v);
            }}
            showList={view !== 'rpjmd'} 
        />

        <main className="flex-1 flex flex-col bg-slate-900 relative">
             <div className="h-12 bg-slate-800/50 border-b border-slate-700 flex items-end px-4 gap-1 shrink-0 overflow-x-auto">
                <button 
                    onClick={() => setView('map')} 
                    className={`px-4 py-2 text-xs font-bold rounded-t transition whitespace-nowrap ${view === 'map' ? 'text-white border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800 border-b-2 border-transparent'}`}
                >
                    <i className="fa-solid fa-map mr-2"></i> Peta Sebaran
                </button>
                <button 
                    onClick={() => setView('table')} 
                    className={`px-4 py-2 text-xs font-bold rounded-t transition whitespace-nowrap ${view === 'table' ? 'text-white border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800 border-b-2 border-transparent'}`}
                >
                    <i className="fa-solid fa-table mr-2"></i> Tabel Data
                </button>
                <button 
                    onClick={() => setView('stats')} 
                    className={`px-4 py-2 text-xs font-bold rounded-t transition whitespace-nowrap ${view === 'stats' ? 'text-white border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800 border-b-2 border-transparent'}`}
                >
                    <i className="fa-solid fa-chart-pie mr-2"></i> Analisis
                </button>
                <button 
                    onClick={() => setView('rpjmd')} 
                    className={`px-4 py-2 text-xs font-bold rounded-t transition whitespace-nowrap ${view === 'rpjmd' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-900/20' : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-900/10 border-b-2 border-transparent'}`}
                >
                    <i className="fa-solid fa-scroll mr-2"></i> Perencanaan (RPJMD)
                </button>
            </div>

            <div className="flex-1 relative overflow-hidden flex flex-col">
                {view === 'map' && <MapView data={filteredData} onSelect={setSelectedVillage} />}
                {view === 'table' && <TableView data={filteredData} onSelect={setSelectedVillage} />}
                {view === 'stats' && <StatsView data={filteredData} />}
                {view === 'rpjmd' && <RpjmdView />}
            </div>
        </main>
      </div>

      {selectedVillage && <DetailModal d={selectedVillage} onClose={() => setSelectedVillage(null)} />}
    </div>
  );
}
