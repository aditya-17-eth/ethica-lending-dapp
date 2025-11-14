import { useState, useEffect, useCallback, memo } from 'react';
import useWallet from '../hooks/useWallet';
import useContract from '../hooks/useContract';
import TransactionStatus from './TransactionStatus';
import LiquidationMonitor from './LiquidationMonitor';
import TransactionHistory from './TransactionHistory';
import WalletBalance from './WalletBalance';
import useRealTimeUpdates from '../hooks/useRealTimeUpdates';
import { formatEther } from '../utils/contractHelpers';

const LenderDashboard = () => {
  const { isConnected, account, isCorrectNetwork } = useWallet();
  const contract = useContract(account, isCorrectNetwork);

  // State for lender data
  const [lenderData, setLenderData] = useState({
    depositAmount: '0',
    poolBalance: '0',
    availableToWithdraw: '0',
    lockedInLoans: '0'
  });

  // State for pool statistics
  const [poolStats, setPoolStats] = useState({
    totalBalance: '0',
    activeLoans: 0,
    totalLenders: 0,
    utilizationRate: 0
  });

  // Form states
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Transaction states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data loading state
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Real-time updates
  const { lastUpdate, isUpdating } = useRealTimeUpdates(contract, account);

  // Load lender data
  const loadLenderData = useCallback(async () => {
    if (!contract.isReady) return;

    try {
      setIsDataLoading(true);
      
      const [lenderDetails, poolBalance, activeLoanCount] = await Promise.all([
        contract.getLenderDetails(account),
        contract.getPoolBalance(),
        contract.getActiveLoanCount()
      ]);

      // Always set the data, even if it's 0
      const depositAmountFormatted = lenderDetails ? formatEther(lenderDetails.depositAmount) : '0';
      const poolBalanceFormatted = poolBalance !== null && poolBalance !== undefined ? formatEther(poolBalance) : '0';
      
      // Calculate available to withdraw (minimum of deposit and pool balance)
      const depositNum = parseFloat(depositAmountFormatted);
      const poolNum = parseFloat(poolBalanceFormatted);
      const availableNum = Math.min(depositNum, poolNum);
      const lockedNum = Math.max(0, depositNum - poolNum);
      
      setLenderData({
        depositAmount: depositAmountFormatted,
        poolBalance: poolBalanceFormatted,
        availableToWithdraw: availableNum.toString(),
        lockedInLoans: lockedNum.toString()
      });

      setPoolStats({
        totalBalance: poolBalanceFormatted,
        activeLoans: activeLoanCount !== null ? activeLoanCount : 0,
        totalLenders: 0, // Will be calculated later
        utilizationRate: 0 // Will be calculated later
      });
    } catch (error) {
      console.error('Error loading lender data:', error);
      setError('Failed to load lender data');
    } finally {
      setIsDataLoading(false);
    }
  }, [contract, account]);

  // Load data on component mount and contract ready
  useEffect(() => {
    if (contract.isReady) {
      loadLenderData();
    }
  }, [contract.isReady, loadLenderData]);

  // Reload data when real-time updates occur
  useEffect(() => {
    if (contract.isReady && lastUpdate) {
      loadLenderData();
    }
  }, [lastUpdate, contract.isReady, loadLenderData]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!contract.isReady) return;

    const cleanup = contract.setupEventListeners({
      onLenderDeposit: (lender, amount) => {
        if (lender.toLowerCase() === account.toLowerCase()) {
          loadLenderData(); // Refresh data when user deposits
        }
      },
      onLenderWithdraw: (lender, amount) => {
        if (lender.toLowerCase() === account.toLowerCase()) {
          loadLenderData(); // Refresh data when user withdraws
        }
      },
      onLoanIssued: () => {
        loadLenderData(); // Refresh pool data when loans are issued
      },
      onLoanRepaid: () => {
        loadLenderData(); // Refresh pool data when loans are repaid
      },
      onLiquidated: () => {
        loadLenderData(); // Refresh pool data when loans are liquidated
      }
    });

    return cleanup;
  }, [contract.isReady, contract, account, loadLenderData]);

  // Handle deposit
  const handleDeposit = async (e) => {
    e.preventDefault();
    
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid deposit amount');
      return;
    }

    if (!isValidDepositAmount(depositAmount)) {
      setError('Please enter a valid deposit amount between 0 and 1000 ETH');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const receipt = await contract.depositFunds(
        depositAmount,
        async (receipt) => {
          setSuccess(`Successfully deposited ${depositAmount} ETH. Transaction: ${receipt.hash}`);
          setDepositAmount('');
          // Wait a moment for blockchain state to update, then refresh
          setTimeout(() => {
            loadLenderData();
          }, 1000);
        },
        (error) => {
          console.error('Deposit error:', error);
          setError(error.message || 'Deposit transaction failed');
        }
      );

      if (receipt) {
        console.log('Deposit transaction confirmed:', receipt.hash);
        // Also refresh immediately after receipt
        await loadLenderData();
      }
    } catch (error) {
      console.error('Deposit failed:', error);
      setError(error.message || 'Deposit failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle withdrawal
  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid withdrawal amount');
      return;
    }

    if (!isValidWithdrawAmount(withdrawAmount)) {
      setError('Withdrawal amount exceeds available balance');
      return;
    }

    if (parseFloat(lenderData.availableToWithdraw) === 0) {
      setError('No funds available for withdrawal');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const receipt = await contract.withdrawFunds(
        async (receipt) => {
          setSuccess(`Successfully withdrew funds. Transaction: ${receipt.hash}`);
          setWithdrawAmount('');
          // Wait a moment for blockchain state to update, then refresh
          setTimeout(() => {
            loadLenderData();
          }, 1000);
        },
        (error) => {
          console.error('Withdrawal error:', error);
          setError(error.message || 'Withdrawal transaction failed');
        }
      );

      if (receipt) {
        console.log('Withdrawal transaction confirmed:', receipt.hash);
        // Also refresh immediately after receipt
        await loadLenderData();
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
      setError(error.message || 'Withdrawal failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear transaction messages
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Handle max deposit (set to user's ETH balance or a reasonable max)
  const handleMaxDeposit = () => {
    // For now, set a reasonable max. In a real app, we'd get user's ETH balance
    setDepositAmount('1.0');
  };

  // Handle max withdrawal
  const handleMaxWithdraw = () => {
    setWithdrawAmount(lenderData.availableToWithdraw);
  };

  // Validation functions
  const isValidDepositAmount = (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 1000; // Max 1000 ETH for safety
  };

  const isValidWithdrawAmount = (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= parseFloat(lenderData.availableToWithdraw);
  };

  if (!isConnected || !isCorrectNetwork) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-16">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lender Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet and ensure you're on Sepolia testnet to access the lender dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lender Dashboard</h1>
            <p className="text-gray-600 mt-1">Deposit ETH to back MockDAI loans and earn from liquidations</p>
          </div>
          {isUpdating && (
            <div className="mt-4 md:mt-0 flex items-center space-x-1 text-xs text-blue-600">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Updating...</span>
            </div>
          )}
        </div>

        {/* Wallet Balance */}
        <WalletBalance 
          account={account}
          isConnected={isConnected}
          isCorrectNetwork={isCorrectNetwork}
          className="mb-6"
        />

        {/* Transaction Status */}
        <TransactionStatus
          isLoading={isLoading}
          error={error}
          success={success}
          onClearMessages={clearMessages}
          className="mb-6"
        />

        {/* Liquidation Monitor */}
        <div className="mb-6 text-center">
          <LiquidationMonitor account={account} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Balance and Statistics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Balance</h2>
              
              {isDataLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-600">Total Deposited</p>
                          <p className="text-2xl font-bold text-green-900">{lenderData.depositAmount} ETH</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-600">Available to Withdraw</p>
                          <p className="text-2xl font-bold text-blue-900">{lenderData.availableToWithdraw} ETH</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-yellow-600">Locked in Loans</p>
                          <p className="text-2xl font-bold text-yellow-900">{lenderData.lockedInLoans} ETH</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {parseFloat(lenderData.lockedInLoans) > 0 && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-yellow-900">Funds Locked</p>
                          <p className="text-xs text-yellow-800 mt-1">
                            {lenderData.lockedInLoans} ETH is currently backing active MockDAI loans and cannot be withdrawn until loans are repaid.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pool Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Pool Statistics</h2>
                <div className="group relative">
                  <svg className="h-5 w-5 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute right-0 w-64 p-2 mt-2 text-xs text-white bg-gray-900 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    The lending pool holds ETH deposits that back MockDAI loans. Borrowers deposit ETH collateral and receive MockDAI tokens.
                  </div>
                </div>
              </div>
              
              {isDataLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Pool Balance (ETH)</p>
                      <p className="text-xl font-bold text-gray-900">{poolStats.totalBalance} ETH</p>
                      <p className="text-xs text-gray-500 mt-1">Backing MockDAI loans</p>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Active Loans</p>
                      <p className="text-xl font-bold text-gray-900">{poolStats.activeLoans}</p>
                      <p className="text-xs text-gray-500 mt-1">MockDAI loans issued</p>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Utilization Rate</p>
                      <p className="text-xl font-bold text-gray-900">{poolStats.utilizationRate}%</p>
                      <p className="text-xs text-gray-500 mt-1">Pool efficiency</p>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-900">How it works</h4>
                        <p className="text-xs text-blue-800 mt-1">
                          Your ETH deposits back MockDAI loans to borrowers. Borrowers must maintain 150% ETH collateral. 
                          When loans are liquidated, the ETH collateral is added to the pool, benefiting lenders.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Deposit Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deposit ETH</h3>
              
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (ETH)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="depositAmount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.0"
                      step="0.001"
                      min="0"
                      max="1000"
                      className={`w-full px-3 py-2 pr-16 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        depositAmount && !isValidDepositAmount(depositAmount)
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={handleMaxDeposit}
                      disabled={isLoading}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded disabled:opacity-50"
                    >
                      Max
                    </button>
                  </div>
                  {depositAmount && !isValidDepositAmount(depositAmount) && (
                    <p className="text-sm text-red-600 mt-1">
                      Please enter a valid amount between 0 and 1000 ETH
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !depositAmount || !isValidDepositAmount(depositAmount)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Deposit ETH'}
                </button>
              </form>
            </div>

            {/* Withdrawal Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdraw ETH</h3>
              
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (ETH)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="withdrawAmount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.0"
                      step="0.001"
                      min="0"
                      max={lenderData.availableToWithdraw}
                      className={`w-full px-3 py-2 pr-16 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        withdrawAmount && !isValidWithdrawAmount(withdrawAmount)
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      }`}
                      disabled={isLoading || parseFloat(lenderData.availableToWithdraw) === 0}
                    />
                    <button
                      type="button"
                      onClick={handleMaxWithdraw}
                      disabled={isLoading || parseFloat(lenderData.availableToWithdraw) === 0}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded disabled:opacity-50"
                    >
                      Max
                    </button>
                  </div>
                  {withdrawAmount && !isValidWithdrawAmount(withdrawAmount) && (
                    <p className="text-sm text-red-600 mt-1">
                      Amount exceeds available balance
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Available: {lenderData.availableToWithdraw} ETH
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    isLoading || 
                    !withdrawAmount || 
                    !isValidWithdrawAmount(withdrawAmount) ||
                    parseFloat(lenderData.availableToWithdraw) === 0
                  }
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Withdraw ETH'}
                </button>
              </form>

              {parseFloat(lenderData.availableToWithdraw) === 0 && parseFloat(lenderData.depositAmount) > 0 && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-900">Withdrawal Unavailable</p>
                      <p className="text-xs text-yellow-800 mt-1">
                        Your funds are currently backing active MockDAI loans. You can withdraw once borrowers repay their loans.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {parseFloat(lenderData.availableToWithdraw) === 0 && parseFloat(lenderData.depositAmount) === 0 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  No funds deposited
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-8">
          <TransactionHistory account={account} contract={contract} />
        </div>
      </div>
    </div>
  );
};

export default memo(LenderDashboard);