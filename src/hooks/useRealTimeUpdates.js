import { useState, useEffect, useCallback, useRef } from 'react';

const useRealTimeUpdates = (contract, account, updateInterval = 30000) => {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isUpdating, setIsUpdating] = useState(false);
  const intervalRef = useRef(null);
  const eventListenersRef = useRef(null);

  // Force update function
  const forceUpdate = useCallback(() => {
    setLastUpdate(Date.now());
  }, []);

  // Set up periodic updates
  useEffect(() => {
    if (!contract.isReady) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval for periodic updates
    intervalRef.current = setInterval(() => {
      setIsUpdating(true);
      forceUpdate();
      setTimeout(() => setIsUpdating(false), 1000);
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [contract.isReady, updateInterval, forceUpdate]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!contract.isReady) return;

    // Clean up existing listeners
    if (eventListenersRef.current) {
      eventListenersRef.current();
    }

    // Set up new event listeners
    eventListenersRef.current = contract.setupEventListeners({
      onLenderDeposit: (lender, amount) => {
        console.log('Real-time update: Lender deposit', { lender, amount });
        forceUpdate();
      },
      onLenderWithdraw: (lender, amount) => {
        console.log('Real-time update: Lender withdraw', { lender, amount });
        forceUpdate();
      },
      onCollateralDeposited: (borrower, amount) => {
        console.log('Real-time update: Collateral deposited', { borrower, amount });
        forceUpdate();
      },
      onLoanIssued: (borrower, loanAmount, interest, dueTime) => {
        console.log('Real-time update: Loan issued', { borrower, loanAmount, interest, dueTime });
        forceUpdate();
      },
      onLoanRepaid: (borrower, totalAmount) => {
        console.log('Real-time update: Loan repaid', { borrower, totalAmount });
        forceUpdate();
      },
      onLiquidated: (borrower, collateralAmount) => {
        console.log('Real-time update: Position liquidated', { borrower, collateralAmount });
        forceUpdate();
      }
    });

    return () => {
      if (eventListenersRef.current) {
        eventListenersRef.current();
      }
    };
  }, [contract.isReady, contract, forceUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (eventListenersRef.current) {
        eventListenersRef.current();
      }
    };
  }, []);

  return {
    lastUpdate,
    isUpdating,
    forceUpdate
  };
};

export default useRealTimeUpdates;