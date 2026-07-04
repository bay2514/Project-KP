const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');

const app = express();

// 1. MIDDLEWARE
app.use(cors()); // Mengizinkan akses dari Frontend
app.use(express.json()); // Membaca data yang dikirim dalam format JSON

// 2. KONEKSI DATABASE
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // Default user XAMPP
  password: '',      // Kosongkan jika tidak ada password di XAMPP
  database: 'srabi'  // Nama database Anda
});

db.connect((err) => {
  if (err) {
    console.error('Gagal terkoneksi ke database:', err);
  } else {
    console.log('Berhasil terkoneksi ke database MySQL (srabi)');
  }
});

// ==========================================
// 3. KUMPULAN API ENDPOINTS
// ==========================================

// Cek Status Server
app.get('/', (req, res) => {
  res.send('Server Backend Srabi Berjalan Lancar!');
});

// --- API LOGIN ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const query = "SELECT id_user, username, nama, level FROM user WHERE username = ? AND password = ?";
    
    db.query(query, [username, password], (err, results) => {
      if (err) {
        console.error("🔴 Kendala Query MySQL:", err.message);
        return res.status(500).json({ 
          success: false, 
          message: `Terjadi kesalahan internal database: ${err.message}` 
        });
      }
      if (results.length > 0) {
        res.json({
          success: true,
          message: "Login berhasil!",
          user: results[0]
        });
      } else {
        res.status(401).json({
          success: false,
          message: "Username atau password yang Anda masukkan salah!"
        });
      }
    });
});

// GET: Dashboard
app.get('/api/dashboard', (req, res) => {
  const qProduk = `SELECT COUNT(*) as total_produk, SUM(CASE WHEN stok < 10 THEN 1 ELSE 0 END) as stok_menipis FROM PRODUK`;
  const qTransaksi = `SELECT COUNT(*) as total_transaksi, SUM(total_harga) as total_penjualan FROM TRANSAKSI WHERE jenis_transaksi = 'keluar'`;
  const qGrafik = `SELECT MONTH(tanggal) as bulan_angka, SUM(total_harga) as total FROM TRANSAKSI WHERE YEAR(tanggal) = YEAR(CURDATE()) AND jenis_transaksi = 'keluar' GROUP BY MONTH(tanggal)`;
  const qTerbaru = `SELECT t.id_transaksi, t.tanggal, t.total_harga, GROUP_CONCAT(CONCAT(p.nama_produk, ' (', dt.jumlah, ')') SEPARATOR ', ') as produk_list, SUM(dt.jumlah) as total_qty FROM TRANSAKSI t LEFT JOIN DETAIL_TRANSAKSI dt ON t.id_transaksi = dt.id_transaksi LEFT JOIN PRODUK p ON dt.id_produk = p.id_produk WHERE t.jenis_transaksi = 'keluar' GROUP BY t.id_transaksi ORDER BY t.tanggal DESC, t.id_transaksi DESC LIMIT 5`;
  const qTerlaris = `SELECT p.nama_produk, SUM(dt.jumlah) AS terjual, p.stok AS stok FROM DETAIL_TRANSAKSI dt JOIN PRODUK p ON dt.id_produk = p.id_produk JOIN TRANSAKSI t ON dt.id_transaksi = t.id_transaksi WHERE t.jenis_transaksi = 'keluar' GROUP BY p.id_produk ORDER BY terjual DESC LIMIT 5`;

  db.query(qProduk, (err1, rProduk) => {
    if (err1) return res.status(500).json({ error: err1.message });
    db.query(qTransaksi, (err2, rTransaksi) => {
      if (err2) return res.status(500).json({ error: err2.message });
      db.query(qGrafik, (err3, rGrafik) => {
        if (err3) return res.status(500).json({ error: err3.message });
        db.query(qTerbaru, (err4, rTerbaru) => {
          if (err4) return res.status(500).json({ error: err4.message });
          db.query(qTerlaris, (err5, rTerlaris) => {
            if (err5) return res.status(500).json({ error: err5.message });

            const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const chartData = namaBulan.map((bulan, index) => {
              const dataBulan = rGrafik.find(g => g.bulan_angka === (index + 1));
              return {
                name: bulan,
                Penjualan: dataBulan ? parseFloat(dataBulan.total || 0) : 0
              };
            });

            res.json({
              total_produk: rProduk[0].total_produk || 0,
              stok_menipis: rProduk[0].stok_menipis || 0,
              total_transaksi: rTransaksi[0].total_transaksi || 0,
              total_penjualan: rTransaksi[0].total_penjualan || 0,
              chartData: chartData,
              transaksi_terbaru: rTerbaru,
              produk_terlaris: rTerlaris
            });
          });
        });
      });
    });
  });
});

