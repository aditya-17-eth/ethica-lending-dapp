const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LoanContract", function () {
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

  describe("Lender Operations", function () {
    it("should allow ETH deposits to pool", async function () {
      const depositAmount = ethers.parseEther("1.0");
      
      await expect(loanContract.connect(lender1).depositFunds({ value: depositAmount }))
        .to.emit(loanContract, "LenderDeposit")
        .withArgs(lender1.address, depositAmount);
      
      const lenderDetails = await loanContract.getLenderDetails(lender1.address);
      expect(lenderDetails.depositAmount).to.equal(depositAmount);
      
      const poolBalance = await loanContract.getPoolBalance();
      expect(poolBalance).to.equal(depositAmount);
    });

    it("should allow multiple deposits from same lender", async function () {
      const deposit1 = ethers.parseEther("1.0");
      const deposit2 = ethers.parseEther("0.5");
      
      await loanContract.connect(lender1).depositFunds({ value: deposit1 });
      await loanContract.connect(lender1).depositFunds({ value: deposit2 });
      
      const lenderDetails = await loanContract.getLenderDetails(lender1.address);
      expect(lenderDetails.depositAmount).to.equal(deposit1 + deposit2);
    });

    it("should allow withdrawal of deposited funds", async function () {
      const depositAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(lender1).depositFunds({ value: depositAmount });
      
      await expect(loanContract.connect(lender1).withdrawFunds())
        .to.emit(loanContract, "LenderWithdraw")
        .withArgs(lender1.address, depositAmount);
      
      const lenderDetails = await loanContract.getLenderDetails(lender1.address);
      expect(lenderDetails.depositAmount).to.equal(0);
    });

    it("should reject withdrawal with no deposits", async function () {
      await expect(loanContract.connect(lender1).withdrawFunds())
        .to.be.revertedWith("No funds to withdraw");
    });
  });

  describe("Borrower Operations", function () {
    beforeEach(async function () {
      // Add liquidity to pool
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("10.0") });
    });

    it("should accept collateral deposits", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      
      await expect(loanContract.connect(borrower1).depositCollateral({ value: collateralAmount }))
        .to.emit(loanContract, "CollateralDeposited")
        .withArgs(borrower1.address, collateralAmount);
      
      const loanDetails = await loanContract.getLoanDetails(borrower1.address);
      expect(loanDetails.collateralAmount).to.equal(collateralAmount);
    });

    it("should enforce 150% collateral ratio for borrowing", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      
      await expect(loanContract.connect(borrower1).borrow(mockDaiLoanAmount))
        .to.emit(loanContract, "LoanIssued");
      
      const loanDetails = await loanContract.getLoanDetails(borrower1.address);
      expect(loanDetails.loanAmount).to.equal(mockDaiLoanAmount);
      expect(loanDetails.interest).to.equal(ethers.parseEther("0.05")); // 5% of 1 MockDAI
      
      // Verify borrower received MockDAI
      const borrowerBalance = await mockToken.balanceOf(borrower1.address);
      expect(borrowerBalance).to.equal(mockDaiLoanAmount);
    });

    it("should reject borrowing with insufficient collateral", async function () {
      const collateralAmount = ethers.parseEther("1.0");
      const mockDaiLoanAmount = ethers.parseEther("1.0"); // Would require 1.5 ETH collateral
      
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      
      await expect(loanContract.connect(borrower1).borrow(mockDaiLoanAmount))
        .to.be.revertedWith("Insufficient collateral");
    });

    it("should prevent borrowing with existing active loan", async function () {
      const collateralAmount = ethers.parseEther("3.0");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      await expect(loanContract.connect(borrower1).borrow(mockDaiLoanAmount))
        .to.be.revertedWith("Active loan already exists");
    });

    it("should allow loan repayment and collateral return", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      const interest = ethers.parseEther("0.05");
      const totalRepayment = mockDaiLoanAmount + interest;
      
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      // Transfer additional MockDAI to borrower to cover interest
      await mockToken.transfer(borrower1.address, interest);
      
      // Approve LoanContract to spend MockDAI for repayment
      await mockToken.connect(borrower1).approve(await loanContract.getAddress(), totalRepayment);
      
      await expect(loanContract.connect(borrower1).repayLoan(totalRepayment))
        .to.emit(loanContract, "LoanRepaid")
        .withArgs(borrower1.address, totalRepayment);
      
      const loanDetails = await loanContract.getLoanDetails(borrower1.address);
      expect(loanDetails.repaid).to.be.true;
      expect(loanDetails.collateralAmount).to.equal(0);
    });
  });

  describe("Liquidation Mechanics", function () {
    beforeEach(async function () {
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("10.0") });
    });

    it("should allow liquidation of overdue loans", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      // Fast forward time beyond loan duration
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
      await ethers.provider.send("evm_mine");
      
      await expect(loanContract.connect(liquidator).liquidate(borrower1.address))
        .to.emit(loanContract, "Liquidated")
        .withArgs(borrower1.address, collateralAmount);
      
      const loanDetails = await loanContract.getLoanDetails(borrower1.address);
      expect(loanDetails.liquidated).to.be.true;
      expect(loanDetails.collateralAmount).to.equal(0);
    });

    it("should reject liquidation of healthy loans", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      await expect(loanContract.connect(liquidator).liquidate(borrower1.address))
        .to.be.revertedWith("Loan cannot be liquidated");
    });
  });

  describe("View Functions", function () {
    it("should return correct pool balance", async function () {
      const depositAmount = ethers.parseEther("5.0");
      await loanContract.connect(lender1).depositFunds({ value: depositAmount });
      
      const poolBalance = await loanContract.getPoolBalance();
      expect(poolBalance).to.equal(depositAmount);
    });

    it("should calculate correct repayment amount", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("10.0") });
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      const repaymentAmount = await loanContract.calculateRepaymentAmount(borrower1.address);
      expect(repaymentAmount).to.equal(ethers.parseEther("1.05")); // 1 MockDAI + 5% interest
    });

    it("should return correct collateral ratio", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("10.0") });
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      const ratio = await loanContract.getCollateralRatio(borrower1.address);
      expect(ratio).to.equal(150); // 150%
    });
  });

  describe("Edge Cases", function () {
    it("should handle multiple lenders correctly", async function () {
      const deposit1 = ethers.parseEther("2.0");
      const deposit2 = ethers.parseEther("3.0");
      
      await loanContract.connect(lender1).depositFunds({ value: deposit1 });
      await loanContract.connect(lender2).depositFunds({ value: deposit2 });
      
      const poolBalance = await loanContract.getPoolBalance();
      expect(poolBalance).to.equal(deposit1 + deposit2);
      
      const lender1Details = await loanContract.getLenderDetails(lender1.address);
      const lender2Details = await loanContract.getLenderDetails(lender2.address);
      
      expect(lender1Details.depositAmount).to.equal(deposit1);
      expect(lender2Details.depositAmount).to.equal(deposit2);
    });

    it("should prevent double borrowing", async function () {
      const collateralAmount = ethers.parseEther("3.0");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("10.0") });
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      await expect(loanContract.connect(borrower1).borrow(mockDaiLoanAmount))
        .to.be.revertedWith("Active loan already exists");
    });

    it("should reject repayment of non-existent loan", async function () {
      await expect(loanContract.connect(borrower1).repayLoan(ethers.parseEther("1.0")))
        .to.be.revertedWith("No active loan");
    });
  });
});