import { useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/beneficiary", label: "Beneficiary" },
];

function Navbar({ role, account, roleTitle, status, onConnectWallet }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const shortWallet = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : status;

  const navClassName = ({ isActive }) =>
    `rounded-md px-4 py-2 text-sm font-semibold transition ${
      isActive ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

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
              <button className="btn-primary px-4 py-2 text-sm" onClick={onConnectWallet}>
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
            <button className="btn-primary w-full px-6 py-3 text-base" onClick={onConnectWallet}>
              {role === "guest" ? "Connect Wallet" : "Switch Wallet"}
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
