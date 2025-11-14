import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animations';

/**
 * FAQAccordion Component - Placeholder
 * 
 * NOTE TO DEVELOPER: This is a placeholder component with basic FAQ functionality.
 * You can replace this entire component with your custom implementation.
 * The component should be self-contained and not require any props.
 * 
 * Expected features:
 * - Accordion layout with expand/collapse
 * - Smooth transitions
 * - Keyboard navigation support
 * - FAQ content about your platform
 */
const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      id: 1,
      question: 'How does Ethica lending work?',
      answer: 'Borrowers deposit ETH as collateral and receive MockDAI tokens as a loan. The smart contract monitors the collateral value in real-time. If the collateral falls below the liquidation threshold (150% of the loan value), the position can be liquidated to protect lenders.'
    },
    {
      id: 2,
      question: 'What are the collateral requirements?',
      answer: 'Borrowers must maintain a collateral ratio of at least 150%. This means for every $100 worth of MockDAI borrowed, you need to deposit at least $150 worth of ETH. This over-collateralization protects lenders from price volatility.'
    },
    {
      id: 3,
      question: 'How does liquidation work?',
      answer: 'When a loan\'s collateral ratio falls below 150%, it becomes eligible for liquidation. Liquidators can repay the loan and receive the collateral at a discount. This automated process ensures lenders are protected while giving borrowers incentive to maintain healthy collateral ratios.'
    },
    {
      id: 4,
      question: 'What are the interest rates?',
      answer: 'Interest rates are set by the smart contract and displayed transparently on the platform. Rates may vary based on market conditions and utilization. All interest calculations are performed on-chain, ensuring complete transparency.'
    },
    {
      id: 5,
      question: 'Is my money safe?',
      answer: 'Ethica uses audited smart contracts deployed on the Ethereum blockchain. All transactions are transparent and verifiable on-chain. However, as with all DeFi protocols, please understand the risks including smart contract vulnerabilities, market volatility, and liquidation risk.'
    },
    {
      id: 6,
      question: 'How do I get started?',
      answer: 'Connect your Web3 wallet (like MetaMask) to the platform, ensure you\'re on the correct network, and navigate to either the Lender or Borrower dashboard. Lenders can deposit MockDAI to earn interest, while borrowers can deposit ETH collateral to borrow MockDAI.'
    }
  ];

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleAccordion(index);
    }
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-3 sm:mb-4 lg:mb-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Frequently Asked Questions
        </motion.h2>
        <motion.p 
          className="text-center text-gray-600 mb-8 sm:mb-10 md:mb-12 lg:mb-16 text-sm sm:text-base lg:text-lg px-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Find answers to common questions about Ethica lending platform
        </motion.p>
        
        <motion.div 
          className="space-y-4"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors duration-200"
              variants={fadeInUp}
            >
              <button
                onClick={() => toggleAccordion(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-900 flex justify-between items-start hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset text-sm sm:text-base"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${faq.id}`}
              >
                <span className="pr-3 sm:pr-4 flex-1">{faq.question}</span>
                <motion.span
                  className="text-xl sm:text-2xl text-blue-600 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                  animate={{ rotate: openIndex === index ? 45 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  +
                </motion.span>
              </button>
              
              <motion.div
                id={`faq-answer-${faq.id}`}
                initial={false}
                animate={{
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-4 sm:px-6 pb-3 sm:pb-4 text-gray-600 leading-relaxed text-sm sm:text-base">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FAQAccordion;
