const { ethers } = require("hardhat");

async function main() {
  console.log("🔑 Generating Hardhat Test Accounts\n");
  
  // Get the default signers (first 10 accounts)
  const signers = await ethers.getSigners();
  
  console.log("📋 Available Test Accounts:");
  console.log("=" .repeat(80));
  
  for (let i = 0; i < Math.min(10, signers.length); i++) {
    const signer = signers[i];
    const balance = await ethers.provider.getBalance(signer.address);
    const balanceInEth = ethers.formatEther(balance);
    
    console.log(`Account ${i}:`);
    console.log(`  Address: ${signer.address}`);
    console.log(`  Private Key: ${signer.privateKey || 'Available in local network only'}`);
    console.log(`  Balance: ${balanceInEth} ETH`);
    console.log("");
  }
  
  console.log("💡 Usage Tips:");
  console.log("- These accounts are pre-funded on Hardhat local network");
  console.log("- Import any address into MetaMask for testing");
  console.log("- Use 'npx hardhat node' to start local blockchain");
  console.log("- Network: http://localhost:8545, Chain ID: 31337");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });