// ─── FreelancerProfile.jsx ────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE } from "../constants/api";

export function FreelancerProfile() {
  const { addr }          = useParams();
  const [rep, setRep]     = useState(null);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/reputation/${addr}`)
      .then(r => r.json())
      .then(d => { setRep(d); setLoad(false); });
  }, [addr]);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading profile...</div>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-indigo-700 flex items-center justify-center text-2xl font-bold">
            {addr.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <p className="font-mono text-sm text-gray-400">{addr}</p>
            <p className="text-xl font-bold mt-1">Freelancer Profile</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{parseFloat(rep?.score || 0).toFixed(3)}</p>
            <p className="text-sm text-gray-400 mt-1">XRP Earned (Reputation Score)</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-indigo-400">{rep?.jobsCompleted || 0}</p>
            <p className="text-sm text-gray-400 mt-1">Jobs Completed</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-4 text-center">
          Reputation is calculated from on-chain milestone approvals — it cannot be faked.
        </p>
      </div>

      <Link to="/" className="block text-center text-indigo-400 hover:underline">← Back to Job Board</Link>
    </div>
  );
}

// ─── Dashboard.jsx ────────────────────────────────────────────────────────────

export function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/stats`).then(r => r.json()).then(setStats);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Platform Dashboard</h1>
      {stats ? (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-4xl font-bold text-indigo-400">{stats.totalJobs}</p>
            <p className="text-gray-400 mt-2">Total Jobs On-Chain</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-4xl font-bold text-green-400">{parseFloat(stats.totalValueLocked).toFixed(4)}</p>
            <p className="text-gray-400 mt-2">XRP in Escrow</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-400">Loading...</p>
      )}
    </div>
  );
}

// ─── Navbar.jsx ───────────────────────────────────────────────────────────────

import { Link as NavLink } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <NavLink to="/" className="text-xl font-bold text-indigo-400">TrustEscrow</NavLink>
        <div className="flex items-center gap-6">
          <NavLink to="/" className="text-sm text-gray-400 hover:text-white transition">Jobs</NavLink>
          <NavLink to="/post" className="text-sm text-gray-400 hover:text-white transition">Post Job</NavLink>
          <NavLink to="/dashboard" className="text-sm text-gray-400 hover:text-white transition">Dashboard</NavLink>
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}

// ─── constants/contract.js ────────────────────────────────────────────────────

export const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

export const CONTRACT_ABI = [
  "function createJob(string title, string ipfsCid, string[] milestoneDescs, uint256[] milestoneAmounts) payable returns (uint256)",
  "function acceptJob(uint256 jobId)",
  "function approveMilestone(uint256 jobId, uint256 milestoneIndex, string nftIpfsCid)",
  "function openDispute(uint256 jobId)",
  "function cancelOpenJob(uint256 jobId)",
  "function resolveDisputeByTimeout(uint256 jobId)",
  "function getJob(uint256 jobId) view returns (address client, address freelancer, string title, string ipfsCid, uint256 totalAmount, uint8 status, uint256 milestoneCount)",
  "function getMilestone(uint256 jobId, uint256 idx) view returns (string description, uint256 amount, bool approved, bool released)",
  "function getReputation(address wallet) view returns (uint256 score, uint256 jobsCompleted)",
  "function totalJobs() view returns (uint256)",
  "event JobCreated(uint256 indexed jobId, address indexed client, string title, uint256 amount)",
  "event MilestoneApproved(uint256 indexed jobId, uint256 milestoneIndex, uint256 amount)",
  "event ReputationNFTMinted(uint256 indexed tokenId, uint256 indexed jobId, address indexed freelancer, string ipfsCid)",
];

// ─── constants/api.js ─────────────────────────────────────────────────────────

export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
