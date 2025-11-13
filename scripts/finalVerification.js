const { ethers } = require("hardhat");

async function main() {
  console.log("🎯 Final Verification - Everything Should Work Now!\n");
  
  // Check contract address
  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  console.log("✅ Contract Address:", contractAddress);
  
  // Test account balances
  console.log("\n💰 Test Account Balances:");
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  
  const account1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const balance = await provider.getBalance(account1);
  console.log(`Account 1: ${account1}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`);
  
  // Test contract
  console.log("\n🔗 Contract Test:");
  try {
    const LoanContract = await ethers.getContractFactory("LoanContract");
    const contract = LoanContract.attach(contractAddress);
    const poolBalance = await contract.getPoolBalance();
    console.log("✅ Contract working, Pool Balance:", ethers.formatEther(poolBalance), "ETH");
  } catch (error) {
    console.log("❌ Contract error:", error.message);
  }
  
  console.log("\n🎉 Your dApp should now show:");
  console.log("1. Available ETH Balance: ~10,000 ETH (in the blue/purple gradient box)");
  console.log("2. All buttons should be clickable and responsive");
  console.log("3. You can deposit ETH as a lender");
  console.log("4. You can deposit collateral and borrow as a borrower");
  
  console.log("\n🔧 If still showing 0 ETH:");
  console.log("1. Hard refresh your browser (Ctrl+F5)");
  console.log("2. Check MetaMask is on 'Hardhat Local' network");
  console.log("3. Make sure you imported the correct account");
  console.log("4. Open browser console (F12) and look for errors");
  
  console.log("\n🚀 Ready to test your lending dApp!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });