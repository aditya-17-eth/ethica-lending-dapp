const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockToken Integration with LoanContract", function () {
  let loanContract;
  let mockToken;
  let owner, lender1, borrower1;
  
  beforeEach(async function () {
    [owner, lender1, borrower1] = await ethers.getSigners();
    
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

  it("should verify MockToken is properly integrated", async function () {
    const mockTokenAddress = await loanContract.mockToken();
    expect(mockTokenAddress).to.equal(await mockToken.getAddress());
  });

  it("should allow borrowing MockDAI with ETH collateral", async function () {
    // Add ETH liquidity to pool
    await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("10.0") });
    
    // Deposit ETH collateral
    const collateralAmount = ethers.parseEther("1.5");
    await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
    
    // Borrow MockDAI
    const mockDaiLoanAmount = ethers.parseEther("1.0");
    await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
    
    // Verify borrower received MockDAI
    const borrowerMockDaiBalance = await mockToken.balanceOf(borrower1.address);
    expect(borrowerMockDaiBalance).to.equal(mockDaiLoanAmount);
    
    // Verify loan details
    const loanDetails = await loanContract.getLoanDetails(borrower1.address);
    expect(loanDetails.loanAmount).to.equal(mockDaiLoanAmount);
    expect(loanDetails.collateralAmount).to.equal(collateralAmount);
  });

  it("should allow repaying loan with MockDAI and return ETH collateral", async function () {
    // Setup: Add liquidity and create loan
    await loanContract.connect(lender1).depositFunds({ value: ethers.parseEther("10.0") });
    
    const collateralAmount = ethers.parseEther("1.5");
    await loanContract.connect(borrower1).depositCollateral({ value: collateralAmount });
    
    const mockDaiLoanAmount = ethers.parseEther("1.0");
    await loanContract.connect(borrower1).borrow(mockDaiLoanAmount);
    
    // Calculate repayment amount
    const interest = ethers.parseEther("0.05"); // 5%
    const totalRepayment = mockDaiLoanAmount + interest;
    
    // Transfer additional MockDAI to borrower to cover interest
    await mockToken.transfer(borrower1.address, interest);
    
    // Approve LoanContract to spend MockDAI
    await mockToken.connect(borrower1).approve(await loanContract.getAddress(), totalRepayment);
    
    // Get borrower's ETH balance before repayment
    const ethBalanceBefore = await ethers.provider.getBalance(borrower1.address);
    
    // Repay loan
    const tx = await loanContract.connect(borrower1).repayLoan(totalRepayment);
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    
    // Verify borrower's ETH balance increased (collateral returned)
    const ethBalanceAfter = await ethers.provider.getBalance(borrower1.address);
    expect(ethBalanceAfter).to.be.closeTo(ethBalanceBefore + collateralAmount - gasUsed, ethers.parseEther("0.001"));
    
    // Verify loan is marked as repaid
    const loanDetails = await loanContract.getLoanDetails(borrower1.address);
    expect(loanDetails.repaid).to.be.true;
    expect(loanDetails.collateralAmount).to.equal(0);
    
    // Verify MockDAI was transferred to contract
    const borrowerMockDaiBalance = await mockToken.balanceOf(borrower1.address);
    expect(borrowerMockDaiBalance).to.equal(0);
  });

  it("should reject borrowing if contract has insufficient MockDAI", async function () {
    // Deploy a new LoanContract without transferring MockDAI
    const LoanContract = await ethers.getContractFactory("LoanContract");
    const emptyLoanContract = await LoanContract.deploy(await mockToken.getAddress());
    await emptyLoanContract.waitForDeployment();
    
    // Add ETH liquidity
    await emptyLoanContract.connect(lender1).depositFunds({ value: ethers.parseEther("10.0") });
    
    // Deposit collateral
    await emptyLoanContract.connect(borrower1).depositCollateral({ value: ethers.parseEther("1.5") });
    
    // Try to borrow - should fail due to insufficient MockDAI in contract
    await expect(
      emptyLoanContract.connect(borrower1).borrow(ethers.parseEther("1.0"))
    ).to.be.revertedWith("Insufficient MockDAI balance in contract");
  });
});
