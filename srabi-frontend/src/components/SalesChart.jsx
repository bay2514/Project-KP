import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// 1. Tambahkan props 'chartData' di dalam kurung komponen
function SalesChart({ chartData = [] }) {
  
  // 2. Ambil label bulan dan total penjualan dari data backend
  // Jika data belum siap (masih loading), kita gunakan nilai default/kosong
  const labels = chartData.length > 0 
    ? chartData.map(item => item.name) 
    : ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
  const dataPenjualan = chartData.length > 0 
    ? chartData.map(item => item.Penjualan) 
    : Array(12).fill(0); // Set angka 0 jika tidak ada data

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Total Penjualan",
        // 3. Masukkan data asli dari backend ke sini, buang Math.random()
        data: dataPenjualan, 
        borderColor: "#E67E22",
        backgroundColor: "#E67E22",
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top"
      },
      // (Opsional) Menambahkan format Rupiah saat grafik di-hover (Tooltip)
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    }
  };

  return <Line data={data} options={options} />;
}

export default SalesChart;