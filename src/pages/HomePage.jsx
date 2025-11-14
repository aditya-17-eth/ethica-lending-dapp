import React from 'react';
import Layout from '../components/layout/Layout';
import HeroSection from '../components/home/HeroSection';
import WhyChooseEthica from '../components/home/WhyChooseEthica';
import NewsletterForm from '../components/home/NewsletterForm';
import FAQAccordion from '../components/home/FAQAccordion';

/**
 * HomePage Component
 * 
 * Main landing page for the Ethica dApp that introduces visitors to the platform.
 * Includes hero section, features, newsletter signup, and FAQ.
 * 
 * All child components (HeroSection, WhyChooseEthica, NewsletterForm, FAQAccordion)
 * are placeholder components that can be replaced with custom implementations.
 */
const HomePage = () => {
  return (
    <Layout>
      <div className="scroll-smooth">
        <HeroSection />
        <WhyChooseEthica />
        <NewsletterForm />
        <FAQAccordion />
      </div>
    </Layout>
  );
};

export default HomePage;
