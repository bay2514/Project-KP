import { useState } from "react";
import axios from "axios";
import logo from "../assets/images/logo-srabi.png";

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    
    // Validasi input kosong dasar
    if (!form.username || !form.password) {
      setError("Username dan password wajib diisi."); 
      return;
    }

    setLoading(true);

    try {
      // Mengirimkan request login ke server backend MySQL Anda
      const response = await axios.post("http://localhost:5000/api/login", {
        username: form.username,
        password: form.password
      });

      if (response.data.success) {
        // Kirim data user riil dari database ke fungsi onLogin induk Anda
        onLogin({ 
          username: response.data.user.username, 
          nama: response.data.user.nama 
        });
      }
    } catch (err) {
      // Menangkap pesan error dari backend atau masalah jaringan
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError("Gagal terhubung ke server backend.");
      }
      setLoading(false); // Matikan loading jika gagal
    }
  };

  const handleKey = (e) => { 
    if (e.key === "Enter") handleSubmit(); 
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Logo */}
        <div className="text-center mb-4">
          <img src={logo} alt="Logo Srabi" width="90" height="90" style={{ borderRadius: "50%" }} />
          <h4 className="mt-3" style={{ color: "#6F4E37", fontWeight: 700 }}>Srabi Solo</h4>
          <p className="text-muted" style={{ fontSize: "14px" }}>Sistem Informasi Penjualan</p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger py-2 px-3" style={{ borderRadius: "8px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {/* Form */}
        <div className="mb-3">
          <label className="form-label" style={{ color: "#6F4E37", fontWeight: 600 }}>Username</label>
          <input
            type="text"
            className="form-control"
            placeholder="Masukkan username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            onKeyDown={handleKey}
            autoFocus
          />
        </div>
        <div className="mb-4">
          <label className="form-label" style={{ color: "#6F4E37", fontWeight: 600 }}>Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Masukkan password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={handleKey}
          />
        </div>

        <button
          className="btn btn-srabi w-100"
          onClick={handleSubmit}
          disabled={loading}
          style={{ height: "44px", fontSize: "15px" }}
        >
          {loading && <span className="spinner-border spinner-border-sm me-2" />}
          {loading ? "Memverifikasi..." : "Masuk"}
        </button>

        <p className="text-center text-muted mt-4 mb-0" style={{ fontSize: "12px" }}>
          Demo: username <strong>admin</strong> / password <strong>srabi123</strong>
        </p>
      </div>
    </div>
  );
}

export default Login;