// --- API PRODUK ---
app.get('/api/produk', (req, res) => {
  db.query('SELECT * FROM PRODUK', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
});

app.post('/api/produk', (req, res) => {
  const { nama_produk, harga, stok } = req.body;
  if (!nama_produk || !harga || !stok) return res.status(400).json({ message: 'Semua data wajib diisi!' });
  db.query('INSERT INTO PRODUK (nama_produk, harga, stok) VALUES (?, ?, ?)', [nama_produk, harga, stok], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Produk berhasil ditambahkan!' });
  });
});

app.put('/api/produk/:id', (req, res) => {
  const { nama_produk, harga, stok } = req.body;
  db.query('UPDATE PRODUK SET nama_produk = ?, harga = ?, stok = ? WHERE id_produk = ?', 
  [nama_produk, harga, stok, req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Produk berhasil diperbarui!' });
  });
});

app.delete('/api/produk/:id', (req, res) => {
  db.query('DELETE FROM PRODUK WHERE id_produk = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Produk berhasil dihapus!' });
  });
});

// --- API TRANSAKSI ---
app.post('/api/transaksi', (req, res) => {
  const { tanggal, total_harga, jenis_transaksi, id_user, items } = req.body;
  if (!tanggal || !total_harga || !jenis_transaksi || !items || items.length === 0) {
    return res.status(400).json({ error: "Data transaksi tidak lengkap atau keranjang kosong!" });
  }

  const idProduks = items.map(item => item.id_produk);
  const queryCekStok = `SELECT id_produk, nama_produk, stok FROM PRODUK WHERE id_produk IN (?)`;
  
  db.query(queryCekStok, [idProduks], (errStok, produkDB) => {
    if (errStok) return res.status(500).json({ error: "Gagal mengecek stok database: " + errStok.message });

    if (jenis_transaksi === 'keluar') {
      for (const itemKeranjang of items) {
        const prodDiDB = produkDB.find(p => p.id_produk === itemKeranjang.id_produk);
        if (prodDiDB && prodDiDB.stok < itemKeranjang.jumlah) {
          return res.status(400).json({ 
            error: `Transaksi Gagal! Stok untuk produk "${prodDiDB.nama_produk}" tidak mencukupi (Sisa Stok: ${prodDiDB.stok}, Diminta: ${itemKeranjang.jumlah}).` 
          });
        }
      }
    }

    db.beginTransaction((err) => {
      if (err) return res.status(500).json({ error: err.message });
      const queryTransaksi = `INSERT INTO TRANSAKSI (tanggal, total_harga, jenis_transaksi, id_user) VALUES (?, ?, ?, ?)`;
      
      db.query(queryTransaksi, [tanggal, total_harga, jenis_transaksi, id_user], (errTx, resultTx) => {
        if (errTx) return db.rollback(() => res.status(500).json({ error: "Gagal insert tabel transaksi: " + errTx.message }));

        const id_transaksi_baru = resultTx.insertId;
        const valuesDetail = items.map(item => [id_transaksi_baru, item.id_produk, item.jumlah, item.subtotal]);
        const queryDetail = `INSERT INTO DETAIL_TRANSAKSI (id_transaksi, id_produk, jumlah, subtotal) VALUES ?`;
        
        db.query(queryDetail, [valuesDetail], (errDt, resultDt) => {
          if (errDt) return db.rollback(() => res.status(500).json({ error: "Gagal insert detail transaksi: " + errDt.message }));

          const updatePromises = items.map(item => {
            return new Promise((resolve, reject) => {
              const queryUpdateStok = jenis_transaksi === 'masuk'
                ? `UPDATE PRODUK SET stok = stok + ? WHERE id_produk = ?`
                : `UPDATE PRODUK SET stok = stok - ? WHERE id_produk = ?`;
              db.query(queryUpdateStok, [item.jumlah, item.id_produk], (errUpdate) => {
                if (errUpdate) return reject(errUpdate);
                resolve();
              });
            });
          });

          Promise.all(updatePromises)
            .then(() => {
              db.commit((errCommit) => {
                if (errCommit) return db.rollback(() => res.status(500).json({ error: "Gagal melakukan commit database." }));
                res.status(201).json({
                  message: jenis_transaksi === 'masuk' ? "Transaksi berhasil disimpan dan stok otomatis bertambah!" : "Transaksi berhasil disimpan dan stok otomatis berkurang!",
                  id_transaksi: id_transaksi_baru
                });
              });
            })
            .catch((errStokUpdate) => {
              return db.rollback(() => res.status(500).json({ error: "Gagal memperbarui stok produk: " + errStokUpdate.message }));
            });
        });
      });
    });
  });
});

