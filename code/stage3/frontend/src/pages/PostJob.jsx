/**
 * PostJob — Client creates a new job and deposits funds into escrow
 *
 * Flow:
 *   1. Client fills form (title, description, milestones + amounts)
 *   2. Frontend uploads metadata to IPFS via backend (Pinata)
 *   3. Smart contract call: createJob(title, ipfsCid, milestones, amounts, {value})
 *   4. On success → redirect to job detail page
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import { parseEther } from "ethers/lib/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constants/contract";
import { API_BASE } from "../constants/api";

export function PostJob() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills]           = useState("");
  const [milestones, setMilestones]   = useState([
    { description: "", amount: "" }
  ]);
  const [files, setFiles]             = useState([]);
  const [step, setStep]               = useState("form"); // form | uploading | confirm | success
  const [ipfsCid, setIpfsCid]         = useState(null);
  const [error, setError]             = useState(null);

  // ── Milestone helpers ──

  const addMilestone = () =>
    setMilestones([...milestones, { description: "", amount: "" }]);

  const removeMilestone = (i) =>
    setMilestones(milestones.filter((_, idx) => idx !== i));

  const updateMilestone = (i, field, value) => {
    const updated = [...milestones];
    updated[i][field] = value;
    setMilestones(updated);
  };

  const totalAmount = milestones.reduce((sum, m) => {
    const n = parseFloat(m.amount);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  // ── Step 1: Upload metadata to IPFS ──

  const handleUpload = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title || !description) return setError("Fill in title and description");
    if (milestones.some(m => !m.description || !m.amount))
      return setError("All milestones need a description and amount");
    if (totalAmount <= 0) return setError("Total amount must be > 0");

    setStep("uploading");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("budget", totalAmount.toString());
      formData.append("skills", JSON.stringify(skills.split(",").map(s => s.trim()).filter(Boolean)));
      formData.append("clientAddress", address);
      files.forEach(f => formData.append("attachments", f));

      const resp = await fetch(`${API_BASE}/jobs/metadata`, {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);

      setIpfsCid(data.cid);
      setStep("confirm");
    } catch (err) {
      setError(err.message);
      setStep("form");
    }
  };

  // ── Step 2: Write to blockchain ──

  const milestoneDescs   = milestones.map(m => m.description);
  const milestoneAmounts = milestones.map(m => {
    try { return parseEther(m.amount || "0"); }
    catch { return parseEther("0"); }
  });
  const totalWei = milestoneAmounts.reduce((a, b) => a.add(b), parseEther("0"));

  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "createJob",
    args: [title, ipfsCid || "", milestoneDescs, milestoneAmounts],
    overrides: { value: totalWei },
    enabled: step === "confirm" && !!ipfsCid,
  });

  const { write: createJob, isLoading: txLoading } = useContractWrite({
    ...config,
    onSuccess(data) {
      data.wait().then(() => setStep("success"));
    },
    onError(err) {
      setError(err.message);
    },
  });

  // ── Render ──

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <h2 className="text-2xl font-bold">Connect your wallet to post a job</h2>
        <ConnectButton />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="flex flex-col items-center gap-6 pt-20">
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-bold">Job Posted!</h2>
        <p className="text-gray-400">Your funds are now locked in the TrustEscrow contract.</p>
        <p className="text-sm text-indigo-400">IPFS CID: {ipfsCid}</p>
        <button onClick={() => navigate("/")} className="px-6 py-3 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700">
          Browse Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Post a Job</h1>
      <p className="text-gray-400 mb-8">Funds are held in escrow until milestones are approved.</p>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Job Title</label>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Build a Solidity smart contract for token vesting"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe what you need, requirements, deliverables..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium mb-1">Required Skills (comma separated)</label>
          <input
            value={skills} onChange={e => setSkills(e.target.value)}
            placeholder="Solidity, React, IPFS"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Milestones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Milestones</label>
            <button type="button" onClick={addMilestone}
              className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-700 px-2 py-1 rounded">
              + Add Milestone
            </button>
          </div>

          <div className="space-y-3">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-3 items-start bg-gray-900 border border-gray-700 rounded-lg p-3">
                <div className="flex-1">
                  <input
                    value={m.description}
                    onChange={e => updateMilestone(i, "description", e.target.value)}
                    placeholder={`Milestone ${i + 1} description`}
                    className="w-full bg-transparent text-sm focus:outline-none"
                  />
                </div>
                <div className="w-28">
                  <div className="flex items-center gap-1">
                    <input
                      value={m.amount}
                      onChange={e => updateMilestone(i, "amount", e.target.value)}
                      placeholder="0.1"
                      type="number" step="0.001" min="0"
                      className="w-full bg-transparent text-sm text-right focus:outline-none"
                    />
                    <span className="text-gray-500 text-xs">XRP</span>
                  </div>
                </div>
                {milestones.length > 1 && (
                  <button type="button" onClick={() => removeMilestone(i)}
                    className="text-red-500 hover:text-red-400 text-sm">✕</button>
                )}
              </div>
            ))}
          </div>

          <div className="text-right mt-2 text-sm text-gray-400">
            Total: <span className="text-white font-semibold">{totalAmount.toFixed(4)} XRP</span>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium mb-1">Attachments (optional, stored on IPFS)</label>
          <input type="file" multiple
            onChange={e => setFiles(Array.from(e.target.files))}
            className="text-sm text-gray-400"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={step === "uploading"}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg font-semibold transition"
        >
          {step === "uploading" ? "Uploading to IPFS..." : "Upload Metadata & Continue →"}
        </button>
      </form>

      {/* Confirmation Step */}
      {step === "confirm" && (
        <div className="mt-8 bg-gray-900 border border-green-700 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-green-400">✅ Metadata Uploaded to IPFS</h3>
          <p className="text-sm text-gray-400">CID: <code className="text-green-300">{ipfsCid}</code></p>
          <p className="text-sm text-gray-400">
            Now deposit <strong className="text-white">{totalAmount} XRP</strong> into the smart contract to create your job on-chain.
          </p>
          <button
            onClick={() => createJob?.()}
            disabled={txLoading || !createJob}
            className="w-full py-3 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-lg font-semibold transition"
          >
            {txLoading ? "Confirm in wallet..." : `Deposit ${totalAmount} XRP & Create Job`}
          </button>
        </div>
      )}
    </div>
  );
}
