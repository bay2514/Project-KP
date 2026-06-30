import logo from "../assets/images/logo-srabi.png";
import { NavLink } from "react-router-dom";

const menuItems = [
  { to: "/",          label: "Dashboard"  },
  { to: "/produk",    label: "Produk"     },
  { to: "/transaksi", label: "Transaksi"  },
  { to: "/laporan",   label: "Laporan"    },
];

function Sidebar({ collapsed, onToggle }) {
  const navLinkClass = ({ isActive }) =>
    isActive ? "sidebar-link active" : "sidebar-link";

  if (collapsed) return null;

  return (
    // TAMBAHKAN STYLE DI BAWAH INI
    <div 
      className="sidebar text-white" 
      style={{ 
        position: "sticky", 
        top: 0, 
        height: "100vh", 
        overflowY: "auto" 
      }}
    >

      {/* Brand */}
      <div className="sidebar-brand">
        <img src={logo} alt="Logo Srabi" width="56" height="56" style={{ borderRadius: "50%", flexShrink: 0 }} />
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Srabi Solo</span>
          <span className="sidebar-brand-sub">Sistem Penjualan</span>
        </div>
      </div>

      <hr className="sidebar-divider" />

      {/* Menu */}
      <ul className="nav flex-column gap-1">
        {menuItems.map(({ to, icon, label }) => (
          <li className="nav-item" key={to}>
            <NavLink to={to} className={navLinkClass} end={to === "/"}>
              {/* icon belum ada di menuItems atas, jadi saya asumsikan aman */}
              <span className="sidebar-icon">{icon}</span>
              <span className="sidebar-label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;