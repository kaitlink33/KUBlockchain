const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak
} = require("docx");
const fs = require("fs");

const border = { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorders = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, bold: true, size: 32, color: "4F46E5" })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, bold: true, size: 26 })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, bold: true, size: 22 })] });
}
function p(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, size: 22, ...opts })], spacing: { after: 120 } });
}
function sp() { return new Paragraph({ children: [new TextRun("")], spacing: { after: 80 } }); }
function bullet(text, { bold = false } = {}) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, size: 22, bold })],
    spacing: { after: 80 },
  });
}
function tableRow(cells, isHeader = false) {
  return new TableRow({
    children: cells.map((text, i) =>
      new TableCell({
        borders,
        width: { size: Math.floor(9360 / cells.length), type: WidthType.DXA },
        shading: isHeader ? { fill: "4F46E5", type: ShadingType.CLEAR } : undefined,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 20, bold: isHeader, color: isHeader ? "FFFFFF" : "000000" })] })],
      })
    ),
  });
}

const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
    }]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "4F46E5" },
        paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [

      // Title Page
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1440, after: 240 },
        children: [new TextRun({ text: "TrustEscrow", bold: true, size: 64, color: "4F46E5" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 },
        children: [new TextRun({ text: "Product Requirements Document", size: 32, color: "374151" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
        children: [new TextRun({ text: "KU Block-a-Thon 2026 — 36-Hour Hackathon", size: 22, italics: true, color: "6B7280" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1440 },
        children: [new TextRun({ text: "Tracks: XRPL Real-World Impact | Pinata Builder | Open Innovation", size: 20, color: "6366F1" })] }),

      new Paragraph({ children: [new PageBreak()] }),

      // 1. Overview
      h1("1. Product Overview"),
      p("TrustEscrow is a decentralized freelance escrow and reputation platform built on the XRPL EVM Sidechain. It eliminates the need for centralized intermediaries (like Upwork or Fiverr) by using smart contracts to hold funds, release payments on milestone approval, and permanently record reputation as on-chain NFTs."),
      sp(),
      p("The core insight: in Web2 freelancing, trust is enforced by a company. In Web3, trust is enforced by math."),
      sp(),

      h2("1.1 Problem Statement"),
      p("Traditional freelance platforms suffer from three fundamental problems:"),
      bullet("Fraud and disputes — clients can refuse payment; freelancers can ghost after receiving funds"),
      bullet("Centralized control — platforms can freeze accounts, take 20% fees, or change rules arbitrarily"),
      bullet("Opaque reputation — reviews can be faked, deleted, or manipulated by the platform"),
      sp(),

      h2("1.2 Solution"),
      p("TrustEscrow replaces the platform middleman with a smart contract that:"),
      bullet("Locks client funds at job creation — freelancers know payment is guaranteed"),
      bullet("Auto-releases payment when a client approves a milestone — no payment delays"),
      bullet("Mints a tamper-proof ERC-721 NFT on job completion — reputation lives in the freelancer's wallet forever"),
      bullet("Stores all job details on IPFS via Pinata — metadata is permanent and decentralized"),
      sp(),

      new Paragraph({ children: [new PageBreak()] }),

      // 2. Goals
      h1("2. Goals and Non-Goals"),
      h2("2.1 Hackathon Goals (36 hours)"),
      bullet("Deploy TrustEscrow smart contract on XRPL EVM Devnet"),
      bullet("Implement full escrow lifecycle: create → accept → approve milestones → complete"),
      bullet("Integrate Pinata for job metadata and NFT metadata storage"),
      bullet("Build React frontend with wallet connection (MetaMask/RainbowKit)"),
      bullet("Mint ERC-721 reputation NFTs on job completion"),
      bullet("Demonstrate live demo with real on-chain transactions"),
      sp(),
      h2("2.2 Non-Goals (Post-hackathon)"),
      bullet("DAO-based dispute arbitration"),
      bullet("RLUSD stablecoin integration"),
      bullet("Mobile app"),
      bullet("Production security audit"),
      sp(),

      new Paragraph({ children: [new PageBreak()] }),

      // 3. Users
      h1("3. User Personas"),
      h2("3.1 Alice — The Client"),
      p("Alice is a startup founder who wants to hire a developer for a 2-week smart contract project. She has 2 ETH available but is nervous about paying a stranger upfront. She wants payment only released when deliverables are met."),
      sp(),
      h2("3.2 Bob — The Freelancer"),
      p("Bob is a Solidity developer who has been burned before by clients who refused to pay after work was delivered. He wants provable evidence of his completed work history that he can show future clients, even if a platform goes down."),
      sp(),

      new Paragraph({ children: [new PageBreak()] }),

      // 4. Features
      h1("4. Feature Requirements"),
      h2("4.1 Smart Contract (P0 — Must Have)"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2500, 4000, 2860],
        rows: [
          tableRow(["Function", "Description", "On-Chain State Change"], true),
          tableRow(["createJob()", "Client deposits XRP, defines milestones", "Yes — stores job struct"]),
          tableRow(["acceptJob()", "Freelancer claims the job", "Yes — sets freelancer address"]),
          tableRow(["approveMilestone()", "Client releases payment for one milestone", "Yes — transfers XRP, sets approved=true"]),
          tableRow(["openDispute()", "Either party flags a problem", "Yes — changes status to Disputed"]),
          tableRow(["cancelOpenJob()", "Client cancels before freelancer accepts", "Yes — refunds XRP"]),
          tableRow(["_mintReputationNFT()", "Internal — mints ERC-721 on completion", "Yes — mints NFT to freelancer"]),
        ]
      }),
      sp(),

      h2("4.2 Pinata / IPFS Integration (P0 — Required for Pinata Track)"),
      bullet("Job Metadata Upload: Title, description, required skills, attachments → IPFS CID stored on-chain"),
      bullet("NFT Metadata Upload: Completion certificate with job stats → CID stored as tokenURI"),
      bullet("Gateway Retrieval: Frontend reads from gateway.pinata.cloud for fast load times"),
      bullet("Pin Management: All TrustEscrow files tagged with keyvalue metadata for dashboard tracking"),
      sp(),

      h2("4.3 Backend API (P1)"),
      bullet("POST /api/jobs/metadata — uploads job data to Pinata, returns CID"),
      bullet("POST /api/nft/metadata — creates and pins NFT JSON, returns CID"),
      bullet("GET /api/jobs/:id — enriches on-chain data with IPFS metadata"),
      bullet("GET /api/reputation/:address — returns score and completed job count"),
      bullet("GET /api/stats — platform-level stats for dashboard"),
      sp(),

      h2("4.4 Frontend (P1)"),
      bullet("Job Board — lists all on-chain jobs with IPFS metadata"),
      bullet("Post Job — multi-step form with Pinata upload + contract write"),
      bullet("Job Detail — role-aware actions (accept, approve, dispute)"),
      bullet("Freelancer Profile — on-chain reputation score and job history"),
      bullet("Dashboard — platform stats (total jobs, XRP in escrow)"),
      sp(),

      new Paragraph({ children: [new PageBreak()] }),

      // 5. Technical Architecture
      h1("5. Technical Architecture"),
      h2("5.1 System Diagram"),
      p("React Frontend → Express Backend → Pinata IPFS"),
      p("React Frontend → TrustEscrow.sol → XRPL EVM Sidechain"),
      p("TrustEscrow.sol → Emits Events → Backend Listener"),
      sp(),

      h2("5.2 Tech Stack"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2500, 3500, 3360],
        rows: [
          tableRow(["Layer", "Technology", "Purpose"], true),
          tableRow(["Smart Contract", "Solidity 0.8.20 + OpenZeppelin", "Escrow logic, ERC-721 NFTs"]),
          tableRow(["Blockchain", "XRPL EVM Sidechain (Devnet)", "Transaction execution"]),
          tableRow(["Storage", "Pinata / IPFS", "Job metadata, NFT metadata"]),
          tableRow(["Backend", "Node.js + Express + ethers.js", "API, event listeners, Pinata bridge"]),
          tableRow(["Frontend", "React 18 + Wagmi + RainbowKit", "Wallet connection, contract reads/writes"]),
          tableRow(["Styling", "TailwindCSS", "Dark theme UI"]),
          tableRow(["Testing", "Hardhat + Chai", "Smart contract unit tests"]),
        ]
      }),
      sp(),

      new Paragraph({ children: [new PageBreak()] }),

      // 6. Timeline
      h1("6. 36-Hour Build Timeline"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1800, 2000, 5560],
        rows: [
          tableRow(["Hours", "Phase", "Deliverables"], true),
          tableRow(["0–2",   "Setup",          "Repo init, hardhat config, Pinata account, env files"]),
          tableRow(["2–8",   "Stage 1: Contracts", "TrustEscrow.sol, unit tests, deploy to XRPL Devnet"]),
          tableRow(["8–14",  "Stage 2: Backend",   "Express server, Pinata service, API routes, event listeners"]),
          tableRow(["14–22", "Stage 3: Frontend",  "Job board, PostJob, JobDetail, Navbar, RainbowKit"]),
          tableRow(["22–28", "Integration",    "Wire frontend to backend + contract, end-to-end testing"]),
          tableRow(["28–32", "Polish",          "UI improvements, error handling, demo script"]),
          tableRow(["32–36", "Submission",      "README, video demo, devpost writeup, deploy"]),
        ]
      }),
      sp(),

      new Paragraph({ children: [new PageBreak()] }),

      // 7. Success Metrics
      h1("7. Success Metrics"),
      h2("7.1 Technical"),
      bullet("All Hardhat unit tests passing"),
      bullet("Contract deployed on XRPL EVM Devnet with verifiable address"),
      bullet("At least 3 on-chain state changes demonstrated during live demo"),
      bullet("At least 2 IPFS files pinned via Pinata (job metadata + NFT metadata)"),
      bullet("Frontend connects to wallet and reads/writes contract successfully"),
      sp(),
      h2("7.2 Demo Script"),
      p("The following sequence should be completable in under 5 minutes for judges:"),
      bullet("Connect MetaMask (client wallet)"),
      bullet("Post job with 2 milestones totaling 1 XRP — Pinata CID appears"),
      bullet("Switch to freelancer wallet — accept the job"),
      bullet("Switch back to client — approve milestone 1 — payment released on-chain"),
      bullet("Approve milestone 2 — Reputation NFT minted to freelancer"),
      bullet("Navigate to freelancer profile — show on-chain score"),
      sp(),

      new Paragraph({ children: [new PageBreak()] }),

      // 8. Risks
      h1("8. Risks and Mitigations"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3000, 3000, 3360],
        rows: [
          tableRow(["Risk", "Likelihood", "Mitigation"], true),
          tableRow(["XRPL EVM RPC downtime", "Medium", "Keep Sepolia as fallback network"]),
          tableRow(["Pinata API rate limits", "Low", "Free tier is 250 requests/month"]),
          tableRow(["Reentrancy vulnerability", "Low", "Use OpenZeppelin ReentrancyGuard"]),
          tableRow(["MetaMask XRPL chain not recognized", "Medium", "Provide one-click chain add in README"]),
          tableRow(["Time overrun on UI polish", "High", "Use shadcn/ui components to accelerate"]),
        ]
      }),
      sp(),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/mnt/user-data/outputs/TrustEscrow_PRD.docx", buf);
  console.log("PRD written");
});
