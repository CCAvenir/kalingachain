import { useEffect, useState } from "react";
import {
  fetchVerificationLogs,
  getContractDebugConfig,
  getTotalBeneficiaries,
  issueID,
  revokeID,
} from "../utils/contract";

function AdminPanel({ account }) {
  const [beneficiaryToIssue, setBeneficiaryToIssue] = useState("");
  const [beneficiaryToRevoke, setBeneficiaryToRevoke] = useState("");
  const [status, setStatus] = useState("Use this panel to issue or revoke benefit IDs.");
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState("");
  const [totalBeneficiaries, setTotalBeneficiaries] = useState(0);
  const debug = getContractDebugConfig();

  async function refreshLogs() {
    try {
      setError("");
      setLoadingLogs(true);
      const [entries, beneficiaries] = await Promise.all([
        fetchVerificationLogs(),
        getTotalBeneficiaries(),
      ]);
      setLogs(entries);
      setTotalBeneficiaries(beneficiaries);
    } catch (error) {
      console.error("[KalingaChain] Admin log refresh failed.", error);
      setError(error.message || "Failed to load logs.");
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    refreshLogs();
  }, []);

  const handleIssue = async () => {
    const beneficiary = beneficiaryToIssue.trim();
    if (!beneficiary) {
      setError("Please enter a beneficiary wallet address.");
      return;
    }

    try {
      setError("");
      setStatus("Issuing ID...");
      const txHash = await issueID(beneficiary);
      setStatus(`ID issued. TX: ${txHash}`);
      setBeneficiaryToIssue("");
      await refreshLogs();
    } catch (error) {
      console.error("[KalingaChain] Issue ID failed.", error);
      setStatus("Issue ID failed.");
      setError(error.reason || error.message || "Issue failed.");
    }
  };

  const handleRevoke = async () => {
    const beneficiary = beneficiaryToRevoke.trim();
    if (!beneficiary) {
      setError("Please enter a beneficiary wallet address.");
      return;
    }

    try {
      setError("");
      setStatus("Revoking ID...");
      const txHash = await revokeID(beneficiary);
      setStatus(`ID revoked. TX: ${txHash}`);
      setBeneficiaryToRevoke("");
      await refreshLogs();
    } catch (error) {
      console.error("[KalingaChain] Revoke ID failed.", error);
      setStatus("Revoke ID failed.");
      setError(error.reason || error.message || "Revoke failed.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="card space-y-3">
        <h2 className="text-3xl font-bold text-black">Admin Panel</h2>
        <p className="break-all text-lg text-gray-900">
          Connected admin wallet: <span className="font-semibold">{account || "Not connected"}</span>
        </p>
        <p className="text-base text-gray-700">
          Network must be Sepolia ({debug.requiredChainId}). Contract: {debug.contractAddress}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card space-y-5">
          <h3 className="text-2xl font-semibold text-black">ID Management</h3>

          <div className="space-y-3 rounded-xl border bg-gray-50 p-4">
            <h4 className="text-xl font-semibold text-black">Issue Digital Benefit ID</h4>
            <input
              className="input"
              placeholder="Beneficiary wallet address"
              value={beneficiaryToIssue}
              onChange={(e) => setBeneficiaryToIssue(e.target.value)}
              aria-label="Issue beneficiary address"
            />
            <button className="btn-primary w-full rounded-xl px-6 py-4 text-lg" onClick={handleIssue}>
              Issue ID
            </button>
          </div>

          <div className="space-y-3 rounded-xl border bg-gray-50 p-4">
            <h4 className="text-xl font-semibold text-black">Revoke Benefit ID</h4>
            <input
              className="input"
              placeholder="Beneficiary wallet address"
              value={beneficiaryToRevoke}
              onChange={(e) => setBeneficiaryToRevoke(e.target.value)}
              aria-label="Revoke beneficiary address"
            />
            <button className="btn-secondary w-full rounded-xl px-6 py-4 text-lg" onClick={handleRevoke}>
              Revoke ID
            </button>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="text-2xl font-semibold text-black">Admin Analytics</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-gray-50 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-wide text-gray-500">Total Beneficiaries</p>
              <p className="mt-2 text-4xl font-bold text-black">{totalBeneficiaries}</p>
            </div>
            <div className="rounded-xl border bg-gray-50 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-wide text-gray-500">Total Verifications</p>
              <p className="mt-2 text-4xl font-bold text-black">{logs.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xl font-semibold text-black">Verification Logs</h4>
            <button className="btn-secondary rounded-xl px-4 py-2 text-sm" onClick={refreshLogs}>
              Refresh Logs
            </button>
          </div>
          {loadingLogs ? (
            <p className="text-lg text-gray-800">Loading logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-lg text-gray-800">No verification logs yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border-b px-4 py-3 font-semibold text-gray-700">Merchant</th>
                    <th className="border-b px-4 py-3 font-semibold text-gray-700">Beneficiary</th>
                    <th className="border-b px-4 py-3 font-semibold text-gray-700">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={`${log.timestamp}-${index}`} className="bg-white">
                      <td className="border-b px-4 py-3 text-gray-800">{log.merchant}</td>
                      <td className="border-b px-4 py-3 text-gray-800">{log.beneficiary}</td>
                      <td className="border-b px-4 py-3 text-gray-800">
                        {new Date(log.timestamp * 1000).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {status && <p className="rounded-xl border bg-white p-4 text-lg text-black">{status}</p>}
      {error && <p className="rounded-xl border border-black bg-white p-4 text-lg text-black">{error}</p>}
    </div>
  );
}

export default AdminPanel;
