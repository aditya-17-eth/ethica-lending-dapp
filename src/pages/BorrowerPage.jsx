import React from 'react';
import Layout from '../components/layout/Layout';
import Breadcrumb from '../components/common/Breadcrumb';
import BorrowerDashboard from '../components/BorrowerDashboard';

/**
 * BorrowerPage Component
 * 
 * Wrapper page for the Borrower Dashboard that includes the layout structure
 * with navigation and breadcrumb navigation.
 * 
 * This component wraps the existing BorrowerDashboard component with the
 * new layout infrastructure (Navbar, Footer, Breadcrumb).
 */
const BorrowerPage = () => {
  return (
    <Layout>
      <Breadcrumb items={['Home', 'Borrower Dashboard']} />
      <BorrowerDashboard />
    </Layout>
  );
};

export default BorrowerPage;
