import { useState, useCallback } from 'react';

const useTransactions = () => {
  const [transactions, setTransactions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Transaction states
  const TRANSACTION_STATES = {
    IDLE: 'idle',
    PENDING: 'pending',
    SUCCESS: 'success',
    ERROR: 'error'
  };

  // Add or update transaction
  const updateTransaction = useCallback((txId, state, data = {}) => {
    setTransactions(prev => ({
      ...prev,
      [txId]: {
        id: txId,
        state,
        timestamp: Date.now(),
        ...data
      }
    }));
  }, []);

  // Execute transaction with state management
  const executeTransaction = useCallback(async (
    txId,
    transactionFunction,
    successMessage = 'Transaction completed successfully',
    errorMessage = 'Transaction failed'
  ) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    updateTransaction(txId, TRANSACTION_STATES.PENDING, {
      message: 'Transaction pending...'
    });

    try {
      const result = await transactionFunction();
      
      if (result) {
        updateTransaction(txId, TRANSACTION_STATES.SUCCESS, {
          message: successMessage,
          txHash: result.hash,
          blockNumber: result.blockNumber
        });
        setSuccess(successMessage);
      } else {
        throw new Error('Transaction returned null result');
      }
      
      setIsLoading(false);
      return result;
    } catch (error) {
      console.error(`Transaction ${txId} failed:`, error);
      
      const errorMsg = error.message || errorMessage;
      updateTransaction(txId, TRANSACTION_STATES.ERROR, {
        message: errorMsg,
        error: error
      });
      
      setError(errorMsg);
      setIsLoading(false);
      return null;
    }
  }, [updateTransaction, TRANSACTION_STATES]);

  // Clear transaction history
  const clearTransactions = useCallback(() => {
    setTransactions({});
    setError('');
    setSuccess('');
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  // Get transaction by ID
  const getTransaction = useCallback((txId) => {
    return transactions[txId] || null;
  }, [transactions]);

  // Get all transactions
  const getAllTransactions = useCallback(() => {
    return Object.values(transactions).sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions]);

  // Get transactions by state
  const getTransactionsByState = useCallback((state) => {
    return Object.values(transactions)
      .filter(tx => tx.state === state)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions]);

  // Check if any transaction is pending
  const hasPendingTransactions = useCallback(() => {
    return Object.values(transactions).some(tx => tx.state === TRANSACTION_STATES.PENDING);
  }, [transactions, TRANSACTION_STATES]);

  // Get recent transactions (last 10)
  const getRecentTransactions = useCallback((limit = 10) => {
    return Object.values(transactions)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }, [transactions]);

  return {
    // State
    transactions,
    isLoading,
    error,
    success,
    
    // Transaction states enum
    TRANSACTION_STATES,
    
    // Methods
    executeTransaction,
    updateTransaction,
    clearTransactions,
    clearMessages,
    getTransaction,
    getAllTransactions,
    getTransactionsByState,
    getRecentTransactions,
    hasPendingTransactions,
    
    // Computed properties
    pendingTransactions: getTransactionsByState(TRANSACTION_STATES.PENDING),
    successfulTransactions: getTransactionsByState(TRANSACTION_STATES.SUCCESS),
    failedTransactions: getTransactionsByState(TRANSACTION_STATES.ERROR),
    recentTransactions: getRecentTransactions()
  };
};

export default useTransactions;