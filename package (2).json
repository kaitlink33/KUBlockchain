/**
 * JobDetail — Shows job info, milestones, and actions
 *
 * Actions available depend on role:
 *   Visitor:    View only
 *   Freelancer: Accept job (if Open)
 *   Client:     Approve milestones, open dispute
 */

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constants/contract";
import { API_BASE } from "../constants/api";

const STATUS_COLORS = {
  Open:       "bg-green-900 text-green-300",
  InProgress: "bg-blue-900  text-blue-300",
  Completed:  "bg-gray-700  text-gray-300",
  Disputed:   "bg-red-900   text-red-300",
  Cancelled:  "bg-gray-800  text-gray-500",
};

export function JobDetail() {
  const { jobId }             = useParams();
  const { address }           = useAccount();
  const [job, setJob]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [nftCid, setNftCid]   = useState("");
  const [approving, setApproving] = useState(null); // milestone index

  useEffect(() => {
    fetch(`${API_BASE}/jobs/${jobId}`)
      .then(r => r.json())
      .then(d => { setJob(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [jobId]);

  // ── Accept job ──
  const { config: acceptConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI,
    functionName: "acceptJob", args: [parseInt(jobId)],
    enabled: job?.status === "Open" && !!address && address !== job?.client,
  });
  const { write: acceptJob, isLoading: accepting } = useContractWrite({
    ...acceptConfig,
    onSuccess: (d) => d.wait().then(() => window.location.reload()),
  });

  // ── Approve milestone ──
  const { config: approveConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI,
    functionName: "approveMilestone",
    args: [parseInt(jobId), approving ?? 0, nftCid],
    enabled: approving !== null && !!nftCid,
  });
  const { write: approveMilestone, isLoading: approving_ } = useContractWrite({
    ...approveConfig,
    onSuccess: (d) => d.wait().then(() => window.location.reload()),
  });

  // ── Open dispute ──
  const { config: disputeConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI,
    functionName: "openDispute", args: [parseInt(jobId)],
    enabled: job?.status === "InProgress",
  });
  const { write: openDispute, isLoading: disputing } = useContractWrite({
    ...disputeConfig,
    onSuccess: (d) => d.wait().then(() => window.location.reload()),
  });

  // ── Generate NFT metadata (before approving last milestone) ──
  const generateNftCid = async (milestoneIdx) => {
    setApproving(milestoneIdx);
    const resp = await fetch(`${API_BASE}/nft/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId, jobTitle: job.title,
        freelancerAddress: job.freelancer,
        completedAt: new Date().toISOString(),
        totalEarned: job.totalAmount,
        milestones: job.milestones.length,
      }),
    });
    const data = await resp.json();
    setNftCid(data.cid);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading job...</div>;
  if (!job || job.error) return <div className="text-center py-20 text-red-400">Job not found</div>;

  const isClient     = address?.toLowerCase() === job.client?.toLowerCase();
  const isFreelancer = address?.toLowerCase() === job.freelancer?.toLowerCase();
  const allApproved  = job.milestones.every(m => m.approved);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[job.status] || ""}`}>
            {job.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Client</p>
            <Link to={`/profile/${job.client}`} className="text-indigo-400 hover:underline font-mono text-xs">
              {job.client}
            </Link>
          </div>
          {job.freelancer && (
            <div>
              <p className="text-gray-500">Freelancer</p>
              <Link to={`/profile/${job.freelancer}`} className="text-indigo-400 hover:underline font-mono text-xs">
                {job.freelancer}
              </Link>
            </div>
          )}
          <div>
            <p className="text-gray-500">Total Value</p>
            <p className="font-semibold text-green-400">{job.totalAmount} XRP</p>
          </div>
          <div>
            <p className="text-gray-500">IPFS Metadata</p>
            <a href={`https://gateway.pinata.cloud/ipfs/${job.ipfsCid}`}
              target="_blank" rel="noreferrer"
              className="text-indigo-400 hover:underline text-xs font-mono truncate block">
              {job.ipfsCid}
            </a>
          </div>
        </div>

        {job.ipfsMetadata?.description && (
          <p className="mt-4 text-gray-300 text-sm leading-relaxed">{job.ipfsMetadata.description}</p>
        )}
      </div>

      {/* Milestones */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Milestones</h2>
        {job.milestones.map((m, i) => (
          <div key={i} className={`bg-gray-900 border rounded-xl p-4 flex items-center justify-between
            ${m.approved ? "border-green-800" : "border-gray-800"}`}>
            <div>
              <p className="font-medium">{m.description}</p>
              <p className="text-sm text-gray-400">{m.amount} XRP</p>
            </div>
            <div className="flex items-center gap-3">
              {m.approved ? (
                <span className="text-green-400 text-sm font-medium">✓ Approved</span>
              ) : isClient && job.status === "InProgress" ? (
                <button
                  onClick={() => generateNftCid(i)}
                  disabled={approving === i && approving_}
                  className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-lg text-sm font-medium transition"
                >
                  {approving === i && approving_ ? "Confirming..." : "Approve & Release"}
                </button>
              ) : (
                <span className="text-gray-500 text-sm">Pending</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {!address && (
          <div className="flex items-center gap-4">
            <p className="text-gray-400 text-sm">Connect wallet to interact</p>
            <ConnectButton />
          </div>
        )}

        {/* Freelancer: Accept */}
        {job.status === "Open" && address && !isClient && (
          <button onClick={() => acceptJob?.()}
            disabled={accepting || !acceptJob}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg font-semibold transition">
            {accepting ? "Confirming..." : "Accept This Job"}
          </button>
        )}

        {/* Dispute */}
        {job.status === "InProgress" && (isClient || isFreelancer) && (
          <button onClick={() => openDispute?.()}
            disabled={disputing || !openDispute}
            className="w-full py-3 bg-red-900 hover:bg-red-800 disabled:opacity-50 rounded-lg font-semibold transition text-red-300">
            {disputing ? "Opening dispute..." : "Open Dispute"}
          </button>
        )}

        {/* Completed NFT */}
        {job.status === "Completed" && allApproved && (
          <div className="bg-indigo-900/30 border border-indigo-700 rounded-xl p-4 text-center">
            <p className="text-indigo-300 font-semibold">🏆 Job Complete — Reputation NFT Minted</p>
            <p className="text-sm text-gray-400 mt-1">
              The freelancer's wallet now holds a permanent proof-of-completion NFT stored on IPFS.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
