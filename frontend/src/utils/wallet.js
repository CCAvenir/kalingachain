import { BrowserProvider } from "ethers";
import { verifyEligibility } from "./contract";

const REQUIRED_CHAIN_ID = Number(import.meta.env.VITE_SEPOLIA_CHAIN_ID || 11155111);
const METAMASK_DOWNLOAD_URL = "https://metamask.io/download/";
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

function buildMetaMaskDeepLink() {
  const currentUrl = window.location.href;
  return `https://metamask.app.link/dapp/${encodeURIComponent(currentUrl)}`;
}

function redirectToMetaMaskMobile() {
  const deepLink = buildMetaMaskDeepLink();
  window.location.href = deepLink;

  // If MetaMask mobile is not installed, fallback to download page.
  window.setTimeout(() => {
    window.location.href = METAMASK_DOWNLOAD_URL;
  }, 1800);
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

export async function connectWallet() {
  const hasProvider = await hasMetaMask();
  if (!hasProvider) {
    if (isMobileDevice()) {
      redirectToMetaMaskMobile();
      throw new Error("Opening MetaMask mobile app...");
    }

    window.location.href = METAMASK_DOWNLOAD_URL;
    throw new Error("MetaMask wallet is required to use this system.");
  }

  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  await assertSepolia(provider);
  const network = await provider.getNetwork();
  const message = `KalingaChain wallet authentication at ${new Date().toISOString()}`;
  const signature = await signer.signMessage(message);
  const account = accounts[0];

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

export async function getConnectedAccount() {
  if (!(await hasMetaMask())) return null;
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

export async function getWalletSession() {
  const account = await getConnectedAccount();
  return {
    account,
    role: await detectWalletRole(account),
  };
}
