import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ── Helpers ─────────────────────────────────────────────────────
const formatRp   = (n) => "Rp " + Number(n).toLocaleString("id-ID");
const toDate     = (s) => new Date(s + "T00:00:00");
const weekLabel  = (d) => { 
  const s = new Date(d); 
  s.setDate(s.getDate() - s.getDay()); 
  return s.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }); 
};
const monthLabel = (s) => { 
  const d = toDate(s); 
  return d.toLocaleDateString("id-ID", { month: "short", year: "numeric" }); 
};

function groupData(data, mode) {
  const map = {};
  data.forEach((t) => {
    let key;
    const tanggalBersih = t.tanggal ? t.tanggal.slice(0, 10) : "";
    if (mode === "harian") key = tanggalBersih;
    else if (mode === "mingguan") key = weekLabel(toDate(t.tanggal));
    else key = t.tanggal.slice(0, 7);

    if (!map[key]) {
      map[key] = { 
        label: mode === "bulanan" ? monthLabel(t.tanggal) : key, 
        penjualan: 0, 
        transaksi: 0 
      };
    }
    // Tambahkan parseFloat di sini agar nilai grafik tidak korup menjadi NaN
    map[key].penjualan += parseFloat(t.total_harga || 0);
    map[key].transaksi += 1;
  });
  return Object.values(map).sort((a, b) => (a.label > b.label ? 1 : -1));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e8d8cc", borderRadius: "8px", padding: "10px 14px", fontSize: "13px" }}>
      <p style={{ color: "#6F4E37", fontWeight: 700, margin: "0 0 6px" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: <strong>{p.name === "Penjualan" ? formatRp(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────
export default function Laporan() {
  const [dari, setDari]         = useState("2026-04-01");
  const [sampai, setSampai]     = useState("2026-06-30");
  const [periode, setPeriode]   = useState("harian");
  const [chartType, setChartType] = useState("line");
  
  // State untuk menampung data dari MySQL
  const [allTransaksi, setAllTransaksi] = useState([]);
  const [loading, setLoading]           = useState(false);

  const handleCetak = () => {
    window.open(
      `http://localhost:5000/api/laporan/cetak?dariTanggal=${dari}&sampaiTanggal=${sampai}`,
      "_blank"
    );
  };

  const formatTanggal = (tanggal) => {
    return new Date(tanggal).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Fungsi ambil data dari backend berdasarkan rentang tanggal
  const fetchLaporanData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/laporan", {
        params: { dariTanggal: dari, sampaiTanggal: sampai }
      });
      setAllTransaksi(response.data);
    } catch (error) {
      console.error("Gagal memuat data laporan dari backend:", error);
      alert("Gagal mengambil data laporan dari server!");
    } finally {
      setLoading(false);
    }
  };

  // Ambil data otomatis saat pertama kali komponen di-render atau filter tanggal berubah
  useEffect(() => {
    fetchLaporanData();
  }, [dari, sampai]);

  // Menggunakan data hasil fetch dari database untuk diproses ke summary & chart
  const totalPenjualan = useMemo(() => 
    allTransaksi.reduce((s, t) => s + parseFloat(t.total_harga || 0), 0), 
    [allTransaksi]
  );
  
  const totalItem = useMemo(() => 
    allTransaksi.reduce((s, t) => s + (t.detail ? t.detail.reduce((x, d) => x + parseInt(d.jumlah || 0), 0) : 0), 0), 
    [allTransaksi]
  );
  const chartData      = useMemo(() => groupData(allTransaksi, periode), [allTransaksi, periode]);

  const ringkasan = [
    { label: "Total Transaksi",    value: allTransaksi.length,     cls: "laporan-card-1" },
    { label: "Total Item Terjual", value: totalItem,               cls: "laporan-card-2" },
    { label: "Total Penjualan",    value: formatRp(totalPenjualan), cls: "laporan-card-3" },
  ];

  const periodeOpts   = ["harian"];
  const chartTypeOpts = [{ val: "line", label: "Line" }, { val: "bar", label: "Bar" }];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Laporan Penjualan</h2>
          <p>Lihat dan cetak laporan berdasarkan periode</p>
        </div>
        <button className= "btn btn-srabi"onClick={handleCetak}>🖨️ Cetak Laporan</button>
      </div>

      {/* Filter */}
      <div className="panel-card card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            {[{ label: "Dari Tanggal", value: dari, setter: setDari }, { label: "Sampai Tanggal", value: sampai, setter: setSampai }].map(({ label, value, setter }) => (
              <div className="col-md-3" key={label}>
                <label className="form-label">{label}</label>
                <input type="date" className="form-control" value={value} onChange={(e) => setter(e.target.value)} />
              </div>
            ))}
            <div className="col-md-3">
              <label className="form-label">Periode Grafik</label>
              <div className="d-flex gap-1">
                {periodeOpts.map((p) => (
                  <button key={p} onClick={() => setPeriode(p)}
                    className="btn btn-sm flex-fill"
                    style={{
                      backgroundColor: periode === p ? "#6F4E37" : "#f8f5f0",
                      color: periode === p ? "#fff" : "#6F4E37",
                      border: "1px solid #C89467", borderRadius: "6px",
                      textTransform: "capitalize", fontWeight: 500,
                    }}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label">Jenis Grafik</label>
              <div className="d-flex gap-1">
                {chartTypeOpts.map(({ val, label }) => (
                  <button key={val} onClick={() => setChartType(val)}
                    className="btn btn-sm flex-fill"
                    style={{
                      backgroundColor: chartType === val ? "#C8813A" : "#f8f5f0",
                      color: chartType === val ? "#fff" : "#6F4E37",
                      border: "1px solid #C89467", borderRadius: "6px", fontWeight: 500,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Konten Utama */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
          <p className="mt-2 text-muted">Memuat data dari database...</p>
        </div>
      ) : (
        <>
          {/* Ringkasan */}
          <div className="row g-3 mb-4">
            {ringkasan.map(({ label, value, cls }) => (
              <div className="col-md-4" key={label}>
                <div className={`laporan-card ${cls}`}>
                  <div className="laporan-card-label">{label}</div>
                  <div className="laporan-card-value">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Grafik */}
          <div className="panel-card card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 style={{ color: "#6F4E37", fontWeight: 700, margin: 0 }}>
                  Grafik Penjualan — {periode.charAt(0).toUpperCase() + periode.slice(1)}
                </h6>
              </div>

              {chartData.length === 0 ? (
                <div className="text-center text-muted py-5">Tidak ada data untuk periode ini</div>
              ) : (
                <>
                  <p style={{ color: "#6F4E37", fontWeight: 600, fontSize: "13px", marginBottom: "4px" }}>Total Penjualan (Rp)</p>
                  <ResponsiveContainer width="100%" height={220}>
                    {chartType === "line" ? (
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0e6da" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A0522D" }} />
                        <YAxis tickFormatter={(v) => "Rp " + (v / 1000) + "k"} tick={{ fontSize: 11, fill: "#A0522D" }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="penjualan" name="Penjualan" stroke="#6F4E37" strokeWidth={2.5} dot={{ r: 4, fill: "#6F4E37" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    ) : (
                      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0e6da" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A0522D" }} />
                        <YAxis tickFormatter={(v) => "Rp " + (v / 1000) + "k"} tick={{ fontSize: 11, fill: "#A0522D" }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="penjualan" name="Penjualan" fill="#6F4E37" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>

                  {/* Chart Jumlah Transaksi */}
                  <p style={{ color: "#C8813A", fontWeight: 600, fontSize: "13px", margin: "20px 0 4px" }}>Jumlah Transaksi</p>
                  <ResponsiveContainer width="100%" height={180}>
                    {chartType === "line" ? (
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0e6da" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A0522D" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#A0522D" }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="transaksi" name="Transaksi" stroke="#C8813A" strokeWidth={2.5} dot={{ r: 4, fill: "#C8813A" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    ) : (
                      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0e6da" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A0522D" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#A0522D" }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="transaksi" name="Transaksi" fill="#C8813A" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </>
              )}
            </div>
          </div>

          {/* Tabel */}
          <div className="panel-card card">
            <div className="card-header border-0 bg-white pt-3">
            <h5>Detail Transaksi — {formatTanggal(dari)} s/d {formatTanggal(sampai)}</h5>
              <h6 style={{ color: "#6F4E37", fontWeight: 600 }}>
              <span className="text-muted ms-2" style={{ fontSize: "13px", fontWeight: 400 }}>({allTransaksi.length} transaksi)</span>
              </h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle srabi-table mb-0">
                  <thead>
                    <tr><th>No</th><th>Tanggal</th><th>Produk</th><th>Jumlah</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {allTransaksi.length === 0 ? (
                      <tr><td colSpan={5} className="text-center text-muted py-4">Tidak ada transaksi pada periode ini</td></tr>
                    ) : allTransaksi.map((t, i) => (
                      <tr key={t.id_transaksi}>
                        <td>{i + 1}</td>
                        <td>{new Date(t.tanggal).toLocaleDateString("id-ID")}</td>
                        <td>{t.detail ? t.detail.map((d) => `${d.nama_produk} (${d.jumlah})`).join(", ") : "-"}</td>
                        <td>{t.detail ? t.detail.reduce((s, d) => s + d.jumlah, 0) : 0}</td>
                        <td><strong style={{ color: "#6F4E37" }}>{formatRp(t.total_harga)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                  {allTransaksi.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="text-end">Total Keseluruhan</td>
                        <td><strong>{formatRp(totalPenjualan)}</strong></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}