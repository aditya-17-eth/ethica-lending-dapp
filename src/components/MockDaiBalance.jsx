import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import useTokenContract from '../hooks/useTokenContract';
import { LOAN_CONTRACT_ADDRESS } from '../utils/contractHelpers';

const MockDaiBalance = ({ account, isCorrectNetwork, loanContractAddress }) => {
  const tokenContract = useTokenContract(account, isCorrectNetwork);
  const [balance, setBalance] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);

  // Fetch balance and allowance
  const fetchBalances = useCallback(async () => {
    if (!tokenContract.isReady || !account) return;

    setIsLoading(true);
    try {
      const [bal, allow, info] = await Promise.all([
        tokenContract.balanceOf(account),
        tokenContract.allowance(account, loanContractAddress || LOAN_CONTRACT_ADDRESS),
        tokenContract.getTokenInfo()
      ]);

      setBalance(bal);
      setAllowance(allow);
      setTokenInfo(info);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tokenContract, account, loanContractAddress]);

  // Initial fetch
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!tokenContract.isReady) return;

    const cleanup = tokenContract.setupEventListeners({
      onTransfer: (from, to, value) => {
        // Refresh balance when transfer involves current account
        if (from === account || to === account) {
          fetchBalances();
        }
      },
      onApproval: (owner, spender) => {
        // Refresh allowance when approval involves current account
        if (owner === account) {
          fetchBalances();
        }
      }
    });

    return cleanup;
  }, [tokenContract, account, fetchBalances]);

  // Format balance with proper decimals
  const formatBalance = (value) => {
    if (!value || value === '0') return '0.00';
    try {
      const formatted = ethers.formatEther(value);
      const num = parseFloat(formatted);
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (error) {
      return '0.00';
    }
  };

  // Format allowance status
  const getAllowanceStatus = () => {
    if (!allowance || allowance === '0') {
      return {
        status: 'Not Approved',
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      };
    }

    const allowanceNum = parseFloat(ethers.formatEther(allowance));
    if (allowanceNum >= 1000000) {
      return {
        status: 'Unlimited',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    }

    return {
      status: `${formatBalance(allowance)} mDAI`,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    };
  };

  const allowanceStatus = getAllowanceStatus();

  if (!tokenContract.isReady) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-500">
          Connect wallet to view MockDAI balance
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">MockDAI Balance</h3>
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        )}
      </div>

      {/* Balance Display */}
      <div className="mb-4">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-gray-900">
            {formatBalance(balance)}
          </span>
          <span className="ml-2 text-lg text-gray-600">
            {tokenInfo?.symbol || 'mDAI'}
          </span>
        </div>
        {tokenInfo && (
          <div className="text-xs text-gray-500 mt-1">
            {tokenInfo.name}
          </div>
        )}
      </div>

      {/* Allowance Status */}
      <div className="border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Allowance for LoanContract:</span>
          <span className={`text-xs font-medium px-2 py-1 rounded ${allowanceStatus.bgColor} ${allowanceStatus.color}`}>
            {allowanceStatus.status}
          </span>
        </div>
        
        {allowance === '0' && (
          <div className="mt-2 text-xs text-gray-500">
            You need to approve MockDAI spending before repaying loans
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchBalances}
        disabled={isLoading}
        className="mt-3 w-full text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors"
      >
        {isLoading ? 'Refreshing...' : 'Refresh Balance'}
      </button>
    </div>
  );
};

export default MockDaiBalance;
