# KalingaChain: Decentralized Benefit and Discount Verification System

KalingaChain is a decentralized application (dApp) for issuing and verifying blockchain-based benefit IDs for Filipino Seniors and Persons with Disabilities (PWDs). IDs are account-bound and non-transferable, and merchants can verify eligibility through wallet QR codes.

## Tech Stack

- Solidity smart contracts (ERC-4973-style Account-Bound Token)
- Ethereum Sepolia testnet
- React + Vite + Tailwind CSS
- ethers.js for blockchain integration
- MetaMask wallet
- `qrcode.react` for QR generation

## Project Structure

```text
kalingachain
├── contracts
│   └── KalingaChainID.sol
├── frontend
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src
│       ├── components
│       │   ├── AdminPanel.jsx
│       │   ├── BeneficiaryDashboard.jsx
│       │   ├── MerchantScanner.jsx
│       │   ├── Navbar.jsx
│       │   └── QRDisplay.jsx
│       ├── pages
│       │   ├── Admin.jsx
│       │   ├── Beneficiary.jsx
│       │   ├── Home.jsx
│       │   └── Merchant.jsx
│       ├── utils
│       │   ├── contract.js
│       │   └── wallet.js
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
└── package.json
```

## Smart Contract Features

`contracts/KalingaChainID.sol` includes:

- Admin-only `issueID(address beneficiary)`
- Admin-only `revokeID(address beneficiary)`
- `verifyEligibility(address user)` status check
- `logVerification(address merchant, address beneficiary)` verification logging
- Non-transferability by design (no transfer functions)
- Events:
  - `IDIssued`
  - `IDRevoked`
  - `VerificationLogged`
  - `Attest` / `Revoke` (ERC-4973-style)

## Local Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create frontend env file:
   ```bash
   copy frontend\.env.example frontend\.env
   ```
3. Update `frontend/.env` with your deployed Sepolia contract address.
4. Start app:
   ```bash
   npm run dev
   ```

## Remix Deployment (Sepolia)

1. Open [Remix IDE](https://remix.ethereum.org/).
2. Create `KalingaChainID.sol` and paste `contracts/KalingaChainID.sol`.
3. In Solidity compiler, compile with version `0.8.20` (or compatible `^0.8.20`).
4. Open Deploy & Run:
   - Environment: **Injected Provider - MetaMask**
   - Network in MetaMask: **Sepolia**
   - Constructor parameter `admin`: your LGU admin wallet address
5. Deploy contract and confirm transaction in MetaMask.
6. Copy deployed contract address.
7. Put address in `frontend/.env`:
   - `VITE_KALINGACHAIN_CONTRACT_ADDRESS=0x...`
8. Restart frontend dev server.

## Security Practices Used

- Non-transferable account-bound ID model
- Admin-only issue/revoke controls
- Merchant log integrity (`merchant == msg.sender`)
- Minimal on-chain personal data (wallet address only)
- Error handling for wallet/network/contract interactions

## Accessible UI Considerations

- Large text sizing
- High contrast palette
- Simple and clear navigation
- Mobile-responsive layout
"# kalingachain" 
