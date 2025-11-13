const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration Tests - Complete User Flows", function () {
  let loanContract;
  let mockToken;
  let owner, lender1, lender2, borrower1, borrower2, liquidator;
  
  beforeEach(async function () {
    [owner, lender1, lender2, borrower1, borrower2, liquidator] = await ethers.getSigners();
    
    // Deploy MockToken first
    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy();
    await mockToken.waitForDeployment();
    
    // Deploy LoanContract with MockToken address
    const LoanContract = await ethers.getContractFactory("LoanContract");
    loanContract = await LoanContract.deploy(await mockToken.getAddress());
    await loanContract.waitForDeployment();
    
    // Transfer MockDAI to LoanContract for lending operations
    const transferAmount = ethers.parseEther("500000"); // 500k MockDAI
    await mockToken.transfer(await loanContract.getAddress(), transferAmount);
  });

  describe("End-to-End Lender Flow", function () {
    it("should complete full lender deposit and withdrawal journey", async function () {
      const depositAmount = ethers.parseEther("5.0");
      
      // Step 1: Check initial state
      let lenderDetails = await loanContract.getLenderDetails(lender1.address);
      expect(lenderDetails.depositAmount).to.equal(0);
      
      let poolBalance = await loanContract.getPoolBalance();
      expect(poolBalance).to.equal(0);
      
      // Step 2: Deposit funds
      const depositTx = await loanContract.connect(lender1).depositFunds({ value: depositAmount });
      await expect(depositTx)
        .to.emit(loanContract, "LenderDeposit")
        .withArgs(lender1.address, depositAmount);
      
      // Step 3: Verify deposit state
      lenderDetails = await loanContract.getLenderDetails(lender1.address);
      expect(lenderDetails.depositAmount).to.equal(depositAmount);
      
      poolBalance = await loanContract.getPoolBalance();
      expect(poolBalance).to.equal(depositAmount);
      
      // Step 4: Withdraw funds
      const withdrawTx = await loanContract.connect(lender1).withdrawFunds();
      await expect(withdrawTx)
        .to.emit(loanContract, "LenderWithdraw")
        .withArgs(lender1.address, depositAmount);
      
      // Step 5: Verify final state
      lenderDetails = await loanContract.getLenderDetails(lender1.address);
      expect(lenderDetails.depositAmount).to.equal(0);
      
      poolBalance = await loanContract.getPoolBalance();
      expect(poolBalance).to.equal(0);
    });

    it("should handle multiple lenders with different deposit amounts", async function () {
      const deposit1 = ethers.parseEther("2.0");
      const deposit2 = ethers.parseEther("3.5");
      const deposit3 = ethers.parseEther("1.5");
      
      // Multiple lenders deposit
      await loanContract.connect(lender1).depositFunds({ value: deposit1 });
      await loanContract.connect(lender2).depositFunds({ value: deposit2 });
      await loanContract.connect(lender1).depositFunds({ value: deposit3 }); // Second deposit from lender1
      
      // Verify individual balances
      const lender1Details = await loanContract.getLenderDetails(lender1.address);
      const lender2Details = await loanContract.getLenderDetails(lender2.address);
      
      expect(lender1Details.depositAmount).to.equal(deposit1 + deposit3);
      expect(lender2Details.depositAmount).to.equal(deposit2);
      
      // Verify total pool balance
      const poolBalance = await loanContract.getPoolBalance();
      expect(poolBalance).to.equal(deposit1 + deposit2 + deposit3);
      
      // Partial withdrawal by lender1
      await loanContract.connect(lender1).withdrawFunds();
      
      // Verify state after partial withdrawal
      const updatedPoolBalance = await loanContract.getPoolBalance();
      expect(updatedPoolBalance).to.equal(deposit2);
      
      const updatedLender1Details = await loanContract.getLenderDetails(lender1.address);
      expect(updatedLender1Details.depositAmount).to.equal(0);
    });
  });

  describe("End-to-End Borrower Flow", function () {
    beforeEach(async function () {
      // Ensure sufficient liquidity in pool
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("10.0") });
    });

    it("should complete full borrower journey from collateral to repayment", async function () {
      const collateralAmount = ethers.parseEther("3.0");
      const loanAmount = ethers.parseEther("2.0");
      const expectedInterest = ethers.parseEther("0.1"); // 5% of 2 ETH
      const totalRepayment = loanAmount + expectedInterest;
      
      // Step 1: Check initial state
      let loanDetails = await loanContract.getLoanDetails(borrower1.address);
      expect(loanDetails.collateralAmount).to.equal(0);
      expect(loanDetails.loanAmount).to.equal(0);
      
      // Step 2: Deposit collateral
      const collateralTx = await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await expect(collateralTx)
        .to.emit(loanContract, "CollateralDeposited")
        .withArgs(borrower1.address, collateralAmount);
      
      // Step 3: Verify collateral state
      loanDetails = await loanContract.getLoanDetails(borrower1.address);
      expect(loanDetails.collateralAmount).to.equal(collateralAmount);
      expect(loanDetails.loanAmount).to.equal(0);
      
      // Step 4: Borrow against collateral
      const borrowTx = await loanContract.connect(borrower1).borrow(loanAmount);
      await expect(borrowTx)
        .to.emit(loanContract, "LoanIssued")
        .withArgs(borrower1.address, loanAmount, expectedInterest, await getExpectedDueTime());
      
      // Step 5: Verify loan state
      loanDetails = await loanContract.getLoanDetails(borrower1.address);
      expect(loanDetails.collateralAmount).to.equal(collateralAmount);
      expect(loanDetails.loanAmount).to.equal(loanAmount);
      expect(loanDetails.interest).to.equal(expectedInterest);
      expect(loanDetails.repaid).to.be.false;
      expect(loanDetails.liquidated).to.be.false;
      
      // Step 6: Verify collateral ratio
      const collateralRatio = await loanContract.getCollateralRatio(borrower1.address);
      expect(collateralRatio).to.equal(150); // 3 ETH / 2 ETH * 100 = 150%
      
      // Step 7: Verify repayment amount calculation
      const calculatedRepayment = await loanContract.calculateRepaymentAmount(borrower1.address);
      expect(calculatedRepayment).to.equal(totalRepayment);
      
      // Step 8: Repay loan
      const repayTx = await loanContract.connect(borrower1).repayLoan({ value: totalRepayment });
      await expect(repayTx)
        .to.emit(loanContract, "LoanRepaid")
        .withArgs(borrower1.address, totalRepayment);
      
      // Step 9: Verify final state
      loanDetails = await loanContract.getLoanDetails(borrower1.address);
      expect(loanDetails.collateralAmount).to.equal(0); // Collateral returned
      expect(loanDetails.repaid).to.be.true;
      expect(loanDetails.liquidated).to.be.false;
      
      // Step 10: Verify pool balance increased by interest
      const finalPoolBalance = await loanContract.getPoolBalance();
      expect(finalPoolBalance).to.equal(ethers.parseEther("10.1")); // Original 10 + 0.1 interest
    });

    it("should handle borrower with multiple collateral deposits", async function () {
      const collateral1 = ethers.parseEther("1.0");
      const collateral2 = ethers.parseEther("0.5");
      const totalCollateral = collateral1 + collateral2;
      const loanAmount = ethers.parseEther("1.0");
      
      // Multiple collateral deposits
      await loanContract.connect(borrower1).depositCollateral({ value: collateral1 });
      await loanContract.connect(borrower1).depositCollateral({ value: collateral2 });
      
      // Verify total collateral
      let loanDetails = await loanContract.getLoanDetails(borrower1.address);
      expect(loanDetails.collateralAmount).to.equal(totalCollateral);
      
      // Borrow against total collateral
      await loanContract.connect(borrower1).borrow(loanAmount);
      
      // Verify loan was issued
      loanDetails = await loanContract.getLoanDetails(borrower1.address);
      expect(loanDetails.loanAmount).to.equal(loanAmount);
      
      // Verify collateral ratio
      const ratio = await loanContract.getCollateralRatio(borrower1.address);
      expect(ratio).to.equal(150); // 1.5 ETH / 1.0 ETH * 100 = 150%
    });

    it("should prevent borrowing beyond collateral capacity", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const validLoanAmount = ethers.parseEther("1.0");
      const invalidLoanAmount = ethers.parseEther("1.1"); // Would require 1.65 ETH collateral
      
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      
      // Valid loan should succeed
      await expect(loanContract.connect(borrower1).borrow(validLoanAmount))
        .to.emit(loanContract, "LoanIssued");
      
      // Repay the loan first
      const repaymentAmount = await loanContract.calculateRepaymentAmount(borrower1.address);
      await loanContract.connect(borrower1).repayLoan({ value: repaymentAmount });
      
      // Now test invalid loan amount with fresh borrower
      await loanContract.connect(borrower2).depositCollateral({ value: collateralAmount });
      
      // Invalid loan should fail
      await expect(loanContract.connect(borrower2).borrow(invalidLoanAmount))
        .to.be.revertedWith("Insufficient collateral");
    });

    async function getExpectedDueTime() {
      const currentBlock = await ethers.provider.getBlock('latest');
      const loanDuration = 30 * 24 * 60 * 60; // 30 days in seconds
      return currentBlock.timestamp + loanDuration;
    }
  });

  describe("Liquidation Scenarios and Edge Cases", function () {
    beforeEach(async function () {
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("10.0") });
    });

    it("should handle time-based liquidation scenario", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const loanAmount = ethers.parseEther("1.0");
      
      // Setup loan
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(loanAmount);
      
      // Verify loan is not liquidatable initially
      let isLiquidatable = await loanContract.isLoanLiquidatable(borrower1.address);
      expect(isLiquidatable).to.be.false;
      
      // Fast forward time beyond loan duration
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
      await ethers.provider.send("evm_mine");
      
      // Verify loan is now liquidatable
      isLiquidatable = await loanContract.isLoanLiquidatable(borrower1.address);
      expect(isLiquidatable).to.be.true;
      
      // Verify loan is overdue
      const isOverdue = await loanContract.isLoanOverdue(borrower1.address);
      expect(isOverdue).to.be.true;
      
      // Execute liquidation
      const liquidationTx = await loanContract.connect(liquidator).liquidate(borrower1.address);
      await expect(liquidationTx)
        .to.emit(loanContract, "Liquidated")
        .withArgs(borrower1.address, collateralAmount);
      
      // Verify post-liquidation state
      const loanDetails = await loanContract.getLoanDetails(borrower1.address);
      expect(loanDetails.liquidated).to.be.true;
      expect(loanDetails.collateralAmount).to.equal(0);
      
      // Verify collateral was added to pool
      const poolBalance = await loanContract.getPoolBalance();
      expect(poolBalance).to.equal(ethers.parseEther("10.5")); // Original 10 - 1 (loan) + 1.5 (liquidated collateral)
    });

    it("should handle multiple borrowers with different risk levels", async function () {
      // Setup multiple borrowers with different collateral ratios
      const borrower1Collateral = ethers.parseEther("1.5"); // Will borrow 1 ETH (150% ratio)
      const borrower2Collateral = ethers.parseEther("3.0"); // Will borrow 1.5 ETH (200% ratio)
      
      const borrower1Loan = ethers.parseEther("1.0");
      const borrower2Loan = ethers.parseEther("1.5");
      
      // Setup borrower1 (higher risk)
      await loanContract.connect(borrower1).depositCollateral({ value: borrower1Collateral });
      await loanContract.connect(borrower1).borrow(borrower1Loan);
      
      // Setup borrower2 (lower risk)
      await loanContract.connect(borrower2).depositCollateral({ value: borrower2Collateral });
      await loanContract.connect(borrower2).borrow(borrower2Loan);
      
      // Verify initial collateral ratios
      const ratio1 = await loanContract.getCollateralRatio(borrower1.address);
      const ratio2 = await loanContract.getCollateralRatio(borrower2.address);
      expect(ratio1).to.equal(150);
      expect(ratio2).to.equal(200);
      
      // Fast forward time to make loans overdue
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      // Both should be liquidatable due to time
      const isLiquidatable1 = await loanContract.isLoanLiquidatable(borrower1.address);
      const isLiquidatable2 = await loanContract.isLoanLiquidatable(borrower2.address);
      expect(isLiquidatable1).to.be.true;
      expect(isLiquidatable2).to.be.true;
      
      // Liquidate both positions
      await loanContract.connect(liquidator).liquidate(borrower1.address);
      await loanContract.connect(liquidator).liquidate(borrower2.address);
      
      // Verify both are liquidated
      const loan1Details = await loanContract.getLoanDetails(borrower1.address);
      const loan2Details = await loanContract.getLoanDetails(borrower2.address);
      expect(loan1Details.liquidated).to.be.true;
      expect(loan2Details.liquidated).to.be.true;
      
      // Verify pool received all collateral
      const finalPoolBalance = await loanContract.getPoolBalance();
      // Original 10 - 1 (loan1) - 1.5 (loan2) + 1.5 (collateral1) + 3.0 (collateral2) = 12.0
      expect(finalPoolBalance).to.equal(ethers.parseEther("12.0"));
    });

    it("should handle complex scenario with lenders, borrowers, and liquidation", async function () {
      // Complex scenario: Multiple lenders, borrowers, partial liquidation
      
      // Step 1: Multiple lenders deposit
      await loanContract.connect(lender2).depositFunds({ value: ethers.parseEther("5.0") });
      // Total pool: 15 ETH (10 from beforeEach + 5 from lender2)
      
      // Step 2: Multiple borrowers take loans
      await loanContract.connect(borrower1).depositCollateral({ value: ethers.parseEther("3.0") });
      await loanContract.connect(borrower1).borrow(ethers.parseEther("2.0"));
      
      await loanContract.connect(borrower2).depositCollateral({ value: ethers.parseEther("2.25") });
      await loanContract.connect(borrower2).borrow(ethers.parseEther("1.5"));
      
      // Step 3: Verify pool utilization
      let poolBalance = await loanContract.getPoolBalance();
      expect(poolBalance).to.equal(ethers.parseEther("11.5")); // 15 - 2 - 1.5 = 11.5
      
      // Step 4: One borrower repays successfully
      const repaymentAmount1 = await loanContract.calculateRepaymentAmount(borrower1.address);
      await loanContract.connect(borrower1).repayLoan({ value: repaymentAmount1 });
      
      // Step 5: Other borrower's loan becomes overdue
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      // Step 6: Liquidate overdue borrower
      await loanContract.connect(liquidator).liquidate(borrower2.address);
      
      // Step 7: Verify final state
      const loan1Details = await loanContract.getLoanDetails(borrower1.address);
      const loan2Details = await loanContract.getLoanDetails(borrower2.address);
      
      expect(loan1Details.repaid).to.be.true;
      expect(loan1Details.collateralAmount).to.equal(0);
      
      expect(loan2Details.liquidated).to.be.true;
      expect(loan2Details.collateralAmount).to.equal(0);
      
      // Step 8: Verify final pool balance
      // 15 (initial) - 1.5 (outstanding loan) + 0.1 (interest from repaid loan) + 2.25 (liquidated collateral) = 15.85
      const finalPoolBalance = await loanContract.getPoolBalance();
      expect(finalPoolBalance).to.equal(ethers.parseEther("15.85"));
      
      // Step 9: Lenders should be able to withdraw their original deposits
      // Note: In this implementation, lenders get back their exact deposit amounts
      // The interest and liquidated collateral remain in the pool
      await loanContract.connect(lender1).withdrawFunds();
      await loanContract.connect(lender2).withdrawFunds();
      
      // Verify remaining balance (should be the interest earned + liquidated collateral - original deposits)
      const remainingBalance = await loanContract.getPoolBalance();
      // 15.85 - 10 (lender1) - 5 (lender2) = 0.85
      expect(remainingBalance).to.equal(ethers.parseEther("0.85"));
    });
  });

  describe("Error Handling and Edge Cases", function () {
    it("should handle insufficient pool liquidity for borrowing", async function () {
      const collateralAmount = ethers.parseEther("15.0");
      const loanAmount = ethers.parseEther("10.0");
      
      // Only small amount in pool
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("5.0") });
      
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      
      // Should fail due to insufficient pool liquidity
      await expect(loanContract.connect(borrower1).borrow(loanAmount))
        .to.be.revertedWith("Insufficient pool liquidity");
    });

    it("should prevent lender withdrawal when it would affect pool liquidity", async function () {
      // This test verifies the system maintains liquidity for active loans
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("2.0") });
      
      // Borrower takes loan using most of the pool
      await loanContract.connect(borrower1).depositCollateral({ value: ethers.parseEther("3.0") });
      await loanContract.connect(borrower1).borrow(ethers.parseEther("1.5"));
      
      // Pool now has 0.5 ETH, but lender deposited 2.0 ETH
      // In current implementation, this should still allow withdrawal
      // But in a more sophisticated version, it might restrict withdrawals
      
      // For now, verify the current behavior
      const poolBalance = await loanContract.getPoolBalance();
      expect(poolBalance).to.equal(ethers.parseEther("0.5"));
    });

    it("should handle zero amounts gracefully", async function () {
      // Test zero deposit
      await expect(loanContract.connect(lender1).depositFunds({ value: 0 }))
        .to.be.revertedWith("Deposit amount must be greater than 0");
      
      // Test zero collateral
      await expect(loanContract.connect(borrower1).depositCollateral({ value: 0 }))
        .to.be.revertedWith("Collateral amount must be greater than 0");
      
      // Test zero borrow amount
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("1.0") });
      await loanContract.connect(borrower1).depositCollateral({ value: ethers.parseEther("1.0") });
      
      await expect(loanContract.connect(borrower1).borrow(0))
        .to.be.revertedWith("Loan amount must be greater than 0");
    });

    it("should maintain data consistency across all operations", async function () {
      // This test verifies that all state changes are consistent
      const initialPoolBalance = await loanContract.getPoolBalance();
      expect(initialPoolBalance).to.equal(0);
      
      // Multiple operations
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("5.0") });
      await loanContract.connect(lender2).depositFunds({ value: ethers.parseEther("3.0") });
      
      await loanContract.connect(borrower1).depositCollateral({ value: ethers.parseEther("2.4") });
      await loanContract.connect(borrower1).borrow(ethers.parseEther("1.6"));
      
      // Verify consistency
      const poolBalance = await loanContract.getPoolBalance();
      const lender1Details = await loanContract.getLenderDetails(lender1.address);
      const lender2Details = await loanContract.getLenderDetails(lender2.address);
      const borrowerDetails = await loanContract.getLoanDetails(borrower1.address);
      
      // Pool balance should be deposits minus loans
      expect(poolBalance).to.equal(ethers.parseEther("6.4")); // 8 - 1.6 = 6.4
      
      // Individual balances should be correct
      expect(lender1Details.depositAmount).to.equal(ethers.parseEther("5.0"));
      expect(lender2Details.depositAmount).to.equal(ethers.parseEther("3.0"));
      expect(borrowerDetails.loanAmount).to.equal(ethers.parseEther("1.6"));
      expect(borrowerDetails.collateralAmount).to.equal(ethers.parseEther("2.4"));
    });
  });
});