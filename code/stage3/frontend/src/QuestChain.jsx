import { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useDisconnect, useContractRead, useContractWrite, usePrepareContractWrite } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ethers } from "ethers";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "0x61a0937d163a7Ea9F85a2e50c331a92AD232BA74";
const API_BASE         = process.env.REACT_APP_API_URL          || "http://localhost:4000/api";

const CONTRACT_ABI = [
  "function createJob(string title, string ipfsCid, string[] milestoneDescs, uint256[] milestoneAmounts) payable returns (uint256)",
  "function acceptJob(uint256 jobId)",
  "function approveMilestone(uint256 jobId, uint256 milestoneIndex, string nftIpfsCid)",
  "function openDispute(uint256 jobId)",
  "function cancelOpenJob(uint256 jobId)",
  "function getJob(uint256 jobId) view returns (address client, address freelancer, string title, string ipfsCid, uint256 totalAmount, uint8 status, uint256 milestoneCount)",
  "function getMilestone(uint256 jobId, uint256 idx) view returns (string description, uint256 amount, bool approved, bool released)",
  "function getReputation(address wallet) view returns (uint256 score, uint256 jobsCompleted)",
  "function totalJobs() view returns (uint256)",
  "event JobCreated(uint256 indexed jobId, address indexed client, string title, uint256 amount)",
];

const RARITY_CONFIG = {
  Common:    { color: "#9ca3af", glow: "rgba(156,163,175,0.3)",  bg: "rgba(156,163,175,0.1)",  border: "rgba(156,163,175,0.4)" },
  Rare:      { color: "#60a5fa", glow: "rgba(96,165,250,0.4)",   bg: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.5)" },
  Epic:      { color: "#c084fc", glow: "rgba(192,132,252,0.4)",  bg: "rgba(192,132,252,0.1)",  border: "rgba(192,132,252,0.5)" },
  Legendary: { color: "#fbbf24", glow: "rgba(251,191,36,0.5)",   bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.6)" },
};

const STATUS_MAP = { 0: "Open", 1: "InProgress", 2: "Completed", 3: "Disputed", 4: "Cancelled" };

