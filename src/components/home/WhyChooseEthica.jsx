
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animations';

/**
 * WhyChooseEthica Component - Placeholder
 * 
 * NOTE TO DEVELOPER: This is a placeholder component with basic feature cards.
 * You can replace this entire component with your custom implementation.
 * The component should be self-contained and not require any props.
 * 
 * Expected features:
 * - Section title
 * - Feature cards with icons, titles, and descriptions
 * - Responsive grid layout
 * - Hover effects or animations
 */
const WhyChooseEthica = () => {
  const features = [
    {
      id: 1,
      title: 'Trustless Lending',
      description: 'Secure smart contracts eliminate intermediaries, ensuring transparent and automated lending processes.',
      icon: '🔒'
    },
    {
      id: 2,
      title: 'Real-time Monitoring',
      description: 'Track your collateral health and loan status in real-time with our intuitive dashboard.',
      icon: '📊'
    },
    {
      id: 3,
      title: 'Transparent Liquidation',
      description: 'Clear liquidation thresholds and automated processes protect both lenders and borrowers.',
      icon: '⚖️'
    },
    {
      id: 4,
      title: 'Secure Automation',
      description: 'Battle-tested smart contracts handle all transactions securely on the Ethereum blockchain.',
      icon: '🛡️'
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-3 sm:mb-4 lg:mb-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Why Choose Ethica?
        </motion.h2>
        <motion.p 
          className="text-center text-gray-600 mb-8 sm:mb-10 md:mb-12 lg:mb-16 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg px-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Experience the future of decentralized lending with our secure and transparent platform
        </motion.p>
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              className="bg-white p-5 sm:p-6 md:p-7 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
              variants={fadeInUp}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseEthica;
