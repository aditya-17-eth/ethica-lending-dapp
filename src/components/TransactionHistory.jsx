import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { formatEther, formatTimestamp, MOCK_TOKEN_ADDRESS, MOCK_TOKEN_ABI } from '../utils/contractHelpers';

const TransactionHistory = ({ account, contract }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, lender, borrower, liquidation

  // Load transaction history from events
  const loadTransactionHistory = useCallback(async () => {
    if (!contract.isReady || !account) return;

    setIsLoading(true);
    try {
      // Get all events for the user
      const provider = contract.provider;
      const contractInstance = contract.contract;
      
      // Get current block number for filtering recent events
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks

      // Initialize MockToken contract for token events
      let tokenContract = null;
      if (MOCK_TOKEN_ADDRESS !== "0x0000000000000000000000000000000000000000") {
        tokenContract = new ethers.Contract(MOCK_TOKEN_ADDRESS, MOCK_TOKEN_ABI, provider);
      }

      // Fetch all relevant events
      const eventPromises = [
        contractInstance.queryFilter(
          contractInstance.filters.LenderDeposit(account),
          fromBlock,
          'latest'
        ),
        contractInstance.queryFilter(
          contractInstance.filters.LenderWithdraw(account),
          fromBlock,
          'latest'
        ),
        contractInstance.queryFilter(
          contractInstance.filters.CollateralDeposited(account),
          fromBlock,
          'latest'
        ),
        contractInstance.queryFilter(
          contractInstance.filters.LoanIssued(account),
          fromBlock,
          'latest'
        ),
        contractInstance.queryFilter(
          contractInstance.filters.LoanRepaid(account),
          fromBlock,
          'latest'
        ),
        contractInstance.queryFilter(
          contractInstance.filters.Liquidated(account),
          fromBlock,
          'latest'
        )
      ];

      // Add token transfer events if token contract is available
      if (tokenContract) {
        eventPromises.push(
          tokenContract.queryFilter(
            tokenContract.filters.Transfer(null, account),
            fromBlock,
            'latest'
          ),
          tokenContract.queryFilter(
            tokenContract.filters.Transfer(account, null),
            fromBlock,
            'latest'
          )
        );
      }

      const eventResults = await Promise.all(eventPromises);
      
      const [
        lenderDepositEvents,
        lenderWithdrawEvents,
        collateralDepositedEvents,
        loanIssuedEvents,
        loanRepaidEvents,
        liquidatedEvents,
        tokenReceiveEvents = [],
        tokenSendEvents = []
      ] = eventResults;

      // Process and combine all events
      const allTransactions = [];

      // Process lender deposit events
      lenderDepositEvents.forEach(event => {
        allTransactions.push({
          id: `${event.transactionHash}-${event.logIndex}`,
          type: 'lender_deposit',
          category: 'lender',
          title: 'Deposit to Pool',
          amount: formatEther(event.args.amount),
          timestamp: null, // Will be filled by block timestamp
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          status: 'completed',
          icon: 'deposit'
        });
      });

      // Process lender withdraw events
      lenderWithdrawEvents.forEach(event => {
        allTransactions.push({
          id: `${event.transactionHash}-${event.logIndex}`,
          type: 'lender_withdraw',
          category: 'lender',
          title: 'Withdraw from Pool',
          amount: formatEther(event.args.amount),
          timestamp: null,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          status: 'completed',
          icon: 'withdraw'
        });
      });

      // Process collateral deposit events
      collateralDepositedEvents.forEach(event => {
        allTransactions.push({
          id: `${event.transactionHash}-${event.logIndex}`,
          type: 'collateral_deposit',
          category: 'borrower',
          title: 'Deposit Collateral',
          amount: formatEther(event.args.amount),
          timestamp: null,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          status: 'completed',
          icon: 'collateral'
        });
      });

      // Process loan issued events
      loanIssuedEvents.forEach(event => {
        allTransactions.push({
          id: `${event.transactionHash}-${event.logIndex}`,
          type: 'loan_issued',
          category: 'borrower',
          title: 'Loan Borrowed (MockDAI)',
          amount: formatEther(event.args.loanAmount),
          currency: 'mDAI',
          timestamp: null,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          status: 'completed',
          icon: 'borrow',
          details: {
            interest: formatEther(event.args.interest),
            dueTime: Number(event.args.dueTime)
          }
        });
      });

      // Process loan repaid events
      loanRepaidEvents.forEach(event => {
        allTransactions.push({
          id: `${event.transactionHash}-${event.logIndex}`,
          type: 'loan_repaid',
          category: 'borrower',
          title: 'Loan Repaid (MockDAI)',
          amount: formatEther(event.args.totalAmount),
          currency: 'mDAI',
          timestamp: null,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          status: 'completed',
          icon: 'repay'
        });
      });

      // Process liquidation events
      liquidatedEvents.forEach(event => {
        allTransactions.push({
          id: `${event.transactionHash}-${event.logIndex}`,
          type: 'liquidated',
          category: 'liquidation',
          title: 'Position Liquidated',
          amount: formatEther(event.args.collateralAmount),
          currency: 'ETH',
          timestamp: null,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          status: 'completed',
          icon: 'liquidation'
        });
      });

      // Process MockToken receive events (incoming transfers)
      tokenReceiveEvents.forEach(event => {
        // Skip if it's from the zero address (minting) or from the loan contract (loan issuance already tracked)
        const loanContractAddr = contractInstance.target || contractInstance.address;
        if (event.args.from === ethers.ZeroAddress || 
            event.args.from.toLowerCase() === loanContractAddr.toLowerCase()) {
          return;
        }

        allTransactions.push({
          id: `${event.transactionHash}-${event.logIndex}`,
          type: 'token_receive',
          category: 'borrower',
          title: 'MockDAI Received',
          amount: formatEther(event.args.value),
          currency: 'mDAI',
          timestamp: null,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          status: 'completed',
          icon: 'deposit',
          details: {
            from: event.args.from
          }
        });
      });

      // Process MockToken send events (outgoing transfers)
      tokenSendEvents.forEach(event => {
        // Skip if it's to the loan contract (loan repayment already tracked)
        const loanContractAddr = contractInstance.target || contractInstance.address;
        if (event.args.to.toLowerCase() === loanContractAddr.toLowerCase()) {
          return;
        }

        allTransactions.push({
          id: `${event.transactionHash}-${event.logIndex}`,
          type: 'token_send',
          category: 'borrower',
          title: 'MockDAI Sent',
          amount: formatEther(event.args.value),
          currency: 'mDAI',
          timestamp: null,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          status: 'completed',
          icon: 'withdraw',
          details: {
            to: event.args.to
          }
        });
      });

      // Get block timestamps for all transactions
      const blockNumbers = [...new Set(allTransactions.map(tx => tx.blockNumber))];
      const blockTimestamps = {};
      
      await Promise.all(
        blockNumbers.map(async (blockNumber) => {
          try {
            const block = await provider.getBlock(blockNumber);
            blockTimestamps[blockNumber] = block.timestamp;
          } catch (error) {
            console.error(`Error fetching block ${blockNumber}:`, error);
            blockTimestamps[blockNumber] = Date.now() / 1000; // Fallback to current time
          }
        })
      );

      // Add timestamps and sort by most recent
      const transactionsWithTimestamps = allTransactions
        .map(tx => ({
          ...tx,
          timestamp: blockTimestamps[tx.blockNumber]
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      setTransactions(transactionsWithTimestamps);
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [contract, account]);

  // Load transaction history on component mount
  useEffect(() => {
    if (contract.isReady) {
      loadTransactionHistory();
    }
  }, [contract.isReady, loadTransactionHistory]);

  // Filter transactions based on selected filter
  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.category === filter;
  });

  // Get transaction icon
  const getTransactionIcon = (iconType) => {
    const iconClasses = "h-8 w-8";
    
    switch (iconType) {
      case 'deposit':
        return (
          <div className="bg-green-100 rounded-full p-2">
            <svg className={`${iconClasses} text-green-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'withdraw':
        return (
          <div className="bg-blue-100 rounded-full p-2">
            <svg className={`${iconClasses} text-blue-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        );
      case 'collateral':
        return (
          <div className="bg-purple-100 rounded-full p-2">
            <svg className={`${iconClasses} text-purple-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        );
      case 'borrow':
        return (
          <div className="bg-orange-100 rounded-full p-2">
            <svg className={`${iconClasses} text-orange-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      case 'repay':
        return (
          <div className="bg-green-100 rounded-full p-2">
            <svg className={`${iconClasses} text-green-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'liquidation':
        return (
          <div className="bg-red-100 rounded-full p-2">
            <svg className={`${iconClasses} text-red-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 rounded-full p-2">
            <svg className={`${iconClasses} text-gray-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
        <div className="flex items-center space-x-2">
          {/* Filter buttons */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Transactions</option>
            <option value="lender">Lender Activity</option>
            <option value="borrower">Borrower Activity</option>
            <option value="liquidation">Liquidations</option>
          </select>
          <button
            onClick={loadTransactionHistory}
            disabled={isLoading}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'Your transaction history will appear here'
              : `No ${filter} transactions found`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Transaction Icon */}
              <div className="flex-shrink-0">
                {getTransactionIcon(transaction.icon)}
              </div>

              {/* Transaction Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {transaction.title}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {transaction.amount} {transaction.currency || 'ETH'}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(transaction.timestamp)}
                  </p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${transaction.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View on Etherscan
                  </a>
                </div>
                {/* Additional details for loan transactions */}
                {transaction.details && (
                  <div className="mt-1 text-xs text-gray-500">
                    {transaction.type === 'loan_issued' && (
                      <span>Interest: {transaction.details.interest} mDAI</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;