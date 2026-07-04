import { useState, useEffect } from "react";
import axios from "axios";

function QtyInput({ value, onChange, min = 1, max = 9999 }) {
  const step = (delta) => onChange(Math.min(max, Math.max(min, (parseInt(value) || 0) + delta)));
  const handleChange = (e) => {
    const val = e.target.value;
    if (val === "") { onChange(""); return; }
    const num = parseInt(val);
    if (!isNaN(num)) onChange(Math.min(max, Math.max(min, num)));
  };
  const handleBlur = (e) => {
    if (e.target.value === "" || isNaN(parseInt(e.target.value))) onChange(min);
  };
  return (
    <div className="qty-wrap">
      <button type="button" className="qty-btn" onClick={() => step(-1)}>−</button>
      <input type="number" className="qty-input" value={value} onChange={handleChange} onBlur={handleBlur} min={min} max={max} />
      <button type="button" className="qty-btn" onClick={() => step(1)}>+</button>
    </div>
  );
}

function Transaksi() {
  // STATE DATA DARI BACKEND
  const [transaksiList, setTransaksiList] = useState([]);
  const [produkData, setProdukData] = useState([]); 

  // STATE MODAL & INTERFASE
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [jenisTransaksi, setJenisTransaksi] = useState("keluar"); // <-- TAMBAHAN: State jenis transaksi
  const [cart, setCart] = useState([]);
  const [selectedProduk, setSelectedProduk] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [search, setSearch] = useState("");
  const [notaData, setNotaData] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showNota, setShowNota] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");
  const totalCart = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // ==========================================
  // AMBIL DATA DARI BACKEND (GET)
  // ==========================================
  const fetchTransaksi = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/transaksi");
      setTransaksiList(response.data);
    } catch (error) {
      console.error("Gagal mengambil data transaksi:", error);
    }
  };

  const fetchProduk = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/produk");
      setProdukData(response.data);
    } catch (error) {
      console.error("Gagal mengambil data produk:", error);
    }
  };

  useEffect(() => {
    fetchTransaksi();
    fetchProduk();
  }, []);

  // FILTER PENCARIAN
  const filtered = transaksiList
    .filter((t) =>
     t.tanggal.includes(search) ||
    (t.jenis_transaksi && t.jenis_transaksi.toLowerCase().includes(search.toLowerCase())) || 
    (t.detail && t.detail.some((d) => d.nama_produk.toLowerCase().includes(search.toLowerCase())))
)

