import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { MOCK_TOKEN_ABI, MOCK_TOKEN_ADDRESS } from '../utils/contractHelpers';

const useTokenContract = (account, isCorrectNetwork) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  // Initialize token contract
  useEffect(() => {
    if (signer && MOCK_TOKEN_ADDRESS !== "0x0000000000000000000000000000000000000000") {
      try {
        const contractInstance = new ethers.Contract(
          MOCK_TOKEN_ADDRESS,
          MOCK_TOKEN_ABI,
          signer
        );
        setTokenContract(contractInstance);
      } catch (error) {
        console.error('Error initializing token contract:', error);
        setError('Failed to initialize token contract');
        setTokenContract(null);
      }
    } else {
      setTokenContract(null);
    }
  }, [signer]);

  // Fetch balance when contract or account changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (tokenContract && account) {
        try {
          const bal = await tokenContract.balanceOf(account);
          setBalance(bal.toString());
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
    };

    fetchBalance();
  }, [tokenContract, account]);

  // Execute transaction helper
  const executeTransaction = useCallback(async (method, args = [], onSuccess, onError) => {
    if (!tokenContract) {
      const errorMsg = 'Token contract not initialized';
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return null;
    }

    setIsLoading(true);
    setError('');

    try {
      const tx = await method(...args);
      const receipt = await tx.wait();
      
      // Refresh balance after transaction
      if (account) {
        const newBalance = await tokenContract.balanceOf(account);
        setBalance(newBalance.toString());
      }
      
      if (onSuccess) {
        onSuccess(receipt);
      }
      
      setIsLoading(false);
      return receipt;
    } catch (error) {
      console.error('Transaction failed:', error);
      const errorMsg = parseTokenError(error);
      setError(errorMsg);
      
      if (onError) {
        onError(error);
      }
      
      setIsLoading(false);
      return null;
    }
  }, [tokenContract, account]);

  // Get balance of an address
  const balanceOf = useCallback(async (address) => {
    if (!tokenContract) return '0';
    
    try {
      const bal = await tokenContract.balanceOf(address || account);
      return bal.toString();
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }, [tokenContract, account]);

  // Approve spender to use tokens
  const approve = useCallback(async (spender, amount, onSuccess, onError) => {
    if (!tokenContract) return null;
    
    return executeTransaction(
      tokenContract.approve,
      [spender, amount],
      onSuccess,
      onError
    );
  }, [tokenContract, executeTransaction]);

  // Get allowance for spender
  const allowance = useCallback(async (owner, spender) => {
    if (!tokenContract) return '0';
    
    try {
      const allowanceAmount = await tokenContract.allowance(owner || account, spender);
      return allowanceAmount.toString();
    } catch (error) {
      console.error('Error getting allowance:', error);
      return '0';
    }
  }, [tokenContract, account]);

  // Transfer tokens
  const transfer = useCallback(async (to, amount, onSuccess, onError) => {
    if (!tokenContract) return null;
    
    return executeTransaction(
      tokenContract.transfer,
      [to, amount],
      onSuccess,
      onError
    );
  }, [tokenContract, executeTransaction]);

  // Get token metadata
  const getTokenInfo = useCallback(async () => {
    if (!tokenContract) return null;
    
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.totalSupply()
      ]);
      
      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString()
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }, [tokenContract]);

  // Set up event listeners
  const setupEventListeners = useCallback((callbacks = {}) => {
    if (!tokenContract || !account) return () => {};

    const { onTransfer, onApproval } = callbacks;

    // Filter for events involving the current account
    const transferFilter = tokenContract.filters.Transfer(null, null);
    const approvalFilter = tokenContract.filters.Approval(account, null);

    const handleTransfer = async (from, to, value, event) => {
      // Only update if the current account is involved
      if (from === account || to === account) {
        const newBalance = await tokenContract.balanceOf(account);
        setBalance(newBalance.toString());
        
        if (onTransfer) {
          onTransfer(from, to, value, event);
        }
      }
    };

    const handleApproval = async (owner, spender, value, event) => {
      if (onApproval) {
        onApproval(owner, spender, value, event);
      }
    };

    // Set up event listeners
    tokenContract.on(transferFilter, handleTransfer);
    tokenContract.on(approvalFilter, handleApproval);

    // Return cleanup function
    return () => {
      tokenContract.off(transferFilter, handleTransfer);
      tokenContract.off(approvalFilter, handleApproval);
    };
  }, [tokenContract, account]);

  // Memoized return object
  const tokenInterface = useMemo(() => ({
    // State
    tokenContract,
    provider,
    signer,
    balance,
    isLoading,
    error,
    isReady: !!tokenContract && !!account && isCorrectNetwork,
    
    // Functions
    balanceOf,
    approve,
    allowance,
    transfer,
    getTokenInfo,
    setupEventListeners,
    executeTransaction
  }), [
    tokenContract,
    provider,
    signer,
    balance,
    isLoading,
    error,
    account,
    isCorrectNetwork,
    balanceOf,
    approve,
    allowance,
    transfer,
    getTokenInfo,
    setupEventListeners,
    executeTransaction
  ]);

  return tokenInterface;
};

// Helper function to parse token contract errors
const parseTokenError = (error) => {
  if (error.code === 4001) {
    return 'Transaction rejected by user';
  }
  
  if (error.message.includes('Insufficient balance')) {
    return 'Insufficient MockDAI balance';
  }
  
  if (error.message.includes('Insufficient allowance')) {
    return 'Insufficient MockDAI allowance';
  }
  
  if (error.message.includes('Approve to zero address')) {
    return 'Cannot approve zero address';
  }
  
  if (error.message.includes('Transfer to zero address')) {
    return 'Cannot transfer to zero address';
  }
  
  if (error.message.includes('user rejected transaction')) {
    return 'Transaction rejected by user';
  }
  
  if (error.message.includes('insufficient funds')) {
    return 'Insufficient funds for gas';
  }
  
  return error.message || 'Transaction failed';
};

export default useTokenContract;
