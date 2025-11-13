import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WalletConnection from './components/WalletConnection';
import LenderDashboard from './components/LenderDashboard';
import BorrowerDashboard from './components/BorrowerDashboard';
import LiquidationMonitor from './components/LiquidationMonitor';
import DebugInfo from './components/DebugInfo';
import useWallet from './hooks/useWallet';
import './App.css';

// Liquidation page component
const LiquidationPage = () => {
  const { isConnected, account, isCorrectNetwork } = useWallet();

  if (!isConnected || !isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Liquidation Monitor</h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet and ensure you're on Sepolia testnet to access the liquidation monitor
          </p>
          <WalletConnection />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Liquidation Monitor</h1>
            <p className="text-gray-600 mt-1">Monitor and liquidate at-risk positions</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
            </div>
            <a
              href="/"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Back to Home
            </a>
          </div>
        </div>

        {/* Liquidation Monitor */}
        <LiquidationMonitor account={account} />
      </div>
    </div>
  );
};

// Placeholder components for routing structure
const HomePage = () => {
  const { isConnected, account, isCorrectNetwork } = useWallet();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Ethica Lending dApp</h1>
        <p className="text-lg text-gray-600 mb-8">
          Decentralized peer-to-peer lending platform
        </p>
        
        <div className="mb-8">
          <WalletConnection />
        </div>

        {/* Debug Info - Remove this after testing */}
        <div className="mb-4">
          <DebugInfo />
        </div>

        {isConnected && isCorrectNetwork && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Choose your role to get started:
            </p>
            <div className="space-y-3">
              <a
                href="/lender"
                className="block w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Lender Dashboard
              </a>
              <a
                href="/borrower"
                className="block w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Borrower Dashboard
              </a>
              <a
                href="/liquidation"
                className="block w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Liquidation Monitor
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};





function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lender" element={<LenderDashboard />} />
          <Route path="/borrower" element={<BorrowerDashboard />} />
          <Route path="/liquidation" element={<LiquidationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;