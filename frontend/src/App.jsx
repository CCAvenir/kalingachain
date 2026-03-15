import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Merchant from "./pages/Merchant";
import Beneficiary from "./pages/Beneficiary";
import { connectWallet, getWalletSession } from "./utils/wallet";

function UnauthorizedAccess() {
  return (
    <section className="mx-auto max-w-3xl rounded-lg border bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-black">Unauthorized Access</h1>
      <p className="mt-3 text-lg text-gray-700">
        This wallet is not authorized to open this page. Please connect an approved KalingaChain
        wallet.
      </p>
    </section>
  );
}

function ProtectedRoute({ allow, role, children }) {
  if (!allow.includes(role)) {
    return <UnauthorizedAccess />;
  }
  return children;
}

function App() {
  const [account, setAccount] = useState("");
  const [role, setRole] = useState("guest");
  const [status, setStatus] = useState("Wallet not connected");

  const roleTitle = useMemo(() => {
    if (role === "admin") return "Admin";
    if (role === "merchant") return "Merchant";
    if (role === "beneficiary") return "Beneficiary";
    return "Guest";
  }, [role]);

  const refreshWalletSession = async () => {
    const session = await getWalletSession();
    if (!session.account) {
      setAccount("");
      setRole("guest");
      setStatus("Wallet not connected");
      return;
    }

    setAccount(session.account);
    setRole(session.role);
    setStatus("Wallet connected");
  };

  useEffect(() => {
    refreshWalletSession();
  }, []);

  useEffect(() => {
    const handleRoleRefreshRequest = async () => {
      await refreshWalletSession();
    };

    window.addEventListener("kalingachain:role-refresh", handleRoleRefreshRequest);
    return () => {
      window.removeEventListener("kalingachain:role-refresh", handleRoleRefreshRequest);
    };
  }, []);

  const handleConnectWallet = async () => {
    try {
      const session = await connectWallet();
      setAccount(session.account);
      setRole(session.role);
      setStatus("Wallet connected");
    } catch (error) {
      setStatus(error.message || "Connection failed");
    }
  };

  const handleRefreshRole = async () => {
    try {
      setStatus("Refreshing wallet role...");
      await refreshWalletSession();
    } catch (error) {
      setStatus(error.message || "Unable to refresh role");
    }
  };

  const handleDisconnectWallet = () => {
    // MetaMask does not provide a true dApp-side disconnect for all cases.
    // This clears the local app session and returns user to guest mode.
    setAccount("");
    setRole("guest");
    setStatus("Wallet disconnected");
  };

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <Navbar
        role={role}
        account={account}
        roleTitle={roleTitle}
        status={status}
        onConnectWallet={handleConnectWallet}
        onRefreshRole={handleRefreshRole}
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <Routes>
          <Route
            path="/"
            element={<Home account={account} role={role} onConnectWallet={handleConnectWallet} />}
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allow={["admin"]} role={role}>
                <Admin account={account} role={role} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant"
            element={
              <ProtectedRoute allow={["merchant"]} role={role}>
                <Merchant account={account} role={role} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/beneficiary"
            element={
              <ProtectedRoute allow={["beneficiary"]} role={role}>
                <Beneficiary account={account} role={role} onDisconnectWallet={handleDisconnectWallet} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
