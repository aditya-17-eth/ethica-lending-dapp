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
      
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      // Transfer additional MockDAI to borrower to cover interest
      await mockToken.transfer(borrower1.address, interest);
      
      // Approve LoanContract to spend MockDAI for repayment (only principal is required)
      await mockToken.connect(borrower1).approve(await loanContract.getAddress(), mockDaiLoanAmount + interest);
      
      // The event emits only the principal amount, not the total with interest
      await expect(loanContract.connect(borrower1).repayLoan(mockDaiLoanAmount + interest))
        .to.emit(loanContract, "LoanRepaid")
        .withArgs(borrower1.address, mockDaiLoanAmount);
      
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

  describe("Interest Distribution", function () {
    it("should track totalInterestEarned when loan is repaid", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("10.0") });
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      // Calculate expected interest (5% of collateral)
      const expectedInterest = (collateralAmount * BigInt(5)) / BigInt(100);
      
      // Approve and repay loan
      const totalRepayment = mockDaiLoanAmount + ethers.parseEther("0.05");
      await mockToken.transfer(borrower1.address, ethers.parseEther("0.05"));
      await mockToken.connect(borrower1).approve(await loanContract.getAddress(), totalRepayment);
      await loanContract.connect(borrower1).repayLoan(totalRepayment);
      
      // Verify totalInterestEarned increased
      const totalInterestEarned = await loanContract.totalInterestEarned();
      expect(totalInterestEarned).to.equal(expectedInterest);
    });

    it("should distribute proportional interest to single lender", async function () {
      const depositAmount = ethers.parseEther("10.0");
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(lender1).depositFunds({ value: depositAmount });
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      // Repay loan
      const totalRepayment = mockDaiLoanAmount + ethers.parseEther("0.05");
      await mockToken.transfer(borrower1.address, ethers.parseEther("0.05"));
      await mockToken.connect(borrower1).approve(await loanContract.getAddress(), totalRepayment);
      await loanContract.connect(borrower1).repayLoan(totalRepayment);
      
      // Calculate expected interest
      const expectedInterest = (collateralAmount * BigInt(5)) / BigInt(100);
      
      // Lender withdraws and should receive principal + all interest
      const initialBalance = await ethers.provider.getBalance(lender1.address);
      const tx = await loanContract.connect(lender1).withdrawFunds();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(lender1.address);
      
      const expectedWithdrawal = depositAmount + expectedInterest;
      const actualReceived = finalBalance - initialBalance + gasUsed;
      
      expect(actualReceived).to.be.closeTo(expectedWithdrawal, ethers.parseEther("0.001"));
    });

    it("should distribute proportional interest to multiple lenders", async function () {
      const deposit1 = ethers.parseEther("6.0");
      const deposit2 = ethers.parseEther("4.0");
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      // Two lenders deposit (60% and 40% split)
      await loanContract.connect(lender1).depositFunds({ value: deposit1 });
      await loanContract.connect(lender2).depositFunds({ value: deposit2 });
      
      // Borrower takes loan and repays
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      const totalRepayment = mockDaiLoanAmount + ethers.parseEther("0.05");
      await mockToken.transfer(borrower1.address, ethers.parseEther("0.05"));
      await mockToken.connect(borrower1).approve(await loanContract.getAddress(), totalRepayment);
      await loanContract.connect(borrower1).repayLoan(totalRepayment);
      
      // Calculate expected interest
      const totalInterest = (collateralAmount * BigInt(5)) / BigInt(100);
      const totalDeposited = deposit1 + deposit2;
      const lender1Interest = (totalInterest * deposit1) / totalDeposited;
      const lender2Interest = (totalInterest * deposit2) / totalDeposited;
      
      // Lender1 withdraws (should get 60% of interest)
      const lender1InitialBalance = await ethers.provider.getBalance(lender1.address);
      const tx1 = await loanContract.connect(lender1).withdrawFunds();
      const receipt1 = await tx1.wait();
      const gasUsed1 = receipt1.gasUsed * receipt1.gasPrice;
      const lender1FinalBalance = await ethers.provider.getBalance(lender1.address);
      
      const lender1Expected = deposit1 + lender1Interest;
      const lender1Received = lender1FinalBalance - lender1InitialBalance + gasUsed1;
      
      expect(lender1Received).to.be.closeTo(lender1Expected, ethers.parseEther("0.001"));
      
      // Lender2 withdraws (should get 40% of interest)
      const lender2InitialBalance = await ethers.provider.getBalance(lender2.address);
      const tx2 = await loanContract.connect(lender2).withdrawFunds();
      const receipt2 = await tx2.wait();
      const gasUsed2 = receipt2.gasUsed * receipt2.gasPrice;
      const lender2FinalBalance = await ethers.provider.getBalance(lender2.address);
      
      const lender2Expected = deposit2 + lender2Interest;
      const lender2Received = lender2FinalBalance - lender2InitialBalance + gasUsed2;
      
      expect(lender2Received).to.be.closeTo(lender2Expected, ethers.parseEther("0.001"));
    });

    it("should handle edge case with multiple loans and multiple lenders", async function () {
      const deposit1 = ethers.parseEther("5.0");
      const deposit2 = ethers.parseEther("5.0");
      
      await loanContract.connect(lender1).depositFunds({ value: deposit1 });
      await loanContract.connect(lender2).depositFunds({ value: deposit2 });
      
      // First borrower takes loan and repays
      const collateral1 = ethers.parseEther("1.5");
      const loan1 = ethers.parseEther("1.0");
      await loanContract.connect(borrower1).depositCollateral({ value: collateral1 });
      await loanContract.connect(borrower1).borrow(loan1);
      
      await mockToken.transfer(borrower1.address, ethers.parseEther("0.05"));
      await mockToken.connect(borrower1).approve(await loanContract.getAddress(), loan1 + ethers.parseEther("0.05"));
      await loanContract.connect(borrower1).repayLoan(loan1 + ethers.parseEther("0.05"));
      
      // Second borrower takes loan and repays
      const collateral2 = ethers.parseEther("3.0");
      const loan2 = ethers.parseEther("2.0");
      await loanContract.connect(borrower2).depositCollateral({ value: collateral2 });
      await loanContract.connect(borrower2).borrow(loan2);
      
      await mockToken.transfer(borrower2.address, ethers.parseEther("0.1"));
      await mockToken.connect(borrower2).approve(await loanContract.getAddress(), loan2 + ethers.parseEther("0.1"));
      await loanContract.connect(borrower2).repayLoan(loan2 + ethers.parseEther("0.1"));
      
      // Calculate total interest from both loans
      const interest1 = (collateral1 * BigInt(5)) / BigInt(100);
      const interest2 = (collateral2 * BigInt(5)) / BigInt(100);
      const totalInterest = interest1 + interest2;
      
      // Each lender should get 50% of total interest
      const expectedInterestPerLender = totalInterest / BigInt(2);
      
      // Verify lender1 receives correct amount
      const lender1InitialBalance = await ethers.provider.getBalance(lender1.address);
      const tx1 = await loanContract.connect(lender1).withdrawFunds();
      const receipt1 = await tx1.wait();
      const gasUsed1 = receipt1.gasUsed * receipt1.gasPrice;
      const lender1FinalBalance = await ethers.provider.getBalance(lender1.address);
      
      const lender1Expected = deposit1 + expectedInterestPerLender;
      const lender1Received = lender1FinalBalance - lender1InitialBalance + gasUsed1;
      
      expect(lender1Received).to.be.closeTo(lender1Expected, ethers.parseEther("0.001"));
    });
  });

  describe("Collateral Removal", function () {
    it("should allow collateral removal when no active loan", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      
      await expect(loanContract.connect(borrower1).removeCollateral())
        .to.emit(loanContract, "CollateralRemoved")
        .withArgs(borrower1.address, collateralAmount);
      
      const loanDetails = await loanContract.getLoanDetails(borrower1.address);
      expect(loanDetails.collateralAmount).to.equal(0);
    });

    it("should reject collateral removal when active loan exists", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("10.0") });
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      await expect(loanContract.connect(borrower1).removeCollateral())
        .to.be.revertedWith("Active loan exists");
    });

    it("should allow collateral removal after loan is repaid", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("10.0") });
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      // Repay loan
      const totalRepayment = mockDaiLoanAmount + ethers.parseEther("0.05");
      await mockToken.transfer(borrower1.address, ethers.parseEther("0.05"));
      await mockToken.connect(borrower1).approve(await loanContract.getAddress(), totalRepayment);
      await loanContract.connect(borrower1).repayLoan(totalRepayment);
      
      // Now deposit more collateral
      const additionalCollateral = ethers.parseEther("2.0");
      await loanContract.connect(borrower1).depositCollateral({ value: additionalCollateral });
      
      // Should be able to remove collateral
      await expect(loanContract.connect(borrower1).removeCollateral())
        .to.emit(loanContract, "CollateralRemoved")
        .withArgs(borrower1.address, additionalCollateral);
    });

    it("should reject collateral removal when no collateral deposited", async function () {
      await expect(loanContract.connect(borrower1).removeCollateral())
        .to.be.revertedWith("No collateral to remove");
    });

    it("should allow collateral removal after loan is liquidated", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("10.0") });
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      // Fast forward time to make loan overdue
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      // Liquidate loan
      await loanContract.connect(liquidator).liquidate(borrower1.address);
      
      // Deposit new collateral
      const newCollateral = ethers.parseEther("2.0");
      await loanContract.connect(borrower1).depositCollateral({ value: newCollateral });
      
      // Should be able to remove collateral
      await expect(loanContract.connect(borrower1).removeCollateral())
        .to.emit(loanContract, "CollateralRemoved")
        .withArgs(borrower1.address, newCollateral);
    });
  });

  describe("Active Loan Count Tracking", function () {
    beforeEach(async function () {
      await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("20.0") });
    });

    it("should increment activeLoanCount when loan is created", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      const initialCount = await loanContract.getActiveLoanCount();
      expect(initialCount).to.equal(0);
      
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      const newCount = await loanContract.getActiveLoanCount();
      expect(newCount).to.equal(1);
    });

    it("should decrement activeLoanCount when loan is repaid", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      expect(await loanContract.getActiveLoanCount()).to.equal(1);
      
      // Repay loan
      const totalRepayment = mockDaiLoanAmount + ethers.parseEther("0.05");
      await mockToken.transfer(borrower1.address, ethers.parseEther("0.05"));
      await mockToken.connect(borrower1).approve(await loanContract.getAddress(), totalRepayment);
      await loanContract.connect(borrower1).repayLoan(totalRepayment);
      
      expect(await loanContract.getActiveLoanCount()).to.equal(0);
    });

    it("should decrement activeLoanCount when loan is liquidated", async function () {
      const collateralAmount = ethers.parseEther("1.5");
      const mockDaiLoanAmount = ethers.parseEther("1.0");
      
      await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
      await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
      
      expect(await loanContract.getActiveLoanCount()).to.equal(1);
      
      // Fast forward time to make loan overdue
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      await loanContract.connect(liquidator).liquidate(borrower1.address);
      
      expect(await loanContract.getActiveLoanCount()).to.equal(0);
    });

    it("should track multiple concurrent active loans correctly", async function () {
      const collateral1 = ethers.parseEther("1.5");
      const loan1 = ethers.parseEther("1.0");
      const collateral2 = ethers.parseEther("3.0");
      const loan2 = ethers.parseEther("2.0");
      
      // First borrower takes loan
      await loanContract.connect(borrower1).depositCollateral({ value: collateral1 });
      await loanContract.connect(borrower1).borrow(loan1);
      expect(await loanContract.getActiveLoanCount()).to.equal(1);
      
      // Second borrower takes loan
      await loanContract.connect(borrower2).depositCollateral({ value: collateral2 });
      await loanContract.connect(borrower2).borrow(loan2);
      expect(await loanContract.getActiveLoanCount()).to.equal(2);
      
      // First borrower repays
      await mockToken.transfer(borrower1.address, ethers.parseEther("0.05"));
      await mockToken.connect(borrower1).approve(await loanContract.getAddress(), loan1 + ethers.parseEther("0.05"));
      await loanContract.connect(borrower1).repayLoan(loan1 + ethers.parseEther("0.05"));
      expect(await loanContract.getActiveLoanCount()).to.equal(1);
      
      // Second borrower repays
      await mockToken.transfer(borrower2.address, ethers.parseEther("0.1"));
      await mockToken.connect(borrower2).approve(await loanContract.getAddress(), loan2 + ethers.parseEther("0.1"));
      await loanContract.connect(borrower2).repayLoan(loan2 + ethers.parseEther("0.1"));
      expect(await loanContract.getActiveLoanCount()).to.equal(0);
    });

    it("should maintain accurate count with mixed repayments and liquidations", async function () {
      const collateral1 = ethers.parseEther("1.5");
      const loan1 = ethers.parseEther("1.0");
      const collateral2 = ethers.parseEther("3.0");
      const loan2 = ethers.parseEther("2.0");
      
      // Two borrowers take loans
      await loanContract.connect(borrower1).depositCollateral({ value: collateral1 });
      await loanContract.connect(borrower1).borrow(loan1);
      await loanContract.connect(borrower2).depositCollateral({ value: collateral2 });
      await loanContract.connect(borrower2).borrow(loan2);
      expect(await loanContract.getActiveLoanCount()).to.equal(2);
      
      // First borrower repays
      await mockToken.transfer(borrower1.address, ethers.parseEther("0.05"));
      await mockToken.connect(borrower1).approve(await loanContract.getAddress(), loan1 + ethers.parseEther("0.05"));
      await loanContract.connect(borrower1).repayLoan(loan1 + ethers.parseEther("0.05"));
      expect(await loanContract.getActiveLoanCount()).to.equal(1);
      
      // Second borrower gets liquidated
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await loanContract.connect(liquidator).liquidate(borrower2.address);
      expect(await loanContract.getActiveLoanCount()).to.equal(0);
    });
  });
});