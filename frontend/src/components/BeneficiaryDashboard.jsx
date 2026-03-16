import { useEffect, useState } from "react";
import { fetchVerificationLogs, verifyEligibility } from "../utils/contract";
import QRDisplay from "./QRDisplay";

function BeneficiaryDashboard({ account, onDisconnectWallet }) {
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [historyClearedAt, setHistoryClearedAt] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!account) {
      setHistoryClearedAt(0);
      return;
    }
    const key = `kalingachain-history-cleared-at-${account.toLowerCase()}`;
    const saved = Number(window.localStorage.getItem(key) || 0);
    setHistoryClearedAt(Number.isFinite(saved) ? saved : 0);
  }, [account]);

  useEffect(() => {
    let mounted = true;

    async function loadBeneficiaryData() {
      if (!account) {
        if (mounted) {
          setEligible(false);
          setHistory([]);
          setError("");
        }
        return;
      }

      try {
        if (mounted) {
          setLoading(true);
          setHistoryLoading(true);
          setError("");
        }

        const [isEligible, logs] = await Promise.all([verifyEligibility(account), fetchVerificationLogs()]);
        if (!mounted) return;

        setEligible(isEligible);
        setHistory(logs.filter((entry) => entry.beneficiary.toLowerCase() === account.toLowerCase()));
      } catch (err) {
        console.error("[KalingaChain] Beneficiary eligibility check failed.", err);
        if (mounted) {
          setEligible(false);
          setHistory([]);
          setError(err.message || "Could not verify status.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setHistoryLoading(false);
        }
      }
    }

    const handleVerificationLogged = () => {
      loadBeneficiaryData();
    };

    loadBeneficiaryData();
    window.addEventListener("kalingachain:verification-logged", handleVerificationLogged);

    return () => {
      mounted = false;
      window.removeEventListener("kalingachain:verification-logged", handleVerificationLogged);
    };
  }, [account]);

  const visibleHistory = history.filter((entry) => entry.timestamp > historyClearedAt);

  const handleClearHistoryView = () => {
    if (!account) return;
    const clearedAt = Math.floor(Date.now() / 1000);
    const key = `kalingachain-history-cleared-at-${account.toLowerCase()}`;
    window.localStorage.setItem(key, String(clearedAt));
    setHistoryClearedAt(clearedAt);
  };

  const handleRestoreHistoryView = () => {
    if (!account) return;
    const key = `kalingachain-history-cleared-at-${account.toLowerCase()}`;
    window.localStorage.removeItem(key);
    setHistoryClearedAt(0);
  };

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

          <button
            className="btn-secondary w-full rounded-xl px-6 py-4 text-lg"
            onClick={onDisconnectWallet}
          >
            Disconnect Wallet
          </button>

          {account && <QRDisplay address={account} />}
          {error && <p className="rounded-xl border border-black bg-white p-4 text-lg text-black">{error}</p>}
        </div>

        <div className="card space-y-4">
          <h3 className="text-2xl font-bold text-black">Verification History</h3>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-secondary flex-1 rounded-xl px-6 py-4 text-lg"
              onClick={() => setHistoryOpen((value) => !value)}
            >
              {historyOpen ? "Hide Verification History" : "View Verification History"}
            </button>
            <button
              className="btn-secondary rounded-xl px-6 py-4 text-lg"
              onClick={() => window.dispatchEvent(new Event("kalingachain:verification-logged"))}
              disabled={!account || historyLoading}
            >
              {historyLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {historyOpen && (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-secondary rounded-xl px-4 py-2 text-sm"
                  onClick={handleClearHistoryView}
                  disabled={visibleHistory.length === 0}
                >
                  Clear History View
                </button>
                {historyClearedAt > 0 && (
                  <button
                    className="btn-secondary rounded-xl px-4 py-2 text-sm"
                    onClick={handleRestoreHistoryView}
                  >
                    Show Cleared History
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-600">
                History is stored on-chain. Clear History View only hides previous entries on this
                device.
              </p>

              {historyLoading ? (
                <p className="text-lg text-gray-800">Loading verification history...</p>
              ) : visibleHistory.length === 0 ? (
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
                      {visibleHistory.slice(0, 10).map((entry, index) => (
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