app.get('/api/transaksi', (req, res) => {
  const query = `SELECT t.id_transaksi, t.tanggal, t.total_harga, t.jenis_transaksi, dt.jumlah, dt.subtotal, p.nama_produk, p.harga FROM transaksi t LEFT JOIN detail_transaksi dt ON t.id_transaksi = dt.id_transaksi LEFT JOIN produk p ON dt.id_produk = p.id_produk ORDER BY t.id_transaksi DESC`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const transaksiMap = {};
    results.forEach(row => {
      if (!transaksiMap[row.id_transaksi]) {
        transaksiMap[row.id_transaksi] = { id_transaksi: row.id_transaksi, tanggal: row.tanggal, total_harga: row.total_harga, jenis_transaksi: row.jenis_transaksi, detail: [] };
      }
      if (row.nama_produk) {
        transaksiMap[row.id_transaksi].detail.push({ nama_produk: row.nama_produk, jumlah: row.jumlah, harga: row.harga, subtotal: row.subtotal });
      }
    });
    res.json(Object.values(transaksiMap));
  });
});

app.get('/api/laporan', (req, res) => {
  const { dariTanggal, sampaiTanggal } = req.query;
  if (!dariTanggal || !sampaiTanggal) return res.status(400).json({ error: "Rentang tanggal harus diisi!" });
  const query = `SELECT t.id_transaksi, t.tanggal, t.total_harga, CONCAT('[', GROUP_CONCAT(JSON_OBJECT('nama_produk', p.nama_produk, 'jumlah', dt.jumlah)), ']') AS detail FROM TRANSAKSI t LEFT JOIN DETAIL_TRANSAKSI dt ON t.id_transaksi = dt.id_transaksi LEFT JOIN PRODUK p ON dt.id_produk = p.id_produk WHERE t.tanggal BETWEEN ? AND ? AND t.jenis_transaksi = 'keluar' GROUP BY t.id_transaksi ORDER BY t.tanggal ASC`;
  
  db.query(query, [dariTanggal, sampaiTanggal], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const formattedResults = results.map(row => ({ ...row, detail: row.detail ? JSON.parse(row.detail) : [] }));
    res.status(200).json(formattedResults);
  });
});

