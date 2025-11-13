const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging Wallet Balance Issue...\n");
  
  // Test accounts
  const testAccounts = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account 0
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account 1  
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"  // Account 2
  ];
  
  console.log("💰 Current Account Balances:");
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  
  for (let i = 0; i < testAccounts.length; i++) {
    try {
      const balance = await provider.getBalance(testAccounts[i]);
      const balanceEth = ethers.formatEther(balance);
      console.log(`Account ${i}: ${testAccounts[i]}`);
      console.log(`   Balance: ${balanceEth} ETH`);
      console.log(`   Private Key: ${getPrivateKey(i)}`);
      console.log("");
    } catch (error) {
      console.log(`Account ${i}: Error - ${error.message}`);
    }
  }
  
  // Test contract
  console.log("🔗 Contract Status:");
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  console.log("Contract Address:", contractAddress);
  
  try {
    const LoanContract = await ethers.getContractFactory("LoanContract");
    const contract = LoanContract.attach(contractAddress);
    const poolBalance = await contract.getPoolBalance();
    console.log("✅ Contract accessible, Pool Balance:", ethers.formatEther(poolBalance), "ETH");
  } catch (error) {
    console.log("❌ Contract error:", error.message);
  }
  
  console.log("\n🦊 MetaMask Troubleshooting:");
  console.log("1. Make sure you're connected to 'Hardhat Local' network");
  console.log("2. Chain ID should be 31337");
  console.log("3. RPC URL should be http://localhost:8545");
  console.log("4. Import Account 1 using private key above");
  console.log("5. Refresh your browser page");
  console.log("6. Check browser console (F12) for any errors");
}

function getPrivateKey(index) {
  const keys = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", 
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
  ];
  return keys[index] || "N/A";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Debug failed:", error);
    process.exit(1);
  });