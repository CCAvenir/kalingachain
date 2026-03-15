import { BrowserProvider } from "ethers";
import { verifyEligibility } from "./contract";

const REQUIRED_CHAIN_ID = Number(import.meta.env.VITE_SEPOLIA_CHAIN_ID || 11155111);
const METAMASK_DOWNLOAD_URL = "https://metamask.io/download/";
const WALLET_SOURCE_KEY = "kalingachain-wallet-source";
const MANUAL_ACCOUNT_KEY = "kalingachain-manual-account";
const ROLE_WALLETS = {
  admin: "0x17bda475397B028B26Dd3a2b413E8Ea69b045BA6".toLowerCase(),
  merchant: "0x0dc67924399d1AF0fdeA6e5050bCF64690ADa50d".toLowerCase(),
};

export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function getMetaMaskDownloadUrl() {
  return METAMASK_DOWNLOAD_URL;
}

function persistSession(walletSource, manualAddress = "") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WALLET_SOURCE_KEY, walletSource);
  if (manualAddress) {
    window.localStorage.setItem(MANUAL_ACCOUNT_KEY, manualAddress);
  } else {
    window.localStorage.removeItem(MANUAL_ACCOUNT_KEY);
  }
}

function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(WALLET_SOURCE_KEY);
  window.localStorage.removeItem(MANUAL_ACCOUNT_KEY);
}

function getWalletSource() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(WALLET_SOURCE_KEY);
}

function getManualAccount() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(MANUAL_ACCOUNT_KEY);
}

export async function hasMetaMask() {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
}

export function getWalletDebugConfig() {
  return {
    requiredChainId: REQUIRED_CHAIN_ID,
    hasMetaMask: typeof window !== "undefined" && typeof window.ethereum !== "undefined",
    roleWallets: ROLE_WALLETS,
  };
}

export async function detectWalletRole(address) {
  if (!address) return "guest";
  const normalized = address.toLowerCase();

  if (normalized === ROLE_WALLETS.admin) return "admin";
  if (normalized === ROLE_WALLETS.merchant) return "merchant";

  try {
    const eligible = await verifyEligibility(address);
    return eligible ? "beneficiary" : "guest";
  } catch (error) {
    console.error("[KalingaChain] Beneficiary role check failed.", error);
    return "guest";
  }
}

async function detectManualRole(address) {
  if (!address) return "guest";
  try {
    const eligible = await verifyEligibility(address);
    return eligible ? "beneficiary" : "guest";
  } catch (error) {
    console.error("[KalingaChain] Manual role check failed.", error);
    return "guest";
  }
}

async function assertSepolia(provider) {
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  if (chainId !== REQUIRED_CHAIN_ID) {
    console.error("[KalingaChain] Wallet connected to wrong network.", {
      currentChainId: chainId,
      requiredChainId: REQUIRED_CHAIN_ID,
    });
    throw new Error(`Wrong network. Please switch MetaMask to Sepolia (${REQUIRED_CHAIN_ID}).`);
  }
}

async function connectWithMetaMask() {
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  await assertSepolia(provider);
  const network = await provider.getNetwork();
  const message = `KalingaChain wallet authentication at ${new Date().toISOString()}`;
  const signature = await signer.signMessage(message);
  const account = accounts[0];

  persistSession("metamask");

  return {
    provider,
    signer,
    account,
    role: await detectWalletRole(account),
    chainId: Number(network.chainId),
    authMessage: message,
    signature,
  };
}

export async function connectWallet() {
  const hasProvider = await hasMetaMask();
  if (hasProvider) {
    return connectWithMetaMask();
  }

  if (isMobileDevice()) {
    throw new Error("Mobile detected. Enter wallet address manually.");
  }

  throw new Error("MetaMask is not installed. Please install MetaMask.");
}

export async function connectWalletWithManualAddress(address) {
  const normalized = address?.trim();
  if (!normalized || !/^0x[a-fA-F0-9]{40}$/.test(normalized)) {
    throw new Error("Please enter a valid wallet address.");
  }

  persistSession("manual", normalized);
  return {
    account: normalized,
    // Manual mode is read-only and never grants admin/merchant privileges.
    role: await detectManualRole(normalized),
    chainId: REQUIRED_CHAIN_ID,
    provider: null,
    signer: null,
    authMessage: "Manual mobile wallet session",
    signature: "",
  };
}

export function disconnectWalletSession() {
  clearSession();
}

export async function disconnectWallet() {
  clearSession();
}

export async function getConnectedAccount() {
  if (await hasMetaMask()) {
    try {
      const provider = new BrowserProvider(window.ethereum);
      await assertSepolia(provider);
      const accounts = await provider.send("eth_accounts", []);
      return accounts[0] ?? null;
    } catch (error) {
      console.error("[KalingaChain] Unable to hydrate connected account.", error);
      return null;
    }
  }

  if (getWalletSource() === "manual") {
    return getManualAccount();
  }

  return null;
}

export async function getWalletSession() {
  const account = await getConnectedAccount();
  if (getWalletSource() === "manual") {
    return {
      account,
      role: await detectManualRole(account),
    };
  }
  return {
    account,
    role: await detectWalletRole(account),
  };
}
