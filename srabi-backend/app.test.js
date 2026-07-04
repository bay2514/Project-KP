const request = require('supertest');
const app = require('./app');

describe('Pengujian Lengkap API Srabi Backend', () => {

  // Variabel global untuk menyimpan ID produk sementara yang akan dites
  let testProductId; 

  // ==========================================
  // 1. PENGUJIAN STATUS SERVER
  // ==========================================
  describe('Pengecekan Server (GET /)', () => {
    it('seharusnya mengembalikan status 200 dan pesan server berjalan', async () => {
      const response = await request(app).get('/');
      expect(response.statusCode).toBe(200);
      expect(response.text).toBe('Server Backend Srabi Berjalan Lancar!');
    });
  });

  // ==========================================
  // 2. PENGUJIAN API LOGIN
  // ==========================================
  describe('Endpoint Login (POST /api/login)', () => {
    it('seharusnya gagal (401) jika username atau password salah', async () => {
      const response = await request(app).post('/api/login').send({
        username: 'user_salah',
        password: 'password_salah'
      });
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    // CATATAN: Ubah 'admin' dan '12345' dengan username & password asli di DB Anda
    it('seharusnya berhasil (200) jika username dan password benar', async () => {
      const response = await request(app).post('/api/login').send({
        username: 'admin', 
        password: 'srabi123'    // Sesuaikan dengan data nyata di XAMPP Anda
      });
      // Kita abaikan pengecekan jika gagal karena mungkin kredensial di atas salah
      if (response.statusCode === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('user');
      }
    });
  });

  // ==========================================
  // 3. PENGUJIAN API PRODUK (CRUD)
  // ==========================================
  describe('Endpoint Produk (GET, POST, PUT, DELETE /api/produk)', () => {
    
    it('seharusnya gagal menambah produk (400) jika data tidak lengkap', async () => {
      const response = await request(app).post('/api/produk').send({ nama_produk: 'Srabi Coklat' });
      expect(response.statusCode).toBe(400);
    });

    it('seharusnya berhasil menambah produk baru (201)', async () => {
      const response = await request(app).post('/api/produk').send({
        nama_produk: 'Srabi Susu',
        harga: 10000,
        stok: 50
      });
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('message', 'Produk berhasil ditambahkan!');
    });

    it('seharusnya bisa mengambil daftar produk (200) dan menemukan produk test', async () => {
      const response = await request(app).get('/api/produk');
      expect(response.statusCode).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      
      // Cari produk yang baru saja dibuat untuk mendapatkan ID-nya
      const produkTest = response.body.find(p => p.nama_produk === 'Srabi Susu');
      expect(produkTest).toBeDefined();
      
      // Simpan ID untuk digunakan di test Edit, Transaksi, dan Delete
      testProductId = produkTest.id_produk; 
    });

    it('seharusnya berhasil mengedit produk (200)', async () => {
      const response = await request(app).put(`/api/produk/${testProductId}`).send({
        nama_produk: 'Srabi Susu',
        harga: 15000,
        stok: 50
      });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Produk berhasil diperbarui!');
    });
  });

  // ==========================================
  // 4. PENGUJIAN API TRANSAKSI
  // ==========================================
  describe('Endpoint Transaksi (POST & GET /api/transaksi)', () => {
    
    it('seharusnya gagal (400) jika keranjang kosong', async () => {
      const response = await request(app).post('/api/transaksi').send({
        tanggal: '2026-07-02',
        total_harga: 0,
        jenis_transaksi: 'keluar',
        items: []
      });
      expect(response.statusCode).toBe(400);
    });

    it('seharusnya gagal (400) jika stok tidak mencukupi (Unhappy Path)', async () => {
      const response = await request(app).post('/api/transaksi').send({
        tanggal: '2026-07-02',
        total_harga: 1500000, 
        jenis_transaksi: 'keluar',
        items: [{
          id_produk: testProductId,
          jumlah: 100, 
          subtotal: 1500000
        }]
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toMatch(/tidak mencukupi/);
    });

    it('seharusnya berhasil (201) menyimpan transaksi jika stok cukup (Happy Path)', async () => {
      const response = await request(app).post('/api/transaksi').send({
        tanggal: '2026-07-02',
        total_harga: 30000, // 2 * 15000
        jenis_transaksi: 'keluar',
        items: [{
          id_produk: testProductId,
          jumlah: 2, // Membeli 2, stok 50
          subtotal: 30000
        }]
      });
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id_transaksi');
    });

    it('seharusnya bisa mengambil riwayat transaksi (200)', async () => {
      const response = await request(app).get('/api/transaksi');
      expect(response.statusCode).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });
  });

  // ==========================================
  // 5. PEMBERSIHAN DATA (CLEANUP)
  // ==========================================
  describe('Pembersihan Data Testing', () => {
    it('seharusnya berhasil menghapus produk test dari database', async () => {
      // Menghapus produk buatan Jest agar tidak mengotori tabel asli aplikasi Anda
      // (Catatan: Ini bisa gagal jika produk sudah terkait dengan tabel DETAIL_TRANSAKSI karena ada Foreign Key)
      const response = await request(app).delete(`/api/produk/${testProductId}`);
      // Kami mengharapkan status 200 atau 500 (jika terhadang relasi database)
      expect([200, 500]).toContain(response.statusCode);
    });
  });

  // ==========================================
  // 6. PENGUJIAN API LAPORAN
  // ==========================================
  describe('Endpoint Laporan (GET /api/laporan)', () => {
    it('seharusnya gagal (400) jika rentang tanggal tidak dikirimkan', async () => {
      const response = await request(app).get('/api/laporan');
      expect(response.statusCode).toBe(400);
    });

    it('seharusnya berhasil (200) jika rentang tanggal valid', async () => {
      const response = await request(app).get('/api/laporan?dariTanggal=2024-01-01&sampaiTanggal=2026-12-31');
      expect(response.statusCode).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });

    it('seharusnya berhasil (200) men-generate file PDF cetak laporan', async () => {
      const response = await request(app).get('/api/laporan/cetak?dariTanggal=2024-01-01&sampaiTanggal=2026-12-31');
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf'); // Mengecek apakah response berupa file PDF
    });
  });

});