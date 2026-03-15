import { BrowserProvider, Contract, getAddress, isAddress } from "ethers";

export const KALINGACHAIN_ABI = [
  "function issueID(address beneficiary) external returns (uint256)",
  "function revokeID(address beneficiary) external",
  "function totalBeneficiaries() external view returns (uint256)",
  "function admins(address account) external view returns (bool)",
  "function merchants(address account) external view returns (bool)",
  "function setAdmin(address account, bool isEnabled) external",
  "function setMerchant(address account, bool isEnabled) external",
  "function verifyEligibility(address user) external view returns (bool)",
  "function logVerification(address merchant, address beneficiary) external",
  "function tokenOf(address user) external view returns (uint256)",
  "function owner() external view returns (address)",
  "function getVerificationLogCount() external view returns (uint256)",
  "function getVerificationLog(uint256 index) external view returns (address merchant, address beneficiary, uint256 timestamp, bool eligibleAtCheck)",
  "event IDIssued(address indexed beneficiary, uint256 indexed tokenId)",
  "event IDRevoked(address indexed beneficiary, uint256 indexed tokenId)",
  "event VerificationLogged(address indexed merchant, address indexed beneficiary, bool eligible, uint256 timestamp)",
];

export const KALINGACHAIN_ADDRESS =
  import.meta.env.VITE_KALINGACHAIN_CONTRACT_ADDRESS || "";

const REQUIRED_CHAIN_ID = Number(import.meta.env.VITE_SEPOLIA_CHAIN_ID || 11155111);
const REQUIRED_NETWORK_NAME = "Sepolia";

function buildDebugInfo(chainId) {
  return {
    requiredChainId: REQUIRED_CHAIN_ID,
    currentChainId: chainId ?? "unknown",
    contractAddress: KALINGACHAIN_ADDRESS || "missing",
  };
}

export function getContractAddress() {
  if (!KALINGACHAIN_ADDRESS) {
    throw new Error("Contract address missing. Set VITE_KALINGACHAIN_CONTRACT_ADDRESS.");
  }
  if (!isAddress(KALINGACHAIN_ADDRESS)) {
    throw new Error("Contract address is invalid. Check VITE_KALINGACHAIN_CONTRACT_ADDRESS.");
  }
  return getAddress(KALINGACHAIN_ADDRESS);
}

function getEip1193Provider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not connected. Install or unlock MetaMask.");
  }
  return window.ethereum;
}

async function getProvider() {
  const ethereum = getEip1193Provider();
  const provider = new BrowserProvider(ethereum);
  return provider;
}

async function ensureSepoliaNetwork(provider) {
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  if (chainId !== REQUIRED_CHAIN_ID) {
    const debug = buildDebugInfo(chainId);
    console.error("[KalingaChain] Wrong network detected.", debug);
    throw new Error(
      `Wrong network: connected to chain ${chainId}. Please switch MetaMask to ${REQUIRED_NETWORK_NAME} (${REQUIRED_CHAIN_ID}).`,
    );
  }
  return chainId;
}

async function ensureContractDeployment(provider, address, chainId) {
  // BAD_DATA often happens when the address has no bytecode on the selected network.
  const code = await provider.getCode(address);
  if (code === "0x") {
    const debug = buildDebugInfo(chainId);
    console.error("[KalingaChain] No contract found at configured address.", debug);
    throw new Error("No contract deployed at this address.");
  }
}

function buildReadableError(error, operation) {
  const code = error?.code;
  if (code === "BAD_DATA") {
    return new Error(
      `Contract call failed during ${operation}. This usually means wrong contract address, wrong ABI, or wrong network.`,
    );
  }
  return new Error(error?.reason || error?.shortMessage || error?.message || `${operation} failed.`);
}

export function getContractDebugConfig() {
  return buildDebugInfo();
}

export async function getConnectedWalletAddress() {
  if (typeof window === "undefined" || !window.ethereum) {
    return null;
  }

  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_accounts", []);
  return accounts[0] ?? null;
}

async function buildContract({ withSigner = false } = {}) {
  getEip1193Provider();
  const provider = await getProvider();
  // Run preflight checks before creating a contract instance to prevent opaque decode errors.
  const chainId = await ensureSepoliaNetwork(provider);
  const address = getContractAddress();
  await ensureContractDeployment(provider, address, chainId);

  if (withSigner) {
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    return new Contract(address, KALINGACHAIN_ABI, signer);
  }

  return new Contract(address, KALINGACHAIN_ABI, provider);
}

export async function getContractWithSigner() {
  return buildContract({ withSigner: true });
}

export async function getContractReadOnly() {
  return buildContract({ withSigner: false });
}

export async function issueID(beneficiary) {
  try {
    const contract = await getContractWithSigner();
    const tx = await contract.issueID(beneficiary);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("[KalingaChain] issueID failed.", error);
    throw buildReadableError(error, "issueID");
  }
}

export async function revokeID(beneficiary) {
  try {
    const contract = await getContractWithSigner();
    const tx = await contract.revokeID(beneficiary);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("[KalingaChain] revokeID failed.", error);
    throw buildReadableError(error, "revokeID");
  }
}

export async function verifyEligibility(userAddress) {
  try {
    const contract = await getContractReadOnly();
    return await contract.verifyEligibility(userAddress);
  } catch (error) {
    console.error("[KalingaChain] verifyEligibility failed.", error);
    throw buildReadableError(error, "verifyEligibility");
  }
}

export async function logVerification(beneficiary) {
  try {
    const contract = await getContractWithSigner();
    const signer = await contract.runner.getAddress();
    const tx = await contract.logVerification(signer, beneficiary);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("[KalingaChain] logVerification failed.", error);
    throw buildReadableError(error, "logVerification");
  }
}

export async function fetchVerificationLogs() {
  try {
    const contract = await getContractReadOnly();
    const count = await contract.getVerificationLogCount();
    const entries = [];

    for (let i = 0; i < Number(count); i += 1) {
      const [merchant, beneficiary, timestamp, eligibleAtCheck] = await contract.getVerificationLog(i);
      entries.push({
        merchant,
        beneficiary,
        timestamp: Number(timestamp),
        eligibleAtCheck,
      });
    }

    return entries.reverse();
  } catch (error) {
    console.error("[KalingaChain] fetchVerificationLogs failed.", error);
    throw buildReadableError(error, "fetchVerificationLogs");
  }
}

export async function getTotalBeneficiaries() {
  try {
    const contract = await getContractReadOnly();
    const count = await contract.totalBeneficiaries();
    return Number(count);
  } catch (error) {
    console.error("[KalingaChain] getTotalBeneficiaries failed.", error);
    throw buildReadableError(error, "getTotalBeneficiaries");
  }
}
