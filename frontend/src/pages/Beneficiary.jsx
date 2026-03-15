import BeneficiaryDashboard from "../components/BeneficiaryDashboard";

function Beneficiary({ account }) {
  return (
    <section className="space-y-6">
      <BeneficiaryDashboard account={account} />
    </section>
  );
}

export default Beneficiary;