// Urutkan berdasarkan ID Transaksi terbesar ke terkecil (Terbaru di atas)
.sort((a, b) => b.id_transaksi - a.id_transaksi);

  // LOGIKA KERANJANG BELANJA
  const handleTambahCart = () => {
    const qty = parseInt(jumlah) || 0;
    if (!selectedProduk || qty < 1) return;
    const produk = produkData.find((p) => p.id_produk === Number(selectedProduk));
    if (!produk) return;
    const existing = cart.find((c) => c.id_produk === produk.id_produk);
    setCart(existing
      ? cart.map((c) => c.id_produk === produk.id_produk
          ? { ...c, jumlah: c.jumlah + qty, subtotal: (c.jumlah + qty) * produk.harga }
          : c)
      : [...cart, { id_produk: produk.id_produk, nama_produk: produk.nama_produk, harga: produk.harga, jumlah: qty, subtotal: produk.harga * qty }]
    );
    setSelectedProduk(""); setJumlah(1);
  };

  const handleEditCartQty = (id_produk, newQty) => {
    const qty = parseInt(newQty) || 0;
    if (qty < 1) { setCart(cart.filter((c) => c.id_produk !== id_produk)); return; }
    setCart(cart.map((c) => c.id_produk === id_produk ? { ...c, jumlah: qty, subtotal: qty * c.harga } : c));
  };

  const handleTutupModal = () => {
    setShowModal(false); 
    setCart([]); 
    setSelectedProduk("");
    setJumlah(1); 
    setTanggal(new Date().toISOString().split("T")[0]);
    setJenisTransaksi("keluar"); // <-- Reset ke default 'keluar'
  };

  // ==========================================
  // SIMPAN DATA KE BACKEND (POST)
  // ==========================================
  const handleSimpan = async () => {
    if (cart.length === 0 || !tanggal) return;

    const idUser = localStorage.getItem("id_user") || null;

    const payload = {
      tanggal,
      total_harga: totalCart,
      jenis_transaksi: jenisTransaksi, // <-- TAMBAHAN: Kirim jenis ke backend
      id_user: idUser,
      items: cart.map(item => ({
        id_produk: item.id_produk,
        jumlah: item.jumlah,
        subtotal: item.subtotal
      }))
    };

    try {
      const response = await axios.post("http://localhost:5000/api/transaksi", payload);
      
    const transaksiBaru = {
      id_transaksi: response.data.id_transaksi,
      tanggal,
      total_harga: totalCart,
      jenis_transaksi: jenisTransaksi, 
      id_user: idUser,
      detail: [...cart],
    };

    setNotaData(transaksiBaru);
    setShowModal(false);
    setShowSuccess(true);
    handleTutupModal();
    fetchTransaksi(); 
  } catch (error) {
    console.error("Gagal menyimpan transaksi:", error);
    
    // Ambil pesan dari backend
    const pesanError = error.response?.data?.error || "Gagal menyimpan transaksi ke database.";
    
    // Set pesan ke state dan munculkan pop-up gagal
    setErrorMessage(pesanError);
    setShowError(true); 
  }
};

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Transaksi Penjualan & Inventori</h2>
          <p>Catat dan kelola arus barang masuk dan keluar</p>
        </div>
        <button className="btn btn-srabi" onClick={() => setShowModal(true)}>+ Transaksi Baru</button>
      </div>

      {/* Tabel Utama */}
      <div className="panel-card card">
        <div className="card-body">
          <input type="text" className="form-control search-input" placeholder="Cari transaksi atau jenis..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <table className="table table-hover align-middle srabi-table">
            <thead>
              {/* TAMBAHAN: Judul Kolom Jenis */}
              <tr><th>No</th><th>Tanggal</th><th>Jenis</th><th>Produk</th><th>Total</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted py-4">Belum ada transaksi</td></tr>
              ) : filtered.map((t, i) => (
                <tr key={t.id_transaksi}>
                  <td>{i + 1}</td>
                  <td>{new Date(t.tanggal).toLocaleDateString("id-ID")}</td>
                  {/* TAMBAHAN: Badge Status Barang Masuk / Keluar */}
                  <td>
                    {t.jenis_transaksi === "masuk" ? (
                      <span className="badge bg-success" style={{ padding: "6px 12px" }}>Barang Masuk</span>
                    ) : (
                      <span className="badge bg-danger" style={{ padding: "6px 12px" }}>Barang Keluar</span>
                    )}
                  </td>
                  <td>{t.detail ? t.detail.map((d) => `${d.nama_produk}`).join(", ") : ""}</td>
                  <td><strong style={{ color: "#6F4E37" }}>{formatRp(t.total_harga)}</strong></td>
                  <td><button className="btn btn-sm btn-srabi-secondary" onClick={() => setShowDetail(t)}>Detail</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Transaksi Baru */}
      {showModal && (
        <div className="modal show d-block modal-srabi" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Transaksi Baru</h5>
                <button className="btn-close btn-close-white" onClick={handleTutupModal} />
              </div>
              <div className="modal-body">
                {/* TAMBAHAN LOGIKA FORM: Memilih jenis transaksi */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Tanggal</label>
                    <input type="date" className="form-control"
                      value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Jenis Transaksi</label>
                    <select className="form-select" value={jenisTransaksi} onChange={(e) => setJenisTransaksi(e.target.value)}>
                        <option value="keluar">Barang Keluar (Penjualan/Pengurangan Stok)</option>
                        <option value="masuk">Barang Masuk (Penambahan Stok)</option>
                    </select>
                  </div>
                </div>

                <div className="cart-section">
                  <label className="form-label">Tambah Produk</label>
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    <select className="form-select" style={{ minWidth: "200px", flex: 1 }}
                      value={selectedProduk} onChange={(e) => setSelectedProduk(e.target.value)}>
                      <option value="">Pilih produk...</option>
                      {produkData.map((p) => (
                        <option key={p.id_produk} value={p.id_produk}>
                          {p.nama_produk} — {formatRp(p.harga)}
                        </option>
                      ))}
                    </select>
                    <QtyInput value={jumlah} onChange={setJumlah} min={1} max={9999} />
                    <button className="btn btn-srabi" style={{ whiteSpace: "nowrap", height: "42px" }}
                      onClick={handleTambahCart}>+ Tambah</button>
                  </div>
                </div>

                {cart.length > 0 && (
                  <table className="table align-middle srabi-table mb-0 mt-3">
                    <thead>
                      <tr><th>Produk</th><th>Harga</th><th>Jumlah</th><th>Subtotal</th><th></th></tr>
                    </thead>
                    <tbody>
                      {cart.map((c) => (
                        <tr key={c.id_produk}>
                          <td><strong>{c.nama_produk}</strong></td>
                          <td>{formatRp(c.harga)}</td>
                          <td><QtyInput value={c.jumlah} onChange={(val) => handleEditCartQty(c.id_produk, val)} min={1} max={9999} /></td>
                          <td><strong style={{ color: "#6F4E37" }}>{formatRp(c.subtotal)}</strong></td>
                          <td><button className="btn btn-sm btn-danger" onClick={() => setCart(cart.filter((x) => x.id_produk !== c.id_produk))}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="cart-total">
                  <span className="text-muted me-2">Total Estimasi Nilai:</span>
                  <strong style={{ fontSize: "1.2rem" }}>{formatRp(totalCart)}</strong>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleTutupModal}>Batal</button>
                <button className="btn btn-srabi" onClick={handleSimpan} disabled={cart.length === 0}>Simpan Transaksi</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail */}
      {showDetail && (
        <div className="modal show d-block modal-srabi" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detail Transaksi #{showDetail.id_transaksi}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowDetail(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <p className="m-0">
                    <span className="text-muted">Tanggal: </span>
                    <strong style={{ color: "#6F4E37" }}>{new Date(showDetail.tanggal).toLocaleDateString("id-ID")}</strong>
                  </p>
                  {/* TAMBAHAN: Info Jenis Transaksi di Detail */}
                  <div>
                    {showDetail.jenis_transaksi === "masuk" ? (
                      <span className="badge bg-success">Barang Masuk</span>
                    ) : (
                      <span className="badge bg-danger">Barang Keluar</span>
                    )}
                  </div>
                </div>
                <table className="table srabi-table">
                  <thead>
                    <tr><th>Produk</th><th>Harga</th><th>Jumlah</th><th>Subtotal</th></tr>
                  </thead>
                  <tbody>
                    {showDetail.detail && showDetail.detail.map((d, i) => (
                      <tr key={i}>
                        <td>{d.nama_produk}</td>
                        <td>{formatRp(d.harga || 0)}</td>
                        <td>{d.jumlah}</td>
                        <td><strong style={{ color: "#6F4E37" }}>{formatRp(d.subtotal || 0)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="cart-total">
                  <span className="text-muted me-2">Total:</span>
                  <strong style={{ fontSize: "1.1rem" }}>{formatRp(showDetail.total_harga)}</strong>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDetail(null)}>Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Transaksi Sukses */}
      {showSuccess && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center p-4">
              <div style={{ fontSize: "60px" }}>✅</div>
              <h4 className="mt-3">Transaksi Berhasil Disimpan</h4>
              <p className="text-muted">Apakah Anda ingin mencetak nota?</p>
              <div className="d-flex justify-content-center gap-2 mt-4">
                <button className="btn btn-secondary" onClick={() => setShowSuccess(false)}>Tutup</button>
                <button className="btn btn-success" onClick={() => { setShowSuccess(false); setShowNota(true); }}>🖨 Cetak Nota</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRANSAKSI GAGAL (DI TENGAH LAYAR) */}
        {showError && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-exclated-triangle-fill me-2"></i> Transaksi Gagal
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowError(false)}></button>
                </div>
                <div className="modal-body text-center p-4">
                  {/* Icon Silang Besar */}
                  <div className="text-danger mb-3" style={{ fontSize: '3rem' }}>❌</div>
                  <p className="fs-5 text-secondary">{errorMessage}</p>
                </div>
                <div className="modal-footer border-0 d-grid">
                  <button type="button" className="btn btn-danger btn-lg shadow-sm" onClick={() => setShowError(false)}>
                    Kembali
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Modal Cetak Nota */}
      {showNota && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                {/* TAMBAHAN: Nama judul nota berubah sesuai jenisnya */}
                <h5 className="modal-title">
                  {notaData?.jenis_transaksi === "masuk" ? "Nota Barang Masuk (Restock)" : "Nota Penjualan (Barang Keluar)"}
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setShowNota(false)} />
              </div>
              <div className="modal-body nota-print">
                <div className="text-center">
                  <h4>UMKM SRABI SOLO</h4>
                  <p>Jl. Imam Bonjol No.141, Pemecutan Klod</p>
                  <p>Kec. Denpasar Bar., Kota Denpasar, Bali</p>
                </div>
                <hr />
                <div className="mb-3 d-flex justify-content-between">
                  <div>
                    <div>Tanggal : {notaData?.tanggal}</div>
                    <div>No Nota : NP-{notaData?.id_transaksi}</div>
                  </div>
                  {/* TAMBAHAN: Keterangan jenis di kertas print */}
                  <div className="text-end">
                    <strong>JENIS: {notaData?.jenis_transaksi?.toUpperCase()}</strong>
                  </div>
                </div>
                <table className="table table-borderless">
                  <thead>
                    <tr><th>No</th><th>Produk</th><th>Qty</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {notaData?.detail.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.nama_produk}</td>
                        <td>{item.jumlah}</td>
                        <td>{formatRp(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <hr />
                <div className="text-end mt-3">
                  <h5>Total Nilai Transaksi : {formatRp(notaData?.total_harga)}</h5>
                </div>
                <hr />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowNota(false)}>Tutup</button>
                <button className="btn btn-success" onClick={() => window.print()}>Print</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Gantilah fungsi setJenisTransitions menjadi setJenisTransaksi di baris kode select dropdown agar tidak menimbulkan error typo.


// CSS Khusus Cetak
const printStyles = `
@media print {
  body * {
    visibility: hidden;
  }
  .nota-print, .nota-print * {
    visibility: visible;
  }
  .nota-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 20px;
    background: #fff !important;
    color: #000 !important;
  }
  @page {
    size: auto;
    margin: 0mm;
  }
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = printStyles;
  document.head.appendChild(styleSheet);
}

export default Transaksi;