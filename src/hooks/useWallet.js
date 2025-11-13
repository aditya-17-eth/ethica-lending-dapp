import { useState, useEffect, useCallback } from 'react';

const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [error, setError] = useState('');

  // Supported network chain IDs
  const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex
  const HARDHAT_CHAIN_ID = '0x7a69'; // 31337 in hex
  const SUPPORTED_NETWORKS = [SEPOLIA_CHAIN_ID, HARDHAT_CHAIN_ID];

  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    
    try {
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(currentChainId);
      const isCorrect = SUPPORTED_NETWORKS.includes(currentChainId);
      setIsCorrectNetwork(isCorrect);
      return isCorrect;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  }, [SUPPORTED_NETWORKS]);

  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length === 0) {
      setIsConnected(false);
      setAccount('');
      setError('');
    } else {
      setAccount(accounts[0]);
      setIsConnected(true);
    }
  }, []);

  const handleChainChanged = useCallback((newChainId) => {
    setChainId(newChainId);
    const isCorrect = SUPPORTED_NETWORKS.includes(newChainId);
    setIsCorrectNetwork(isCorrect);
    
    if (!isCorrect) {
      setError('Please switch to Sepolia testnet or Hardhat local network');
    } else {
      setError('');
    }
  }, [SUPPORTED_NETWORKS]);

  useEffect(() => {
    const initializeWallet = async () => {
      if (window.ethereum) {
        try {
          // Check if already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            await checkNetwork();
          }

          // Set up event listeners
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('chainChanged', handleChainChanged);
        } catch (error) {
          console.error('Error initializing wallet:', error);
        }
      }
    };

    initializeWallet();

    // Cleanup event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [checkNetwork, handleAccountsChanged, handleChainChanged]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return false;
    }

    try {
      setError('');
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        await checkNetwork();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        setError('Connection rejected by user');
      } else {
        setError('Failed to connect wallet');
      }
      return false;
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount('');
    setChainId('');
    setIsCorrectNetwork(false);
    setError('');
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return false;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
          setError('Failed to add Sepolia network');
          return false;
        }
      } else {
        console.error('Error switching to Sepolia:', switchError);
        setError('Failed to switch to Sepolia network');
        return false;
      }
    }
  };

  const switchToHardhat = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return false;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HARDHAT_CHAIN_ID }],
      });
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: HARDHAT_CHAIN_ID,
                chainName: 'Hardhat Local',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['http://localhost:8545'],
                blockExplorerUrls: [],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Hardhat network:', addError);
          setError('Failed to add Hardhat network');
          return false;
        }
      } else {
        console.error('Error switching to Hardhat:', switchError);
        setError('Failed to switch to Hardhat network');
        return false;
      }
    }
  };

  return {
    isConnected,
    account,
    chainId,
    isCorrectNetwork,
    error,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    switchToHardhat,
    checkNetwork,
  };
};

export default useWallet;