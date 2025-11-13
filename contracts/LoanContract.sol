// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LoanContract {
    // Constants
    uint256 public constant COLLATERAL_RATIO = 150; // 150% collateral ratio required
    uint256 public constant INTEREST_RATE = 5; // 5% interest rate
    uint256 public constant LOAN_DURATION = 30 days; // 30 days loan duration
    
    // State variables
    uint256 public totalPoolBalance;
    uint256 public totalInterestEarned;
    uint256 public totalDeposited;
    uint256 public activeLoanCount;
    IERC20 public mockToken;
    
    // Structs
    struct Loan {
        address borrower;
        uint256 collateralAmount;
        uint256 loanAmount;
        uint256 interest;
        uint256 startTime;
        uint256 dueTime;
        bool repaid;
        bool liquidated;
    }
    
    struct Lender {
        uint256 depositAmount;
    }
    
    // Mappings
    mapping(address => Loan) public loans;
    mapping(address => Lender) public lenders;
    
    // Events
    event LenderDeposit(address indexed lender, uint256 amount);
    event LenderWithdraw(address indexed lender, uint256 amount);
    event CollateralDeposited(address indexed borrower, uint256 amount);
    event CollateralRemoved(address indexed borrower, uint256 amount);
    event LoanIssued(address indexed borrower, uint256 loanAmount, uint256 interest, uint256 dueTime);
    event LoanRepaid(address indexed borrower, uint256 totalAmount);
    event Liquidated(address indexed borrower, uint256 collateralAmount);
    
    // Custom errors
    error InsufficientCollateral();
    error InsufficientPoolLiquidity();
    error LoanAlreadyExists();
    error NoActiveLoan();
    error LoanNotDue();
    error CollateralRatioHealthy();
    error UnauthorizedWithdrawal();
    error InsufficientFunds();
    
    // Constructor
    constructor(address _mockTokenAddress) {
        require(_mockTokenAddress != address(0), "Invalid MockToken address");
        mockToken = IERC20(_mockTokenAddress);
    }
    
    // Lender functions
    function depositFunds() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        // Update lender's deposit amount
        lenders[msg.sender].depositAmount += msg.value;
        
        // Update total pool balance
        totalPoolBalance += msg.value;
        
        // Update total deposited
        totalDeposited += msg.value;
        
        emit LenderDeposit(msg.sender, msg.value);
    }
    
    function withdrawFunds() external {
        Lender storage lender = lenders[msg.sender];
        require(lender.depositAmount > 0, "No funds to withdraw");
        
        // Calculate lender's proportional share of the pool
        uint256 lenderShare = lender.depositAmount;
        uint256 proportionalInterest = 0;
        
        // Calculate proportional interest if there's any interest earned and total deposits
        if (totalInterestEarned > 0 && totalDeposited > 0) {
            proportionalInterest = (totalInterestEarned * lenderShare) / totalDeposited;
        }
        
        // Total withdrawal = principal + proportional interest
        uint256 withdrawAmount = lenderShare + proportionalInterest;
        
        // Check if there's sufficient liquidity
        require(address(this).balance >= withdrawAmount, "Insufficient contract balance");
        
        // Update state before transfer to prevent reentrancy
        lender.depositAmount = 0;
        totalDeposited -= lenderShare;
        
        // Reduce pool balance proportionally
        if (totalPoolBalance >= lenderShare) {
            totalPoolBalance -= lenderShare;
        } else {
            totalPoolBalance = 0;
        }
        
        // Reduce interest earned proportionally
        if (totalInterestEarned >= proportionalInterest) {
            totalInterestEarned -= proportionalInterest;
        } else {
            totalInterestEarned = 0;
        }
        
        // Transfer funds
        (bool success, ) = payable(msg.sender).call{value: withdrawAmount}("");
        require(success, "Transfer failed");
        
        emit LenderWithdraw(msg.sender, withdrawAmount);
    }
    
    // Borrower functions
    function depositCollateral() external payable {
        require(msg.value > 0, "Collateral amount must be greater than 0");
        
        Loan storage loan = loans[msg.sender];
        
        // Add to existing collateral or create new loan record
        loan.borrower = msg.sender;
        loan.collateralAmount += msg.value;
        
        emit CollateralDeposited(msg.sender, msg.value);
    }
    
    function removeCollateral() external {
        Loan storage loan = loans[msg.sender];
        
        // Validation: Check borrower has collateral to remove
        require(loan.collateralAmount > 0, "No collateral to remove");
        
        // Validation: Prevent collateral removal when active loan exists
        // Active loan means: loanAmount > 0 AND not repaid AND not liquidated
        require(loan.loanAmount == 0 || loan.repaid || loan.liquidated, "Active loan exists");
        
        uint256 collateralToReturn = loan.collateralAmount;
        
        // Update state before transfer to prevent reentrancy
        loan.collateralAmount = 0;
        
        // Transfer collateral back to borrower
        (bool success, ) = payable(msg.sender).call{value: collateralToReturn}("");
        require(success, "Collateral transfer failed");
        
        // Emit event on successful removal
        emit CollateralRemoved(msg.sender, collateralToReturn);
    }
    
    function borrow(uint256 mockDaiAmount) external {
        require(mockDaiAmount > 0, "Loan amount must be greater than 0");
        
        Loan storage loan = loans[msg.sender];
        require(loan.collateralAmount > 0, "No collateral deposited");
        require(loan.loanAmount == 0, "Active loan already exists");
        
        // Check collateral ratio (150% minimum) - ETH collateral vs MockDAI loan
        uint256 requiredCollateral = (mockDaiAmount * COLLATERAL_RATIO) / 100;
        require(loan.collateralAmount >= requiredCollateral, "Insufficient collateral");
        
        // Check pool liquidity (ETH backing)
        require(totalPoolBalance >= mockDaiAmount, "Insufficient pool liquidity");
        
        // Check LoanContract has sufficient MockDAI balance
        uint256 contractMockDaiBalance = mockToken.balanceOf(address(this));
        require(contractMockDaiBalance >= mockDaiAmount, "Insufficient MockDAI balance in contract");
        
        // Calculate interest and set loan terms
        uint256 interest = (mockDaiAmount * INTEREST_RATE) / 100;
        uint256 startTime = block.timestamp;
        uint256 dueTime = startTime + LOAN_DURATION;
        
        // Update loan record (storing MockDAI amounts)
        loan.loanAmount = mockDaiAmount;
        loan.interest = interest;
        loan.startTime = startTime;
        loan.dueTime = dueTime;
        loan.repaid = false;
        loan.liquidated = false;
        
        // Update pool balance (ETH backing)
        totalPoolBalance -= mockDaiAmount;
        
        // Increment active loan count
        activeLoanCount++;
        
        // Transfer MockDAI to borrower
        bool success = mockToken.transfer(msg.sender, mockDaiAmount);
        require(success, "MockDAI transfer failed");
        
        emit LoanIssued(msg.sender, mockDaiAmount, interest, dueTime);
    }
    
    function repayLoan(uint256 mockDaiAmount) external {
        Loan storage loan = loans[msg.sender];
        require(loan.loanAmount > 0, "No active loan");
        require(!loan.repaid, "Loan already repaid");
        require(!loan.liquidated, "Loan already liquidated");
        
        // Store values before resetting
        uint256 principalAmount = loan.loanAmount;
        uint256 collateralToReturn = loan.collateralAmount;
        
        // Only require principal repayment in MockDAI (not interest)
        require(mockDaiAmount >= principalAmount, "Insufficient repayment amount");
        
        // Verify borrower has approved LoanContract to spend MockDAI
        uint256 allowance = mockToken.allowance(msg.sender, address(this));
        require(allowance >= principalAmount, "Insufficient MockDAI allowance");
        
        // Calculate interest deduction from collateral (5% of collateral)
        // Interest is paid in ETH by keeping part of the collateral
        uint256 interestDeduction = (collateralToReturn * INTEREST_RATE) / 100;
        uint256 finalCollateralReturn = collateralToReturn - interestDeduction;
        
        // Reset loan record completely so borrower can borrow again
        loan.loanAmount = 0;
        loan.interest = 0;
        loan.collateralAmount = 0;
        loan.repaid = true;
        loan.startTime = 0;
        loan.dueTime = 0;
        
        // Receive MockDAI principal repayment from borrower (no interest in MockDAI)
        bool success = mockToken.transferFrom(msg.sender, address(this), principalAmount);
        require(success, "MockDAI transfer failed");
        
        // Add principal repayment to pool balance (ETH backing)
        totalPoolBalance += principalAmount;
        
        // Track interest earned for distribution to lenders
        totalInterestEarned += interestDeduction;
        
        // Decrement active loan count
        activeLoanCount--;
        
        // Return ETH collateral minus interest to borrower
        if (finalCollateralReturn > 0) {
            (bool ethSuccess, ) = payable(msg.sender).call{value: finalCollateralReturn}("");
            require(ethSuccess, "Collateral transfer failed");
        }
        
        emit LoanRepaid(msg.sender, principalAmount);
    }
    
    function liquidate(address borrower) external {
        Loan storage loan = loans[borrower];
        require(loan.loanAmount > 0, "No active loan");
        require(!loan.repaid, "Loan already repaid");
        require(!loan.liquidated, "Loan already liquidated");
        
        // Check liquidation conditions
        bool isUndercollateralized = _isUndercollateralized(borrower);
        bool isOverdue = block.timestamp > loan.dueTime;
        
        require(isUndercollateralized || isOverdue, "Loan cannot be liquidated");
        
        // Update loan status
        loan.liquidated = true;
        
        // Decrement active loan count
        activeLoanCount--;
        
        // Transfer collateral to lending pool
        uint256 collateralAmount = loan.collateralAmount;
        loan.collateralAmount = 0;
        
        // Add liquidated collateral to pool balance
        totalPoolBalance += collateralAmount;
        
        emit Liquidated(borrower, collateralAmount);
    }
    
    // Internal helper function to check if loan is undercollateralized
    function _isUndercollateralized(address borrower) internal view returns (bool) {
        Loan memory loan = loans[borrower];
        if (loan.loanAmount == 0) return false;
        
        uint256 currentRatio = (loan.collateralAmount * 100) / loan.loanAmount;
        return currentRatio < COLLATERAL_RATIO;
    }
    
    // View functions
    function getLoanDetails(address borrower) external view returns (Loan memory) {
        return loans[borrower];
    }
    
    function getLenderDetails(address lender) external view returns (Lender memory) {
        return lenders[lender];
    }
    
    function getPoolBalance() external view returns (uint256) {
        return totalPoolBalance;
    }
    
    function calculateRepaymentAmount(address borrower) external view returns (uint256) {
        Loan memory loan = loans[borrower];
        if (loan.loanAmount == 0 || loan.repaid || loan.liquidated) {
            return 0;
        }
        return loan.loanAmount + loan.interest;
    }
    
    // Helper functions
    function isLoanOverdue(address borrower) external view returns (bool) {
        Loan memory loan = loans[borrower];
        return loan.loanAmount > 0 && !loan.repaid && !loan.liquidated && block.timestamp > loan.dueTime;
    }
    
    function isLoanLiquidatable(address borrower) external view returns (bool) {
        Loan memory loan = loans[borrower];
        if (loan.loanAmount == 0 || loan.repaid || loan.liquidated) {
            return false;
        }
        
        bool isUndercollateralized = _isUndercollateralized(borrower);
        bool isOverdue = block.timestamp > loan.dueTime;
        
        return isUndercollateralized || isOverdue;
    }
    
    function getCollateralRatio(address borrower) external view returns (uint256) {
        Loan memory loan = loans[borrower];
        if (loan.loanAmount == 0) {
            return 0;
        }
        return (loan.collateralAmount * 100) / loan.loanAmount;
    }
    
    function getAvailableBorrowAmount(address borrower) external view returns (uint256) {
        Loan memory loan = loans[borrower];
        
        // Check if there's an active loan (not repaid and not liquidated)
        if (loan.loanAmount > 0 && !loan.repaid && !loan.liquidated) {
            return 0; // Already has active loan
        }
        
        // Calculate max borrow based on collateral
        uint256 maxBorrowFromCollateral = (loan.collateralAmount * 100) / COLLATERAL_RATIO;
        uint256 availableInPool = totalPoolBalance;
        
        return maxBorrowFromCollateral < availableInPool ? maxBorrowFromCollateral : availableInPool;
    }
    
    function getActiveLoanCount() external view returns (uint256) {
        return activeLoanCount;
    }
}