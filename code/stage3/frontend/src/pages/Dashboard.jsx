import React, { useEffect, useState } from "react";
import { API_BASE } from "../constants/api";

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
