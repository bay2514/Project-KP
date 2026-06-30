import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function MainLayout({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="d-flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="main-content" style={{ backgroundColor: "#f8f5f0", minHeight: "100vh" }}>
        <Navbar user={user} onLogout={onLogout} onToggle={() => setCollapsed(!collapsed)} />
        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default MainLayout;