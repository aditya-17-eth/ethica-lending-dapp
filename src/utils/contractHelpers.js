import { ethers } from 'ethers';

// Contract ABI - extracted from the LoanContract.sol
export const LOAN_CONTRACT_ABI = [
  // Constants
  "function COLLATERAL_RATIO() view returns (uint256)",
  "function INTEREST_RATE() view returns (uint256)",
  "function LOAN_DURATION() view returns (uint256)",
  
  // State variables
  "function totalPoolBalance() view returns (uint256)",
  "function mockToken() view returns (address)",
  
  // Structs (represented as tuples in ABI)
  "function loans(address) view returns (tuple(address borrower, uint256 collateralAmount, uint256 loanAmount, uint256 interest, uint256 startTime, uint256 dueTime, bool repaid, bool liquidated))",
  "function lenders(address) view returns (tuple(uint256 depositAmount))",
  
  // Lender functions
  "function depositFunds() payable",
  "function withdrawFunds()",
  
  // Borrower functions
  "function depositCollateral() payable",
  "function borrow(uint256 mockDaiAmount)",
  "function repayLoan(uint256 mockDaiAmount)",
  
  // Liquidation
  "function liquidate(address borrower)",
  
  // View functions
  "function getLoanDetails(address borrower) view returns (tuple(address borrower, uint256 collateralAmount, uint256 loanAmount, uint256 interest, uint256 startTime, uint256 dueTime, bool repaid, bool liquidated))",
  "function getLenderDetails(address lender) view returns (tuple(uint256 depositAmount))",
  "function getPoolBalance() view returns (uint256)",
  "function calculateRepaymentAmount(address borrower) view returns (uint256)",
  "function isLoanOverdue(address borrower) view returns (bool)",
  "function isLoanLiquidatable(address borrower) view returns (bool)",
  "function getCollateralRatio(address borrower) view returns (uint256)",
  "function getAvailableBorrowAmount(address borrower) view returns (uint256)",
  
  // Events
  "event LenderDeposit(address indexed lender, uint256 amount)",
  "event LenderWithdraw(address indexed lender, uint256 amount)",
  "event CollateralDeposited(address indexed borrower, uint256 amount)",
  "event LoanIssued(address indexed borrower, uint256 loanAmount, uint256 interest, uint256 dueTime)",
  "event LoanRepaid(address indexed borrower, uint256 totalAmount)",
  "event Liquidated(address indexed borrower, uint256 collateralAmount)"
];

// Contract addresses - will be updated after deployment
export const LOAN_CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
export const MOCK_TOKEN_ADDRESS = process.env.REACT_APP_MOCK_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";

// MockToken ABI - ERC-20 standard
export const MOCK_TOKEN_ABI = [
  // View functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
  // State-changing functions
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Sepolia testnet configuration
export const SEPOLIA_CONFIG = {
  chainId: '0xaa36a7', // 11155111 in hex
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.infura.io/v3/'],
  blockExplorerUrls: ['https://sepolia.etherscan.io/'],
};

// Utility functions for formatting
export const formatEther = (value) => {
  if (!value) return '0';
  return ethers.formatEther(value);
};

export const parseEther = (value) => {
  if (!value) return ethers.parseEther('0');
  return ethers.parseEther(value.toString());
};

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

export const calculateTimeRemaining = (dueTime) => {
  if (!dueTime) return 0;
  const now = Math.floor(Date.now() / 1000);
  const remaining = Number(dueTime) - now;
  return Math.max(0, remaining);
};

export const formatTimeRemaining = (seconds) => {
  if (seconds <= 0) return 'Overdue';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Error handling utilities
export const parseContractError = (error) => {
  if (error.code === 4001) {
    return 'Transaction rejected by user';
  }
  
  if (error.message.includes('InsufficientCollateral')) {
    return 'Insufficient collateral for this loan amount';
  }
  
  if (error.message.includes('InsufficientPoolLiquidity')) {
    return 'Not enough liquidity in the lending pool';
  }
  
  if (error.message.includes('LoanAlreadyExists')) {
    return 'You already have an active loan';
  }
  
  if (error.message.includes('NoActiveLoan')) {
    return 'No active loan found';
  }
  
  if (error.message.includes('InsufficientFunds')) {
    return 'Insufficient funds for this transaction';
  }
  
  if (error.message.includes('UnauthorizedWithdrawal')) {
    return 'Cannot withdraw funds while loans are active';
  }
  
  if (error.message.includes('user rejected transaction')) {
    return 'Transaction rejected by user';
  }
  
  if (error.message.includes('insufficient funds')) {
    return 'Insufficient ETH balance';
  }
  
  return error.message || 'Transaction failed';
};

// Gas estimation utilities
export const estimateGasWithBuffer = async (contractMethod, args = [], value = 0) => {
  try {
    const gasEstimate = await contractMethod.estimateGas(...args, { value });
    // Add 20% buffer to gas estimate
    return gasEstimate * 120n / 100n;
  } catch (error) {
    console.error('Gas estimation failed:', error);
    // Return a reasonable default gas limit
    return 300000n;
  }
};

// Transaction options helper
export const getTransactionOptions = (gasLimit, value = 0) => {
  return {
    gasLimit,
    value,
    // Let MetaMask handle gas price
  };
};