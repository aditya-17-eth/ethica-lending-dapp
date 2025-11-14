// Navigation utilities for route constants and navigation link configuration

/**
 * Route constants for the application
 * Centralized route definitions to avoid hardcoding paths throughout the app
 */
export const routes = {
  home: '/',
  lender: '/lender',
  borrower: '/borrower',
  liquidation: '/liquidation',
  security: '/security'
};

/**
 * Navigation link configuration
 * Used by Navbar component to render navigation links
 */
export const navigationLinks = [
  { label: 'Home', path: routes.home },
  { label: 'Lender', path: routes.lender },
  { label: 'Borrower', path: routes.borrower },
  { label: 'Liquidation', path: routes.liquidation },
  { label: 'Security', path: routes.security }
];