const STATUS_CONFIG = {
  Open:       { label: "⚔ Open",        color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  InProgress: { label: "🔥 In Progress", color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  Completed:  { label: "✓ Completed",   color: "#9ca3af", bg: "rgba(156,163,175,0.1)"  },
  Disputed:   { label: "⚡ Disputed",    color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  Cancelled:  { label: "✕ Cancelled",   color: "#6b7280", bg: "rgba(107,114,128,0.1)"  },
};

// Assign rarity based on reward amount
function getRarity(xrpAmount) {
  if (xrpAmount >= 20) return "Legendary";
  if (xrpAmount >= 10) return "Epic";
  if (xrpAmount >= 4)  return "Rare";
  return "Common";
}

// Map on-chain job to quest shape
function jobToQuest(job, id) {
  const reward   = parseFloat(formatEther(job.totalAmount || 0n));
  const rarity   = getRarity(reward);
  const status   = STATUS_MAP[job.status] || "Open";
  return {
    id,
    title:       job.title       || `Quest #${id}`,
    giver:       job.client      || "0x0000...0000",
    freelancer:  job.freelancer,
    reward,
    xp:          Math.round(reward * 28),
    rarity,
    status,
    ipfsCid:     job.ipfsCid,
    totalAmount: job.totalAmount,
    milestoneCount: Number(job.milestoneCount || 0),
    milestones:  [],   // fetched lazily on detail open
    description: "",   // fetched from IPFS via backend lazily
    tags:        [],
    category:    "Development",
    deadline:    "Open",
    attempts:    0,
    completions: status === "Completed" ? 1 : 0,
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Inter:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-void: #06060a;
    --bg-dark: #0d0d14;
    --bg-card: #111118;
    --bg-elevated: #16161f;
    --border: rgba(255,255,255,0.07);
    --border-bright: rgba(255,255,255,0.15);
    --text-primary: #f0eeff;
    --text-secondary: #8b8ba8;
    --text-dim: #4a4a6a;
    --accent: #7c3aed;
    --accent-bright: #a855f7;
    --gold: #fbbf24;
    --gold-dim: #92620a;
  }

  html, body { height: 100%; background: var(--bg-void); }

  .app {
    min-height: 100vh;
    background: var(--bg-void);
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.15) 0%, transparent 60%),
      radial-gradient(ellipse 40% 30% at 90% 20%, rgba(251,191,36,0.06) 0%, transparent 50%);
    font-family: 'Inter', sans-serif;
    color: var(--text-primary);
    overflow-x: hidden;
  }

  .app::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(6,6,10,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
    padding: 0 32px;
    height: 64px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .nav-logo {
    font-family: 'Cinzel', serif;
    font-size: 22px; font-weight: 700; letter-spacing: 2px;
    background: linear-gradient(135deg, #a855f7, #fbbf24);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; cursor: pointer;
  }
  .nav-links { display: flex; gap: 32px; align-items: center; }
  .nav-link {
    font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--text-secondary); cursor: pointer; transition: color 0.2s; font-weight: 500;
  }
  .nav-link:hover, .nav-link.active { color: var(--text-primary); }
  .nav-link.active { color: var(--accent-bright); }

  .wallet-btn {
    padding: 8px 20px;
    background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2));
    border: 1px solid rgba(168,85,247,0.5);
    border-radius: 6px; color: #c4b5fd;
    font-size: 12px; letter-spacing: 1px; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s; font-weight: 500;
  }
  .wallet-btn:hover { background: rgba(168,85,247,0.3); border-color: rgba(168,85,247,0.8); }
  .wallet-btn.connected {
    background: linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.1));
    border-color: rgba(52,211,153,0.4); color: #6ee7b7;
  }
  .wallet-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .stats-bar {
    position: relative; z-index: 1;
    padding: 16px 32px;
    background: rgba(17,17,24,0.8);
    border-bottom: 1px solid var(--border);
    display: flex; gap: 40px; align-items: center;
  }
  .stat { display: flex; flex-direction: column; gap: 2px; }
  .stat-value { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 600; color: var(--gold); }
  .stat-label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); }
  .stat-divider { width: 1px; height: 36px; background: var(--border); }

  .main { position: relative; z-index: 1; display: flex; min-height: calc(100vh - 64px); }

  .sidebar {
    width: 240px; min-width: 240px;
    padding: 24px 16px;
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 8px;
  }
  .sidebar-section { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim); padding: 16px 12px 8px; }
  .sidebar-item {
    padding: 10px 12px; border-radius: 8px; cursor: pointer;
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; color: var(--text-secondary); transition: all 0.15s;
  }
  .sidebar-item:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
  .sidebar-item.active { background: rgba(124,58,237,0.15); color: #c4b5fd; border: 1px solid rgba(124,58,237,0.3); }
  .sidebar-badge {
    margin-left: auto; padding: 2px 7px; border-radius: 10px;
    background: rgba(124,58,237,0.2); color: #a78bfa;
    font-size: 11px; font-weight: 600;
  }

  .content { flex: 1; padding: 32px; overflow-y: auto; }

  .page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; }
  .page-title { font-family: 'Cinzel', serif; font-size: 28px; font-weight: 700; letter-spacing: 1px; color: var(--text-primary); }
  .page-sub { font-size: 14px; color: var(--text-secondary); margin-top: 4px; }

  .filters { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .filter-btn {
    padding: 7px 14px; border-radius: 6px; font-size: 12px; letter-spacing: 0.5px;
    cursor: pointer; border: 1px solid var(--border); background: transparent;
    color: var(--text-secondary); transition: all 0.15s; font-weight: 500;
  }
  .filter-btn:hover { border-color: var(--border-bright); color: var(--text-primary); }
  .filter-btn.active { background: rgba(124,58,237,0.2); border-color: rgba(124,58,237,0.5); color: #c4b5fd; }

  .quest-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }

  .quest-card {
    background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border);
    padding: 20px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;
  }
  .quest-card:hover { transform: translateY(-2px); border-color: var(--border-bright); }

  .quest-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; gap: 8px; }
  .quest-title { font-family: 'Cinzel', serif; font-size: 15px; font-weight: 600; line-height: 1.4; margin-bottom: 8px; color: var(--text-primary); }
  .quest-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .quest-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
  .quest-tag { padding: 3px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); font-size: 11px; color: var(--text-dim); }
  .quest-footer { display: flex; align-items: center; justify-content: space-between; }
  .quest-reward { display: flex; align-items: baseline; gap: 4px; }
  .quest-reward-amount { font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; color: var(--gold); }
  .quest-reward-sym { font-size: 12px; color: var(--gold-dim); font-weight: 600; letter-spacing: 1px; }
  .quest-xp { font-size: 12px; color: #a78bfa; font-weight: 500; }
  .quest-meta { display: flex; align-items: center; gap: 12px; font-size: 11px; color: var(--text-dim); }
  .quest-milestones { display: flex; gap: 4px; margin-bottom: 12px; }
  .milestone-pip { height: 4px; flex: 1; border-radius: 2px; background: rgba(255,255,255,0.08); }
  .milestone-pip.done { background: #34d399; }

  .cta-btn {
    padding: 10px 22px; border-radius: 8px; font-size: 13px; font-weight: 600;
    letter-spacing: 0.5px; cursor: pointer; border: none; transition: all 0.2s; text-transform: uppercase;
  }
  .cta-primary { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; box-shadow: 0 0 20px rgba(124,58,237,0.4); }
  .cta-primary:hover { box-shadow: 0 0 30px rgba(168,85,247,0.5); transform: translateY(-1px); }
  .cta-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .cta-outline { background: transparent; border: 1px solid var(--border-bright) !important; color: var(--text-secondary); }
  .cta-outline:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
  .cta-gold { background: linear-gradient(135deg, #92400e, #b45309); color: #fef3c7; border: 1px solid rgba(251,191,36,0.3) !important; box-shadow: 0 0 16px rgba(251,191,36,0.2); }
  .cta-gold:hover { box-shadow: 0 0 24px rgba(251,191,36,0.35); transform: translateY(-1px); }
  .cta-gold:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .detail-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 32px;
  }
  .detail-panel {
    background: var(--bg-dark); border: 1px solid var(--border-bright);
    border-radius: 16px; width: 100%; max-width: 620px;
    max-height: 85vh; overflow-y: auto; padding: 32px; position: relative;
  }
  .detail-close {
    position: absolute; top: 16px; right: 16px;
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,0.05); border: 1px solid var(--border);
    color: var(--text-secondary); cursor: pointer; font-size: 16px;
    display: flex; align-items: center; justify-content: center; transition: all 0.15s;
  }
  .detail-close:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }
  .detail-rarity-bar { height: 3px; border-radius: 2px; margin-bottom: 24px; background: linear-gradient(90deg, transparent, currentColor, transparent); }
  .detail-title { font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; margin-bottom: 8px; line-height: 1.3; }
  .detail-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 24px; }
  .detail-section-title { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 12px; }
  .milestone-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
  .milestone-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 8px;
    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
    font-size: 13px; color: var(--text-secondary);
  }
  .milestone-num {
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    background: rgba(124,58,237,0.2); color: #a78bfa; flex-shrink: 0;
  }
  .reward-showcase {
    display: flex; align-items: center; gap: 20px;
    padding: 20px; border-radius: 12px; margin-bottom: 24px;
    background: linear-gradient(135deg, rgba(251,191,36,0.07), rgba(251,191,36,0.03));
    border: 1px solid rgba(251,191,36,0.2);
  }
  .reward-showcase-amount { font-family: 'Cinzel', serif; font-size: 36px; font-weight: 900; color: var(--gold); }
  .reward-showcase-label { font-size: 12px; letter-spacing: 1px; color: var(--gold-dim); text-transform: uppercase; }
  .reward-showcase-xp { padding: 6px 14px; border-radius: 20px; background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3); font-size: 13px; color: #a78bfa; font-weight: 600; }

  .profile-header {
    display: flex; gap: 28px; align-items: flex-start; margin-bottom: 32px;
    padding: 28px; border-radius: 16px; background: var(--bg-card); border: 1px solid var(--border);
  }
  .avatar {
    width: 80px; height: 80px; border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #fbbf24);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cinzel', serif; font-size: 28px; font-weight: 700;
    color: white; flex-shrink: 0;
  }
  .profile-name { font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .profile-addr { font-size: 12px; color: var(--text-dim); font-family: monospace; margin-bottom: 12px; }
  .profile-stats { display: flex; gap: 24px; flex-wrap: wrap; }
  .profile-stat { text-align: center; }
  .profile-stat-val { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 600; }
  .profile-stat-lab { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--text-dim); }

  .nft-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
  .nft-card {
    aspect-ratio: 1; border-radius: 12px; border: 1px solid var(--border);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; cursor: pointer; transition: all 0.2s; background: var(--bg-card);
    overflow: hidden; position: relative;
  }
  .nft-card:hover { transform: scale(1.03); border-color: var(--border-bright); }
  .nft-glow { position: absolute; width: 80px; height: 80px; border-radius: 50%; filter: blur(30px); opacity: 0.3; }
  .nft-icon { font-size: 36px; position: relative; z-index: 1; }
  .nft-name { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-align: center; padding: 0 8px; position: relative; z-index: 1; }

  .form-grid { display: grid; gap: 20px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .form-label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); }
  .form-input {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 8px; padding: 12px 14px;
    color: var(--text-primary); font-size: 14px;
    font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.15s; width: 100%;
  }
  .form-input:focus { border-color: rgba(124,58,237,0.6); }
  .form-input::placeholder { color: var(--text-dim); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-select {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 8px; padding: 12px 14px;
    color: var(--text-primary); font-size: 14px;
    font-family: 'Inter', sans-serif; outline: none; cursor: pointer;
  }
  .form-section { font-family: 'Cinzel', serif; font-size: 16px; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 4px; }

  .milestone-input-row { display: flex; gap: 8px; align-items: center; }
  .milestone-input-row .form-input { flex: 1; }
  .remove-btn {
    width: 34px; height: 34px; border-radius: 6px; flex-shrink: 0;
    background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.2);
    color: #f87171; cursor: pointer; font-size: 16px;
    display: flex; align-items: center; justify-content: center; transition: all 0.15s;
  }
  .remove-btn:hover { background: rgba(248,113,113,0.2); }
  .add-milestone-btn {
    padding: 8px 16px; border-radius: 6px;
    background: rgba(124,58,237,0.1); border: 1px dashed rgba(124,58,237,0.3);
    color: #a78bfa; font-size: 13px; cursor: pointer; transition: all 0.15s;
    font-family: 'Inter', sans-serif;
  }
  .add-milestone-btn:hover { background: rgba(124,58,237,0.2); }

  .toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 999;
    padding: 14px 20px; border-radius: 10px;
    background: var(--bg-elevated); border: 1px solid var(--border-bright);
    font-size: 13px; color: var(--text-primary);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: slideUp 0.3s ease;
    max-width: 320px;
  }
  .toast.success { border-color: rgba(52,211,153,0.4); color: #6ee7b7; }
  .toast.error   { border-color: rgba(248,113,113,0.4); color: #fca5a5; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeIn 0.3s ease forwards; }

  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .shimmer-text {
    background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 25%, #fde68a 50%, #f59e0b 75%, #fbbf24 100%);
    background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; animation: shimmer 3s linear infinite;
  }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function RarityGem({ rarity }) {
  const cfg = RARITY_CONFIG[rarity] || RARITY_CONFIG.Common;
  return (
    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      {rarity === "Legendary" ? "◆ " : rarity === "Epic" ? "◈ " : rarity === "Rare" ? "◇ " : "○ "}{rarity}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Open;
  return (
    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 500, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className={`toast ${type}`}>{message}</div>;
}

// ─── Wallet Button ─────────────────────────────────────────────────────────────

function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isLoading } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button className="wallet-btn connected" onClick={() => disconnect()}>
        ✓ {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

  const connector = connectors[0];
  return (
    <button
      className="wallet-btn"
      disabled={isLoading || !connector}
      onClick={() => connector && connect({ connector })}
    >
      {isLoading ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}

// ─── Quest Card ───────────────────────────────────────────────────────────────

function QuestCard({ quest, onClick }) {
  const rarity = RARITY_CONFIG[quest.rarity] || RARITY_CONFIG.Common;
  const pips = Array.from({ length: Math.max(quest.milestoneCount, 1) });
  return (
    <div className="quest-card fade-in" onClick={onClick}
      style={{ boxShadow: `0 0 0 1px ${rarity.border}` }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 24px ${rarity.glow}, 0 0 0 1px ${rarity.border}`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 0 1px ${rarity.border}`; }}
    >
      <div style={{ height: 2, borderRadius: 2, marginBottom: 16, background: `linear-gradient(90deg, ${rarity.color}00, ${rarity.color}, ${rarity.color}00)` }} />
      <div className="quest-card-top">
        <RarityGem rarity={quest.rarity} />
        <StatusBadge status={quest.status} />
      </div>
      <div className="quest-title">{quest.title}</div>
      <div className="quest-desc">{quest.description || "Loading quest details from IPFS…"}</div>
      <div className="quest-tags">{quest.tags.map(t => <span key={t} className="quest-tag">{t}</span>)}</div>
      <div className="quest-milestones">
        {pips.map((_, i) => <div key={i} className={`milestone-pip ${quest.status === "Completed" ? "done" : ""}`} />)}
      </div>
      <div className="quest-footer">
        <div>
          <div className="quest-reward">
            <span className="quest-reward-amount">{quest.reward.toFixed(1)}</span>
            <span className="quest-reward-sym">XRP</span>
          </div>
          <div className="quest-xp">+{quest.xp} XP</div>
        </div>
        <div className="quest-meta">
          <span>🗡 {quest.milestoneCount} stages</span>
          <span>👤 {quest.giver.slice(0, 6)}…{quest.giver.slice(-4)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Quest Detail ─────────────────────────────────────────────────────────────

function QuestDetail({ quest, onClose, onAccept, onApprove, onDispute, onCancel, userAddress }) {
  const rarity = RARITY_CONFIG[quest.rarity] || RARITY_CONFIG.Common;
  const isClient     = userAddress && quest.giver.toLowerCase()      === userAddress.toLowerCase();
  const isFreelancer = userAddress && quest.freelancer?.toLowerCase() === userAddress.toLowerCase();

  return (
    <div className="detail-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="detail-panel fade-in">
        <button className="detail-close" onClick={onClose}>×</button>
        <div className="detail-rarity-bar" style={{ color: rarity.color }} />
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <RarityGem rarity={quest.rarity} />
          <StatusBadge status={quest.status} />
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>#{quest.id.toString().padStart(4, "0")}</span>
        </div>

        <div className="detail-title">{quest.title}</div>
        <div className="detail-desc">{quest.description || "Fetching details from IPFS…"}</div>

        <div className="reward-showcase">
          <div>
            <div className="reward-showcase-amount shimmer-text">{quest.reward.toFixed(2)} XRP</div>
            <div className="reward-showcase-label">Quest Reward in Escrow</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <div className="reward-showcase-xp">+{quest.xp} XP</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>NFT awarded on completion</div>
          </div>
        </div>

        {quest.milestones.length > 0 && (
          <>
            <div className="detail-section-title">Quest Stages</div>
            <div className="milestone-list">
              {quest.milestones.map((m, i) => (
                <div key={i} className="milestone-item">
                  <div className="milestone-num">{i + 1}</div>
                  <span>{m.description}</span>
                  {m.approved && <span style={{ marginLeft: "auto", color: "#34d399", fontSize: 13 }}>✓</span>}
                  {isClient && quest.status === "InProgress" && !m.approved && (
                    <button className="cta-btn cta-primary" style={{ fontSize: 11, padding: "5px 12px", marginLeft: "auto" }}
                      onClick={() => onApprove(quest.id, i)}>
                      Approve
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="detail-section-title">Quest Giver</div>
        <div style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-secondary)", marginBottom: 24, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid var(--border)" }}>
          {quest.giver}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* Freelancer: accept open quest */}
          {quest.status === "Open" && !isClient && (
            <button className="cta-btn cta-gold" style={{ flex: 1 }} onClick={() => onAccept(quest.id)}>
              ⚔ Accept Quest
            </button>
          )}
          {/* Client: cancel open quest */}
          {quest.status === "Open" && isClient && (
            <button className="cta-btn cta-outline" onClick={() => onCancel(quest.id)}>
              Cancel & Refund
            </button>
          )}
          {/* Client or freelancer: open dispute */}
          {quest.status === "InProgress" && (isClient || isFreelancer) && (
            <button className="cta-btn cta-outline" onClick={() => onDispute(quest.id)}>
              ⚡ Open Dispute
            </button>
          )}
          {quest.status === "Completed" && (
            <div style={{ textAlign: "center", flex: 1, padding: "12px", borderRadius: 8, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399", fontSize: 13 }}>
              ✓ Quest Completed — NFT Awarded
            </div>
          )}
          <a className="cta-btn cta-outline"
            href={`https://explorer.testnet.xrplevm.org/address/${CONTRACT_ADDRESS}`}
            target="_blank" rel="noopener noreferrer">
            View on Chain ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Quest Board ──────────────────────────────────────────────────────────────

function QuestBoard({ quests, loading, onSelectQuest, onPostQuest }) {
  const [filter, setFilter]       = useState("All");
  const [rarityFilter, setRarity] = useState("All");

  const categories = ["All", "Development", "Design", "Backend", "Security", "Data"];
  const rarities   = ["All", "Common", "Rare", "Epic", "Legendary"];

  const filtered = quests.filter(q =>
    (filter === "All" || q.category === filter) &&
    (rarityFilter === "All" || q.rarity === rarityFilter)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quest Board</div>
          <div className="page-sub">{loading ? "Loading quests from chain…" : `${filtered.length} quests on-chain · Reward locked in escrow`}</div>
        </div>
        <button className="cta-btn cta-primary" style={{ fontSize: 12, padding: "9px 18px" }} onClick={onPostQuest}>
          + Post Quest
        </button>
      </div>

      <div className="filters">
        {categories.map(c => <button key={c} className={`filter-btn ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>{c}</button>)}
      </div>
      <div className="filters">
        {rarities.map(r => {
          const cfg = RARITY_CONFIG[r];
          return (
            <button key={r} className={`filter-btn ${rarityFilter === r ? "active" : ""}`}
              onClick={() => setRarity(r)}
              style={rarityFilter === r && r !== "All" ? { borderColor: cfg?.border, color: cfg?.color, background: cfg?.bg } : {}}>
              {r}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-dim)" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚔</div>
          <div>Summoning quests from the chain…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-dim)" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🌱</div>
          <div>No quests yet. Be the first to post one!</div>
          <button className="cta-btn cta-primary" style={{ marginTop: 20 }} onClick={onPostQuest}>Post a Quest →</button>
        </div>
      ) : (
        <div className="quest-grid">
          {filtered.map(q => <QuestCard key={q.id} quest={q} onClick={() => onSelectQuest(q)} />)}
        </div>
      )}
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

function ProfilePage({ userAddress }) {
  const [rep, setRep] = useState(null);

  useEffect(() => {
    if (!userAddress) return;
    fetch(`${API_BASE}/reputation/${userAddress}`)
      .then(r => r.json())
      .then(setRep)
      .catch(() => {});
  }, [userAddress]);

  const initials = userAddress ? userAddress.slice(2, 4).toUpperCase() : "??";
  const xrpEarned = rep ? parseFloat(rep.score || 0).toFixed(3) : "0.000";
  const completed = rep?.jobsCompleted || 0;
  const xp        = Math.round(parseFloat(xrpEarned) * 28 + completed * 200);

  return (
    <div className="fade-in">
      <div className="page-title" style={{ marginBottom: 24 }}>Adventurer Profile</div>

      {!userAddress ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-dim)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
          <div>Connect your wallet to view your profile</div>
        </div>
      ) : (
        <>
          <div className="profile-header">
            <div className="avatar">{initials}</div>
            <div style={{ flex: 1 }}>
              <div className="profile-name">Adventurer</div>
              <div className="profile-addr">{userAddress}</div>
              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="profile-stat-val shimmer-text">{xrpEarned}</div>
                  <div className="profile-stat-lab">XRP Earned</div>
                </div>
                <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch" }} />
                <div className="profile-stat">
                  <div className="profile-stat-val" style={{ color: "#a78bfa" }}>{xp}</div>
                  <div className="profile-stat-lab">Total XP</div>
                </div>
                <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch" }} />
                <div className="profile-stat">
                  <div className="profile-stat-val" style={{ color: "#34d399" }}>{completed}</div>
                  <div className="profile-stat-lab">Completed</div>
                </div>
              </div>
            </div>
            <RarityGem rarity={completed >= 5 ? "Legendary" : completed >= 3 ? "Epic" : completed >= 1 ? "Rare" : "Common"} />
          </div>

          <div style={{ padding: "20px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "var(--text-dim)", letterSpacing: "1px", textTransform: "uppercase" }}>XP Progress</div>
              <div style={{ fontSize: 12, color: "#a78bfa" }}>{xp} XP</div>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min((xp % 1000) / 10, 100)}%`, borderRadius: 4, background: "linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)", transition: "width 0.5s ease" }} />
            </div>
          </div>

          <div style={{ padding: "20px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
              On-chain reputation NFTs appear here after completing quests.
            </div>
            {completed === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-dim)" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏛</div>
                <div>Complete your first quest to earn an NFT</div>
              </div>
            ) : (
              <div className="nft-grid">
                {Array.from({ length: completed }).map((_, i) => (
                  <div key={i} className="nft-card" style={{ borderColor: RARITY_CONFIG.Rare.border }}>
                    <div className="nft-glow" style={{ background: "#60a5fa" }} />
                    <div className="nft-icon">⚔</div>
                    <div className="nft-name" style={{ color: "#60a5fa" }}>Quest #{i + 1}</div>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", position: "relative", zIndex: 1 }}>Completion NFT</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Create Quest Page ────────────────────────────────────────────────────────

function CreateQuestPage({ onSubmit, isConnected }) {
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState("Development");
  const [rarity,      setRarity]      = useState("Common");
  const [tags,        setTags]        = useState("");
  const [reward,      setReward]      = useState("");
  const [milestones,  setMilestones]  = useState(["", ""]);
  const [submitting,  setSubmitting]  = useState(false);

  const addMilestone    = ()       => setMilestones([...milestones, ""]);
  const removeMilestone = i        => setMilestones(milestones.filter((_, idx) => idx !== i));
  const updateMilestone = (i, val) => { const n = [...milestones]; n[i] = val; setMilestones(n); };

  const handleSubmit = async () => {
    if (!isConnected)         return alert("Connect your wallet first");
    if (!title.trim())        return alert("Quest title required");
    if (!description.trim())  return alert("Description required");
    if (!reward || isNaN(parseFloat(reward))) return alert("Valid reward required");
    const filled = milestones.filter(m => m.trim());
    if (filled.length === 0)  return alert("At least one stage required");

    setSubmitting(true);
    await onSubmit({ title, description, category, rarity, tags: tags.split(",").map(t => t.trim()).filter(Boolean), reward: parseFloat(reward), milestones: filled });
    setSubmitting(false);
  };

  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <div className="page-title">Post a Quest</div>
          <div className="page-sub">Define your quest. Reward is locked in escrow until stages are complete.</div>
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
        <div className="form-grid">
          <div className="form-section">Quest Details</div>

          <div className="form-group">
            <label className="form-label">Quest Title</label>
            <input className="form-input" placeholder="e.g. Slay the Broken Auth Flow" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={4} placeholder="Describe the quest, requirements, and what counts as completion…" style={{ resize: "vertical" }} value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                {["Development", "Design", "Backend", "Security", "Data", "Other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Rarity / Difficulty</label>
              <select className="form-select" value={rarity} onChange={e => setRarity(e.target.value)}>
                {["Common", "Rare", "Epic", "Legendary"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Skills Required (comma separated)</label>
            <input className="form-input" placeholder="React, Node.js, SQL" value={tags} onChange={e => setTags(e.target.value)} />
          </div>

          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          <div className="form-section">Quest Stages</div>

          {milestones.map((m, i) => (
            <div key={i} className="milestone-input-row">
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(124,58,237,0.2)", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <input className="form-input" value={m} onChange={e => updateMilestone(i, e.target.value)} placeholder={`Stage ${i + 1} — e.g. Submit wireframes for approval`} />
              {milestones.length > 1 && <button className="remove-btn" onClick={() => removeMilestone(i)}>✕</button>}
            </div>
          ))}
          <button className="add-milestone-btn" onClick={addMilestone}>+ Add Stage</button>

          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          <div className="form-section">Escrow Reward</div>

          <div style={{ padding: 20, borderRadius: 12, background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)" }}>
            <label className="form-label" style={{ marginBottom: 8, display: "block" }}>Total XRP Reward (split equally across stages)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input className="form-input" type="number" placeholder="10.0" step="0.1" min="0.1" value={reward} onChange={e => setReward(e.target.value)} style={{ flex: 1 }} />
              <span style={{ color: "var(--gold)", fontFamily: "Cinzel, serif", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap" }}>XRP</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 12 }}>
              ⚠ Funds are locked in the QuestChain contract until each stage is approved. 1% platform fee applies.
            </div>
          </div>

          <button className="cta-btn cta-primary" onClick={handleSubmit} disabled={submitting || !isConnected}>
            {submitting ? "Posting to Chain…" : isConnected ? "⚔ Post Quest to Chain" : "Connect Wallet to Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function QuestChain() {
  const { address, isConnected } = useAccount();

  const [page,          setPage]          = useState("board");
  const [quests,        setQuests]        = useState([]);
  const [loadingQuests, setLoadingQuests] = useState(true);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [stats,         setStats]         = useState({ totalJobs: 0, totalValueLocked: "0.0" });
  const [toast,         setToast]         = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });



  // ── Fetch all jobs from backend ─────────────────────────────────────────────
  const fetchQuests = useCallback(async () => {
    setLoadingQuests(true);
    try {
      // ── Fix: fetch fresh stats directly, don't rely on stale state ──
      const statsRes = await fetch(`${API_BASE}/stats`);
      const freshStats = await statsRes.json();
      const total = freshStats.totalJobs || 0;

    // update stats bar too
      setStats(freshStats);

      if (total === 0) { setQuests([]); setLoadingQuests(false); return; }

      const jobs = await Promise.all(
        Array.from({ length: total }, (_, i) =>
          fetch(`${API_BASE}/jobs/${i}`).then(r => r.json()).catch(() => null)
        )
      );

      const mapped = jobs
        .filter(Boolean)
        .map((j, i) => ({
          id:             i,
          title:          j.title          || `Quest #${i}`,
          giver:          j.client         || "0x0000…0000",
          freelancer:     j.freelancer     || null,
        // ── Fix: backend already returns formatted ETH string, not BigInt ──
          reward:         parseFloat(j.totalAmount || 0),
          xp:             Math.round(parseFloat(j.totalAmount || 0) * 28),
          rarity:         getRarity(parseFloat(j.totalAmount || 0)),
          status:         j.status         || "Open",
          milestoneCount: j.milestones?.length || j.milestoneCount || 0,
          milestones:     j.milestones     || [],
          description:    j.ipfsMetadata?.description || "",
          tags:           j.ipfsMetadata?.skills      || [],
          category:       "Development",
          deadline:       "Open",
          attempts:       0,
          completions:    j.status === "Completed" ? 1 : 0,
        }));

      setQuests(mapped);
   } catch (e) {
      console.error("Failed to fetch quests:", e);
    }
    setLoadingQuests(false);
  }, []); // ── Fix: remove stats.totalJobs dependency — we fetch fresh inside

  useEffect(() => { fetchQuests(); }, [fetchQuests]);

  // ── Contract actions (ethers via window.ethereum) ──────────────────────────
  const callContract = async (method, args = [], value = "0") => {
    if (!window.ethereum) throw new Error("No wallet found");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer   = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const overrides = { gasLimit: 500000 }; // explicit — XRPL EVM won't estimate reliably
    if (value !== "0") overrides.value = ethers.utils.parseEther(value);

    const tx = await contract[method](...args, overrides);
    await tx.wait(1); // wait 1 confirmation only (XRPL is fast)
    return tx;
  };

  const handleAccept = async (jobId) => {
    try {
      showToast("Accepting quest… confirm in wallet", "success");
      await callContract("acceptJob", [jobId]);
      showToast("Quest accepted! You're on the quest. ⚔", "success");
      fetchQuests();
      setSelectedQuest(null);
    } catch (e) {
      showToast(e.message?.slice(0, 80) || "Transaction failed", "error");
    }
  };

  const handleApprove = async (jobId, milestoneIdx) => {
    try {
      showToast("Approving stage… confirm in wallet", "success");
      await callContract("approveMilestone", [jobId, milestoneIdx, "QmPending"]);
      showToast("Stage approved! Payment released. ✓", "success");
      fetchQuests();
    } catch (e) {
      showToast(e.message?.slice(0, 80) || "Transaction failed", "error");
    }
  };

  const handleDispute = async (jobId) => {
    try {
      showToast("Opening dispute…", "success");
      await callContract("openDispute", [jobId]);
      showToast("Dispute opened. ⚡", "success");
      fetchQuests();
      setSelectedQuest(null);
    } catch (e) {
      showToast(e.message?.slice(0, 80) || "Transaction failed", "error");
    }
  };

  const handleCancel = async (jobId) => {
    try {
      showToast("Cancelling quest…", "success");
      await callContract("cancelOpenJob", [jobId]);
      showToast("Quest cancelled. Funds refunded. ✓", "success");
      fetchQuests();
      setSelectedQuest(null);
    } catch (e) {
      showToast(e.message?.slice(0, 80) || "Transaction failed", "error");
    }
  };

  const handlePostQuest = async ({ title, description, tags, reward, milestones }) => {
    try {
      showToast("Uploading to IPFS…", "success");
      const ipfsRes = await fetch(`${API_BASE}/jobs/metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          skills: tags,
          budget: reward,
          clientAddress: address,
        }),
      });
      const ipfsData = await ipfsRes.json();
      const cid = ipfsData.cid || "";

      showToast("Confirm transaction in your wallet…", "success");

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // ── Fix: build amounts in BigNumber, sum them as totalValue ──────────────
      const totalWei   = ethers.utils.parseEther(reward.toString());
      const perWei     = totalWei.div(milestones.length);
      // give any remainder to the last milestone to avoid dust mismatch
      const amounts    = milestones.map((_, i) =>
        i === milestones.length - 1
          ? totalWei.sub(perWei.mul(milestones.length - 1))
          : perWei
      );

      const tx = await contract.createJob(title, cid, milestones, amounts, {
        value:    totalWei,
        gasLimit: 800000, // createJob is heavier — needs more gas
      });

      showToast("Transaction submitted… waiting for confirmation", "success");
      await tx.wait(1);
      showToast("Quest posted to chain! ⚔", "success");
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchQuests();
      setPage("board");
    } catch (e) {
      console.error(e);
      showToast(e.reason || e.message?.slice(0, 80) || "Failed to post quest", "error");
    }
  };

  const openQuests    = quests.filter(q => q.status === "Open").length;
  const completedCount = quests.filter(q => q.status === "Completed").length;
  const totalXRP      = parseFloat(stats.totalValueLocked || 0).toFixed(1);

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        {/* Nav */}
        <nav className="nav">
          <div className="nav-logo" onClick={() => setPage("board")}>⚔ QUESTCHAIN</div>
          <div className="nav-links">
            <span className={`nav-link ${page === "board"   ? "active" : ""}`} onClick={() => setPage("board")}>Board</span>
            <span className={`nav-link ${page === "create"  ? "active" : ""}`} onClick={() => setPage("create")}>Post Quest</span>
            <span className={`nav-link ${page === "profile" ? "active" : ""}`} onClick={() => setPage("profile")}>Profile</span>
            <WalletButton />
          </div>
        </nav>

        {/* Stats bar */}
        <div className="stats-bar">
          <div className="stat">
            <div className="stat-value">{stats.totalJobs}</div>
            <div className="stat-label">Total Quests</div>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <div className="stat-value">{totalXRP}</div>
            <div className="stat-label">XRP in Escrow</div>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <div className="stat-value">{openQuests}</div>
            <div className="stat-label">Open Quests</div>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-divider" />
          <div className="stat" style={{ marginLeft: "auto" }}>
            <div className="stat-value" style={{ color: "#c084fc", fontSize: 14 }}>XRPL EVM Testnet</div>
            <div className="stat-label">Chain ID · 1449000</div>
          </div>
        </div>

        {/* Layout */}
        <div className="main">
          <aside className="sidebar">
            <div className="sidebar-section">Navigate</div>
            <div className={`sidebar-item ${page === "board" ? "active" : ""}`} onClick={() => setPage("board")}>
              <span>⚔</span> Quest Board <span className="sidebar-badge">{openQuests}</span>
            </div>
            <div className={`sidebar-item ${page === "create" ? "active" : ""}`} onClick={() => setPage("create")}>
              <span>✦</span> Post Quest
            </div>
            <div className={`sidebar-item ${page === "profile" ? "active" : ""}`} onClick={() => setPage("profile")}>
              <span>◈</span> My Profile
            </div>

            <div className="sidebar-section">Filter by Rarity</div>
            {Object.entries(RARITY_CONFIG).map(([r, cfg]) => (
              <div key={r} className="sidebar-item" style={{ color: cfg.color }}>
                <span>{r === "Legendary" ? "◆" : r === "Epic" ? "◈" : r === "Rare" ? "◇" : "○"}</span> {r}
              </div>
            ))}

            <div className="sidebar-section">Contract</div>
            <div className="sidebar-item" style={{ fontSize: 11 }}>
              <a href={`https://explorer.testnet.xrplevm.org/address/${CONTRACT_ADDRESS}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--text-dim)", textDecoration: "none", fontFamily: "monospace" }}>
                {CONTRACT_ADDRESS.slice(0, 8)}…{CONTRACT_ADDRESS.slice(-6)} ↗
              </a>
            </div>
          </aside>

          <main className="content">
            {page === "board" && (
              <QuestBoard
                quests={quests}
                loading={loadingQuests}
                onSelectQuest={setSelectedQuest}
                onPostQuest={() => setPage("create")}
              />
            )}
            {page === "create" && (
              <CreateQuestPage onSubmit={handlePostQuest} isConnected={isConnected} />
            )}
            {page === "profile" && (
              <ProfilePage userAddress={address} />
            )}
          </main>
        </div>

        {selectedQuest && (
          <QuestDetail
            quest={selectedQuest}
            onClose={() => setSelectedQuest(null)}
            onAccept={handleAccept}
            onApprove={handleApprove}
            onDispute={handleDispute}
            onCancel={handleCancel}
            userAddress={address}
          />
        )}

        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </>
  );
}
