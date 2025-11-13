import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { LOAN_CONTRACT_ABI, LOAN_CONTRACT_ADDRESS, MOCK_TOKEN_ADDRESS } from '../utils/contractHelpers';
import useTokenContract from './useTokenContract';

const useContract = (account, isCorrectNetwork) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Initialize token contract hook
  const tokenContract = useTokenContract(account, isCorrectNetwork);

  // Initialize provider and signer
  useEffect(() => {
    const initializeProvider = async () => {
      if (window.ethereum && account && isCorrectNetwork) {
        try {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const web3Signer = await web3Provider.getSigner();
          
          setProvider(web3Provider);
          setSigner(web3Signer);
          setError('');
        } catch (error) {
          console.error('Error initializing provider:', error);
          setError('Failed to initialize Web3 provider');
        }
      } else {
        setProvider(null);
        setSigner(null);
      }
    };

    initializeProvider();
  }, [account, isCorrectNetwork]);

  // Initialize contract
  useEffect(() => {
    if (signer && LOAN_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
      try {
        const contractInstance = new ethers.Contract(
          LOAN_CONTRACT_ADDRESS,
          LOAN_CONTRACT_ABI,
          signer
        );
        setContract(contractInstance);
      } catch (error) {
        console.error('Error initializing contract:', error);
        setError('Failed to initialize contract');
        setContract(null);
      }
    } else {
      setContract(null);
    }
  }, [signer]);

  // Contract interaction methods
  const executeTransaction = useCallback(async (method, args = [], value = 0, onSuccess, onError) => {
    if (!contract) {
      const errorMsg = 'Contract not initialized';
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return null;
    }

    setIsLoading(true);
    setError('');

    try {
      const tx = await method(...args, { value });
      const receipt = await tx.wait();
      
      if (onSuccess) {
        onSuccess(receipt);
      }
      
      setIsLoading(false);
      return receipt;
    } catch (error) {
      console.error('Transaction failed:', error);
      const errorMsg = parseContractError(error);
      setError(errorMsg);
      
      if (onError) {
        onError(error);
      }
      
      setIsLoading(false);
      return null;
    }
  }, [contract]);

  // Lender functions
  const depositFunds = useCallback(async (amount, onSuccess, onError) => {
    if (!contract) return null;
    
    const value = ethers.parseEther(amount.toString());
    return executeTransaction(
      contract.depositFunds,
      [],
      value,
      onSuccess,
      onError
    );
  }, [contract, executeTransaction]);

  const withdrawFunds = useCallback(async (onSuccess, onError) => {
    if (!contract) return null;
    
    return executeTransaction(
      contract.withdrawFunds,
      [],
      0,
      onSuccess,
      onError
    );
  }, [contract, executeTransaction]);

  // Borrower functions
  const depositCollateral = useCallback(async (amount, onSuccess, onError) => {
    if (!contract) return null;
    
    const value = ethers.parseEther(amount.toString());
    return executeTransaction(
      contract.depositCollateral,
      [],
      value,
      onSuccess,
      onError
    );
  }, [contract, executeTransaction]);

  const borrow = useCallback(async (amount, onSuccess, onError) => {
    if (!contract) return null;
    
    // Amount is in MockDAI (18 decimals)
    const mockDaiAmount = ethers.parseEther(amount.toString());
    return executeTransaction(
      contract.borrow,
      [mockDaiAmount],
      0,
      onSuccess,
      onError
    );
  }, [contract, executeTransaction]);

  const repayLoan = useCallback(async (amount, onSuccess, onError) => {
    if (!contract) return null;
    
    // Amount is in MockDAI (18 decimals)
    const mockDaiAmount = ethers.parseEther(amount.toString());
    return executeTransaction(
      contract.repayLoan,
      [mockDaiAmount],
      0,
      onSuccess,
      onError
    );
  }, [contract, executeTransaction]);

  const liquidate = useCallback(async (borrowerAddress, onSuccess, onError) => {
    if (!contract) return null;
    
    return executeTransaction(
      contract.liquidate,
      [borrowerAddress],
      0,
      onSuccess,
      onError
    );
  }, [contract, executeTransaction]);

  // View functions (read-only)
  const getLoanDetails = useCallback(async (borrowerAddress) => {
    if (!contract) return null;
    
    try {
      const loan = await contract.getLoanDetails(borrowerAddress || account);
      return {
        borrower: loan.borrower,
        collateralAmount: loan.collateralAmount,
        loanAmount: loan.loanAmount,
        interest: loan.interest,
        startTime: loan.startTime,
        dueTime: loan.dueTime,
        repaid: loan.repaid,
        liquidated: loan.liquidated
      };
    } catch (error) {
      console.error('Error getting loan details:', error);
      return null;
    }
  }, [contract, account]);

  const getLenderDetails = useCallback(async (lenderAddress) => {
    if (!contract) return null;
    
    try {
      const lender = await contract.getLenderDetails(lenderAddress || account);
      return {
        depositAmount: lender.depositAmount
      };
    } catch (error) {
      console.error('Error getting lender details:', error);
      return null;
    }
  }, [contract, account]);

  const getPoolBalance = useCallback(async () => {
    if (!contract) return null;
    
    try {
      return await contract.getPoolBalance();
    } catch (error) {
      console.error('Error getting pool balance:', error);
      return null;
    }
  }, [contract]);

  const calculateRepaymentAmount = useCallback(async (borrowerAddress) => {
    if (!contract) return null;
    
    try {
      return await contract.calculateRepaymentAmount(borrowerAddress || account);
    } catch (error) {
      console.error('Error calculating repayment amount:', error);
      return null;
    }
  }, [contract, account]);

  const getCollateralRatio = useCallback(async (borrowerAddress) => {
    if (!contract) return null;
    
    try {
      return await contract.getCollateralRatio(borrowerAddress || account);
    } catch (error) {
      console.error('Error getting collateral ratio:', error);
      return null;
    }
  }, [contract, account]);

  const getAvailableBorrowAmount = useCallback(async (borrowerAddress) => {
    if (!contract) return null;
    
    try {
      return await contract.getAvailableBorrowAmount(borrowerAddress || account);
    } catch (error) {
      console.error('Error getting available borrow amount:', error);
      return null;
    }
  }, [contract, account]);

  const isLoanLiquidatable = useCallback(async (borrowerAddress) => {
    if (!contract) return false;
    
    try {
      return await contract.isLoanLiquidatable(borrowerAddress || account);
    } catch (error) {
      console.error('Error checking liquidation status:', error);
      return false;
    }
  }, [contract, account]);

  // Contract constants
  const getConstants = useCallback(async () => {
    if (!contract) return null;
    
    try {
      const [collateralRatio, interestRate, loanDuration] = await Promise.all([
        contract.COLLATERAL_RATIO(),
        contract.INTEREST_RATE(),
        contract.LOAN_DURATION()
      ]);
      
      return {
        collateralRatio: Number(collateralRatio),
        interestRate: Number(interestRate),
        loanDuration: Number(loanDuration)
      };
    } catch (error) {
      console.error('Error getting contract constants:', error);
      return null;
    }
  }, [contract]);

  // Event listeners
  const setupEventListeners = useCallback((callbacks = {}) => {
    if (!contract) return () => {};

    const {
      onLenderDeposit,
      onLenderWithdraw,
      onCollateralDeposited,
      onLoanIssued,
      onLoanRepaid,
      onLiquidated
    } = callbacks;

    // Set up event listeners
    if (onLenderDeposit) {
      contract.on('LenderDeposit', onLenderDeposit);
    }
    if (onLenderWithdraw) {
      contract.on('LenderWithdraw', onLenderWithdraw);
    }
    if (onCollateralDeposited) {
      contract.on('CollateralDeposited', onCollateralDeposited);
    }
    if (onLoanIssued) {
      contract.on('LoanIssued', onLoanIssued);
    }
    if (onLoanRepaid) {
      contract.on('LoanRepaid', onLoanRepaid);
    }
    if (onLiquidated) {
      contract.on('Liquidated', onLiquidated);
    }

    // Return cleanup function
    return () => {
      contract.removeAllListeners();
    };
  }, [contract]);

  // MockToken helper functions
  const getMockDaiBalance = useCallback(async (address) => {
    return tokenContract.balanceOf(address || account);
  }, [tokenContract, account]);

  const getMockDaiAllowance = useCallback(async (owner, spender) => {
    return tokenContract.allowance(owner || account, spender || MOCK_TOKEN_ADDRESS);
  }, [tokenContract, account]);

  const approveMockDai = useCallback(async (amount, onSuccess, onError) => {
    if (!contract) return null;
    
    // Approve LoanContract to spend MockDAI
    return tokenContract.approve(
      LOAN_CONTRACT_ADDRESS,
      amount,
      onSuccess,
      onError
    );
  }, [contract, tokenContract]);

  // Memoized return object
  const contractInterface = useMemo(() => ({
    // State
    contract,
    provider,
    signer,
    isLoading,
    error,
    isReady: !!contract && !!account && isCorrectNetwork,
    
    // Lender functions
    depositFunds,
    withdrawFunds,
    
    // Borrower functions
    depositCollateral,
    borrow,
    repayLoan,
    
    // Liquidation
    liquidate,
    
    // View functions
    getLoanDetails,
    getLenderDetails,
    getPoolBalance,
    calculateRepaymentAmount,
    getCollateralRatio,
    getAvailableBorrowAmount,
    isLoanLiquidatable,
    getConstants,
    
    // MockToken functions
    tokenContract,
    getMockDaiBalance,
    getMockDaiAllowance,
    approveMockDai,
    
    // Utilities
    setupEventListeners,
    executeTransaction
  }), [
    contract,
    provider,
    signer,
    isLoading,
    error,
    account,
    isCorrectNetwork,
    depositFunds,
    withdrawFunds,
    depositCollateral,
    borrow,
    repayLoan,
    liquidate,
    getLoanDetails,
    getLenderDetails,
    getPoolBalance,
    calculateRepaymentAmount,
    getCollateralRatio,
    getAvailableBorrowAmount,
    isLoanLiquidatable,
    getConstants,
    tokenContract,
    getMockDaiBalance,
    getMockDaiAllowance,
    approveMockDai,
    setupEventListeners,
    executeTransaction
  ]);

  return contractInterface;
};

// Helper function to parse contract errors (moved from contractHelpers to avoid circular dependency)
const parseContractError = (error) => {
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

export default useContract;