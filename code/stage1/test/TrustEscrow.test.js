import { expect } from "chai";
import hardhat from "hardhat";

const { ethers } = hardhat;
const { parseEther, getBigInt } = ethers;

describe("TrustEscrow", function () {
  let contract, owner, client, freelancer, platform;
  let ONE_ETH, HALF_ETH;

  beforeEach(async () => {
    ONE_ETH = parseEther("1.0");
    HALF_ETH = parseEther("0.5");

    [owner, client, freelancer, platform] = await ethers.getSigners();
    const TrustEscrow = await ethers.getContractFactory("TrustEscrow");
    contract = await TrustEscrow.deploy(platform.address);
  });

  it("creates a job with correct deposit", async () => {
    await contract.connect(client).createJob(
      "Build a website",
      "QmTestCID",
      ["Design", "Development"],
      [HALF_ETH, HALF_ETH],
      { value: ONE_ETH }
    );

    const job = await contract.getJob(0);
    expect(job.client).to.equal(client.address);
    expect(job.totalAmount).to.equal(ONE_ETH);
    expect(job.milestoneCount).to.equal(2);
    expect(job.status).to.equal(0);
  });

  it("freelancer can accept job", async () => {
    await contract.connect(client).createJob(
      "Logo design",
      "QmTestCID",
      ["Draft", "Final"],
      [HALF_ETH, HALF_ETH],
      { value: ONE_ETH }
    );

    await contract.connect(freelancer).acceptJob(0);
    const job = await contract.getJob(0);
    expect(job.freelancer).to.equal(freelancer.address);
    expect(job.status).to.equal(1);
  });

  it("releases payment on milestone approval", async () => {
    await contract.connect(client).createJob(
      "Smart Contract Dev",
      "QmTestCID",
      ["Write contract", "Deploy"],
      [HALF_ETH, HALF_ETH],
      { value: ONE_ETH }
    );
    await contract.connect(freelancer).acceptJob(0);

    const beforeBal = await ethers.provider.getBalance(freelancer.address);
    await contract.connect(client).approveMilestone(0, 0, "QmNftCID");
    const afterBal = await ethers.provider.getBalance(freelancer.address);

    expect(afterBal - beforeBal).to.be.gt(parseEther("0.49"));
  });

  it("mints NFT on job completion", async () => {
    await contract.connect(client).createJob(
      "Full project",
      "QmTestCID",
      ["Milestone 1"],
      [ONE_ETH],
      { value: ONE_ETH }
    );
    await contract.connect(freelancer).acceptJob(0);
    await contract.connect(client).approveMilestone(0, 0, "QmNftCID");

    expect(await contract.ownerOf(0)).to.equal(freelancer.address);
    expect(await contract.tokenURI(0)).to.include("ipfs://");

    const [score, completed] = await contract.getReputation(freelancer.address);
    expect(completed).to.equal(1);
  });

  it("client can cancel open job for refund", async () => {
    await contract.connect(client).createJob(
      "Cancelled project",
      "QmTestCID",
      ["Only milestone"],
      [ONE_ETH],
      { value: ONE_ETH }
    );

    const before = await ethers.provider.getBalance(client.address);
    const tx = await contract.connect(client).cancelOpenJob(0);
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    const after = await ethers.provider.getBalance(client.address);

    expect(after + gasUsed).to.be.gt(before);
  });
});