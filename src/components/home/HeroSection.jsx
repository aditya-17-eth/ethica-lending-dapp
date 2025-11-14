import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../utils/animations';
import { routes } from '../../utils/navigation';

/**
 * HeroSection Component - Placeholder
 * 
 * NOTE TO DEVELOPER: This is a placeholder component with basic styling and structure.
 * You can replace this entire component with your custom implementation.
 * The component should be self-contained and not require any props.
 * 
 * Expected features:
 * - Eye-catching headline and subheadline
 * - Call-to-action button(s)
 * - Background gradient or illustration
 * - Responsive design
 */
const HeroSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate(routes.lender);
  };

  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 sm:py-20 md:py-24 lg:py-32">
      <motion.div 
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        initial="initial"
        animate="animate"
        variants={{
          animate: {
            transition: {
              staggerChildren: 0.2
            }
          }
        }}
      >
        <motion.h1 
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-5 md:mb-6 leading-tight"
          variants={fadeInUp}
        >
          Decentralized Lending Made Simple
        </motion.h1>
        <motion.p 
          className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-9 md:mb-10 max-w-3xl mx-auto leading-relaxed px-2"
          variants={fadeInUp}
        >
          Collateral-based lending on Ethereum with transparent liquidation logic and secure on-chain automation
        </motion.p>
        <motion.button
          onClick={handleGetStarted}
          className="bg-white text-blue-600 px-6 py-3 sm:px-8 md:px-10 md:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto max-w-xs sm:max-w-none"
          variants={fadeInUp}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Get started with Ethica lending platform"
        >
          Get Started
        </motion.button>
      </motion.div>
    </section>
  );
};

export default HeroSection;
