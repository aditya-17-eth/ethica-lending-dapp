const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying dApp Setup...\n");
  
  // Check if Hardhat node is running
  try {
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    const network = await provider.getNetwork();
    console.log("✅ Hardhat network is running");
    console.log("   Chain ID:", network.chainId.toString());
  } catch (error) {
    console.log("❌ Hardhat network not accessible");
    console.log("   Run: npx hardhat node");
    return;
  }
  
  // Check contract deployment
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  try {
    const LoanContract = await ethers.getContractFactory("LoanContract");
    const contract = LoanContract.attach(contractAddress);
    
    const poolBalance = await contract.getPoolBalance();
    console.log("✅ Contract is deployed and accessible");
    console.log("   Address:", contractAddress);
    console.log("   Pool Balance:", ethers.formatEther(poolBalance), "ETH");
  } catch (error) {
    console.log("❌ Contract not accessible:", error.message);
    return;
  }
  
  // Check test accounts
  const [deployer, account1, account2] = await ethers.getSigners();
  
  console.log("\n💰 Test Account Balances:");
  console.log("Account 0 (Deployer):", deployer.address);
  console.log("  Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  console.log("Account 1 (Test Lender):", account1.address);
  console.log("  Balance:", ethers.formatEther(await ethers.provider.getBalance(account1.address)), "ETH");
  
  console.log("Account 2 (Test Borrower):", account2.address);
  console.log("  Balance:", ethers.formatEther(await ethers.provider.getBalance(account2.address)), "ETH");
  
  console.log("\n🦊 MetaMask Setup:");
  console.log("Network Name: Hardhat Local");
  console.log("RPC URL: http://localhost:8545");
  console.log("Chain ID: 31337");
  console.log("Currency Symbol: ETH");
  
  console.log("\n🔑 Import these private keys to MetaMask:");
  console.log("Account 1:", "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
  console.log("Account 2:", "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");
  
  console.log("\n✅ Setup Complete! Your dApp should now work properly.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });