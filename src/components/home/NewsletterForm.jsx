import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../utils/animations';

/**
 * NewsletterForm Component - Placeholder
 * 
 * NOTE TO DEVELOPER: This is a placeholder component with basic form functionality.
 * You can replace this entire component with your custom implementation.
 * The component should be self-contained and not require any props.
 * 
 * Expected features:
 * - Email input with validation
 * - Submit button with loading state
 * - Success/error toast notifications
 * - Integration with your email service provider
 * 
 * TODO: Replace handleSubmit logic with actual API call to your newsletter service
 */
const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('loading');

    // TODO: Replace this with actual API call to your newsletter service
    // Example:
    // try {
    //   const response = await fetch('/api/newsletter/subscribe', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email })
    //   });
    //   if (response.ok) {
    //     setStatus('success');
    //     setMessage('Thank you for subscribing!');
    //     setEmail('');
    //   } else {
    //     throw new Error('Subscription failed');
    //   }
    // } catch (error) {
    //   setStatus('error');
    //   setMessage('Something went wrong. Please try again.');
    // }

    // Placeholder simulation
    setTimeout(() => {
      setStatus('success');
      setMessage('Thank you for subscribing! (This is a placeholder - no actual subscription occurred)');
      setEmail('');
      setTimeout(() => setStatus('idle'), 5000);
    }, 1000);
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-blue-600 text-white">
      <motion.div 
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={{
          animate: {
            transition: {
              staggerChildren: 0.15
            }
          }
        }}
      >
        <motion.h2 
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 lg:mb-5"
          variants={fadeInUp}
        >
          Stay Updated
        </motion.h2>
        <motion.p 
          id="newsletter-description"
          className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 lg:mb-10 opacity-90 px-2"
          variants={fadeInUp}
        >
          Subscribe to receive updates about new features, platform improvements, and important announcements
        </motion.p>
        
        <motion.form 
          onSubmit={handleSubmit} 
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-lg mx-auto"
          variants={fadeInUp}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white text-base"
            required
            disabled={status === 'loading'}
            aria-label="Email address"
            aria-describedby="newsletter-description"
          />
          <motion.button
            type="submit"
            disabled={status === 'loading'}
            className="bg-white text-blue-600 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </motion.button>
        </motion.form>

        {/* Toast Notification */}
        {status === 'success' && (
          <motion.div 
            className="mt-4 sm:mt-6 bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg inline-block text-sm sm:text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            ✓ {message}
          </motion.div>
        )}
        
        {status === 'error' && (
          <motion.div 
            className="mt-4 sm:mt-6 bg-red-500 text-white px-4 sm:px-6 py-3 rounded-lg inline-block text-sm sm:text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            ✗ {message}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};

export default NewsletterForm;
