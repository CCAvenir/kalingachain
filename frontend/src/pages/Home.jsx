import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMetaMaskDownloadUrl, hasMetaMask, isMobileDevice } from "../utils/wallet";

function Home({ account, role, status, onConnectWallet }) {
  const [walletAvailable, setWalletAvailable] = useState(true);
  const isMobile = isMobileDevice();

  useEffect(() => {
    async function checkWalletProvider() {
      const available = await hasMetaMask();
      setWalletAvailable(available);
    }

    checkWalletProvider();
  }, []);

  return (
    <section className="space-y-8">
      <div className="mx-auto  space-y-6 rounded-xl border bg-white p-8 text-center shadow-sm md:p-12">
        <h1 className="text-4xl font-extrabold leading-tight text-black md:text-5xl">
          KalingaChain Digital Benefit Verification
        </h1>
        <p className="text-xl text-gray-600">
          A secure blockchain-powered system for Senior Citizens and Persons with Disabilities.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {role === "guest" ? (
            <button className="btn-primary rounded-xl px-8 py-4 text-lg" onClick={onConnectWallet}>
              Connect Wallet
            </button>
          ) : (
            <>
              <button className="btn-primary rounded-xl px-8 py-4 text-lg" onClick={onConnectWallet}>
                Switch Wallet
              </button>
              {role === "beneficiary" && (
                <Link to="/beneficiary" className="btn-secondary rounded-xl px-8 py-4 text-lg">
                  Open Beneficiary Dashboard
                </Link>
              )}
              {role === "admin" && (
                <Link to="/admin" className="btn-secondary rounded-xl px-8 py-4 text-lg">
                  Open Admin Dashboard
                </Link>
              )}
              {role === "merchant" && (
                <Link to="/merchant" className="btn-secondary rounded-xl px-8 py-4 text-lg">
                  Open Merchant Scanner
                </Link>
              )}
            </>
          )}
        </div>
        {account && (
          <p className="break-all text-sm text-gray-600">
            Connected wallet: {account}
          </p>
        )}
        {!account && status && (
          <p className="text-sm font-medium text-gray-700">{status}</p>
        )}
        {!account && status === "Opening MetaMask mobile app..." && (
          <div className="mx-auto max-w-xl rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
            Redirecting to MetaMask mobile. If nothing opens, install MetaMask and try again.
          </div>
        )}
        {!walletAvailable && (
          <div className="mx-auto max-w-xl rounded-xl border border-black bg-gray-50 p-4 text-left">
            <p className="text-sm font-semibold text-black">
              MetaMask or a compatible wallet is required.
            </p>
            <div className="mt-3">
              <a
                href={getMetaMaskDownloadUrl()}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary inline-flex rounded-xl px-6 py-3 text-base"
              >
                Install MetaMask
              </a>
            </div>
            {isMobile && (
              <p className="mt-3 text-xs text-gray-700">
                For best experience, open this site inside the MetaMask mobile app.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-3xl font-bold text-black">About KalingaChain</h2>
        <p className="mt-3 text-lg text-gray-700">
          KalingaChain replaces physical senior citizen and PWD IDs with blockchain-based digital
          identities. It allows merchants to instantly verify benefit eligibility using QR codes.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-gray-50 p-5 shadow-sm">
            <h3 className="text-xl font-bold text-black">Fraud Prevention</h3>
            <p className="mt-2 text-gray-700">Blockchain-backed identity prevents fake or duplicated IDs.</p>
          </div>
          <div className="rounded-xl border bg-gray-50 p-5 shadow-sm">
            <h3 className="text-xl font-bold text-black">Instant Verification</h3>
            <p className="mt-2 text-gray-700">Merchants confirm eligibility in seconds using QR scanning.</p>
          </div>
          <div className="rounded-xl border bg-gray-50 p-5 shadow-sm">
            <h3 className="text-xl font-bold text-black">Transparent Records</h3>
            <p className="mt-2 text-gray-700">Verification activity is auditable through blockchain logs.</p>
          </div>
        </div>
      </div>

      <footer className="rounded-xl border bg-white p-6 text-center shadow-sm">
        <p className="text-2xl font-bold text-black">KalingaChain</p>
        <p className="mt-2 text-gray-700">Blockchain-enabled benefit verification system</p>
      </footer>
      {role === "unknown" && (
        <div className="rounded-lg border border-black bg-white p-6 text-center shadow-sm">
          <p className="text-xl font-bold text-black">Unauthorized Access</p>
          <p className="mt-2 text-gray-700">This wallet is not registered for KalingaChain roles.</p>
        </div>
      )}
      {role === "beneficiary" && (
        <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
          <p className="text-lg text-gray-700">
            Your wallet is recognized as a beneficiary. Go to your dashboard to show your QR ID.
          </p>
        </div>
      )}
      {role === "admin" && (
        <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
          <p className="text-lg text-gray-700">Admin wallet detected. Open the admin dashboard to issue IDs.</p>
        </div>
      )}
      {role === "merchant" && (
        <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
          <p className="text-lg text-gray-700">Merchant wallet detected. Open scanner to verify beneficiaries.</p>
        </div>
      )}
    </section>
  );
}

export default Home;
