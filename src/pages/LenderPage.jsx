import React from 'react';
import Layout from '../components/layout/Layout';
import Breadcrumb from '../components/common/Breadcrumb';
import LenderDashboard from '../components/LenderDashboard';

/**
 * LenderPage Component
 * 
 * Wrapper page for the Lender Dashboard that includes the layout structure
 * with navigation and breadcrumb navigation.
 * 
 * This component wraps the existing LenderDashboard component with the
 * new layout infrastructure (Navbar, Footer, Breadcrumb).
 */
const LenderPage = () => {
  return (
    <Layout>
      <Breadcrumb items={['Home', 'Lender Dashboard']} />
      <LenderDashboard />
    </Layout>
  );
};

export default LenderPage;
