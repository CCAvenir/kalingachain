import { BrowserProvider } from "ethers";

const REQUIRED_CHAIN_ID = Number(import.meta.env.VITE_SEPOLIA_CHAIN_ID || 11155111);
const ROLE_WALLETS = {
  admin: "0x17bda475397B028B26Dd3a2b413E8Ea69b045BA6".toLowerCase(),
  merchant: "0x0dc67924399d1AF0fdeA6e5050bCF64690ADa50d".toLowerCase(),
  beneficiaries: new Set([
    "0x89CD43268B97D4cc3Fd4C6eDbC58a3f39D4ffE68".toLowerCase(),
    "0xfAe20BA6F615346fA5c6F9C73325109D9fBFA1cF".toLowerCase(),
  ]),
};

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

export function detectWalletRole(address) {
  if (!address) return "guest";
  const normalized = address.toLowerCase();

  if (normalized === ROLE_WALLETS.admin) return "admin";
  if (normalized === ROLE_WALLETS.merchant) return "merchant";
  if (ROLE_WALLETS.beneficiaries.has(normalized)) return "beneficiary";
  return "unknown";
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
  if (!(await hasMetaMask())) {
    throw new Error("MetaMask is not installed.");
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
    role: detectWalletRole(account),
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
    role: detectWalletRole(account),
  };
}
