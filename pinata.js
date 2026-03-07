/**
 * JobBoard — Browse open jobs
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../constants/api";

export function JobBoard() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalJobs, setTotal] = useState(0);

  useEffect(() => {
    // Fetch stats first, then load each job
    fetch(`${API_BASE}/stats`)
      .then(r => r.json())
      .then(async ({ totalJobs: count }) => {
        setTotal(count);
        const fetched = [];
        for (let i = 0; i < Math.min(count, 20); i++) {
          try {
            const r = await fetch(`${API_BASE}/jobs/${i}`);
            const j = await r.json();
            if (!j.error) fetched.push(j);
          } catch (_) {}
        }
        setJobs(fetched);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="text-center py-20">
      <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 mt-4">Loading jobs from blockchain...</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Job Board</h1>
          <p className="text-gray-400">{totalJobs} jobs on-chain</p>
        </div>
        <Link to="/post"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition">
          + Post a Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">🌱</p>
          <p>No jobs yet. Be the first to post one!</p>
          <Link to="/post" className="mt-4 inline-block text-indigo-400 hover:underline">Post a job →</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link key={job.jobId} to={`/job/${job.jobId}`}
              className="bg-gray-900 border border-gray-800 hover:border-indigo-700 rounded-xl p-5 transition block">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                  {job.ipfsMetadata?.description && (
                    <p className="text-gray-400 text-sm line-clamp-2">{job.ipfsMetadata.description}</p>
                  )}
                  {job.ipfsMetadata?.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {job.ipfsMetadata.skills.map(s => (
                        <span key={s} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right ml-6 shrink-0">
                  <p className="text-green-400 font-semibold">{job.totalAmount} XRP</p>
                  <p className="text-xs text-gray-500 mt-1">{job.milestones.length} milestones</p>
                  <span className={`text-xs mt-2 inline-block px-2 py-1 rounded ${
                    job.status === "Open" ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-400"
                  }`}>
                    {job.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
