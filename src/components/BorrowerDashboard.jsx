import { useState, useEffect, useCallback, memo } from 'react';
import { ethers } from 'ethers';
import useWallet from '../hooks/useWallet';
import useContract from '../hooks/useContract';
import useTokenContract from '../hooks/useTokenContract';
import TransactionStatus from './TransactionStatus';
import LiquidationMonitor from './LiquidationMonitor';
import TransactionHistory from './TransactionHistory';
import WalletBalance from './WalletBalance';
import MockDaiBalance from './MockDaiBalance';
import useRealTimeUpdates from '../hooks/useRealTimeUpdates';
import { formatEther, formatTimeRemaining, calculateTimeRemaining, LOAN_CONTRACT_ADDRESS } from '../utils/contractHelpers';

const BorrowerDashboard = () => {
  const { isConnected, account, isCorrectNetwork } = useWallet();
  const contract = useContract(account, isCorrectNetwork);
  const tokenContract = useTokenContract(account, isCorrectNetwork);

  // State for borrower data
  const [borrowerData, setBorrowerData] = useState({
    collateralAmount: '0',
    loanAmount: '0',
    interest: '0',
    startTime: 0,
    dueTime: 0,
    repaid: false,
    liquidated: false,
    hasActiveLoan: false,
    collateralRatio: 0,
    timeRemaining: 0,
    repaymentAmount: '0'
  });

  // State for MockDAI token data
  const [tokenData, setTokenData] = useState({
    balance: '0',
    allowance: '0',
    needsApproval: true
  });

  // State for pool data
  const [poolData, setPoolData] = useState({
    poolBalance: '0',
    availableBorrowAmount: '0'
  });

  // Form states
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');

  // Transaction states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data loading state
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Real-time updates
  const { lastUpdate, isUpdating } = useRealTimeUpdates(contract, account);

  // Load borrower data
  const loadBorrowerData = useCallback(async () => {
    if (!contract.isReady) return;

    try {
      setIsDataLoading(true);
      
      const [loanDetails, poolBalance, availableBorrowAmount, repaymentAmount] = await Promise.all([
        contract.getLoanDetails(account),
        contract.getPoolBalance(),
        contract.getAvailableBorrowAmount(account),
        contract.calculateRepaymentAmount(account)
      ]);

      // Always set the data, even if it's 0
      const hasActiveLoan = loanDetails && loanDetails.loanAmount > 0 && !loanDetails.repaid && !loanDetails.liquidated;
      const timeRemaining = hasActiveLoan ? calculateTimeRemaining(loanDetails.dueTime) : 0;
      
      // Calculate collateral ratio (ETH collateral vs MockDAI loan)
      let collateralRatio = 0;
      if (hasActiveLoan && loanDetails.loanAmount > 0) {
        collateralRatio = (parseFloat(formatEther(loanDetails.collateralAmount)) / parseFloat(formatEther(loanDetails.loanAmount))) * 100;
      }

      const collateralAmountFormatted = loanDetails ? formatEther(loanDetails.collateralAmount) : '0';
      const poolBalanceFormatted = poolBalance !== null && poolBalance !== undefined ? formatEther(poolBalance) : '0';
      const availableBorrowFormatted = availableBorrowAmount !== null && availableBorrowAmount !== undefined ? formatEther(availableBorrowAmount) : '0';

      setBorrowerData({
        collateralAmount: collateralAmountFormatted,
        loanAmount: loanDetails ? formatEther(loanDetails.loanAmount) : '0',
        interest: loanDetails ? formatEther(loanDetails.interest) : '0',
        startTime: loanDetails ? Number(loanDetails.startTime) : 0,
        dueTime: loanDetails ? Number(loanDetails.dueTime) : 0,
        repaid: loanDetails ? loanDetails.repaid : false,
        liquidated: loanDetails ? loanDetails.liquidated : false,
        hasActiveLoan,
        collateralRatio,
        timeRemaining,
        repaymentAmount: repaymentAmount !== null && repaymentAmount !== undefined ? formatEther(repaymentAmount) : '0'
      });

      setPoolData({
        poolBalance: poolBalanceFormatted,
        availableBorrowAmount: availableBorrowFormatted
      });
    } catch (error) {
      console.error('Error loading borrower data:', error);
      setError('Failed to load borrower data');
    } finally {
      setIsDataLoading(false);
    }
  }, [contract, account]);

  // Load MockDAI token data
  const loadTokenData = useCallback(async () => {
    if (!tokenContract.isReady) return;

    try {
      const [balance, allowance] = await Promise.all([
        tokenContract.balanceOf(account),
        tokenContract.allowance(account, LOAN_CONTRACT_ADDRESS)
      ]);

      // Check if approval is needed (only for principal, not interest)
      let needsApproval = true;
      try {
        const allowanceBigInt = BigInt(allowance);
        const principalBigInt = borrowerData.loanAmount && borrowerData.loanAmount !== '0' 
          ? ethers.parseEther(borrowerData.loanAmount) 
          : 0n;
        
        needsApproval = allowanceBigInt === 0n || (principalBigInt > 0n && allowanceBigInt < principalBigInt);
      } catch (e) {
        console.error('Error calculating needsApproval:', e);
        needsApproval = allowance === '0';
      }

      console.log('Token data loaded:', { balance, allowance, needsApproval });

      setTokenData({
        balance,
        allowance,
        needsApproval
      });
    } catch (error) {
      console.error('Error loading token data:', error);
    }
  }, [tokenContract, account, borrowerData.loanAmount]);

  // Load data on component mount and contract ready
  useEffect(() => {
    if (contract.isReady) {
      loadBorrowerData();
    }
  }, [contract.isReady, loadBorrowerData]);

  // Load token data when token contract is ready
  useEffect(() => {
    if (tokenContract.isReady) {
      loadTokenData();
    }
  }, [tokenContract.isReady, loadTokenData, borrowerData.loanAmount]);

  // Reload data when real-time updates occur
  useEffect(() => {
    if (contract.isReady && lastUpdate) {
      loadBorrowerData();
    }
  }, [lastUpdate, contract.isReady, loadBorrowerData]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!contract.isReady) return;

    const cleanup = contract.setupEventListeners({
      onCollateralDeposited: (borrower) => {
        if (borrower.toLowerCase() === account.toLowerCase()) {
          loadBorrowerData(); // Refresh data when user deposits collateral
        }
      },
      onLoanIssued: (borrower) => {
        if (borrower.toLowerCase() === account.toLowerCase()) {
          loadBorrowerData(); // Refresh data when user borrows
        }
      },
      onLoanRepaid: (borrower) => {
        if (borrower.toLowerCase() === account.toLowerCase()) {
          loadBorrowerData(); // Refresh data when user repays
        }
      },
      onLiquidated: (borrower) => {
        if (borrower.toLowerCase() === account.toLowerCase()) {
          loadBorrowerData(); // Refresh data when user is liquidated
        }
      }
    });

    return cleanup;
  }, [contract.isReady, contract, account, loadBorrowerData]);

  // Handle collateral deposit
  const handleDepositCollateral = async (e) => {
    e.preventDefault();
    
    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      setError('Please enter a valid collateral amount');
      return;
    }

    if (!isValidCollateralAmount(collateralAmount)) {
      setError('Please enter a valid collateral amount between 0 and 1000 ETH');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const receipt = await contract.depositCollateral(
        collateralAmount,
        async (receipt) => {
          setSuccess(`Successfully deposited ${collateralAmount} ETH as collateral. Transaction: ${receipt.hash}`);
          setCollateralAmount('');
          // Wait a moment for blockchain state to update, then refresh
          setTimeout(() => {
            loadBorrowerData();
          }, 1000);
        },
        (error) => {
          console.error('Collateral deposit error:', error);
          setError(error.message || 'Collateral deposit transaction failed');
        }
      );

      if (receipt) {
        console.log('Collateral deposit transaction confirmed:', receipt.hash);
        // Also refresh immediately after receipt
        await loadBorrowerData();
      }
    } catch (error) {
      console.error('Collateral deposit failed:', error);
      setError(error.message || 'Collateral deposit failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle borrow request (now borrows MockDAI)
  const handleBorrow = async (e) => {
    e.preventDefault();
    
    if (!borrowAmount || parseFloat(borrowAmount) <= 0) {
      setError('Please enter a valid borrow amount');
      return;
    }

    if (!isValidBorrowAmount(borrowAmount)) {
      setError('Borrow amount exceeds available capacity or pool liquidity');
      return;
    }

    if (borrowerData.hasActiveLoan) {
      setError('You already have an active loan. Please repay it first.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const receipt = await contract.borrow(
        borrowAmount,
        async (receipt) => {
          setSuccess(`Successfully borrowed ${borrowAmount} mDAI. Transaction: ${receipt.hash}`);
          setBorrowAmount('');
          // Wait a moment for blockchain state to update, then refresh
          setTimeout(() => {
            loadBorrowerData();
            loadTokenData();
          }, 1000);
        },
        (error) => {
          console.error('Borrow error:', error);
          setError(error.message || 'Borrow transaction failed');
        }
      );

      if (receipt) {
        console.log('Borrow transaction confirmed:', receipt.hash);
        // Also refresh immediately after receipt
        await loadBorrowerData();
        await loadTokenData();
      }
    } catch (error) {
      console.error('Borrow failed:', error);
      setError(error.message || 'Borrow failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle MockDAI approval for repayment
  const handleApproveToken = async () => {
    console.log('Approve button clicked');
    console.log('Token contract ready:', tokenContract.isReady);
    console.log('Has active loan:', borrowerData.hasActiveLoan);
    console.log('Token contract object:', tokenContract);
    
    if (!tokenContract.isReady) {
      setError('MockDAI token contract not initialized. Please ensure REACT_APP_MOCK_TOKEN_ADDRESS is set in your .env file and the contract is deployed.');
      return;
    }

    if (!borrowerData.hasActiveLoan) {
      setError('No active loan to approve for');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Approve a large amount (or unlimited) for convenience
      const approvalAmount = ethers.parseEther('1000000'); // 1M mDAI
      console.log('Approving amount:', approvalAmount.toString());
      console.log('Loan contract address:', LOAN_CONTRACT_ADDRESS);
      
      const receipt = await tokenContract.approve(
        LOAN_CONTRACT_ADDRESS,
        approvalAmount,
        async (receipt) => {
          setSuccess(`Successfully approved MockDAI spending. Transaction: ${receipt.hash}`);
          setTimeout(() => {
            loadTokenData();
          }, 1000);
        },
        (error) => {
          console.error('Approval error:', error);
          setError(error.message || 'Approval transaction failed');
        }
      );

      if (receipt) {
        console.log('Approval transaction confirmed:', receipt.hash);
        await loadTokenData();
      }
    } catch (error) {
      console.error('Approval failed:', error);
      setError(error.message || 'Approval failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle loan repayment (now repays in MockDAI)
  const handleRepayLoan = async () => {
    if (!borrowerData.hasActiveLoan) {
      setError('No active loan to repay');
      return;
    }

    // Check if approval is needed
    if (tokenData.needsApproval) {
      setError('Please approve MockDAI spending first');
      return;
    }

    console.log('Repaying loan...');
    console.log('Principal amount:', borrowerData.loanAmount);
    console.log('MockDAI balance:', tokenData.balance);
    console.log('MockDAI allowance:', tokenData.allowance);

    // Check if user has enough MockDAI balance (only need principal, not interest)
    try {
      const balanceBigInt = BigInt(tokenData.balance);
      const principalBigInt = ethers.parseEther(borrowerData.loanAmount);
      
      if (balanceBigInt < principalBigInt) {
        setError(`Insufficient MockDAI balance. You have ${ethers.formatEther(tokenData.balance)} mDAI but need ${borrowerData.loanAmount} mDAI to repay the principal.`);
        return;
      }
    } catch (e) {
      console.error('Error checking balance:', e);
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const receipt = await contract.repayLoan(
        borrowerData.loanAmount,
        async (receipt) => {
          const collateralReturned = (parseFloat(borrowerData.collateralAmount) * 0.95).toFixed(4);
          setSuccess(`Successfully repaid ${borrowerData.loanAmount} mDAI. Received ${collateralReturned} ETH collateral back. Transaction: ${receipt.hash}`);
          // Wait a moment for blockchain state to update, then refresh
          setTimeout(() => {
            loadBorrowerData();
            loadTokenData();
          }, 1000);
        },
        (error) => {
          console.error('Repayment error:', error);
          setError(error.message || 'Repayment transaction failed');
        }
      );

      if (receipt) {
        console.log('Repayment transaction confirmed:', receipt.hash);
        // Also refresh immediately after receipt
        await loadBorrowerData();
        await loadTokenData();
      }
    } catch (error) {
      console.error('Repayment failed:', error);
      setError(error.message || 'Repayment failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear transaction messages
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Handle max collateral (set to user's ETH balance or a reasonable max)
  const handleMaxCollateral = () => {
    // For now, set a reasonable max. In a real app, we'd get user's ETH balance
    setCollateralAmount('1.0');
  };

  // Handle max borrow
  const handleMaxBorrow = () => {
    setBorrowAmount(poolData.availableBorrowAmount);
  };

  // Validation functions
  const isValidCollateralAmount = (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 1000; // Max 1000 ETH for safety
  };

  const isValidBorrowAmount = (amount) => {
    const num = parseFloat(amount);
    const maxBorrow = parseFloat(poolData.availableBorrowAmount);
    const poolBalance = parseFloat(poolData.poolBalance);
    return !isNaN(num) && num > 0 && num <= maxBorrow && num <= poolBalance;
  };

  // Get collateral ratio status
  const getCollateralRatioStatus = () => {
    if (!borrowerData.hasActiveLoan) return { status: 'none', color: 'gray' };
    
    if (borrowerData.collateralRatio < 150) {
      return { status: 'liquidatable', color: 'red' };
    } else if (borrowerData.collateralRatio < 160) {
      return { status: 'warning', color: 'yellow' };
    } else {
      return { status: 'healthy', color: 'green' };
    }
  };

  const ratioStatus = getCollateralRatioStatus();

  if (!isConnected || !isCorrectNetwork) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-16">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Borrower Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet and ensure you're on Sepolia testnet to access the borrower dashboard
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
            <h1 className="text-3xl font-bold text-gray-900">Borrower Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your collateral and loans</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <WalletBalance 
            account={account}
            isConnected={isConnected}
            isCorrectNetwork={isCorrectNetwork}
          />
          <MockDaiBalance 
            account={account}
            isCorrectNetwork={isCorrectNetwork}
            loanContractAddress={LOAN_CONTRACT_ADDRESS}
          />
        </div>

        {/* Transaction Status */}
        <TransactionStatus
          isLoading={isLoading}
          error={error}
          success={success}
          onClearMessages={clearMessages}
          className="mb-6"
        />

        {/* Liquidation Monitor - Show if user has active loan */}
        {borrowerData.hasActiveLoan && (
          <div className="mb-6">
            <LiquidationMonitor account={account} />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Collateral and Loan Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Collateral and Loan Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Position</h2>
              
              {isDataLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">Collateral Deposited</p>
                        <p className="text-2xl font-bold text-blue-900">{borrowerData.collateralAmount} ETH</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-600">Active Loan (MockDAI)</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {borrowerData.hasActiveLoan ? `${borrowerData.loanAmount} mDAI` : 'None'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Loan Details */}
            {borrowerData.hasActiveLoan && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Loan Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Interest (5%)</p>
                    <p className="text-xl font-bold text-gray-900">{borrowerData.interest} mDAI</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Repayment (MockDAI)</p>
                    <p className="text-xl font-bold text-gray-900">{borrowerData.repaymentAmount} mDAI</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Time Remaining</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatTimeRemaining(borrowerData.timeRemaining)}
                    </p>
                  </div>
                </div>

                {/* Collateral Ratio Warning */}
                <div className={`mt-4 p-4 rounded-lg border ${
                  ratioStatus.color === 'red' ? 'bg-red-50 border-red-200' :
                  ratioStatus.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-5 w-5 rounded-full ${
                      ratioStatus.color === 'red' ? 'bg-red-500' :
                      ratioStatus.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        ratioStatus.color === 'red' ? 'text-red-800' :
                        ratioStatus.color === 'yellow' ? 'text-yellow-800' :
                        'text-green-800'
                      }`}>
                        Collateral Ratio: {borrowerData.collateralRatio.toFixed(1)}% (ETH/mDAI)
                      </p>
                      <p className={`text-sm ${
                        ratioStatus.color === 'red' ? 'text-red-600' :
                        ratioStatus.color === 'yellow' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {ratioStatus.status === 'liquidatable' && 'Warning: Your position may be liquidated!'}
                        {ratioStatus.status === 'warning' && 'Caution: Consider adding more ETH collateral'}
                        {ratioStatus.status === 'healthy' && 'Your position is healthy'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pool Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pool Information</h2>
              
              {isDataLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Pool Balance</p>
                    <p className="text-xl font-bold text-gray-900">{poolData.poolBalance} ETH</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Your Max Borrow</p>
                    <p className="text-xl font-bold text-gray-900">{poolData.availableBorrowAmount} ETH</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Collateral Deposit Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deposit Collateral</h3>
              
              <form onSubmit={handleDepositCollateral} className="space-y-4">
                <div>
                  <label htmlFor="collateralAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (ETH)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="collateralAmount"
                      value={collateralAmount}
                      onChange={(e) => setCollateralAmount(e.target.value)}
                      placeholder="0.0"
                      step="0.001"
                      min="0"
                      max="1000"
                      className={`w-full px-3 py-2 pr-16 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        collateralAmount && !isValidCollateralAmount(collateralAmount)
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={handleMaxCollateral}
                      disabled={isLoading}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded disabled:opacity-50"
                    >
                      Max
                    </button>
                  </div>
                  {collateralAmount && !isValidCollateralAmount(collateralAmount) && (
                    <p className="text-sm text-red-600 mt-1">
                      Please enter a valid amount between 0 and 1000 ETH
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !collateralAmount || !isValidCollateralAmount(collateralAmount)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Deposit Collateral'}
                </button>
              </form>
            </div>

            {/* Borrow Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Borrow MockDAI</h3>
              
              <form onSubmit={handleBorrow} className="space-y-4">
                <div>
                  <label htmlFor="borrowAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (mDAI)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="borrowAmount"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                      placeholder="0.0"
                      step="0.001"
                      min="0"
                      max={poolData.availableBorrowAmount}
                      className={`w-full px-3 py-2 pr-16 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        borrowAmount && !isValidBorrowAmount(borrowAmount)
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      }`}
                      disabled={isLoading || borrowerData.hasActiveLoan || parseFloat(poolData.availableBorrowAmount) === 0}
                    />
                    <button
                      type="button"
                      onClick={handleMaxBorrow}
                      disabled={isLoading || borrowerData.hasActiveLoan || parseFloat(poolData.availableBorrowAmount) === 0}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded disabled:opacity-50"
                    >
                      Max
                    </button>
                  </div>
                  {borrowAmount && !isValidBorrowAmount(borrowAmount) && (
                    <p className="text-sm text-red-600 mt-1">
                      Amount exceeds available capacity or pool liquidity
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Available: {poolData.availableBorrowAmount} mDAI (backed by {poolData.poolBalance} ETH)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    isLoading || 
                    !borrowAmount || 
                    !isValidBorrowAmount(borrowAmount) ||
                    borrowerData.hasActiveLoan ||
                    parseFloat(poolData.availableBorrowAmount) === 0
                  }
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Borrow MockDAI'}
                </button>

                {borrowerData.hasActiveLoan && (
                  <p className="text-sm text-gray-500 text-center">
                    You already have an active loan
                  </p>
                )}
              </form>
            </div>

            {/* Repayment Form */}
            {borrowerData.hasActiveLoan && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Repay Loan</h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">MockDAI Repayment Required</p>
                      <p className="text-2xl font-bold text-gray-900">{borrowerData.loanAmount} mDAI</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Principal only (interest deducted from ETH collateral)
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <p className="text-xs text-gray-600">Interest Payment (5% of collateral)</p>
                        <p className="text-sm font-medium text-gray-900">
                          {borrowerData.interest} ETH deducted from collateral
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          You'll receive back: {(parseFloat(borrowerData.collateralAmount) * 0.95).toFixed(4)} ETH
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* MockDAI Approval Status */}
                  {tokenData.needsApproval && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-yellow-800">Approval Required</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            You need to approve MockDAI spending before repaying your loan
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Approve Button */}
                  {tokenData.needsApproval && (
                    <button
                      onClick={handleApproveToken}
                      disabled={isLoading}
                      className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Processing...' : 'Approve MockDAI Spending'}
                    </button>
                  )}

                  {/* Repay Button */}
                  <button
                    onClick={handleRepayLoan}
                    disabled={isLoading || tokenData.needsApproval}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Processing...' : 'Repay Loan'}
                  </button>

                  {!tokenData.needsApproval && (
                    <p className="text-xs text-green-600 text-center">
                      ✓ MockDAI spending approved
                    </p>
                  )}
                </div>
              </div>
            )}
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

export default memo(BorrowerDashboard);