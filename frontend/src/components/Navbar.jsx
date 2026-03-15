import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { getMetaMaskDownloadUrl, hasMetaMask, isMobileDevice } from "../utils/wallet";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/beneficiary", label: "Beneficiary" },
];

function Navbar({
  role,
  account,
  roleTitle,
  status,
  onConnectWallet,
  onRefreshRole,
  isMobile,
  manualAddress,
  onManualAddressChange,
  onManualAddressConnect,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletAvailable, setWalletAvailable] = useState(true);
  const shortWallet = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : status;
  const mobileDetected = isMobile ?? isMobileDevice();

  const navClassName = ({ isActive }) =>
    `rounded-md px-4 py-2 text-sm font-semibold transition ${
      isActive ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  useEffect(() => {
    async function checkWalletProvider() {
      const available = await hasMetaMask();
      setWalletAvailable(available);
    }

    checkWalletProvider();
  }, []);

  return (
    <header className="border-b border-gray-300 bg-white">
      <nav className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="text-2xl font-bold text-black lg:text-3xl">KalingaChain</div>

          <button
            className="rounded-md border px-3 py-2 text-xl text-gray-800 md:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>

          <div className="hidden flex-1 items-center justify-between gap-4 md:flex">
            <div className="flex items-center gap-2 lg:gap-3">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={navClassName}>
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-gray-700">
                Role: <span className="text-black">{roleTitle}</span>
              </p>
              <p className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">{shortWallet}</p>
              <button className="btn-secondary px-4 py-2 text-sm" onClick={onRefreshRole}>
                Refresh Role
              </button>
              <button
                className="btn-primary px-4 py-2 text-sm"
                onClick={onConnectWallet}
              >
                {role === "guest" ? "Connect Wallet" : "Switch Wallet"}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="mt-4 space-y-3 rounded-xl border bg-white p-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navClassName}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-sm font-semibold text-gray-700">
                Role: <span className="text-black">{roleTitle}</span>
              </p>
              <p className="mt-1 text-sm text-gray-600">{shortWallet}</p>
            </div>
            <button
              className="btn-primary w-full px-6 py-3 text-base"
              onClick={onConnectWallet}
            >
              {role === "guest" ? "Connect Wallet" : "Switch Wallet"}
            </button>
            <button className="btn-secondary w-full px-6 py-3 text-base" onClick={onRefreshRole}>
              Refresh Role
            </button>
            {mobileDetected && (
              <div className="space-y-2 rounded-md border bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-700">Mobile Manual Wallet Address</p>
                <input
                  className="input py-2 text-sm"
                  placeholder="0x..."
                  value={manualAddress}
                  onChange={(event) => onManualAddressChange(event.target.value)}
                />
                <button className="btn-secondary w-full px-4 py-2 text-sm" onClick={onManualAddressConnect}>
                  Connect Manual Address
                </button>
              </div>
            )}
          </div>
        )}

        {!walletAvailable && !mobileDetected && (
          <div className="mt-4 rounded-xl border border-black bg-gray-50 p-4">
            <p className="text-sm font-semibold text-black">
              MetaMask or a compatible wallet is required.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={getMetaMaskDownloadUrl()}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary rounded-md px-4 py-2 text-sm"
              >
                Install MetaMask
              </a>
            </div>
            {mobileDetected && (
              <p className="mt-2 text-xs text-gray-700">
                For best experience, open this site inside the MetaMask mobile app.
              </p>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
