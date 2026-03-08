import React from "react";
import { createRoot } from "react-dom/client";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { InjectedConnector } from "wagmi/connectors/injected";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import QuestChain from "./QuestChain";

const xrplTestnet = {
  id: 1449000,
  name: "XRPL EVM Testnet",
  network: "xrpl-testnet",
  nativeCurrency: { name: "XRP", symbol: "XRP", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.xrplevm.org"] },
    public:  { http: ["https://rpc.testnet.xrplevm.org"] },
  },
  blockExplorers: {
    default: { name: "XRPL Explorer", url: "https://explorer.testnet.xrplevm.org" },
  },
  testnet: true,
};

const { chains, publicClient } = configureChains(
  [xrplTestnet],
  [jsonRpcProvider({ rpc: (chain) => ({ http: chain.rpcUrls.default.http[0] }) })]
);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [new InjectedConnector({ chains })],
  publicClient,
});

createRoot(document.getElementById("root")).render(
  <WagmiConfig config={wagmiConfig}>
    <RainbowKitProvider chains={chains} theme={darkTheme({ accentColor: "#7c3aed" })}>
      <QuestChain />
    </RainbowKitProvider>
  </WagmiConfig>
);