import BeneficiaryDashboard from "../components/BeneficiaryDashboard";

function Beneficiary({ account, onDisconnectWallet }) {
  return (
    <section className="space-y-6">
      <BeneficiaryDashboard account={account} onDisconnectWallet={onDisconnectWallet} />
    </section>
  );
}

export default Beneficiary;
