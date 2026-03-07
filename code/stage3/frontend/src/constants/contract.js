export const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

export const CONTRACT_ABI = [
  "function createJob(string title, string ipfsCid, string[] milestoneDescs, uint256[] milestoneAmounts) payable returns (uint256)",
  "function acceptJob(uint256 jobId)",
  "function approveMilestone(uint256 jobId, uint256 milestoneIndex, string nftIpfsCid)",
  "function openDispute(uint256 jobId)",
  "function cancelOpenJob(uint256 jobId)",
  "function resolveDisputeByTimeout(uint256 jobId)",
  "function getJob(uint256 jobId) view returns (address client, address freelancer, string title, string ipfsCid, uint256 totalAmount, uint8 status, uint256 milestoneCount)",
  "function getMilestone(uint256 jobId, uint256 idx) view returns (string description, uint256 amount, bool approved, bool released)",
  "function getReputation(address wallet) view returns (uint256 score, uint256 jobsCompleted)",
  "function totalJobs() view returns (uint256)",
  "event JobCreated(uint256 indexed jobId, address indexed client, string title, uint256 amount)",
  "event MilestoneApproved(uint256 indexed jobId, uint256 milestoneIndex, uint256 amount)",
  "event ReputationNFTMinted(uint256 indexed tokenId, uint256 indexed jobId, address indexed freelancer, string ipfsCid)",
];
