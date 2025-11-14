import React from 'react';
import Layout from '../components/layout/Layout';
import Breadcrumb from '../components/common/Breadcrumb';
import LiquidationMonitor from '../components/LiquidationMonitor';
import useWallet from '../hooks/useWallet';

/**
 * LiquidationPage Component
 * 
 * Wrapper page for the Liquidation Monitor that includes the layout structure
 * with navigation and breadcrumb navigation.
 * 
 * This component wraps the existing LiquidationMonitor component with the
 * new layout infrastructure (Navbar, Footer, Breadcrumb).
 */
const LiquidationPage = () => {
  const { isConnected, account, isCorrectNetwork } = useWallet();

  if (!isConnected || !isCorrectNetwork) {
    return (
      <Layout>
        <Breadcrumb items={['Home', 'Liquidation Monitor']} />
        <div className="bg-gray-50 flex items-center justify-center py-12 sm:py-16 px-4">
          <div className="text-center max-w-md mx-auto p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Liquidation Monitor</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Please connect your wallet and ensure you're on Sepolia testnet to access the liquidation monitor
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Breadcrumb items={['Home', 'Liquidation Monitor']} />
      <div className="bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 lg:mb-10">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Liquidation Monitor</h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 lg:mt-2">Monitor and liquidate at-risk positions</p>
            </div>
          </div>

          {/* Liquidation Monitor */}
          <LiquidationMonitor account={account} />
        </div>
      </div>
    </Layout>
  );
};

export default LiquidationPage;
