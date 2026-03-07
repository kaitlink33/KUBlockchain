const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, LevelFormat, BorderStyle, WidthType, ShadingType, PageBreak
} = require("docx");
const fs = require("fs");

const border = { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, bold: true, size: 32, color: "4F46E5" })] }); }
function h2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, bold: true, size: 26 })] }); }
function h3(text) { return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, bold: true, size: 22 })] }); }
function p(text) { return new Paragraph({ children: [new TextRun({ text, size: 22 })], spacing: { after: 140 } }); }
function sp() { return new Paragraph({ children: [new TextRun("")], spacing: { after: 100 } }); }
function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Courier New", size: 18, color: "1F2937" })],
    shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
    spacing: { before: 60, after: 60 },
    indent: { left: 360 },
  });
}
function bullet(text) {
  return new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text, size: 22 })], spacing: { after: 80 } });
}
function numbered(text) {
  return new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text, size: 22 })], spacing: { after: 100 } });
}
function warn(text) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders,
      shading: { fill: "FEF3C7", type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 200, right: 200 },
      width: { size: 9360, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: "⚠️  " + text, size: 20, color: "92400E" })] })]
    })]})],
  });
}
function tip(text) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders,
      shading: { fill: "D1FAE5", type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 200, right: 200 },
      width: { size: 9360, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: "✅  " + text, size: 20, color: "065F46" })] })]
    })]})],
  });
}

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "4F46E5" },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: [

      // Title
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1440, after: 240 },
        children: [new TextRun({ text: "TrustEscrow", bold: true, size: 64, color: "4F46E5" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 },
        children: [new TextRun({ text: "Implementation Guide", size: 32, color: "374151" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1440 },
        children: [new TextRun({ text: "Step-by-step setup from zero to deployed, for KU Block-a-Thon 2026", size: 22, italics: true, color: "6B7280" })] }),

      new Paragraph({ children: [new PageBreak()] }),

      h1("Prerequisites"),
      p("Before you write a single line of code, make sure these are installed and configured:"),
      sp(),
      h2("Required Tools"),
      numbered("Node.js 18+ — Download from nodejs.org. Run: node --version to confirm."),
      numbered("Git — For committing each stage. Run: git --version to confirm."),
      numbered("MetaMask browser extension — Install from metamask.io. Create a wallet and save your seed phrase securely."),
      numbered("VS Code (recommended editor) — code.visualstudio.com — Install the Solidity extension by Juan Blanco."),
      sp(),
      h2("Required Accounts (all free)"),
      numbered("Pinata Account — Sign up at pinata.cloud. Navigate to API Keys and create a new key with pinFileToIPFS and pinJSONToIPFS permissions. Save the API Key and Secret."),
      numbered("WalletConnect Project ID — Sign up at cloud.walletconnect.com, create a project, and copy the Project ID."),
      sp(),
      h2("Add XRPL EVM Devnet to MetaMask"),
      p("Open MetaMask > Settings > Networks > Add Network > Add manually:"),
      bullet("Network Name: XRPL EVM Devnet"),
      bullet("RPC URL: https://rpc-evm-sidechain.xrpl.org"),
      bullet("Chain ID: 1440002"),
      bullet("Currency Symbol: XRP"),
      bullet("Block Explorer: https://evm-sidechain.xrpl.org"),
      sp(),
      p("Then get testnet XRP from the faucet at faucet.xrpl.org — make sure to select 'Devnet' and use your MetaMask wallet address."),
      sp(),

      new Paragraph({ children: [new PageBreak()] }),

      h1("Stage 1: Smart Contracts"),
      p("Estimated time: 4-6 hours. Commit message: feat: smart contracts — TrustEscrow escrow + NFT reputation"),
      sp(),

      h2("1.1 Project Setup"),
      code("mkdir trustescrow && cd trustescrow"),
      code("git init"),
      code("cd code/stage1"),
      code("npm install"),
      sp(),
      tip("If npm install fails with permission errors, run: sudo npm install -g hardhat"),
      sp(),

      h2("1.2 Environment Setup"),
      p("Create a .env file in code/stage1/:"),
      code("PRIVATE_KEY=your_metamask_private_key_here"),
      code("SEPOLIA_RPC_URL=https://rpc.sepolia.org"),
      sp(),
      warn("NEVER commit your .env file to git. The .gitignore already excludes it, but double-check before every push."),
      sp(),
      p("To get your MetaMask private key: MetaMask > Account Details > Export Private Key. This is your testnet-only wallet — never use a wallet with real funds for development."),
      sp(),

      h2("1.3 Compile and Test"),
      code("npx hardhat compile"),
      code("npx hardhat test"),
      sp(),
      p("All 5 tests should pass. If a test fails, read the error message carefully — it usually points to the exact line. Common issues:"),
      bullet("'Cannot find module': run npm install again"),
      bullet("'Compiled N Solidity files': this is a success message, not an error"),
      bullet("'AssertionError: expected X to equal Y': a test found unexpected contract behavior"),
      sp(),

      h2("1.4 Deploy to XRPL EVM Devnet"),
      code("npm run deploy:xrpl"),
      sp(),
      p("The output will say: TrustEscrow deployed to: 0x... — copy this address. You will need it in every subsequent stage."),
      sp(),
      tip("Paste the address into the XRPL EVM Explorer (evm-sidechain.xrpl.org) to verify the deployment. You should see your contract with its ABI."),
      sp(),
      p("Stage 1 Git Commit:"),
      code("git add ."),
      code('git commit -m "feat: smart contracts — TrustEscrow escrow + NFT reputation"'),
      sp(),

      new Paragraph({ children: [new PageBreak()] }),

      h1("Stage 2: Backend API"),
      p("Estimated time: 4-6 hours. Commit message: feat: backend API — Pinata IPFS + contract event listeners"),
      sp(),

      h2("2.1 Setup"),
      code("cd code/stage2/server"),
      code("npm install"),
      sp(),
      p("Create .env in code/stage2/server/:"),
      code("PINATA_API_KEY=your_pinata_api_key"),
      code("PINATA_SECRET_KEY=your_pinata_secret_api_key"),
      code("CONTRACT_ADDRESS=0x...your_deployed_contract..."),
      code("RPC_URL=https://rpc-evm-sidechain.xrpl.org"),
      code("PRIVATE_KEY=your_private_key"),
      code("FRONTEND_URL=http://localhost:3000"),
      code("PORT=4000"),
      sp(),

      h2("2.2 Copy ABI from Hardhat"),
      p("After compiling in Stage 1, Hardhat generates an ABI JSON file. Copy it to the backend:"),
      code("mkdir -p abi"),
      code("cp ../stage1/artifacts/contracts/TrustEscrow.sol/TrustEscrow.json ./abi/"),
      sp(),
      tip("The ABI (Application Binary Interface) tells ethers.js what functions the contract has and how to call them. Without it, the backend cannot interact with the contract."),
      sp(),

      h2("2.3 Start the Server"),
      code("npm run dev"),
      sp(),
      p("You should see:"),
      code("TrustEscrow API running on http://localhost:4000"),
      code("[Pinata] Connected: Congratulations! You are communicating..."),
      sp(),
      p("If Pinata auth fails: double-check your API key and secret. Make sure you created a key with the correct permissions on the Pinata dashboard."),
      sp(),

      h2("2.4 Test the API"),
      p("In a new terminal, test the endpoints:"),
      code("curl http://localhost:4000/api/stats"),
      code('curl http://localhost:4000/api/jobs/0'),
      sp(),
      p("To test the Pinata upload endpoint, use a tool like Postman or:"),
      code("curl -X POST http://localhost:4000/api/jobs/metadata \\"),
      code('  -F "title=Test Job" \\'),
      code('  -F "description=A test job" \\'),
      code('  -F "clientAddress=0x1234..."'),
      sp(),
      p("Stage 2 Git Commit:"),
      code("git add ."),
      code('git commit -m "feat: backend API — Pinata IPFS + contract event listeners"'),
      sp(),

      new Paragraph({ children: [new PageBreak()] }),

      h1("Stage 3: React Frontend"),
      p("Estimated time: 6-8 hours. Commit message: feat: React frontend — job board, escrow UI, reputation profiles"),
      sp(),

      h2("3.1 Setup"),
      code("cd code/stage3/frontend"),
      code("npm install"),
      sp(),
      p("Create .env:"),
      code("REACT_APP_CONTRACT_ADDRESS=0x...your_deployed_contract..."),
      code("REACT_APP_API_URL=http://localhost:4000/api"),
      code("REACT_APP_WALLETCONNECT_PROJECT_ID=your_project_id"),
      sp(),

      h2("3.2 Organize Source Files"),
      p("The all.jsx file in src/pages/ contains multiple components for convenience. For the final version, split it into individual files:"),
      bullet("src/pages/JobBoard.jsx"),
      bullet("src/pages/FreelancerProfile.jsx"),
      bullet("src/pages/Dashboard.jsx"),
      bullet("src/components/Navbar.jsx"),
      bullet("src/constants/contract.js"),
      bullet("src/constants/api.js"),
      sp(),

      h2("3.3 Start the Frontend"),
      p("Make sure your Stage 2 backend is running, then:"),
      code("npm start"),
      sp(),
      p("This opens http://localhost:3000 in your browser. You should see the TrustEscrow job board."),
      sp(),

      h2("3.4 Integration Test — Full Demo Flow"),
      p("Follow these steps to verify everything works end-to-end:"),
      numbered("Click 'Connect Wallet' — MetaMask should pop up, select your account on XRPL EVM Devnet"),
      numbered("Click 'Post a Job' — fill in title, description, and at least one milestone with a small XRP amount (e.g. 0.01)"),
      numbered("Click 'Upload Metadata & Continue' — watch the backend terminal for the Pinata log line"),
      numbered("Click 'Deposit XRP & Create Job' — MetaMask confirmation popup should appear, confirm it"),
      numbered("Wait for transaction — the page should redirect to the job board showing your new job"),
      numbered("Switch to a different MetaMask account (freelancer wallet), also funded from the faucet"),
      numbered("Click the job — click 'Accept This Job' — confirm in MetaMask"),
      numbered("Switch back to client wallet — click 'Approve & Release' on the milestone — confirm"),
      numbered("A Reputation NFT should be minted to the freelancer's wallet"),
      numbered("Navigate to /profile/[freelancer_address] — confirm reputation score is shown"),
      sp(),
      warn("If transactions fail with 'insufficient funds', get more testnet XRP from faucet.xrpl.org. You need XRP for both the escrow deposit AND gas fees."),
      sp(),

      h2("3.5 Common Issues"),
      h3("MetaMask shows wrong network"),
      p("Make sure MetaMask is set to XRPL EVM Devnet (Chain ID 1440002). The app will not work on Ethereum Mainnet."),
      sp(),
      h3("Pinata uploads succeed but frontend shows no metadata"),
      p("Check that your backend is running and REACT_APP_API_URL is set correctly. Open browser DevTools > Network tab to see API calls."),
      sp(),
      h3("usePrepareContractWrite returns undefined"),
      p("The enabled: flag on usePrepareContractWrite prevents the hook from running until all required data is available. Check that ipfsCid is not null before the confirm step."),
      sp(),

      p("Stage 3 Git Commit:"),
      code("git add ."),
      code('git commit -m "feat: React frontend — job board, escrow UI, reputation profiles"'),
      sp(),

      new Paragraph({ children: [new PageBreak()] }),

      h1("Submission Checklist"),
      p("Before submitting to Devpost, verify each of these:"),
      sp(),
      h2("Technical Requirements"),
      bullet("Contract deployed on XRPL EVM Devnet — save and share the contract address"),
      bullet("At least one real on-chain transaction completed (not just localhost Hardhat)"),
      bullet("At least one file pinned to IPFS via Pinata — verify in Pinata dashboard"),
      bullet("Reputation NFT minted and visible in wallet"),
      bullet("GitHub repo is public with all 3 stages committed"),
      sp(),
      h2("Devpost Submission"),
      bullet("Clear README with contract address and setup instructions"),
      bullet("2-3 minute video demo showing the full job flow"),
      bullet("Screenshots of contract on XRPL explorer"),
      bullet("Screenshots of pinned files in Pinata dashboard"),
      bullet("Clear explanation of which tracks you are entering and why you qualify"),
      sp(),
      h2("Demo Script (practice this)"),
      numbered("Open the app — show the empty job board"),
      numbered("Connect MetaMask — show the wallet address in the navbar"),
      numbered("Post a job — show the Pinata CID appearing"),
      numbered("Switch wallets — accept the job — show the on-chain status change"),
      numbered("Approve a milestone — show XRP moving on the XRPL explorer"),
      numbered("Show the minted NFT in the freelancer's wallet"),
      numbered("Show the reputation profile page"),
      sp(),
      tip("Practice the demo at least 3 times. Judges see dozens of projects — a smooth, confident demo is worth as much as the code itself."),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/mnt/user-data/outputs/TrustEscrow_Implementation_Guide.docx", buf);
  console.log("Implementation Guide written");
});
