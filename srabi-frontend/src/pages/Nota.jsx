function Nota() {
  return (
    <MainLayout>

      <h2>Nota Penjualan</h2>

      <div className="card p-4">

        <h4>UMKM Srabi Solo</h4>

        <hr />

        <p>No Transaksi : TRX001</p>
        <p>Tanggal : 10/06/2026</p>

        <table className="table">
          <tbody>
            <tr>
              <td>Srabi Original</td>
              <td>2</td>
              <td>Rp 10.000</td>
            </tr>
          </tbody>
        </table>

        <h5>Total : Rp 10.000</h5>

        <button
          className="btn btn-success"
          onClick={() => window.print()}
        >
          Print Nota
        </button>

      </div>

    </MainLayout>
  );
}

export default Nota;