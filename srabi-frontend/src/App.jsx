import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Produk from "./pages/Produk";
import Transaksi from "./pages/Transaksi";
import Laporan from "./pages/Laporan";
import Nota from "./pages/Nota";

function App() {
  const [user, setUser] = useState(null);

  if (!user) return <Login onLogin={setUser} />;

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
      />

      <BrowserRouter>
        <Routes>
          <Route
            element={
              <MainLayout
                user={user}
                onLogout={() => setUser(null)}
              />
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/produk" element={<Produk />} />
            <Route path="/transaksi" element={<Transaksi />} />
            <Route path="/laporan" element={<Laporan />} />
            <Route path="/nota" element={<Nota />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;