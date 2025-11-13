import useEthBalance from '../hooks/useEthBalance';

const WalletBalance = ({ account, isConnected, isCorrectNetwork, className = '' }) => {
  const { balance, isLoading, error } = useEthBalance(account, isConnected, isCorrectNetwork);

  if (!isConnected || !isCorrectNetwork) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">Available ETH Balance</p>
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span className="text-lg font-bold">Loading...</span>
            </div>
          ) : error ? (
            <p className="text-lg font-bold text-red-200">Error loading balance</p>
          ) : (
            <p className="text-2xl font-bold">
              {parseFloat(balance).toFixed(4)} ETH
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <svg className="h-8 w-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
      </div>
      
      {account && (
        <p className="text-xs opacity-75 mt-2">
          {account.slice(0, 6)}...{account.slice(-4)}
        </p>
      )}
    </div>
  );
};

export default WalletBalance;