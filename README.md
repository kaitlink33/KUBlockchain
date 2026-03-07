# 🔐 TrustEscrow — Decentralized Freelance Escrow & Reputation

**KU Block-a-Thon 2026** | Built in 36 hours

> Trustless. Transparent. Tamper-proof.

TrustEscrow is a decentralized freelance platform where clients lock funds into smart contract escrow, freelancers complete milestone-based work, and reputation is earned as on-chain NFTs — no middleman, no fraud.

---

## 🎯 Track Eligibility

| Track | Qualification |
|---|---|
| **XRPL Real-World Impact** ($1,500) | Deploys on XRPL EVM Sidechain, uses XRP for payments |
| **Pinata Builder Track** ($2,000) | Pinata used for job metadata + NFT metadata storage |
| **Open Innovation DApp** ($1,000) | Full DApp with on-chain state changes |

---

## 🏗️ Architecture

```
Client (React + RainbowKit)
        │
        ├── POST /api/jobs/metadata ──▶ Express Server ──▶ Pinata IPFS
        │                                                    (job description, attachments)
        └── createJob() ─────────────▶ TrustEscrow.sol (XRPL EVM)
                                         │
                                         ├── Escrow holds XRP funds
                                         ├── Milestone approval → auto payment release
                                         └── Job completion → mints ERC-721 Reputation NFT
                                                              (metadata stored on IPFS)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask with XRPL EVM Devnet configured
- Pinata account (free tier works)

### 1. Smart Contracts (Stage 1)
```bash
cd code/stage1
npm install
npx hardhat test              # run unit tests
npm run deploy:xrpl           # deploy to XRPL EVM Devnet
```

### 2. Backend (Stage 2)
```bash
cd code/stage2/server
npm install
cp .env.example .env          # fill in your keys
npm run dev                   # starts on port 4000
```

### 3. Frontend (Stage 3)
```bash
cd code/stage3/frontend
npm install
cp .env.example .env          # add contract address
npm start                     # opens on port 3000
```

---

## 🔑 Environment Variables

### Backend `.env`
```
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret
CONTRACT_ADDRESS=0x...deployed_contract...
RPC_URL=https://rpc-evm-sidechain.xrpl.org
PRIVATE_KEY=your_wallet_private_key
FRONTEND_URL=http://localhost:3000
PORT=4000
```

### Frontend `.env`
```
REACT_APP_CONTRACT_ADDRESS=0x...deployed_contract...
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_WALLETCONNECT_PROJECT_ID=your_project_id
```

---

## 📋 Git Commit Stages

| Stage | Commit Message | Contents |
|---|---|---|
| Stage 1 | `feat: smart contracts — TrustEscrow escrow + NFT reputation` | Solidity, Hardhat, tests |
| Stage 2 | `feat: backend API — Pinata IPFS + contract event listeners` | Express, Pinata service |
| Stage 3 | `feat: React frontend — job board, escrow UI, reputation profiles` | Full React app |

---

## 📸 Demo Flow

1. **Client** connects wallet → Posts "Build a DeFi dashboard" with 2 milestones (1 XRP each)
2. Metadata uploaded to IPFS via Pinata → CID saved on-chain
3. **Freelancer** browses job board → Accepts job (on-chain state change)
4. Freelancer completes work → **Client** approves milestone → 0.99 XRP auto-released
5. After all milestones → **Reputation NFT** minted to freelancer wallet (metadata on IPFS)
6. Anyone can view freelancer's on-chain reputation score at `/profile/:address`

---

## 🛠️ Tech Stack

- **Smart Contract**: Solidity 0.8.20, OpenZeppelin ERC-721, Hardhat
- **Blockchain**: XRPL EVM Sidechain (Devnet)
- **Storage**: Pinata / IPFS (job metadata, NFT metadata, attachments)
- **Backend**: Node.js, Express, ethers.js
- **Frontend**: React 18, Wagmi, RainbowKit, TailwindCSS
- **Wallet**: MetaMask / WalletConnect

---

## 📜 Contract Address
Deployed on XRPL EVM Devnet: `[FILL_AFTER_DEPLOY]`

Explorer: https://evm-sidechain.xrpl.org
