import React from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';

/**
 * SecurityPage Component
 * 
 * Displays security practices and measures implemented in the Ethica platform
 * for both smart contracts and frontend security.
 */
const SecurityPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const smartContractPractices = [
    {
      title: 'Access Control',
      description: 'Role-based access control using OpenZeppelin\'s Ownable pattern to restrict critical functions to authorized addresses only.',
      icon: '🔐'
    },
    {
      title: 'Reentrancy Protection',
      description: 'Implementation of checks-effects-interactions pattern and ReentrancyGuard to prevent reentrancy attacks on fund transfers.',
      icon: '🛡️'
    },
    {
      title: 'Safe Math Operations',
      description: 'Solidity 0.8+ built-in overflow/underflow protection ensures all arithmetic operations are safe from integer vulnerabilities.',
      icon: '🔢'
    },
    {
      title: 'Input Validation',
      description: 'Comprehensive validation of all user inputs with require statements to prevent invalid state transitions and malicious inputs.',
      icon: '✅'
    },
    {
      title: 'Pausable Contracts',
      description: 'Emergency pause functionality to halt contract operations in case of detected vulnerabilities or attacks.',
      icon: '⏸️'
    },
    {
      title: 'Audited Dependencies',
      description: 'Use of battle-tested OpenZeppelin contracts that have been audited and used by thousands of projects.',
      icon: '📚'
    }
  ];

  const frontendPractices = [
    {
      title: 'Secure Wallet Integration',
      description: 'MetaMask integration with proper signature verification and transaction confirmation flows to prevent unauthorized actions.',
      icon: '👛'
    },
    {
      title: 'Input Sanitization',
      description: 'All user inputs are validated and sanitized before being sent to smart contracts to prevent injection attacks.',
      icon: '🧹'
    },
    {
      title: 'HTTPS Only',
      description: 'Enforced HTTPS connections to protect data in transit and prevent man-in-the-middle attacks.',
      icon: '🔒'
    },
    {
      title: 'No Private Key Storage',
      description: 'Private keys never leave the user\'s wallet. All transactions are signed client-side through MetaMask.',
      icon: '🔑'
    },
    {
      title: 'Transaction Verification',
      description: 'Users must explicitly approve all transactions with clear information about what they\'re signing.',
      icon: '📝'
    },
    {
      title: 'Error Handling',
      description: 'Comprehensive error handling that doesn\'t expose sensitive system information while providing helpful user feedback.',
      icon: '⚠️'
    }
  ];

  const bestPractices = [
    'Always verify contract addresses before interacting',
    'Review transaction details carefully before signing',
    'Keep your wallet software up to date',
    'Never share your private keys or seed phrases',
    'Use hardware wallets for large amounts',
    'Be cautious of phishing attempts and fake websites'
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Security First
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your security is our top priority. Learn about the comprehensive measures we've implemented to protect your assets and data.
            </p>
          </motion.div>

          {/* Smart Contract Security */}
          <motion.section variants={itemVariants} className="mb-16">
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-4xl mr-3">⚡</span>
                Smart Contract Security
              </h2>
              <p className="text-gray-600 mb-8">
                Our smart contracts are built with security as the foundation, implementing industry best practices and battle-tested patterns.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {smartContractPractices.map((practice, index) => (
                  <motion.div
                    key={index}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-4xl mb-3">{practice.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {practice.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {practice.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Frontend Security */}
          <motion.section variants={itemVariants} className="mb-16">
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-4xl mr-3">🌐</span>
                Frontend Security
              </h2>
              <p className="text-gray-600 mb-8">
                Our frontend application implements multiple layers of security to protect your interactions with the blockchain.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {frontendPractices.map((practice, index) => (
                  <motion.div
                    key={index}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-4xl mb-3">{practice.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {practice.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {practice.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* User Best Practices */}
          <motion.section variants={itemVariants} className="mb-16">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-8 sm:p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-4xl mr-3">💡</span>
                Security Best Practices for Users
              </h2>
              <p className="text-gray-600 mb-6">
                While we implement robust security measures, your security also depends on following these best practices:
              </p>
              <ul className="space-y-3">
                {bestPractices.map((practice, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="text-orange-500 mr-3 text-xl">•</span>
                    <span className="text-gray-700">{practice}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.section>

          {/* Security Disclosure */}
          <motion.section variants={itemVariants}>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-8 sm:p-12 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Found a Security Issue?
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                We take security seriously. If you discover a security vulnerability, please report it responsibly. We appreciate your help in keeping Ethica secure.
              </p>
              <motion.a
                href="mailto:security@ethica.example.com"
                className="inline-block px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Report Security Issue
              </motion.a>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </Layout>
  );
};

export default SecurityPage;
