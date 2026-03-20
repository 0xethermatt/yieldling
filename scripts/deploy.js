import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Config ────────────────────────────────────────────────────────────────────

// wstETH on Base Sepolia testnet
const WSTETH_BASE_SEPOLIA = "0x13e5FB0B6534BB22cBC59Fae339dbBE0Dc906871";

// Initial per-tx withdrawal cap: 1 wstETH (18 decimals)
const INITIAL_CAP = ethers.parseEther("1");

// ── Deploy ────────────────────────────────────────────────────────────────────

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying YieldPetTreasury...");
  console.log("  Deployer :", deployer.address);
  console.log("  Network  :", (await ethers.provider.getNetwork()).name);
  console.log("  wstETH   :", WSTETH_BASE_SEPOLIA);
  console.log("  Per-tx cap:", ethers.formatEther(INITIAL_CAP), "wstETH");

  const Treasury = await ethers.getContractFactory("YieldPetTreasury");
  const treasury = await Treasury.deploy(WSTETH_BASE_SEPOLIA, INITIAL_CAP);
  await treasury.waitForDeployment();

  const address = await treasury.getAddress();
  console.log("\n✅ YieldPetTreasury deployed to:", address);

  // ── Save deployment info ────────────────────────────────────────────────────

  const network = await ethers.provider.getNetwork();
  const deploymentPath = join(__dirname, "..", "deployments.json");

  // Merge with any existing deployments
  let deployments = {};
  if (fs.existsSync(deploymentPath)) {
    deployments = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  }

  deployments[network.chainId.toString()] = {
    network: network.name,
    chainId: network.chainId.toString(),
    YieldPetTreasury: address,
    wstETH: WSTETH_BASE_SEPOLIA,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));
  console.log("📄 Deployment saved to deployments.json");
  console.log(JSON.stringify(deployments[network.chainId.toString()], null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
