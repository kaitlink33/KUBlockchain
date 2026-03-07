# TrustEscrow — Stage 1: Smart Contracts

## What this stage contains
- `contracts/TrustEscrow.sol` — Core escrow + ERC-721 reputation NFT contract
- `scripts/deploy.js` — Deployment script (Hardhat)
- `test/TrustEscrow.test.js` — Unit tests

## Quick Start

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Deploy to XRPL EVM Devnet

1. Copy `.env.example` to `.env` and fill in private key
2. `npm run deploy:xrpl`

## .env.example
```
PRIVATE_KEY=your_wallet_private_key_here
CONTRACT_ADDRESS=will_be_filled_after_deploy
SEPOLIA_RPC_URL=https://rpc.sepolia.org
ETHERSCAN_API_KEY=optional
```

## Contract Functions

| Function | Who calls it | What it does |
|---|---|---|
| `createJob()` | Client | Deposits funds, creates job + milestones |
| `acceptJob()` | Freelancer | Locks in as the assigned worker |
| `approveMilestone()` | Client | Releases payment for that milestone |
| `openDispute()` | Either party | Starts 48hr arbitration window |
| `resolveDisputeByTimeout()` | Anyone | Refunds client if dispute window expires |
| `cancelOpenJob()` | Client | Cancels job before freelancer accepts |
| `getReputation()` | Anyone | Reads on-chain reputation score |

## XRPL EVM Sidechain
- Chain ID: 1440002
- RPC: https://rpc-evm-sidechain.xrpl.org
- Faucet: https://faucet.xrpl.org (bridge XRP to EVM sidechain)
