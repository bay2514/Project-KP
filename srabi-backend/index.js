const app = require('./app'); // Mengambil aplikasi Express dari file app.js
const port = 5000;

// JALANKAN SERVER
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});