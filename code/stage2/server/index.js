/**
 * TrustEscrow Backend — Stage 2
 * Node.js + Express server
 * Handles: Pinata IPFS uploads, job metadata, contract event listening
 */

const express   = require("express");
const cors      = require("cors");
const multer    = require("multer");
const { ethers } = require("ethers");
require("dotenv").config();

const pinataService  = require("./services/pinata");
const contractABI = require("./abi/TrustEscrow.json").abi;

const app  = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());

// ─── Blockchain connection ────────────────────────────────────────────────────

const provider = new ethers.providers.JsonRpcProvider(
  process.env.RPC_URL || "https://rpc-evm-sidechain.xrpl.org"
);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  provider
);

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/jobs/metadata
 * Uploads job description + attachments to IPFS via Pinata.
 * Returns a CID that is then passed to createJob() on-chain.
 */
app.post("/api/jobs/metadata", upload.array("attachments", 5), async (req, res) => {
  try {
    const { title, description, budget, skills, clientAddress } = req.body;
    if (!title || !description || !clientAddress) {
      return res.status(400).json({ error: "title, description, clientAddress required" });
    }

    const metadata = {
      name: title,
      description,
      budget: parseFloat(budget) || 0,
      skills: skills ? JSON.parse(skills) : [],
      client: clientAddress,
      createdAt: new Date().toISOString(),
      attachments: [],
    };

    // Upload any attachments to Pinata first
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileCid = await pinataService.uploadBuffer(file.buffer, file.originalname, {
          type: "job_attachment",
          job_title: title,
        });
        metadata.attachments.push({ name: file.originalname, cid: fileCid });
      }
    }

    // Upload metadata JSON to Pinata
    const cid = await pinataService.uploadJSON(metadata, `job_${title.replace(/\s+/g, "_")}`);

    res.json({ cid, ipfsUrl: `https://gateway.pinata.cloud/ipfs/${cid}` });
  } catch (err) {
    console.error("Metadata upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/nft/metadata
 * Creates and uploads NFT metadata for a completed job (called by frontend after approval).
 * Returns CID to pass to approveMilestone() on-chain.
 */
app.post("/api/nft/metadata", async (req, res) => {
  try {
    const { jobId, freelancerAddress, jobTitle, completedAt, totalEarned, milestones } = req.body;

    const nftMetadata = {
      name: `TrustEscrow Certificate — ${jobTitle}`,
      description: `Verified completion certificate for "${jobTitle}". Issued by TrustEscrow smart contract.`,
      image: `ipfs://QmTrustEscrowDefaultBadge`,  // Replace with actual badge CID
      attributes: [
        { trait_type: "Job ID",       value: jobId.toString() },
        { trait_type: "Freelancer",   value: freelancerAddress },
        { trait_type: "Total Earned", value: totalEarned, display_type: "number" },
        { trait_type: "Milestones",   value: milestones, display_type: "number" },
        { trait_type: "Completed",    value: completedAt },
      ],
      external_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/job/${jobId}`,
    };

    const cid = await pinataService.uploadJSON(
      nftMetadata,
      `nft_job_${jobId}_${freelancerAddress.slice(0, 8)}`
    );

    res.json({ cid, ipfsUrl: `https://gateway.pinata.cloud/ipfs/${cid}` });
  } catch (err) {
    console.error("NFT metadata error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/jobs/:jobId
 * Fetches on-chain job data and enriches with IPFS metadata.
 */
app.get("/api/jobs/:jobId", async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const [client, freelancer, title, ipfsCid, totalAmount, status, milestoneCount]
      = await contract.getJob(jobId);

    const milestones = [];
    for (let i = 0; i < milestoneCount; i++) {
      const m = await contract.getMilestone(jobId, i);
      milestones.push({
        index: i,
        description: m.description,
        amount: ethers.utils.formatEther(m.amount),
        approved: m.approved,
        released: m.released,
      });
    }

    // Fetch IPFS metadata
    let ipfsData = null;
    try {
      const resp = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsCid}`);
      ipfsData = await resp.json();
    } catch (_) { /* IPFS might be unavailable */ }

    res.json({
      jobId,
      client,
      freelancer,
      title,
      ipfsCid,
      totalAmount: ethers.utils.formatEther(totalAmount),
      status: ["Open","InProgress","Completed","Disputed","Cancelled"][status],
      milestones,
      ipfsMetadata: ipfsData,
    });
  } catch (err) {
    console.error("Get job error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reputation/:address
 * Returns on-chain reputation score and completed job history.
 */
app.get("/api/reputation/:address", async (req, res) => {
  try {
    const addr = req.params.address;
    const [score, jobsCompleted] = await contract.getReputation(addr);

    res.json({
      address: addr,
      score: ethers.utils.formatEther(score),
      jobsCompleted: jobsCompleted.toNumber(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/stats
 * Dashboard stats — total jobs, total value locked (approximate).
 */
app.get("/api/stats", async (req, res) => {
  try {
    const totalJobs = await contract.totalJobs();
    const contractBalance = await provider.getBalance(process.env.CONTRACT_ADDRESS);

    res.json({
      totalJobs: totalJobs.toNumber(),
      totalValueLocked: ethers.utils.formatEther(contractBalance),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Contract event listeners ─────────────────────────────────────────────────

contract.on("JobCreated", (jobId, client, title, amount, event) => {
  console.log(`[Event] Job #${jobId} created by ${client}: "${title}" (${ethers.utils.formatEther(amount)} ETH)`);
});

contract.on("ReputationNFTMinted", (tokenId, jobId, freelancer, ipfsCid, event) => {
  console.log(`[Event] NFT #${tokenId} minted for job #${jobId} → ${freelancer}`);
});

contract.on("DisputeOpened", (jobId, opener, event) => {
  console.log(`[Event] Dispute opened on job #${jobId} by ${opener}`);
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`TrustEscrow API running on http://localhost:${PORT}`);
  console.log("Contract:", process.env.CONTRACT_ADDRESS);
  console.log("Network: ", process.env.RPC_URL);
  await pinataService.testConnection();
});
