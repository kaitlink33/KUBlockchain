import React from "react";
import { createRoot } from "react-dom/client";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { InjectedConnector } from "wagmi/connectors/injected";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import QuestChain from "./QuestChain";

const RPC_URLS = [
  process.env.REACT_APP_RPC_URL || "https://rpc.testnet.xrplevm.org",
  "https://rpc-evm-sidechain.xrpl.org",   // fallback #1
];

const xrplTestnet = {
  id: 1449000,
  name: "XRPL EVM Testnet",
  network: "xrpl-testnet",
  nativeCurrency: { name: "XRP", symbol: "XRP", decimals: 18 },
  rpcUrls: {
    default: { http: RPC_URLS },
    public:  { http: RPC_URLS },
  },
  blockExplorers: {
    default: {
      name: "XRPL Explorer",
      url: "https://explorer.testnet.xrplevm.org",
    },
  },
  testnet: true,
};

const { chains, publicClient } = configureChains(
  [xrplTestnet],
  [
    jsonRpcProvider({
      rpc: (chain) => ({ http: chain.rpcUrls.default.http[0] }),
    }),
    jsonRpcProvider({
      rpc: (chain) => ({ http: chain.rpcUrls.default.http[1] }), // fallback
    }),
  ],
  {
    pollingInterval: 6_000,   // ← fixes block skew (was ~1s default, XRPL blocks ~4s)
    retryCount: 5,
    retryDelay: 1_500,
    stallTimeout: 5_000,
  }
);

const wagmiConfig = createConfig({
  autoConnect: false,
  connectors: [new InjectedConnector({ chains })],
  publicClient,
});

createRoot(document.getElementById("root")).render(
  <WagmiConfig config={wagmiConfig}>
    <RainbowKitProvider
      chains={chains}
      theme={darkTheme({ accentColor: "#7c3aed" })}
    >
      <QuestChain />
    </RainbowKitProvider>
  </WagmiConfig>
);