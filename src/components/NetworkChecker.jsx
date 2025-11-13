import React from 'react';
import { SEPOLIA_CONFIG } from '../utils/contractHelpers';

const NetworkChecker = ({ chainId, isCorrectNetwork, onSwitchNetwork }) => {
  if (isCorrectNetwork) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-2">
            <p className="text-sm font-medium text-green-800">Connected to Sepolia Testnet</p>
          </div>
        </div>
      </div>
    );
  }

  const getCurrentNetworkName = (chainId) => {
    const networks = {
      '0x1': 'Ethereum Mainnet',
      '0x3': 'Ropsten Testnet',
      '0x4': 'Rinkeby Testnet',
      '0x5': 'Goerli Testnet',
      '0xaa36a7': 'Sepolia Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Polygon Mumbai',
      '0xa86a': 'Avalanche Mainnet',
      '0xa869': 'Avalanche Fuji',
      '0x38': 'BSC Mainnet',
      '0x61': 'BSC Testnet'
    };
    
    return networks[chainId] || `Unknown Network (${chainId})`;
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Wrong Network Detected</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>You are currently connected to: <strong>{getCurrentNetworkName(chainId)}</strong></p>
            <p>This dApp requires connection to: <strong>Sepolia Testnet</strong></p>
          </div>
          <div className="mt-4">
            <button
              onClick={onSwitchNetwork}
              className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-200 transition-colors"
            >
              Switch to Sepolia Testnet
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-100 rounded-md">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Need Sepolia ETH?</h4>
            <p className="text-xs text-yellow-700 mb-2">
              You'll need Sepolia ETH to interact with this dApp. Get free testnet ETH from these faucets:
            </p>
            <div className="space-y-1">
              <a
                href="https://sepoliafaucet.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-yellow-600 hover:text-yellow-800 underline"
              >
                • Sepolia Faucet (sepoliafaucet.com)
              </a>
              <a
                href="https://faucets.chain.link/sepolia"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-yellow-600 hover:text-yellow-800 underline"
              >
                • Chainlink Faucet
              </a>
              <a
                href="https://www.infura.io/faucet/sepolia"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-yellow-600 hover:text-yellow-800 underline"
              >
                • Infura Faucet
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkChecker;