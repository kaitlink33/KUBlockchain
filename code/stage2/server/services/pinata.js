/**
 * Pinata IPFS Service
 * Wraps Pinata SDK for clean upload/retrieval of job metadata and NFT metadata.
 *
 * Why Pinata?
 *   - Persistent IPFS pinning (files stay available, not just temporarily cached)
 *   - Fast gateway: gateway.pinata.cloud
 *   - Group API lets us organize files by job/client
 *   - Required for the Pinata Builder Track prize
 *
 * Learn more: https://docs.pinata.cloud
 */

const PinataSDK = require("@pinata/sdk");
const { Readable } = require("stream");
require("dotenv").config();

const pinata = new PinataSDK({
  pinataApiKey:    process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_SECRET_KEY,
  // Or use JWT:
  // pinataJWTKey: process.env.PINATA_JWT
});

/**
 * Upload a JSON object to IPFS via Pinata.
 * @param {object} data     - JSON-serializable object
 * @param {string} name     - Human-readable pin name (for Pinata dashboard)
 * @param {object} metadata - Extra key-value metadata stored alongside pin
 * @returns {Promise<string>} IPFS CID (Content Identifier)
 */
async function uploadJSON(data, name = "trustescrow_metadata", metadata = {}) {
  const result = await pinata.pinJSONToIPFS(data, {
    pinataMetadata: {
      name,
      keyvalues: {
        app: "TrustEscrow",
        version: "1.0",
        ...metadata,
      },
    },
    pinataOptions: {
      cidVersion: 1,  // CIDv1 is URL-safe and future-proof
    },
  });

  console.log(`[Pinata] Pinned JSON "${name}" → ${result.IpfsHash}`);
  return result.IpfsHash;  // This is the CID — e.g. "bafkreigh2akiscaildcqabab4euqbv..."
}

/**
 * Upload a file buffer (image, PDF, etc.) to IPFS via Pinata.
 * @param {Buffer} buffer   - File contents
 * @param {string} filename - Original filename
 * @param {object} metadata - Extra pin metadata
 * @returns {Promise<string>} IPFS CID
 */
async function uploadBuffer(buffer, filename, metadata = {}) {
  const stream = Readable.from(buffer);
  stream.path = filename;  // Pinata SDK needs path on the stream

  const result = await pinata.pinFileToIPFS(stream, {
    pinataMetadata: {
      name: filename,
      keyvalues: { app: "TrustEscrow", ...metadata },
    },
    pinataOptions: { cidVersion: 1 },
  });

  console.log(`[Pinata] Pinned file "${filename}" → ${result.IpfsHash}`);
  return result.IpfsHash;
}

/**
 * List all pins for TrustEscrow (useful for admin dashboards).
 * @param {number} limit  - Max results per page
 * @param {number} offset - Pagination offset
 */
async function listPins(limit = 20, offset = 0) {
  const result = await pinata.pinList({
    pageLimit: limit,
    pageOffset: offset,
    metadata: { keyvalues: { app: { value: "TrustEscrow", op: "eq" } } },
  });
  return result.rows;
}

/**
 * Unpin a CID (delete from Pinata — use with care, removes persistence).
 */
async function unpin(cid) {
  await pinata.unpin(cid);
  console.log(`[Pinata] Unpinned ${cid}`);
}

/**
 * Test connection to Pinata — call on startup to validate API keys.
 */
async function testConnection() {
  try {
    const result = await pinata.testAuthentication();
    console.log("[Pinata] ✅ Connected:", result.message);
    return true;
  } catch (err) {
    console.error("[Pinata] ❌ Auth failed:", err.message);
    return false;
  }
}

module.exports = { uploadJSON, uploadBuffer, listPins, unpin, testConnection };
