import React, { useState } from 'react';
import useWallet from '../hooks/useWallet';

const WalletConnection = ({ onWalletConnected, onWalletDisconnected }) => {
  const { 
    isConnected, 
    account, 
    isCorrectNetwork, 
    error: walletError, 
    connectWallet, 
    disconnectWallet, 
    switchToSepolia, 
    switchToHardhat 
  } = useWallet();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleConnect = async () => {
    if (!window.ethereum) {
      setLocalError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setLocalError('');

    try {
      const success = await connectWallet();
      if (success && onWalletConnected) {
        onWalletConnected(account);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setLocalError('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    if (onWalletDisconnected) {
      onWalletDisconnected();
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const displayError = localError || walletError;

  if (!window.ethereum) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">MetaMask Required</h3>
            <p className="text-sm text-red-700 mt-1">
              Please install MetaMask to connect your wallet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{displayError}</p>
            </div>
          </div>
        </div>
      )}

      {!isConnected ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isConnecting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Connecting...</span>
            </>
          ) : (
            <span>Connect Wallet</span>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Wallet Connected</p>
                  <p className="text-sm text-green-700">{formatAddress(account)}</p>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="text-sm text-green-600 hover:text-green-800 font-medium"
              >
                Disconnect
              </button>
            </div>
          </div>

          {!isCorrectNetwork && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-800">Wrong Network</p>
                    <p className="text-sm text-yellow-700">Please switch to a supported network</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={switchToHardhat}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                  >
                    Hardhat Local
                  </button>
                  <button
                    onClick={switchToSepolia}
                    className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
                  >
                    Sepolia
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletConnection;