/**
 * TrustEscrow Frontend — Stage 3
 * React + Wagmi + RainbowKit
 *
 * Pages:
 *   / — Browse open jobs
 *   /post — Client posts a new job
 *   /job/:id — Job detail (accept, approve milestones, dispute)
 *   /profile/:address — Freelancer reputation profile
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { RainbowKitProvider, getDefaultWallets, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

import { Navbar }        from "./components/Navbar";
import { JobBoard }      from "./pages/JobBoard";
import { PostJob }       from "./pages/PostJob";
import { JobDetail }     from "./pages/JobDetail";
import { FreelancerProfile } from "./pages/FreelancerProfile";
import { Dashboard }     from "./pages/Dashboard";

// ─── Chain config ─────────────────────────────────────────────────────────────

const xrplDevnet = {
  id: 1440002,
  name: "XRPL EVM Devnet",
  network: "xrpl-devnet",
  nativeCurrency: { name: "XRP", symbol: "XRP", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-evm-sidechain.xrpl.org"] }, public: { http: ["https://rpc-evm-sidechain.xrpl.org"] } },
  blockExplorers: { default: { name: "XRPL EVM Explorer", url: "https://evm-sidechain.xrpl.org" } },
  testnet: true,
};

const { chains, publicClient } = configureChains(
  [xrplDevnet],
  [jsonRpcProvider({ rpc: (chain) => ({ http: chain.rpcUrls.default.http[0] }) })]
);

const { connectors } = getDefaultWallets({
  appName: "TrustEscrow",
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || "demo",
  chains,
});

const wagmiConfig = createConfig({ autoConnect: true, connectors, publicClient });

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} theme={darkTheme({ accentColor: "#6366f1" })}>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-950 text-gray-100">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-8">
              <Routes>
                <Route path="/"              element={<JobBoard />} />
                <Route path="/post"          element={<PostJob />} />
                <Route path="/job/:jobId"    element={<JobDetail />} />
                <Route path="/profile/:addr" element={<FreelancerProfile />} />
                <Route path="/dashboard"     element={<Dashboard />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

createRoot(document.getElementById("root")).render(<App />);
