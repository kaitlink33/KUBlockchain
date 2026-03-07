const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, LevelFormat, BorderStyle, WidthType, ShadingType, PageBreak
} = require("docx");
const fs = require("fs");

const border = { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, bold: true, size: 32, color: "4F46E5" })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, bold: true, size: 26, color: "1F2937" })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, bold: true, size: 22, color: "374151" })] });
}
function p(text) {
  return new Paragraph({ children: [new TextRun({ text, size: 22 })], spacing: { after: 140 } });
}
function sp() { return new Paragraph({ children: [new TextRun("")], spacing: { after: 100 } }); }
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 80 },
  });
}
function callout(label, text, color = "EEF2FF") {
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
    rows: [new TableRow({ children: [
      new TableCell({
        borders,
        width: { size: 9360, type: WidthType.DXA },
        shading: { fill: color, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        children: [
          new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: "4338CA" })], spacing: { after: 80 } }),
          new Paragraph({ children: [new TextRun({ text, size: 20, color: "1E1B4B" })], spacing: { after: 0 } }),
        ]
      })
    ]})]
  });
}
function resource(title, url, what) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [
      new TextRun({ text: `${title} — `, size: 21, bold: true }),
      new TextRun({ text: url, size: 21, color: "4F46E5" }),
      new TextRun({ text: ` — ${what}`, size: 21, italics: true }),
    ],
    spacing: { after: 80 },
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
        children: [new TextRun({ text: "Complete Comprehension Guide", size: 32, color: "374151" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1440 },
        children: [new TextRun({ text: "Every concept explained, with learning resources — for absolute beginners to blockchain", size: 22, italics: true, color: "6B7280" })] }),

      new Paragraph({ children: [new PageBreak()] }),

      // PART 1: BLOCKCHAIN CONCEPTS
      h1("Part 1: Blockchain Concepts for Beginners"),
      p("If you have never heard of blockchain, smart contracts, or NFTs before, this section is for you. Each concept is explained as simply as possible, followed by how TrustEscrow uses it, and where you can learn more."),
      sp(),

      // 1.1 Blockchain
      h2("1.1 What is a Blockchain?"),
      p("A blockchain is a database — but unlike a normal database (like a spreadsheet stored on one company's server), a blockchain is stored simultaneously on thousands of computers around the world. Every time data is added, it is grouped into a \"block\" and chained to the previous block using cryptography. This makes the data permanent and tamper-proof: to change one block, you would have to change every block after it across all computers simultaneously, which is computationally impossible."),
      sp(),
      p("Think of it like a Google Doc that thousands of people are watching at once, and nobody — not even Google — can go back and edit old entries."),
      sp(),
      callout("How TrustEscrow uses this:", "Every job, milestone approval, and reputation score is permanently stored on the XRPL EVM blockchain. A client cannot pretend they approved a milestone they didn't. A freelancer cannot fake their reputation score. The history is immutable."),
      sp(),
      p("Resources for learning blockchain basics:"),
      resource("Bitcoin Whitepaper (original blockchain paper)", "https://bitcoin.org/bitcoin.pdf", "The foundational document — challenging but worth skimming"),
      resource("Blockchain Explained — Investopedia", "https://www.investopedia.com/terms/b/blockchain.asp", "Accessible overview with clear diagrams"),
      resource("How does a blockchain work — Simply Explained (YouTube)", "https://www.youtube.com/watch?v=SSo_EIwHSd4", "6-minute visual explanation"),
      sp(),

      // 1.2 Smart Contracts
      h2("1.2 What is a Smart Contract?"),
      p("A smart contract is a program stored on a blockchain. Unlike normal programs running on company servers (where the company can modify them), a smart contract's code is deployed to the blockchain and becomes immutable — it executes exactly as written, every time, for anyone. No company can override it."),
      sp(),
      p("The name 'smart contract' comes from the idea that it can enforce an agreement automatically. If Condition A is met, then Action B happens — guaranteed, without needing a lawyer, a bank, or a company to enforce it."),
      sp(),
      callout("How TrustEscrow uses this:", "TrustEscrow.sol is a smart contract deployed on XRPL. When a client calls approveMilestone(), the contract automatically sends XRP to the freelancer. Nobody can block this payment, delay it, or take a percentage (except the 1% hardcoded platform fee). The contract cannot be changed after deployment."),
      sp(),
      p("Resources for smart contracts:"),
      resource("Smart Contracts — Ethereum Foundation", "https://ethereum.org/en/smart-contracts/", "Official explanation with interactive examples"),
      resource("Solidity Documentation", "https://docs.soliditylang.org/", "The programming language used to write TrustEscrow.sol"),
      resource("CryptoZombies", "https://cryptozombies.io/", "Free, gamified Solidity coding tutorial — highly recommended for beginners"),
      sp(),

      // 1.3 Wallet
      h2("1.3 What is a Crypto Wallet?"),
      p("A wallet is not where you store crypto — it is more accurate to say it's where you store the keys that prove ownership of crypto. It works like a public-private key pair: your public key (wallet address) is like your email address — anyone can send you money there. Your private key is like your password — whoever has it can spend your money."),
      sp(),
      p("MetaMask is a browser extension wallet. When TrustEscrow prompts you to 'sign a transaction,' MetaMask is asking your private key to authorize an action on the blockchain. You never share your private key — MetaMask handles it securely."),
      sp(),
      callout("How TrustEscrow uses this:", "When a client creates a job or a freelancer accepts one, they sign the transaction with MetaMask. The contract reads msg.sender (the caller's wallet address) to verify identity. No username or password — just cryptographic proof."),
      sp(),
      resource("MetaMask Setup Guide", "https://support.metamask.io/getting-started/getting-started-with-metamask/", "Official guide to setting up your first wallet"),
      resource("Public Key Cryptography Explained", "https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/", "Technical foundation of how wallets work"),
      sp(),

      // 1.4 ERC-721 / NFTs
      h2("1.4 What is an NFT (ERC-721)?"),
      p("NFT stands for Non-Fungible Token. 'Fungible' means interchangeable — one dollar bill is the same as any other dollar bill. 'Non-fungible' means unique — each token has a unique ID and cannot be swapped 1:1 with another. ERC-721 is the Ethereum standard that defines how to create NFTs."),
      sp(),
      p("While NFTs became famous for digital art, their underlying technology is simply a unique, ownership-tracked digital asset. In TrustEscrow, we use this property to create certificates: each completed job mints a unique NFT to the freelancer's wallet."),
      sp(),
      callout("How TrustEscrow uses this:", "When all milestones of a job are approved, TrustEscrow.sol calls _mintReputationNFT(). This creates a unique token ID, assigns it to the freelancer's address, and sets its metadata URI to an IPFS link. The NFT lives in the freelancer's wallet forever — it cannot be taken away, even if TrustEscrow shuts down."),
      sp(),
      resource("ERC-721 Standard — Ethereum Foundation", "https://ethereum.org/en/developers/docs/standards/tokens/erc-721/", "Official standard definition"),
      resource("OpenZeppelin ERC721 Docs", "https://docs.openzeppelin.com/contracts/4.x/erc721", "The library we use in TrustEscrow for ERC-721 implementation"),
      resource("NFT School", "https://nftschool.dev/", "Free, practical guide to building NFT projects"),
      sp(),

      // 1.5 IPFS
      h2("1.5 What is IPFS?"),
      p("IPFS (InterPlanetary File System) is a decentralized file storage network. Unlike HTTP (where files are stored at a location, like https://myserver.com/image.jpg), IPFS addresses files by their content hash — called a CID (Content Identifier). If you know the CID, you can retrieve the file from any node in the IPFS network that has it."),
      sp(),
      p("This matters for NFTs: if an NFT's image is stored at a normal URL, that company can change or delete the file. If stored on IPFS, the CID is a cryptographic fingerprint of the content — it is mathematically impossible to change the file without changing the CID."),
      sp(),
      callout("How TrustEscrow uses this:", "When a job is posted, the full description and attachments are uploaded to IPFS via Pinata. The returned CID is stored in the smart contract. When an NFT is minted, its metadata JSON (title, completion date, earnings) is uploaded to IPFS, and the CID becomes the tokenURI. This means job data is permanent even if our backend server goes offline."),
      sp(),
      resource("IPFS Documentation", "https://docs.ipfs.tech/concepts/what-is-ipfs/", "Official IPFS explanation with diagrams"),
      resource("Pinata Documentation", "https://docs.pinata.cloud/", "How to pin files to IPFS with guaranteed persistence"),
      resource("Content Addressing Explained", "https://proto.school/content-addressing", "Interactive ProtoSchool tutorial on IPFS fundamentals"),
      sp(),

      // 1.6 Pinata
      h2("1.6 What is Pinata?"),
      p("IPFS by itself doesn't guarantee files stay available — if no node 'pins' (keeps a copy of) a file, it can disappear from the network. Pinata is a service that pins your files to IPFS and guarantees they remain accessible. It also provides a fast CDN gateway (gateway.pinata.cloud) for quick retrieval."),
      sp(),
      callout("How TrustEscrow uses this:", "Our backend uploads job metadata and NFT metadata through the Pinata SDK. Each upload returns a CID that is then stored on-chain. Pinata also lets us add keyvalue metadata to pins, so we can query 'all TrustEscrow pins' from the dashboard. This is integral to the Pinata Builder Track requirement."),
      sp(),
      resource("Pinata API Reference", "https://docs.pinata.cloud/api-reference/introduction", "Full API reference used in our pinata.js service"),
      resource("Pinata SDK on npm", "https://www.npmjs.com/package/@pinata/sdk", "The package installed in our backend"),
      sp(),

      // 1.7 XRPL
      h2("1.7 What is XRPL and the XRPL EVM Sidechain?"),
      p("The XRP Ledger (XRPL) is a blockchain created by Ripple in 2012, designed for fast, low-cost payments. It can process 1,500 transactions per second with 3-5 second finality and average transaction fees under a cent."),
      sp(),
      p("The XRPL EVM Sidechain is a separate blockchain that runs alongside XRPL and is compatible with the Ethereum Virtual Machine (EVM). This means Solidity smart contracts that work on Ethereum also work on the XRPL EVM Sidechain — but with XRPL's speed and cost benefits. XRP is the native token for paying gas fees."),
      sp(),
      callout("How TrustEscrow uses this:", "TrustEscrow.sol is deployed on the XRPL EVM Devnet (testnet). All funds held in escrow are in XRP. Clients deposit XRP when creating jobs, and the contract releases XRP to freelancers on milestone approval. This qualifies us for the XRPL Real-World Impact prize track."),
      sp(),
      resource("XRPL Developer Documentation", "https://xrpl.org/docs/", "Official XRPL docs"),
      resource("XRPL EVM Sidechain Docs", "https://docs.xrplevm.org/", "EVM sidechain setup, RPC endpoints, faucet"),
      resource("XRPL Faucet", "https://faucet.xrpl.org/", "Get free testnet XRP for development"),
      sp(),

      // 1.8 Escrow
      h2("1.8 What is Escrow?"),
      p("In traditional finance, escrow is a legal arrangement where a third party holds funds until the conditions of an agreement are met. For example, in a real estate transaction, an escrow company holds the buyer's payment until the title is transferred. If conditions are not met, the escrow agent returns funds to the buyer."),
      sp(),
      p("In TrustEscrow, the smart contract itself is the escrow agent. It is trustless — neither party needs to trust the other or trust the platform, because the contract enforces the rules automatically through code."),
      sp(),
      callout("How TrustEscrow uses this:", "When createJob() is called with msg.value (XRP deposit), the funds are held by the contract address. They are only released when the client explicitly calls approveMilestone(). If a dispute is opened and times out, funds return to the client. No human intermediary is ever needed."),
      sp(),
      resource("Escrow Smart Contracts — Solidity by Example", "https://solidity-by-example.org/app/escrow/", "Simple escrow implementation walkthrough"),
      sp(),

      // 1.9 ReentrancyGuard
      h2("1.9 What is the Reentrancy Attack?"),
      p("A reentrancy attack is one of the most famous smart contract vulnerabilities. It occurred in the 2016 DAO hack, where $60 million was drained from a contract. The attack works like this: a malicious contract calls your withdraw function, and before your function updates the balance, the malicious contract calls your withdraw function again — recursively draining funds."),
      sp(),
      p("TrustEscrow uses OpenZeppelin's ReentrancyGuard modifier (nonReentrant) on all payment functions. This sets a lock flag before execution and clears it after, preventing any recursive calls."),
      sp(),
      resource("Reentrancy Attack — SWC Registry", "https://swcregistry.io/docs/SWC-107", "Standard weakness classification for smart contracts"),
      resource("OpenZeppelin ReentrancyGuard", "https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard", "The guard we import in TrustEscrow.sol"),
      sp(),

      new Paragraph({ children: [new PageBreak()] }),

      // PART 2: CODE EXPLAINED
      h1("Part 2: Code Walkthrough"),
      p("This section walks through every significant part of the codebase, explaining what each line does and why."),
      sp(),

      h2("2.1 TrustEscrow.sol — The Smart Contract"),
      h3("Inheritance"),
      p("contract TrustEscrow is ERC721URIStorage, ReentrancyGuard"),
      p("By inheriting ERC721URIStorage, TrustEscrow gains all NFT minting and management functions for free — we do not write them from scratch. ERC721URIStorage specifically lets us assign a unique metadata URL (the IPFS CID) to each token. Inheriting ReentrancyGuard adds the nonReentrant modifier used on payment functions."),
      sp(),

      h3("The Job Struct"),
      p("A struct is a custom data type that groups related variables. The Job struct holds all information about a single job: who the client and freelancer are, the IPFS CID of the job description, the total XRP deposited, the current status, and an array of Milestone structs. Structs in Solidity are stored in contract storage, meaning they are permanently on-chain."),
      sp(),

      h3("The msg.value Pattern"),
      p("In Solidity, msg.value is the amount of cryptocurrency (in wei, the smallest unit) sent with a transaction. When a client calls createJob(), they must send XRP by marking the function payable and including {value: amount} in their transaction. The contract holds this XRP until it decides to send it somewhere."),
      sp(),

      h3("Events"),
      p("Events are logs emitted by smart contracts that external applications can listen for. TrustEscrow emits JobCreated, MilestoneApproved, FundsReleased, and ReputationNFTMinted. Our Node.js backend subscribes to these events using ethers.js — when a job is created on-chain, the backend logs it and can trigger additional actions."),
      sp(),

      h2("2.2 pinata.js — The IPFS Service"),
      h3("Why a separate service file?"),
      p("Rather than duplicating Pinata API calls throughout the codebase, we centralize all IPFS interactions in one file. This follows the Single Responsibility Principle — one file, one job. If we switch from Pinata to another IPFS service later, we only change this one file."),
      sp(),
      h3("CIDv1 vs CIDv0"),
      p("pinataOptions: { cidVersion: 1 } — CIDv1 is the newer IPFS content identifier format. It is case-insensitive, URL-safe, and future-proof. CIDv0 (older format, starts with 'Qm') still works but is being phased out. Always use CIDv1 for new projects."),
      sp(),

      h2("2.3 Wagmi + RainbowKit — Wallet Connection"),
      p("Wagmi is a React hooks library for interacting with Ethereum-compatible blockchains. useContractWrite gives us a write function that calls a smart contract method and handles the wallet signing flow. usePrepareContractWrite pre-validates the transaction parameters before the user signs, catching errors early."),
      sp(),
      p("RainbowKit is a wallet connection UI built on top of Wagmi. ConnectButton renders a polished button that handles wallet detection (MetaMask, WalletConnect), chain switching, and displays the user's address and balance. We configured it to point at XRPL EVM Devnet."),
      sp(),
      resource("Wagmi Documentation", "https://wagmi.sh/", "Full wagmi hooks reference"),
      resource("RainbowKit Documentation", "https://www.rainbowkit.com/docs/introduction", "RainbowKit setup and theming guide"),
      sp(),

      new Paragraph({ children: [new PageBreak()] }),

      // PART 3: TRACK STRATEGY
      h1("Part 3: Hackathon Track Strategy"),
      p("TrustEscrow is designed to qualify for three prize tracks simultaneously. Here is how each qualification is demonstrated:"),
      sp(),

      h2("3.1 XRPL Real-World Impact ($1,500 first place)"),
      p("TrustEscrow solves a real-world problem (freelance payment fraud) using XRPL's core features:"),
      bullet("Deployed on XRPL EVM Sidechain Devnet — all transactions use XRP"),
      bullet("Smart escrow: client deposits XRP → freelancer receives XRP on approval"),
      bullet("Payment finality in 3-5 seconds with sub-cent fees (vs Ethereum's 15+ second finality and variable gas)"),
      bullet("Could integrate RLUSD stablecoin in future for stable-price escrow"),
      sp(),

      h2("3.2 Pinata Builder Track ($2,000 max)"),
      p("Pinata is integral to the architecture, not bolted on:"),
      bullet("Job metadata (description, skills, attachments) stored on IPFS via Pinata — CID stored on-chain"),
      bullet("NFT metadata (certificate JSON) stored on IPFS via Pinata — CID becomes tokenURI"),
      bullet("Files tagged with keyvalue metadata for dashboard querying"),
      bullet("Fast retrieval via gateway.pinata.cloud shown in frontend"),
      bullet("If Pinata goes down, CIDs are still on-chain — any IPFS gateway can serve the content"),
      sp(),

      h2("3.3 Open Innovation DApp ($1,000)"),
      p("Multiple on-chain state changes are demonstrated:"),
      bullet("createJob() — writes Job struct to contract storage, holds XRP"),
      bullet("acceptJob() — updates freelancer field and status"),
      bullet("approveMilestone() — changes approved/released flags, transfers XRP, updates reputation score"),
      bullet("_mintReputationNFT() — mints ERC-721 token to freelancer wallet"),
      sp(),

      new Paragraph({ children: [new PageBreak()] }),

      // PART 4: GLOSSARY
      h1("Part 4: Glossary"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2500, 6860],
        rows: [
          tableRow(["Term", "Definition"], true),
          tableRow(["ABI", "Application Binary Interface — the list of functions a contract exposes. Used by ethers.js and wagmi to know how to call the contract."]),
          tableRow(["CID", "Content Identifier — IPFS address based on the hash of a file's content. Unique and tamper-proof."]),
          tableRow(["DApp", "Decentralized Application — an app where the backend runs on a blockchain rather than a company's server."]),
          tableRow(["ERC-721", "Ethereum standard for Non-Fungible Tokens. TrustEscrow inherits this standard for reputation NFTs."]),
          tableRow(["Gas", "Fee paid to the blockchain network for computation. On XRPL EVM, fees are paid in XRP."]),
          tableRow(["Hardhat", "Ethereum development environment. Used for compiling, testing, and deploying our Solidity contract."]),
          tableRow(["IPFS", "InterPlanetary File System — decentralized file storage addressed by content hash."]),
          tableRow(["msg.sender", "Solidity global variable — the wallet address that called the current function."]),
          tableRow(["msg.value", "Solidity global variable — the amount of cryptocurrency sent with the current transaction."]),
          tableRow(["NFT", "Non-Fungible Token — a unique, ownership-tracked digital asset. ERC-721 tokens."]),
          tableRow(["OpenZeppelin", "Open source library of audited, secure smart contract building blocks. We use their ERC-721 and ReentrancyGuard."]),
          tableRow(["Pinata", "IPFS pinning service that guarantees file persistence and provides a fast CDN gateway."]),
          tableRow(["Solidity", "Programming language for Ethereum-compatible smart contracts."]),
          tableRow(["Testnet / Devnet", "A test blockchain that uses fake money. No real value is at risk during development."]),
          tableRow(["tokenURI", "URL (usually IPFS CID) pointing to the metadata JSON for an ERC-721 NFT."]),
          tableRow(["Wagmi", "React hooks library for blockchain interaction."]),
          tableRow(["wei", "The smallest unit of ETH/XRP. 1 ETH = 10^18 wei. parseEther('1.0') converts 1 ETH to wei."]),
          tableRow(["XRPL", "XRP Ledger — a fast, low-cost blockchain by Ripple. TrustEscrow runs on its EVM Sidechain."]),
        ]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/mnt/user-data/outputs/TrustEscrow_Comprehension_Guide.docx", buf);
  console.log("Comprehension Guide written");
});

function tableRow(cells, isHeader = false) {
  const { TableRow, TableCell, Table, Paragraph, TextRun, BorderStyle, WidthType, ShadingType } = require("docx");
  const border = { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new TableRow({
    children: cells.map((text, i) =>
      new TableCell({
        borders,
        width: { size: i === 0 ? 2500 : 6860, type: WidthType.DXA },
        shading: isHeader ? { fill: "4F46E5", type: ShadingType.CLEAR } : undefined,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 20, bold: isHeader, color: isHeader ? "FFFFFF" : "000000" })] })],
      })
    ),
  });
}
