import { BrowserProvider } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";
import { verifyEligibility } from "./contract";

const REQUIRED_CHAIN_ID = Number(import.meta.env.VITE_SEPOLIA_CHAIN_ID || 11155111);
const METAMASK_DOWNLOAD_URL = "https://metamask.io/download/";
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo";
const META_MASK_DEEP_LINK_KEY = "kalingachain-metamask-deeplink-ts";
const META_MASK_DEEP_LINK_COOLDOWN_MS = 20000;
const ROLE_WALLETS = {
  admin: "0x17bda475397B028B26Dd3a2b413E8Ea69b045BA6".toLowerCase(),
  merchant: "0x0dc67924399d1AF0fdeA6e5050bCF64690ADa50d".toLowerCase(),
};
let walletConnectProviderInstance = null;

export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isMetaMaskBrowser() {
  if (typeof window === "undefined") return false;
  return Boolean(window.ethereum?.isMetaMask);
}

export function getMetaMaskDownloadUrl() {
  return METAMASK_DOWNLOAD_URL;
}

function buildMetaMaskDeepLink() {
  const currentUrl = window.location.href;
  return `https://metamask.app.link/dapp/${encodeURIComponent(currentUrl)}`;
}

function canDeepLinkToMetaMask() {
  if (typeof window === "undefined") return false;
  const lastAttempt = Number(window.sessionStorage.getItem(META_MASK_DEEP_LINK_KEY) || 0);
  const now = Date.now();
  if (now - lastAttempt < META_MASK_DEEP_LINK_COOLDOWN_MS) {
    return false;
  }
  window.sessionStorage.setItem(META_MASK_DEEP_LINK_KEY, String(now));
  return true;
}

function redirectToMetaMaskMobile() {
  const deepLink = buildMetaMaskDeepLink();
  window.location.href = deepLink;

  // If MetaMask mobile is not installed, fallback to download page.
  window.setTimeout(() => {
    window.location.href = METAMASK_DOWNLOAD_URL;
  }, 1800);
}

async function getWalletConnectProvider() {
  if (walletConnectProviderInstance) return walletConnectProviderInstance;

  walletConnectProviderInstance = await EthereumProvider.init({
    projectId: WALLETCONNECT_PROJECT_ID,
    chains: [REQUIRED_CHAIN_ID],
    showQrModal: true,
    methods: [
      "eth_sendTransaction",
      "personal_sign",
      "eth_signTypedData",
      "eth_signTypedData_v4",
      "eth_sign",
    ],
  });

  return walletConnectProviderInstance;
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

async function connectWithProvider(rawProvider, walletSource) {
  const provider = new BrowserProvider(rawProvider);
  const accounts = await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  await assertSepolia(provider);
  const network = await provider.getNetwork();
  const message = `KalingaChain wallet authentication at ${new Date().toISOString()}`;
  const signature = await signer.signMessage(message);
  const account = accounts[0];

  if (typeof window !== "undefined") {
    window.localStorage.setItem("kalingachain-wallet-source", walletSource);
  }

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
  if (hasProvider && isMetaMaskBrowser()) {
    return connectWithProvider(window.ethereum, "metamask");
  }

  if (hasProvider) {
    return connectWithProvider(window.ethereum, "injected");
  }

  if (isMobileDevice()) {
    try {
      const walletConnectProvider = await getWalletConnectProvider();
      if (!walletConnectProvider.session) {
        await walletConnectProvider.connect();
      }
      return await connectWithProvider(walletConnectProvider, "walletconnect");
    } catch (error) {
      console.error("[KalingaChain] WalletConnect connection failed.", error);

      if (!isMetaMaskBrowser() && canDeepLinkToMetaMask()) {
        redirectToMetaMaskMobile();
        throw new Error("Opening MetaMask mobile app...");
      }
    }
  }

  window.location.href = METAMASK_DOWNLOAD_URL;
  throw new Error("MetaMask or a compatible wallet is required.");
}

async function getWalletConnectAccountIfAvailable() {
  try {
    const walletConnectProvider = await getWalletConnectProvider();
    if (!walletConnectProvider.session) return null;

    const provider = new BrowserProvider(walletConnectProvider);
    await assertSepolia(provider);
    const accounts = await provider.send("eth_accounts", []);
    return accounts[0] ?? null;
  } catch (error) {
    console.error("[KalingaChain] Unable to restore WalletConnect account.", error);
    return null;
  }
}

function getWalletSource() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("kalingachain-wallet-source");
}

export function disconnectWalletSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem("kalingachain-wallet-source");
  window.sessionStorage.removeItem(META_MASK_DEEP_LINK_KEY);
}

export async function disconnectWallet() {
  if (getWalletSource() === "walletconnect") {
    try {
      const walletConnectProvider = await getWalletConnectProvider();
      await walletConnectProvider.disconnect();
    } catch (error) {
      console.error("[KalingaChain] WalletConnect disconnect failed.", error);
    }
  }

  disconnectWalletSession();
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

  if (getWalletSource() === "walletconnect") {
    return getWalletConnectAccountIfAvailable();
  }

  return null;
}

export async function getWalletSession() {
  const account = await getConnectedAccount();
  return {
    account,
    role: await detectWalletRole(account),
  };
}
