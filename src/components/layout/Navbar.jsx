import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import useWallet from '../../hooks/useWallet';
import { routes, navigationLinks } from '../../utils/navigation';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { isConnected, account, isCorrectNetwork, connectWallet } = useWallet();

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link to={routes.home} className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold text-blue-600">Ethica</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-4 lg:space-x-8" role="list">
            {navigationLinks.map((link) => (
              <motion.div
                key={link.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm lg:text-base font-medium transition-colors ${
                    isActivePath(link.path)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  aria-current={isActivePath(link.path) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Wallet Connection Status */}
          <div className="hidden md:flex md:items-center md:space-x-3 lg:space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-2">
                {/* Network Status Indicator */}
                <div
                  className={`w-2 h-2 rounded-full ${
                    isCorrectNetwork ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  title={isCorrectNetwork ? 'Connected to correct network' : 'Wrong network'}
                  role="status"
                  aria-label={isCorrectNetwork ? 'Connected to correct network' : 'Wrong network'}
                />
                {/* Wallet Address */}
                <span className="text-xs lg:text-sm text-gray-700 font-medium">
                  {formatAddress(account)}
                </span>
              </div>
            ) : (
              <motion.button
                onClick={connectWallet}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Connect wallet"
              >
                Connect Wallet
              </motion.button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <motion.button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          className="md:hidden border-t border-gray-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationLinks.map((link, index) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActivePath(link.path)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  aria-current={isActivePath(link.path) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>
          {/* Mobile Wallet Status */}
          <div className="px-4 py-3 border-t border-gray-200">
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isCorrectNetwork ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  role="status"
                  aria-label={isCorrectNetwork ? 'Connected to correct network' : 'Wrong network'}
                />
                <span className="text-sm text-gray-700 font-medium">
                  {formatAddress(account)}
                </span>
              </div>
            ) : (
              <motion.button
                onClick={connectWallet}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Connect wallet"
              >
                Connect Wallet
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
