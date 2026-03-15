import { useRef, useState } from "react";
import { isAddress } from "ethers";
import { QrReader } from "react-qr-reader";
import { logVerification, verifyEligibility } from "../utils/contract";

function MerchantScanner({ account }) {
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
  const [status, setStatus] = useState("Enter a beneficiary wallet address to begin verification.");
  const [eligible, setEligible] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const lastScannedRef = useRef("");

  const handleVerify = async (walletInput) => {
    if (!account) {
      setError("MetaMask is not connected. Connect wallet before verification.");
      return;
    }

    const beneficiary = (walletInput ?? beneficiaryAddress).trim();
    if (!beneficiary) {
      setError("Please enter a beneficiary wallet address.");
      return;
    }
    if (!isAddress(beneficiary)) {
      setError("Invalid wallet address format.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      setStatus("Checking eligibility...");
      setTxHash("");
      const isEligible = await verifyEligibility(beneficiary);
      setEligible(isEligible);

      // Persist each merchant check on-chain for auditable verification history.
      setStatus("Logging verification on-chain...");
      const hash = await logVerification(beneficiary);
      setTxHash(hash);
      setStatus("Verification complete.");
      setBeneficiaryAddress(beneficiary);
    } catch (error) {
      console.error("[KalingaChain] Merchant verification failed.", error);
      setStatus("Verification failed.");
      setError(error.reason || error.message || "Unable to verify beneficiary.");
      setEligible(null);
    } finally {
      setBusy(false);
    }
  };

  const handleScanResult = async (result, scanError) => {
    if (scanError) return;
    if (!result?.text) return;

    const scannedText = result.text.trim();
    if (scannedText === lastScannedRef.current) return;
    if (!isAddress(scannedText)) return;

    lastScannedRef.current = scannedText;
    setBeneficiaryAddress(scannedText);
    await handleVerify(scannedText);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="card">
        <h2 className="text-3xl font-bold text-black">Merchant Verification</h2>
        <p className="mt-2 text-lg text-gray-800">Scan a QR code or manually input beneficiary wallet address.</p>
        <p className="mt-2 break-all text-base text-gray-700">
          Merchant Wallet: <span className="font-semibold text-black">{account || "Not connected"}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card space-y-4">
          <h3 className="text-2xl font-semibold text-black">Verification Result</h3>
          <div className="rounded-xl border bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-700">Beneficiary Wallet</p>
            <p className="mt-1 break-all text-base text-black">{beneficiaryAddress || "Not scanned yet"}</p>
          </div>

          {eligible !== null ? (
            <div
              className={`rounded-xl border p-5 text-center ${
                eligible ? "bg-black text-white" : "bg-gray-100 text-black"
              }`}
            >
              <p className="text-3xl font-bold">{eligible ? "ELIGIBLE FOR BENEFITS" : "NOT ELIGIBLE"}</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-gray-50 p-5 text-center">
              <p className="text-xl font-semibold text-gray-700">Waiting for verification</p>
            </div>
          )}

          {status && <p className="text-lg text-gray-800">{status}</p>}
          {error && <p className="rounded-xl border border-black bg-white p-4 text-lg text-black">{error}</p>}
          {txHash && <p className="break-all text-base text-gray-700">Verification log TX: {txHash}</p>}
        </div>

        <div className="card space-y-4">
          <h3 className="text-2xl font-semibold text-black">Scanner Panel</h3>
          <p className="text-gray-700">Point your camera at the beneficiary QR code to auto-verify eligibility.</p>
          {cameraEnabled ? (
            <div className="overflow-hidden rounded-xl border bg-black">
              <QrReader
                constraints={{ facingMode: "environment" }}
                onResult={handleScanResult}
                scanDelay={500}
                videoStyle={{ width: "100%", height: "280px", objectFit: "cover" }}
              />
            </div>
          ) : (
            <p className="rounded-xl border bg-gray-50 p-4 text-gray-700">
              Camera scanner is paused. Enable camera scanner to continue QR detection.
            </p>
          )}
          <button
            className="btn-secondary w-full rounded-xl px-6 py-4 text-lg"
            onClick={() => setCameraEnabled((value) => !value)}
          >
            {cameraEnabled ? "Pause Camera Scanner" : "Enable Camera Scanner"}
          </button>

          <div className="space-y-3 rounded-xl border bg-gray-50 p-4">
            <h4 className="text-xl font-semibold text-black">Manual Wallet Input</h4>
            <input
              className="input"
              placeholder="0x..."
              value={beneficiaryAddress}
              onChange={(e) => setBeneficiaryAddress(e.target.value)}
              aria-label="Beneficiary wallet address"
            />
            <button
              className="btn-primary w-full rounded-xl px-6 py-4 text-lg"
              onClick={() => handleVerify()}
              disabled={busy}
            >
              Verify Eligibility
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MerchantScanner;