app.get('/api/laporan/cetak', (req, res) => {
  const { dariTanggal, sampaiTanggal } = req.query;
  const query = `SELECT t.id_transaksi, t.tanggal, t.total_harga, CONCAT('[', GROUP_CONCAT(JSON_OBJECT('nama_produk', p.nama_produk, 'jumlah', dt.jumlah)), ']') AS detail FROM TRANSAKSI t LEFT JOIN DETAIL_TRANSAKSI dt ON t.id_transaksi = dt.id_transaksi LEFT JOIN PRODUK p ON dt.id_produk = p.id_produk WHERE t.tanggal BETWEEN ? AND ? AND t.jenis_transaksi = 'keluar' GROUP BY t.id_transaksi ORDER BY t.tanggal ASC`;

  db.query(query, [dariTanggal, sampaiTanggal], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const laporan = results.map(row => ({ ...row, detail: row.detail ? JSON.parse(row.detail) : [] }));
    const totalTransaksi = laporan.length;
    const totalItemTerjual = laporan.reduce((total, trx) => total + trx.detail.reduce((sum, item) => sum + Number(item.jumlah), 0), 0);
    const totalPenjualan = laporan.reduce((total, trx) => total + Number(trx.total_harga), 0);

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=laporan-penjualan.pdf");
    doc.pipe(res);

    doc.fontSize(22).text("LAPORAN PENJUALAN", { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(50, 90).lineTo(550, 90).stroke();
    doc.moveDown().fontSize(18).text("SRABI SOLO", { align: "center" });
    doc.moveDown().fontSize(11).text(`Periode : ${dariTanggal} s/d ${sampaiTanggal}`);
    doc.moveDown().rect(50, 190, 500, 80).stroke();
    doc.fontSize(12).text(`Total Transaksi : ${totalTransaksi}`, 70, 210);
    doc.text(`Total Item Terjual : ${totalItemTerjual}`, 70, 230);
    doc.text(`Total Penjualan : Rp ${totalPenjualan.toLocaleString('id-ID')}`, 300, 220);

    let y = 310;
    const headerHeight = 25;
    const rowHeight = 25;
    const bottomLimit = 750;

    const drawTableHeader = (startY) => {
      doc.fontSize(10);
      doc.rect(50, startY, 40, headerHeight).stroke();
      doc.rect(90, startY, 80, headerHeight).stroke();
      doc.rect(170, startY, 250, headerHeight).stroke();
      doc.rect(420, startY, 50, headerHeight).stroke();
      doc.rect(470, startY, 80, headerHeight).stroke();
      doc.text("No", 60, startY + 7);
      doc.text("Tanggal", 100, startY + 7);
      doc.text("Produk", 260, startY + 7);
      doc.text("Qty", 430, startY + 7);
      doc.text("Total", 485, startY + 7);
    };

    drawTableHeader(y);
    y += headerHeight;

    laporan.forEach((trx, index) => {
      if (y + rowHeight > bottomLimit) {
        doc.addPage();
        y = 50;
        drawTableHeader(y);
        y += headerHeight;
      }
      const produk = trx.detail.map(item => item.nama_produk).join(", ");
      const qty = trx.detail.reduce((sum, item) => sum + Number(item.jumlah), 0);

      doc.rect(50, y, 40, rowHeight).stroke();
      doc.rect(90, y, 80, rowHeight).stroke();
      doc.rect(170, y, 250, rowHeight).stroke();
      doc.rect(420, y, 50, rowHeight).stroke();
      doc.rect(470, y, 80, rowHeight).stroke();

      doc.text(String(index + 1), 60, y + 7);
      doc.text(trx.tanggal.toISOString().split("T")[0], 95, y + 7);
      doc.text(produk, 175, y + 7, { width: 240, height: rowHeight, ellipsis: true });
      doc.text(String(qty), 435, y + 7);
      doc.text("Rp " + Number(trx.total_harga).toLocaleString("id-ID"), 475, y + 7);
      y += rowHeight;
    });
    doc.end();
  });
});

// ==========================================
// PENTING: EXPORT APP UNTUK TESTING
// ==========================================
module.exports = app;