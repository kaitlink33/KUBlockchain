require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    hardhat: {},
    xrpl_devnet: {
      url: "https://rpc.testnet.xrplevm.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1449000,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  },
  etherscan: {
  apiKey: {
    xrpl_devnet: "placeholder"
  },
  customChains: [
    {
      network: "xrpl_devnet",
      chainId: 1449000,
      urls: {
        apiURL: "https://explorer.testnet.xrplevm.org/api",
        browserURL: "https://explorer.testnet.xrplevm.org"
      }
    }
  ]
}
};