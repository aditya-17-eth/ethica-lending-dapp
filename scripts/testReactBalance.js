const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing Balance Fetching (React Style)...\n");

    // Simulate what the React app should be doing
    const testAccount = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

    console.log("Testing account:", testAccount);

    try {
        // Test with JsonRpcProvider (like React app)
        const provider = new ethers.JsonRpcProvider("http://localhost:8545");
        const balance = await provider.getBalance(testAccount);
        const balanceEth = ethers.formatEther(balance);

        console.log("✅ Balance fetch successful:");
        console.log("   Raw balance (Wei):", balance.toString());
        console.log("   Formatted balance:", balanceEth, "ETH");

        // Test network info
        const network = await provider.getNetwork();
        console.log("   Network Chain ID:", network.chainId.toString());

    } catch (error) {
        console.log("❌ Balance fetch failed:", error.message);
    }

    console.log("\n🔍 Environment Variables:");
    console.log("REACT_APP_CONTRACT_ADDRESS:", process.env.REACT_APP_CONTRACT_ADDRESS || "Not set");

    console.log("\n💡 If React app shows 0 balance:");
    console.log("1. Check browser console for errors");
    console.log("2. Verify MetaMask is connected to correct account");
    console.log("3. Make sure chain ID is 31337 (Hardhat Local)");
    console.log("4. Try hard refresh (Ctrl+F5)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });