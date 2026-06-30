import { useState, useEffect } from "react";
import axios from "axios";
import SalesChart from "../components/SalesChart";

// Helper format Rupiah otomatis
const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");

// ... import dan fungsi formatRp ...

function Dashboard() {
  const [stats, setStats] = useState({
    totalProduk: 0,
    totalTransaksi: 0,
    totalPenjualan: 0,
  });
  const [produkTerlaris, setProdukTerlaris] = useState([]);
  const [transaksiTerbaru, setTransaksiTerbaru] = useState([]);
  
  // 1. TAMBAHKAN STATE UNTUK DATA GRAFIK
  const [dataGrafik, setDataGrafik] = useState([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/dashboard");
        const resData = response.data;

        setStats({
          totalProduk: resData.total_produk || 0,
          totalTransaksi: resData.total_transaksi || 0,
          totalPenjualan: resData.total_penjualan || 0,
        });

        setProdukTerlaris(resData.produk_terlaris || []);
        setTransaksiTerbaru(resData.transaksi_terbaru || []);
        
        // 2. SIMPAN CHART DATA DARI BACKEND KE STATE
        setDataGrafik(resData.chartData || []);
        
      } catch (error) {
        console.error("Gagal memuat data dashboard dari backend:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  
  // ... sisa kode sampai ke bagian render grafik ...

  // Map data ke format statCards (sisa 3 card)
  const statCards = [
    { label: "Total Produk", value: stats.totalProduk, color: "#6F4E37" },
    { label: "Total Transaksi", value: stats.totalTransaksi, color: "#8B6343" },
    { label: "Total Penjualan", value: formatRp(stats.totalPenjualan), color: "#A0522D" },
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-warning" role="status"></div>
        <p className="mt-2 text-muted">Memuat data dashboard Srabi Solo...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 style={{ color: "#6F4E37", fontWeight: 700 }}>Dashboard</h2>
        <p className="text-muted mb-0">Selamat datang di Sistem Informasi Penjualan UMKM Srabi Solo</p>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {statCards.map((card, i) => (
          // Diubah dari col-md-3 menjadi col-md-4 agar 3 card mengisi penuh lebar layar
          <div className="col-md-4 col-sm-12" key={i}>
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px", backgroundColor: card.color }}>
              <div className="card-body text-white">
                <div style={{ fontSize: "0.8rem", opacity: 0.85, marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {card.label}
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{card.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Terlaris */}
      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
            <div className="card-header border-0 pt-3 pb-0" style={{ backgroundColor: "#6F4E37", borderRadius: "12px 12px 0 0" }}>
              <h6 className="text-white pb-2" style={{ justifySelf: "center", fontWeight: 600 }}>Grafik Penjualan</h6>
            </div>
            <div className="card-body">
              {/* PERBAIKAN DI SINI: Tambahkan chartData={dataGrafik} */}
              <SalesChart chartData={dataGrafik} />
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
            <div className="card-header border-0 pt-3 pb-0" style={{ backgroundColor: "#6F4E37", borderRadius: "12px 12px 0 0" }}>
              <h6 className="text-white pb-2" style={{ justifySelf: "center", fontWeight: 600 }}>Produk Terlaris</h6>
            </div>
            <div className="card-body p-0">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#f8f5f0" }}>
                  <tr>
                    <th style={{ color: "#6F4E37", fontSize: "0.85rem" }}>Produk</th>
                    <th style={{ color: "#6F4E37", fontSize: "0.85rem", width: "25%" }}>Terjual</th>
                    <th style={{ color: "#6F4E37", fontSize: "0.85rem", width: "25%" }}>Stok</th> {/* Tambahan Header Stok */}
                  </tr>
                </thead>
                <tbody>
                  {produkTerlaris.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-muted py-3">Belum ada data</td></tr>
                  ) : (
                    produkTerlaris.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: "0.9rem" }}>{p.nama_produk}</td>
                        <td style={{ color: "#C8813A", fontWeight: 600 }}>{p.terjual}</td>
                        <td style={{ color: "#6F4E37", fontWeight: 600 }}>{p.stok || 0}</td> {/* Tambahan Data Stok */}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Transaksi Terbaru */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
        <div className="card-header border-0 pt-3 pb-0" style={{ backgroundColor: "#6F4E37", borderRadius: "12px 12px 0 0" }}>
          <h6 className="text-white pb-2" style={{ justifySelf: "center", fontWeight: 600 }}>Transaksi Terbaru</h6>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive" style={{ borderRadius: "0 0 12px 12px" }}>
            <table className="table table-hover mb-0">
              <thead style={{ backgroundColor: "#f8f5f0" }}>
                <tr>
                  {["No", "Tanggal", "Produk", "Jumlah", "Total"].map((h) => (
                    <th key={h} style={{ color: "#6F4E37", fontSize: "0.85rem" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transaksiTerbaru.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted py-3">Tidak ada transaksi terbaru</td></tr>
                ) : (
                  transaksiTerbaru.map((t, idx) => (
                    <tr key={t.id_transaksi || idx}>
                      <td>{idx + 1}</td>
                      <td>{t.tanggal ? new Date(t.tanggal).toLocaleDateString("id-ID") : "-"}</td>
                      <td>{t.produk_list || "-"}</td>
                      <td>{t.total_qty || 0}</td>
                      <td style={{ color: "#6F4E37", fontWeight: 600 }}>{formatRp(t.total_harga || 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;