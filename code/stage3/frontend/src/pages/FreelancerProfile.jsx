import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE } from "../constants/api";

export function FreelancerProfile() {
  const { addr }           = useParams();
  const [rep, setRep]      = useState(null);
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
