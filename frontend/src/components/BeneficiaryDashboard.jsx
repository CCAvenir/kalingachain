import { useEffect, useState } from "react";
import { fetchVerificationLogs, verifyEligibility } from "../utils/contract";
import QRDisplay from "./QRDisplay";

function BeneficiaryDashboard({ account }) {
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function check() {
      if (!account) {
        setEligible(false);
        setError("");
        return;
      }
      try {
        setLoading(true);
        setError("");
        const [isEligible, logs] = await Promise.all([
          verifyEligibility(account),
          fetchVerificationLogs(),
        ]);

        if (mounted) {
          setEligible(isEligible);
          setHistory(logs.filter((entry) => entry.beneficiary.toLowerCase() === account.toLowerCase()));
        }
      } catch (err) {
        console.error("[KalingaChain] Beneficiary eligibility check failed.", err);
        if (mounted) {
          setEligible(false);
          setError(err.message || "Could not verify status.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    check();
    return () => {
      mounted = false;
    };
  }, [account]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card space-y-4">
          <h2 className="text-3xl font-bold text-black">Beneficiary Digital ID</h2>
          <p className="text-lg text-gray-800">
            Press <span className="font-semibold">Connect Wallet</span> to access your digital benefit ID.
          </p>

          <div className="rounded-xl border bg-gray-50 p-4">
            <p className="text-lg font-semibold text-black">Wallet Address</p>
            <p className="mt-1 break-all text-lg text-gray-900">{account || "Not connected"}</p>
          </div>

          <div className="rounded-xl border bg-gray-50 p-4">
            <p className="text-lg font-semibold text-black">Benefit Status</p>
            <p className="mt-2 text-2xl font-bold text-black">
              {!account
                ? "CONNECT WALLET"
                : loading
                  ? "Checking eligibility..."
                  : eligible
                    ? "ELIGIBLE"
                    : "NOT ELIGIBLE"}
            </p>
          </div>

          <p className="text-xl text-black">
            Show this QR code to the merchant to verify your government benefits.
          </p>

          {account && <QRDisplay address={account} />}
          {error && <p className="rounded-xl border border-black bg-white p-4 text-lg text-black">{error}</p>}
        </div>

        <div className="card space-y-4">
          <h3 className="text-2xl font-bold text-black">Verification History</h3>
          <button
            className="btn-secondary w-full rounded-xl px-6 py-4 text-lg"
            onClick={() => setHistoryOpen((value) => !value)}
          >
            {historyOpen ? "Hide Verification History" : "View Verification History"}
          </button>

          {historyOpen && (
            <>
              {history.length === 0 ? (
                <p className="text-lg text-gray-800">No verification history yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="min-w-full border-collapse text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border-b px-4 py-3 text-base font-semibold text-gray-700">Merchant</th>
                        <th className="border-b px-4 py-3 text-base font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 10).map((entry, index) => (
                        <tr key={`${entry.timestamp}-${index}`} className="bg-white">
                          <td className="border-b px-4 py-3 text-gray-800">{entry.merchant}</td>
                          <td className="border-b px-4 py-3 text-gray-800">
                            {new Date(entry.timestamp * 1000).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BeneficiaryDashboard;
