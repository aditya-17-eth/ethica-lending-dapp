import { useEffect } from 'react';
import useWallet from '../hooks/useWallet';
import useEthBalance from '../hooks/useEthBalance';

const DebugInfo = () => {
  const { isConnected, account, isCorrectNetwork, chainId } = useWallet();
  const { balance, isLoading, error } = useEthBalance(account, isConnected, isCorrectNetwork);

  useEffect(() => {
    console.log('🔍 Debug Info:');
    console.log('- isConnected:', isConnected);
    console.log('- account:', account);
    console.log('- isCorrectNetwork:', isCorrectNetwork);
    console.log('- chainId:', chainId);
    console.log('- balance:', balance);
    console.log('- isLoading:', isLoading);
    console.log('- error:', error);
    console.log('- window.ethereum:', !!window.ethereum);
    console.log('- Contract Address:', process.env.REACT_APP_CONTRACT_ADDRESS);
  }, [isConnected, account, isCorrectNetwork, chainId, balance, isLoading, error]);

  if (!isConnected) return null;

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-xs font-mono">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <div>Connected: {isConnected ? '✅' : '❌'}</div>
      <div>Account: {account || 'None'}</div>
      <div>Correct Network: {isCorrectNetwork ? '✅' : '❌'}</div>
      <div>Chain ID: {chainId || 'Unknown'}</div>
      <div>Balance: {balance} ETH</div>
      <div>Loading: {isLoading ? '⏳' : '✅'}</div>
      <div>Error: {error || 'None'}</div>
      <div>Contract: {process.env.REACT_APP_CONTRACT_ADDRESS || 'Not set'}</div>
    </div>
  );
};

export default DebugInfo;