import hardhat from "hardhat";

const { ethers, network, run } = hardhat;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying TrustEscrow with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", balance.toString());

  const TrustEscrow = await ethers.getContractFactory("TrustEscrow");
  const contract = await TrustEscrow.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ TrustEscrow deployed to:", address);
  console.log("Save this address in your .env as CONTRACT_ADDRESS");

  if (network.name !== "hardhat") {
    console.log("Waiting 5 blocks before verification...");
    await contract.deploymentTransaction().wait(5);
    try {
      await run("verify:verify", {
        address: address,
        constructorArguments: [deployer.address],
      });
    } catch (e) {
      console.log("Verification skipped:", e.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});