const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying contracts to Hardhat network...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy MockToken first
  console.log("\n📦 Deploying MockToken...");
  const MockToken = await ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy();
  
  // Wait for deployment
  await mockToken.waitForDeployment();
  
  const mockTokenAddress = await mockToken.getAddress();
  console.log("✅ MockToken deployed to:", mockTokenAddress);
  
  // Get MockToken info
  try {
    const name = await mockToken.name();
    const symbol = await mockToken.symbol();
    const totalSupply = await mockToken.totalSupply();
    
    console.log("\n📋 MockToken Configuration:");
    console.log("Name:", name);
    console.log("Symbol:", symbol);
    console.log("Total Supply:", ethers.formatEther(totalSupply));
  } catch (error) {
    console.log("Could not fetch token info:", error.message);
  }
  
  // Deploy LoanContract with MockToken address
  console.log("\n📦 Deploying LoanContract...");
  const LoanContract = await ethers.getContractFactory("LoanContract");
  const loanContract = await LoanContract.deploy(mockTokenAddress);
  
  // Wait for deployment
  await loanContract.waitForDeployment();
  
  const contractAddress = await loanContract.getAddress();
  console.log("✅ LoanContract deployed to:", contractAddress);
  
  // Get contract constants
  try {
    const collateralRatio = await loanContract.COLLATERAL_RATIO();
    const interestRate = await loanContract.INTEREST_RATE();
    const loanDuration = await loanContract.LOAN_DURATION();
    
    console.log("\n📋 LoanContract Configuration:");
    console.log("Collateral Ratio:", collateralRatio.toString() + "%");
    console.log("Interest Rate:", interestRate.toString() + "%");
    console.log("Loan Duration:", loanDuration.toString(), "seconds");
  } catch (error) {
    console.log("Could not fetch contract constants:", error.message);
  }
  
  // Transfer MockDAI tokens to LoanContract for lending
  console.log("\n💰 Transferring MockDAI to LoanContract...");
  const transferAmount = ethers.parseEther("500000"); // Transfer 500,000 mDAI (half of total supply)
  const transferTx = await mockToken.transfer(contractAddress, transferAmount);
  await transferTx.wait();
  
  const loanContractBalance = await mockToken.balanceOf(contractAddress);
  console.log("✅ LoanContract MockDAI balance:", ethers.formatEther(loanContractBalance), "mDAI");
  
  const deployerBalance = await mockToken.balanceOf(deployer.address);
  console.log("✅ Deployer MockDAI balance:", ethers.formatEther(deployerBalance), "mDAI");
  
  // Create .env file with contract addresses
  const envContent = `# Contract deployment
REACT_APP_CONTRACT_ADDRESS=${contractAddress}
REACT_APP_MOCK_TOKEN_ADDRESS=${mockTokenAddress}

# Network configuration
REACT_APP_NETWORK_NAME=hardhat
REACT_APP_NETWORK_ID=31337

# Sepolia testnet configuration (for production)
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
`;

  require('fs').writeFileSync('.env', envContent);
  console.log("✅ Created .env file with contract address");
  
  console.log("\n🎉 Deployment complete!");
  console.log("📝 Next steps:");
  console.log("1. Restart your React app to load the new contract address");
  console.log("2. Make sure MetaMask is connected to Hardhat Local network");
  console.log("3. Import test accounts using the private keys from 'npx hardhat node'");
  console.log("4. Start testing your dApp!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });