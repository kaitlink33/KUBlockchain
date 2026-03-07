import React from "react";
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
