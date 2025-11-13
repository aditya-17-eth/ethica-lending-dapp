import { useState, useEffect, useCallback } from 'react';
import useContract from '../hooks/useContract';
import { formatEther, formatTimeRemaining, calculateTimeRemaining } from '../utils/contractHelpers';

const LiquidationMonitor = ({ account, isVisible = true }) => {
  const contract = useContract(account, true);
  
  // State for liquidatable positions
  const [liquidatablePositions, setLiquidatablePositions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State for liquidation transaction
  const [liquidatingAddress, setLiquidatingAddress] = useState('');

  // Load liquidatable positions (in a real app, this would query multiple addresses)
  const loadLiquidatablePositions = useCallback(async () => {
    if (!contract.isReady) return;

    setIsLoading(true);
    try {
      // For demo purposes, we'll check the current user's position
      // In a real app, you'd have a way to track all borrower addresses
      const positions = [];
      
      if (account) {
        const [loanDetails, isLiquidatable] = await Promise.all([
          contract.getLoanDetails(account),
          contract.isLoanLiquidatable(account)
        ]);

        if (loanDetails && loanDetails.loanAmount > 0 && !loanDetails.repaid && !loanDetails.liquidated) {
          const timeRemaining = calculateTimeRemaining(loanDetails.dueTime);
          const collateralRatio = loanDetails.loanAmount > 0 
            ? (parseFloat(formatEther(loanDetails.collateralAmount)) / parseFloat(formatEther(loanDetails.loanAmount))) * 100
            : 0;

          positions.push({
            borrower: account,
            collateralAmount: formatEther(loanDetails.collateralAmount),
            loanAmount: formatEther(loanDetails.loanAmount),
            collateralRatio,
            timeRemaining,
            isLiquidatable,
            isOverdue: timeRemaining <= 0,
            riskLevel: getRiskLevel(collateralRatio, timeRemaining)
          });
        }
      }

      setLiquidatablePositions(positions);
    } catch (error) {
      console.error('Error loading liquidatable positions:', error);
      setError('Failed to load liquidation data');
    } finally {
      setIsLoading(false);
    }
  }, [contract, account]);

  // Load data on component mount and contract ready
  useEffect(() => {
    if (contract.isReady) {
      loadLiquidatablePositions();
    }
  }, [contract.isReady, loadLiquidatablePositions]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!contract.isReady) return;

    const cleanup = contract.setupEventListeners({
      onLoanIssued: () => {
        loadLiquidatablePositions();
      },
      onLoanRepaid: () => {
        loadLiquidatablePositions();
      },
      onLiquidated: (borrower) => {
        loadLiquidatablePositions();
        if (borrower.toLowerCase() === account?.toLowerCase()) {
          setSuccess('Your position has been liquidated');
        }
      },
      onCollateralDeposited: () => {
        loadLiquidatablePositions();
      }
    });

    return cleanup;
  }, [contract.isReady, contract, account, loadLiquidatablePositions]);

  // Handle liquidation
  const handleLiquidate = async (borrowerAddress) => {
    if (!contract.isReady) return;

    setLiquidatingAddress(borrowerAddress);
    setError('');
    setSuccess('');

    try {
      const receipt = await contract.liquidate(
        borrowerAddress,
        (receipt) => {
          setSuccess(`Successfully liquidated position. Transaction: ${receipt.hash}`);
          loadLiquidatablePositions(); // Refresh data
        },
        (error) => {
          console.error('Liquidation error:', error);
          setError(error.message || 'Liquidation transaction failed');
        }
      );

      if (receipt) {
        console.log('Liquidation transaction confirmed:', receipt.hash);
      }
    } catch (error) {
      console.error('Liquidation failed:', error);
      setError(error.message || 'Liquidation failed');
    } finally {
      setLiquidatingAddress('');
    }
  };

  // Get risk level based on collateral ratio and time
  const getRiskLevel = (collateralRatio, timeRemaining) => {
    if (collateralRatio < 150 || timeRemaining <= 0) {
      return 'critical';
    } else if (collateralRatio < 160 || timeRemaining < 86400) { // Less than 1 day
      return 'high';
    } else if (collateralRatio < 170 || timeRemaining < 259200) { // Less than 3 days
      return 'medium';
    } else {
      return 'low';
    }
  };

  // Get risk level styling
  const getRiskLevelStyle = (riskLevel) => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-green-100 border-green-300 text-green-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  // Get risk level icon
  const getRiskLevelIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'critical':
        return (
          <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'high':
        return (
          <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Clear messages
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Liquidation Monitor</h2>
        <button
          onClick={loadLiquidatablePositions}
          disabled={isLoading}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={clearMessages}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-green-600">{success}</p>
            <button
              onClick={clearMessages}
              className="text-green-400 hover:text-green-600"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Positions List */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      ) : liquidatablePositions.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No positions at risk</h3>
          <p className="mt-1 text-sm text-gray-500">All loan positions are currently healthy</p>
        </div>
      ) : (
        <div className="space-y-4">
          {liquidatablePositions.map((position, index) => (
            <div
              key={`${position.borrower}-${index}`}
              className={`border rounded-lg p-4 ${getRiskLevelStyle(position.riskLevel)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getRiskLevelIcon(position.riskLevel)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="text-sm font-medium truncate">
                        {position.borrower === account ? 'Your Position' : `${position.borrower.slice(0, 6)}...${position.borrower.slice(-4)}`}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        position.riskLevel === 'critical' ? 'bg-red-200 text-red-800' :
                        position.riskLevel === 'high' ? 'bg-orange-200 text-orange-800' :
                        position.riskLevel === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {position.riskLevel} risk
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Collateral:</span>
                        <br />
                        {position.collateralAmount} ETH
                      </div>
                      <div>
                        <span className="font-medium">Loan:</span>
                        <br />
                        {position.loanAmount} ETH
                      </div>
                      <div>
                        <span className="font-medium">Ratio:</span>
                        <br />
                        {position.collateralRatio.toFixed(1)}%
                      </div>
                      <div>
                        <span className="font-medium">Time Left:</span>
                        <br />
                        {position.isOverdue ? 'Overdue' : formatTimeRemaining(position.timeRemaining)}
                      </div>
                    </div>

                    {/* Warning Messages */}
                    {position.riskLevel === 'critical' && (
                      <div className="mt-2 text-xs font-medium">
                        {position.isOverdue && position.collateralRatio < 150 
                          ? '⚠️ Position is overdue AND undercollateralized - liquidation available'
                          : position.isOverdue 
                          ? '⚠️ Position is overdue - liquidation available'
                          : '⚠️ Position is undercollateralized - liquidation available'
                        }
                      </div>
                    )}
                    {position.riskLevel === 'high' && (
                      <div className="mt-2 text-xs">
                        ⚠️ Position approaching liquidation threshold
                      </div>
                    )}
                  </div>
                </div>

                {/* Liquidation Button */}
                {position.isLiquidatable && (
                  <div className="flex-shrink-0 ml-4">
                    <button
                      onClick={() => handleLiquidate(position.borrower)}
                      disabled={liquidatingAddress === position.borrower}
                      className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {liquidatingAddress === position.borrower ? 'Liquidating...' : 'Liquidate'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Liquidation Information</h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>Positions can be liquidated when:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Collateral ratio falls below 150%</li>
                <li>Loan repayment deadline has passed</li>
              </ul>
              <p className="mt-2">Anyone can trigger liquidation and the collateral goes to the lending pool.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidationMonitor;