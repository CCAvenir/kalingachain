import AdminPanel from "../components/AdminPanel";

function Admin({ account, role, onDisconnectWallet }) {
  return (
    <section className="space-y-4">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
        <p className="mt-2 break-all text-gray-700">Role: {role}</p>
        <p className="break-all text-gray-700">Wallet: {account}</p>
        <button className="btn-secondary mt-4 rounded-xl px-6 py-3 text-base" onClick={onDisconnectWallet}>
          Disconnect Wallet
        </button>
      </div>
      <AdminPanel account={account} />
    </section>
  );
}

export default Admin;
