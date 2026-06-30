import { useState } from "react";

function Navbar({ user, onLogout, onToggle }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    // TAMBAHKAN STYLE DI SINI
    <nav 
      className="navbar navbar-custom d-flex justify-content-between align-items-center"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1050 // Agar navbar selalu berada di atas konten (grafik, tabel, dll)
      }}
    >
      <div className="d-flex align-items-center gap-3">
        <button className="sidebar-hamburger" onClick={onToggle} title="Buka/tutup sidebar">
          ☰
        </button>
        <span className="navbar-brand mb-0">Sistem Informasi Penjualan</span>
      </div>

      {/* User dropdown */}
      <div className="position-relative">
        <button
          className="btn d-flex align-items-center gap-2"
          style={{ color: "#6F4E37", fontWeight: 600, fontSize: "14px" }}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div style={{
            width: "34px", height: "34px", borderRadius: "50%",
            backgroundColor: "#6F4E37", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 700,
          }}>
            {user?.nama?.charAt(0).toUpperCase()}
          </div>
          {user?.nama}
          <span style={{ fontSize: "10px" }}>▼</span>
        </button>

        {showDropdown && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={() => setShowDropdown(false)} />
            <div style={{
              position: "absolute", right: 0, top: "110%",
              background: "white", borderRadius: "10px", zIndex: 1000,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              border: "1px solid #e8d8cc", minWidth: "180px", overflow: "hidden",
            }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0e6da" }}>
                <div style={{ fontSize: "13px", color: "#6F4E37", fontWeight: 700 }}>{user?.nama}</div>
                <div style={{ fontSize: "12px", color: "#999" }}>{user?.username}</div>
              </div>
              <button
                className="btn w-100 text-start"
                style={{ padding: "10px 16px", fontSize: "14px", color: "#dc3545", borderRadius: 0 }}
                onClick={() => { setShowDropdown(false); onLogout(); }}
              >
                🚪 Keluar
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;