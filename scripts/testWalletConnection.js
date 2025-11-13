const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing Wallet Connection...\n");
  
  // Test if we can connect to the network
  try {
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    const network = await provider.getNetwork();
    console.log("✅ Network Connection:");
    console.log("   Chain ID:", network.chainId.toString());
    console.log("   Network Name:", network.name);
  } catch (error) {
    console.log("❌ Network connection failed:", error.message);
    return;
  }
  
  // Test account balances
  console.log("\n💰 Account Balances:");
  const accounts = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account 0
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account 1
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"  // Account 2
  ];
  
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  
  for (let i = 0; i < accounts.length; i++) {
    try {
      const balance = await provider.getBalance(accounts[i]);
      console.log(`Account ${i}: ${accounts[i]}`);
      console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
    } catch (error) {
      console.log(`Account ${i}: Error getting balance - ${error.message}`);
    }
  }
  
  // Test contract interaction
  console.log("\n🔗 Contract Test:");
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  try {
    const LoanContract = await ethers.getContractFactory("LoanContract");
    const contract = LoanContract.attach(contractAddress);
    
    const poolBalance = await contract.getPoolBalance();
    const collateralRatio = await contract.COLLATERAL_RATIO();
    
    console.log("✅ Contract is accessible:");
    console.log("   Address:", contractAddress);
    console.log("   Pool Balance:", ethers.formatEther(poolBalance), "ETH");
    console.log("   Collateral Ratio:", collateralRatio.toString() + "%");
  } catch (error) {
    console.log("❌ Contract interaction failed:", error.message);
  }
  
  console.log("\n🦊 MetaMask Debug Info:");
  console.log("Make sure in MetaMask you have:");
  console.log("1. Network: Hardhat Local (Chain ID: 31337)");
  console.log("2. RPC URL: http://localhost:8545");
  console.log("3. Imported one of the test accounts above");
  console.log("4. You should see ~10,000 ETH balance in MetaMask");
  
  console.log("\n🔧 If you see 0 ETH in your dApp:");
  console.log("1. Check browser console for errors (F12)");
  console.log("2. Make sure you restarted React app after creating .env");
  console.log("3. Verify MetaMask is connected to the correct network");
  console.log("4. Try refreshing the page");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });