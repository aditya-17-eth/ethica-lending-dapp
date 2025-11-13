import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const useEthBalance = (account, isConnected, isCorrectNetwork) => {
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBalance = useCallback(async () => {
    if (!account || !isConnected || !isCorrectNetwork || !window.ethereum) {
      setBalance('0');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balanceWei = await provider.getBalance(account);
      const balanceEth = ethers.formatEther(balanceWei);
      
      setBalance(balanceEth);
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      setError('Failed to fetch balance');
      setBalance('0');
    } finally {
      setIsLoading(false);
    }
  }, [account, isConnected, isCorrectNetwork]);

  // Fetch balance on mount and when dependencies change
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Set up periodic balance updates (every 10 seconds)
  useEffect(() => {
    if (!account || !isConnected || !isCorrectNetwork) return;

    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [fetchBalance, account, isConnected, isCorrectNetwork]);

  // Listen for account changes to refresh balance
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = () => {
      fetchBalance();
    };

    const handleChainChanged = () => {
      fetchBalance();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [fetchBalance]);

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance
  };
};

export default useEthBalance;