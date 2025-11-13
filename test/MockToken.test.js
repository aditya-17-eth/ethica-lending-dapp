const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockToken", function () {
  let mockToken;
  let deployer, account1, account2;
  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 18); // 1,000,000 mDAI

  beforeEach(async function () {
    [deployer, account1, account2] = await ethers.getSigners();
    
    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy();
    await mockToken.waitForDeployment();
  });

  describe("Token Metadata", function () {
    it("should have correct name", async function () {
      expect(await mockToken.name()).to.equal("Mock DAI");
    });

    it("should have correct symbol", async function () {
      expect(await mockToken.symbol()).to.equal("mDAI");
    });

    it("should have correct decimals", async function () {
      expect(await mockToken.decimals()).to.equal(18);
    });
  });

  describe("Initial Supply", function () {
    it("should mint initial supply to deployer", async function () {
      const deployerBalance = await mockToken.balanceOf(deployer.address);
      expect(deployerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("should set correct total supply", async function () {
      const totalSupply = await mockToken.totalSupply();
      expect(totalSupply).to.equal(INITIAL_SUPPLY);
    });
  });

  describe("Transfer Operations", function () {
    it("should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseUnits("1000", 18);
      
      await expect(mockToken.connect(deployer).transfer(account1.address, transferAmount))
        .to.emit(mockToken, "Transfer")
        .withArgs(deployer.address, account1.address, transferAmount);
      
      expect(await mockToken.balanceOf(account1.address)).to.equal(transferAmount);
      expect(await mockToken.balanceOf(deployer.address)).to.equal(INITIAL_SUPPLY - transferAmount);
    });

    it("should reject transfer to zero address", async function () {
      const transferAmount = ethers.parseUnits("1000", 18);
      
      await expect(mockToken.connect(deployer).transfer(ethers.ZeroAddress, transferAmount))
        .to.be.revertedWith("Transfer to zero address");
    });

    it("should reject transfer with insufficient balance", async function () {
      const transferAmount = ethers.parseUnits("1000", 18);
      
      await expect(mockToken.connect(account1).transfer(account2.address, transferAmount))
        .to.be.revertedWith("Insufficient balance");
    });

    it("should handle multiple transfers correctly", async function () {
      const amount1 = ethers.parseUnits("1000", 18);
      const amount2 = ethers.parseUnits("500", 18);
      
      await mockToken.connect(deployer).transfer(account1.address, amount1);
      await mockToken.connect(account1).transfer(account2.address, amount2);
      
      expect(await mockToken.balanceOf(account1.address)).to.equal(amount1 - amount2);
      expect(await mockToken.balanceOf(account2.address)).to.equal(amount2);
    });
  });

  describe("Approve and Allowance", function () {
    it("should approve spender to spend tokens", async function () {
      const approvalAmount = ethers.parseUnits("5000", 18);
      
      await expect(mockToken.connect(deployer).approve(account1.address, approvalAmount))
        .to.emit(mockToken, "Approval")
        .withArgs(deployer.address, account1.address, approvalAmount);
      
      expect(await mockToken.allowance(deployer.address, account1.address)).to.equal(approvalAmount);
    });

    it("should reject approval to zero address", async function () {
      const approvalAmount = ethers.parseUnits("5000", 18);
      
      await expect(mockToken.connect(deployer).approve(ethers.ZeroAddress, approvalAmount))
        .to.be.revertedWith("Approve to zero address");
    });

    it("should update allowance on subsequent approvals", async function () {
      const approval1 = ethers.parseUnits("5000", 18);
      const approval2 = ethers.parseUnits("3000", 18);
      
      await mockToken.connect(deployer).approve(account1.address, approval1);
      await mockToken.connect(deployer).approve(account1.address, approval2);
      
      expect(await mockToken.allowance(deployer.address, account1.address)).to.equal(approval2);
    });
  });

  describe("TransferFrom Operations", function () {
    beforeEach(async function () {
      // Transfer some tokens to account1 for testing
      await mockToken.connect(deployer).transfer(account1.address, ethers.parseUnits("10000", 18));
    });

    it("should transfer tokens using allowance", async function () {
      const approvalAmount = ethers.parseUnits("5000", 18);
      const transferAmount = ethers.parseUnits("3000", 18);
      
      await mockToken.connect(account1).approve(account2.address, approvalAmount);
      
      await expect(mockToken.connect(account2).transferFrom(account1.address, account2.address, transferAmount))
        .to.emit(mockToken, "Transfer")
        .withArgs(account1.address, account2.address, transferAmount);
      
      expect(await mockToken.balanceOf(account2.address)).to.equal(transferAmount);
      expect(await mockToken.allowance(account1.address, account2.address)).to.equal(approvalAmount - transferAmount);
    });

    it("should reject transferFrom with insufficient allowance", async function () {
      const approvalAmount = ethers.parseUnits("1000", 18);
      const transferAmount = ethers.parseUnits("2000", 18);
      
      await mockToken.connect(account1).approve(account2.address, approvalAmount);
      
      await expect(mockToken.connect(account2).transferFrom(account1.address, account2.address, transferAmount))
        .to.be.revertedWith("Insufficient allowance");
    });

    it("should reject transferFrom with insufficient balance", async function () {
      const approvalAmount = ethers.parseUnits("20000", 18);
      const transferAmount = ethers.parseUnits("15000", 18);
      
      await mockToken.connect(account1).approve(account2.address, approvalAmount);
      
      await expect(mockToken.connect(account2).transferFrom(account1.address, account2.address, transferAmount))
        .to.be.revertedWith("Insufficient balance");
    });

    it("should reject transferFrom from zero address", async function () {
      const transferAmount = ethers.parseUnits("1000", 18);
      
      await expect(mockToken.connect(account2).transferFrom(ethers.ZeroAddress, account2.address, transferAmount))
        .to.be.revertedWith("Transfer from zero address");
    });

    it("should reject transferFrom to zero address", async function () {
      const approvalAmount = ethers.parseUnits("5000", 18);
      const transferAmount = ethers.parseUnits("1000", 18);
      
      await mockToken.connect(account1).approve(account2.address, approvalAmount);
      
      await expect(mockToken.connect(account2).transferFrom(account1.address, ethers.ZeroAddress, transferAmount))
        .to.be.revertedWith("Transfer to zero address");
    });
  });
});
