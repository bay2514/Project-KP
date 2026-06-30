import { useState, useEffect } from "react";
import axios from "axios"; // Pastikan axios sudah terinstall, atau gunakan fetch

const emptyForm = { nama_produk: "", harga: "", stok: "" };

function Produk() {
  const [produkList, setProdukList] = useState([]); // Mulai dengan array kosong, data diambil dari DB
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [hapusId, setHapusId] = useState(null);
  const [notif, setNotif] = useState({show: false, message: "", type: "success",});

  const API_URL = "http://localhost:5000/api/produk"; // URL Backend Node.js Anda

  // 1. FUNGSI AMBIL DATA DARI DATABASE (GET)
  const fetchProduk = async () => {
    try {
      const response = await axios.get(API_URL);
      setProdukList(response.data);
    } catch (error) {
      console.error("Gagal mengambil data produk:", error);
      showNotif("Gagal mengambil data dari server backend!", "danger");
    }
  };

  // Ambil data otomatis saat halaman dibuka
  useEffect(() => {
    fetchProduk();
  }, []);

  const filtered = produkList.filter((p) =>
    p.nama_produk.toLowerCase().includes(search.toLowerCase())
  );

  const openTambah = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ nama_produk: p.nama_produk, harga: p.harga, stok: p.stok }); setEditId(p.id_produk); setShowModal(true); };

  // 2. FUNGSI SIMPAN DATA (POST UNTUK TAMBAH, PUT UNTUK EDIT)
  const showNotif = (message, type = "success") => {
    setNotif({
      show: true,
      message,
      type,
    });
  
    setTimeout(() => {
      setNotif((prev) => ({
        ...prev,
        show: false,
      }));
    }, 3000);
  };
  const handleSimpan = async () => {
    if (!form.nama_produk || !form.harga || !form.stok) return;

    try {
      const dataPayload = {
        nama_produk: form.nama_produk,
        harga: Number(form.harga),
        stok: Number(form.stok)
      };

      if (editId) {
        // Mode Edit (PUT)
        await axios.put(`${API_URL}/${editId}`, dataPayload);
        showNotif("Produk berhasil diperbarui!");
      } else {
        // Mode Tambah Baru (POST)
        await axios.post(API_URL, dataPayload);
        showNotif("Produk berhasil ditambahkan!");
      }

      fetchProduk(); // Refresh data tabel dari DB setelah simpan sukses
      setShowModal(false);
    } catch (error) {
      console.error("Gagal menyimpan produk:", error);
      showNotif(
        "Gagal terhubung ke backend. Pastikan server Node.js menyala di port 5000!",
        "danger"
      );
    }
  };

  // 3. FUNGSI HAPUS DATA (DELETE)
  const handleHapus = async () => {
    try {
      await axios.delete(`${API_URL}/${hapusId}`);
  
      showNotif("Produk berhasil dihapus!");
  
      fetchProduk();
      setHapusId(null);
  
    } catch (error) {
      console.error("Gagal menghapus produk:", error);
  
      showNotif(
        "Gagal menghapus produk.",
        "danger"
      );
    }
  };
  
  const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");

  const badgeStok = (stok) => {
    if (stok === 0) return <span className="badge badge-habis" style={{ backgroundColor: "#dc3545", color: "white" }}>Habis</span>;
    if (stok <= 10) return <span className="badge badge-menipis">Menipis</span>;
    if (stok <= 30) return <span className="badge badge-terbatas">Terbatas</span>;
    return <span className="badge badge-tersedia">Tersedia</span>;
  };

  return (
    <div>
        {notif.show && (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        minWidth: "300px",
      }}
    >
      <div
        className={`alert alert-${
          notif.type === "danger" ? "danger" : "success"
        } shadow`}
      >
        {notif.message}
      </div>
    </div>
  )}
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Data Produk</h2>
          <p>Kelola data produk yang dijual</p>
        </div>
        <button className="btn btn-srabi" onClick={openTambah}>+ Tambah Produk</button>
      </div>

      {/* Tabel */}
      <div className="panel-card card">
        <div className="card-body">
          <input type="text" className="form-control search-input" placeholder="Cari produk..."
            value={search} onChange={(e) => setSearch(e.target.value)} />

          <table className="table table-hover align-middle srabi-table">
            <thead>
              <tr>
                <th>No</th><th>Nama Produk</th><th>Harga</th>
                <th>Stok</th><th>Status</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted py-4">Produk tidak ditemukan</td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id_produk}>
                  <td>{i + 1}</td>
                  <td><strong>{p.nama_produk}</strong></td>
                  <td>{formatRp(p.harga)}</td>
                  <td>{p.stok}</td>
                  <td>{badgeStok(p.stok)}</td>
                  <td>
                    <button className="btn btn-sm btn-srabi-secondary me-2" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-sm btn-danger" style={{ borderRadius: "6px" }} onClick={() => setHapusId(p.id_produk)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="modal show d-block modal-srabi" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editId ? "Edit Produk" : "Tambah Produk"}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                {[
                  { label: "Nama Produk", key: "nama_produk", type: "text", placeholder: "Nama produk" },
                  { label: "Harga (Rp)", key: "harga", type: "number", placeholder: "Harga" },
                  { label: "Stok", key: "stok", type: "number", placeholder: "Stok" },
                ].map(({ label, key, type, placeholder }) => (
                  <div className="mb-3" key={key}>
                    <label className="form-label">{label}</label>
                    <input className="form-control" type={type} placeholder={placeholder}
                      value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button className="btn btn-srabi" onClick={handleSimpan}>Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {hapusId && (
        <div className="modal show d-block modal-srabi" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center py-4">
                <div style={{ fontSize: "3rem" }}>🗑️</div>
                <h5 className="mt-2">Hapus Produk?</h5>
                <p className="text-muted">Data produk akan dihapus permanen dan tidak bisa dikembalikan.</p>
              </div>
              <div className="modal-footer justify-content-center border-0">
                <button className="btn btn-secondary" onClick={() => setHapusId(null)}>Batal</button>
                <button className="btn btn-danger" onClick={handleHapus}>Ya, Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Produk;