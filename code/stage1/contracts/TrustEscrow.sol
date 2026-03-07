// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * TrustEscrow — Decentralized Freelance Escrow & Reputation System
 * KU Block-a-Thon 2026
 *
 * How it works:
 *   1. Client creates a Job, locking XRP/RLUSD into the contract
 *   2. Freelancer accepts and completes milestones
 *   3. Client approves milestones → funds auto-release to freelancer
 *   4. Each completed job mints a ReputationNFT (stored on IPFS via Pinata)
 *   5. Disputes trigger a 48hr arbitration window
 */
contract TrustEscrow is ERC721URIStorage, ReentrancyGuard {
    using Counters for Counters.Counter;

    // ─── State ────────────────────────────────────────────────────────────────

    Counters.Counter private _jobIdCounter;
    Counters.Counter private _tokenIdCounter;

    enum JobStatus { Open, InProgress, Completed, Disputed, Cancelled }

    struct Milestone {
        string  description;
        uint256 amount;        // wei / smallest unit
        bool    approved;
        bool    released;
    }

    struct Job {
        uint256     id;
        address     client;
        address     freelancer;
        string      title;
        string      ipfsMetadataHash;   // Pinata CID for full job description
        uint256     totalAmount;
        uint256     depositedAmount;
        JobStatus   status;
        uint256     createdAt;
        uint256     disputeDeadline;    // 0 if no dispute
        Milestone[] milestones;
    }

    // jobId → Job
    mapping(uint256 => Job) public jobs;

    // wallet → array of completed jobIds (for reputation lookup)
    mapping(address => uint256[]) public completedJobs;

    // wallet → reputation score (sum of approved milestones)
    mapping(address => uint256) public reputationScore;

    // tokenId → jobId (for NFT metadata lookup)
    mapping(uint256 => uint256) public nftToJob;

    uint256 public constant DISPUTE_WINDOW = 48 hours;
    uint256 public constant PLATFORM_FEE_BPS = 100; // 1%
    address public immutable platformWallet;

    // ─── Events ───────────────────────────────────────────────────────────────

    event JobCreated(uint256 indexed jobId, address indexed client, string title, uint256 amount);
    event FreelancerAccepted(uint256 indexed jobId, address indexed freelancer);
    event MilestoneApproved(uint256 indexed jobId, uint256 milestoneIndex, uint256 amount);
    event FundsReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount);
    event DisputeOpened(uint256 indexed jobId, address indexed opener);
    event DisputeResolved(uint256 indexed jobId, address winner);
    event ReputationNFTMinted(uint256 indexed tokenId, uint256 indexed jobId, address indexed freelancer, string ipfsCid);
    event JobCancelled(uint256 indexed jobId);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _platformWallet)
        ERC721("TrustEscrow Reputation", "TREP")
    {
        platformWallet = _platformWallet;
    }

    // ─── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Client creates a job with milestones, depositing ETH/XRP into escrow.
     * @param title         Short job title
     * @param ipfsCid       Pinata CID for full job details (stored off-chain)
     * @param milestoneDescs Array of milestone descriptions
     * @param milestoneAmts  Array of milestone amounts (must sum to msg.value)
     */
    function createJob(
        string calldata title,
        string calldata ipfsCid,
        string[] calldata milestoneDescs,
        uint256[] calldata milestoneAmts
    ) external payable returns (uint256 jobId) {
        require(msg.value > 0, "Must deposit funds");
        require(milestoneDescs.length == milestoneAmts.length, "Milestone length mismatch");
        require(milestoneDescs.length > 0 && milestoneDescs.length <= 10, "1-10 milestones");

        uint256 total;
        for (uint i = 0; i < milestoneAmts.length; i++) {
            total += milestoneAmts[i];
        }
        require(total == msg.value, "Amounts must equal deposit");

        jobId = _jobIdCounter.current();
        _jobIdCounter.increment();

        Job storage job = jobs[jobId];
        job.id              = jobId;
        job.client          = msg.sender;
        job.title           = title;
        job.ipfsMetadataHash = ipfsCid;
        job.totalAmount     = msg.value;
        job.depositedAmount = msg.value;
        job.status          = JobStatus.Open;
        job.createdAt       = block.timestamp;

        for (uint i = 0; i < milestoneDescs.length; i++) {
            job.milestones.push(Milestone({
                description: milestoneDescs[i],
                amount:      milestoneAmts[i],
                approved:    false,
                released:    false
            }));
        }

        emit JobCreated(jobId, msg.sender, title, msg.value);
    }

    /**
     * @notice Freelancer accepts an open job.
     */
    function acceptJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Open, "Job not open");
        require(job.client != msg.sender, "Client cannot be freelancer");

        job.freelancer = msg.sender;
        job.status     = JobStatus.InProgress;

        emit FreelancerAccepted(jobId, msg.sender);
    }

    /**
     * @notice Client approves a milestone and automatically releases payment.
     * @param jobId          The job ID
     * @param milestoneIndex Which milestone to approve
     * @param nftIpfsCid     Pinata CID for the reputation NFT metadata
     */
    function approveMilestone(
        uint256 jobId,
        uint256 milestoneIndex,
        string calldata nftIpfsCid
    ) external nonReentrant {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client, "Only client");
        require(job.status == JobStatus.InProgress, "Job not in progress");
        require(milestoneIndex < job.milestones.length, "Invalid milestone");

        Milestone storage m = job.milestones[milestoneIndex];
        require(!m.approved, "Already approved");

        m.approved = true;
        m.released = true;

        // Calculate fee
        uint256 fee    = (m.amount * PLATFORM_FEE_BPS) / 10000;
        uint256 payout = m.amount - fee;

        // Update reputation
        reputationScore[job.freelancer] += payout;

        // Release payment to freelancer
        (bool sent, ) = payable(job.freelancer).call{value: payout}("");
        require(sent, "Payment failed");

        // Send platform fee
        if (fee > 0) {
            (bool feeSent, ) = payable(platformWallet).call{value: fee}("");
            require(feeSent, "Fee transfer failed");
        }

        emit MilestoneApproved(jobId, milestoneIndex, m.amount);
        emit FundsReleased(jobId, job.freelancer, payout);

        // Check if all milestones approved → complete job and mint NFT
        bool allDone = true;
        for (uint i = 0; i < job.milestones.length; i++) {
            if (!job.milestones[i].approved) { allDone = false; break; }
        }
        if (allDone) {
            job.status = JobStatus.Completed;
            completedJobs[job.freelancer].push(jobId);
            _mintReputationNFT(job.freelancer, jobId, nftIpfsCid);
        }
    }

    /**
     * @notice Open a dispute (client or freelancer can call within job lifetime).
     */
    function openDispute(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(
            msg.sender == job.client || msg.sender == job.freelancer,
            "Not a party"
        );
        require(job.status == JobStatus.InProgress, "Job not in progress");

        job.status         = JobStatus.Disputed;
        job.disputeDeadline = block.timestamp + DISPUTE_WINDOW;

        emit DisputeOpened(jobId, msg.sender);
    }

    /**
     * @notice Resolve dispute after window — if client doesn't respond, freelancer wins.
     *         In a production system this would integrate Chainlink VRF or a DAO vote.
     */
    function resolveDisputeByTimeout(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Disputed, "Not disputed");
        require(block.timestamp >= job.disputeDeadline, "Window not expired");

        // Default: return funds to client after timeout (conservative)
        job.status = JobStatus.Cancelled;
        uint256 remaining = address(this).balance < job.depositedAmount
            ? address(this).balance
            : job.depositedAmount;

        if (remaining > 0) {
            (bool sent, ) = payable(job.client).call{value: remaining}("");
            require(sent, "Refund failed");
        }

        emit DisputeResolved(jobId, job.client);
        emit JobCancelled(jobId);
    }

    /**
     * @notice Client can cancel an open (unaccepted) job for a full refund.
     */
    function cancelOpenJob(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client, "Only client");
        require(job.status == JobStatus.Open, "Not open");

        job.status = JobStatus.Cancelled;
        (bool sent, ) = payable(job.client).call{value: job.depositedAmount}("");
        require(sent, "Refund failed");

        emit JobCancelled(jobId);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _mintReputationNFT(
        address freelancer,
        uint256 jobId,
        string memory ipfsCid
    ) internal {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(freelancer, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", ipfsCid)));

        nftToJob[tokenId] = jobId;

        emit ReputationNFTMinted(tokenId, jobId, freelancer, ipfsCid);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getJob(uint256 jobId) external view returns (
        address client,
        address freelancer,
        string memory title,
        string memory ipfsCid,
        uint256 totalAmount,
        JobStatus status,
        uint256 milestoneCount
    ) {
        Job storage j = jobs[jobId];
        return (j.client, j.freelancer, j.title, j.ipfsMetadataHash, j.totalAmount, j.status, j.milestones.length);
    }

    function getMilestone(uint256 jobId, uint256 idx) external view returns (
        string memory description,
        uint256 amount,
        bool approved,
        bool released
    ) {
        Milestone storage m = jobs[jobId].milestones[idx];
        return (m.description, m.amount, m.approved, m.released);
    }

    function getReputation(address wallet) external view returns (
        uint256 score,
        uint256 jobsCompleted
    ) {
        return (reputationScore[wallet], completedJobs[wallet].length);
    }

    function totalJobs() external view returns (uint256) {
        return _jobIdCounter.current();
    }
}
