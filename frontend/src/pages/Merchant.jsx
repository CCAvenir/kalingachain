import MerchantScanner from "../components/MerchantScanner";

function Merchant({ account, role }) {
  return (
    <section className="space-y-4">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-black">Merchant Verification</h1>
        <p className="mt-2 break-all text-gray-700">Role: {role}</p>
        <p className="break-all text-gray-700">Wallet: {account}</p>
      </div>
      <MerchantScanner account={account} />
    </section>
  );
}

export default Merchant;
