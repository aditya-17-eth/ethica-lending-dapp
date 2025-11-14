# Ethica Lending dApp

Decentralized peer-to-peer lending platform built on Ethereum that enables collateral-based lending using ETH.

## Project Structure

```
├── contracts/                    # Smart contracts
│   ├── LoanContract.sol         # Main lending contract
│   └── MockToken.sol            # Mock DAI token for testing
├── scripts/                      # Deployment and utility scripts
├── test/                         # Contract tests
├── src/                          # React frontend application
│   ├── components/              # React components
│   │   ├── layout/              # Layout components (Navbar, Footer, Layout)
│   │   ├── home/                # Home page sections (Hero, Features, FAQ, Newsletter)
│   │   ├── common/              # Shared components (Breadcrumb)
│   │   ├── __tests__/           # Component tests
│   │   ├── BorrowerDashboard.jsx
│   │   ├── LenderDashboard.jsx
│   │   ├── LiquidationMonitor.jsx
│   │   ├── WalletConnection.jsx
│   │   └── ErrorBoundary.jsx
│   ├── pages/                   # Page-level components
│   │   ├── HomePage.jsx         # Landing page
│   │   ├── LenderPage.jsx       # Lender dashboard page
│   │   ├── BorrowerPage.jsx     # Borrower dashboard page
│   │   └── LiquidationPage.jsx  # Liquidation monitor page
│   ├── hooks/                   # Custom React hooks
│   │   ├── useWallet.js         # Wallet connection management
│   │   ├── useContract.js       # LoanContract interaction
│   │   ├── useTokenContract.js  # MockToken interaction
│   │   └── useRealTimeUpdates.js # Real-time blockchain updates
│   ├── utils/                   # Utility functions
│   │   ├── contractHelpers.js   # Contract interaction helpers
│   │   ├── animations.js        # Framer Motion animation variants
│   │   └── navigation.js        # Route constants and navigation config
│   ├── App.js                   # Main application with routing
│   ├── App.css                  # Global styles
│   ├── index.js                 # Application entry point
│   └── index.css                # Tailwind CSS imports
└── public/                       # Static assets
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   - Add your Infura/Alchemy RPC URL for Sepolia
   - Add your private key for deployment
   - Add your Etherscan API key for verification

## Technology Stack

- **Smart Contracts**: Solidity 0.8.20+, Hardhat
- **Frontend**: React 19, TailwindCSS, Framer Motion
- **Routing**: React Router DOM v6
- **Blockchain Interaction**: Ethers.js v6
- **Network**: Ethereum Sepolia Testnet

## Features

### Core Functionality
- **Lenders**: Deposit ETH into lending pool, withdraw funds with interest
- **Borrowers**: Deposit collateral, borrow against 150% collateral ratio
- **Automated Liquidation**: Time-based and ratio-based liquidation system
- **Fixed Interest**: 5% interest rate on all loans
- **MetaMask Integration**: Secure wallet connection

### User Experience
- **Professional Landing Page**: Welcoming home page with hero section, features, and FAQ
- **Persistent Navigation**: Navbar with wallet status across all pages
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices
- **Smooth Animations**: Framer Motion transitions for polished interactions
- **Breadcrumb Navigation**: Clear location indicators on dashboard pages
- **Error Boundaries**: Graceful error handling throughout the application

## Browser Compatibility

The application is tested and supported on:
- **Chrome** (latest)
- **Firefox** (latest)
- **Safari** (latest)
- **Edge** (latest)

### Responsive Breakpoints
- **Mobile**: < 640px
- **Desktop**: > 1024px

## Application Architecture

### Routing Configuration

The application uses React Router v6 with the following routes:

- `/` - **HomePage**: Landing page with hero section, features, FAQ, and newsletter
- `/lender` - **LenderPage**: Lender dashboard for depositing ETH and managing funds
- `/borrower` - **BorrowerPage**: Borrower dashboard for taking loans against collateral
- `/liquidation` - **LiquidationPage**: Liquidation monitor for tracking at-risk loans

All routes are wrapped with a consistent layout including:
- **Navbar**: Persistent navigation with wallet connection
- **Breadcrumb**: Current page location indicator (on dashboard pages)
- **Footer**: Social links and copyright information

### Component Organization

#### Layout Components (`src/components/layout/`)
- **Navbar.jsx**: Top navigation bar with logo, route links, and wallet connection
- **Footer.jsx**: Bottom footer with social media links and copyright
- **Layout.jsx**: Wrapper component that provides consistent page structure

#### Home Page Components (`src/components/home/`)
- **HeroSection.jsx**: Eye-catching introduction with CTA button
- **WhyChooseEthica.jsx**: Feature cards showcasing platform benefits
- **NewsletterForm.jsx**: Email subscription form with validation
- **FAQAccordion.jsx**: Expandable FAQ section with common questions

#### Dashboard Components (`src/components/`)
- **LenderDashboard.jsx**: Interface for lenders to manage deposits and withdrawals
- **BorrowerDashboard.jsx**: Interface for borrowers to manage loans and collateral
- **LiquidationMonitor.jsx**: Real-time monitoring of liquidation-eligible loans
- **WalletConnection.jsx**: Wallet connection button and status display

#### Common Components (`src/components/common/`)
- **Breadcrumb.jsx**: Navigation breadcrumb trail
- **ErrorBoundary.jsx**: Error boundary for graceful error handling

### Custom Hooks

The application uses custom hooks for blockchain interaction:

- **useWallet**: Manages wallet connection, account state, and network validation
- **useContract**: Provides interface to LoanContract methods
- **useTokenContract**: Provides interface to MockToken methods
- **useRealTimeUpdates**: Polls blockchain for real-time data updates

### Styling and Animations

- **TailwindCSS**: Utility-first CSS framework for responsive design
- **Framer Motion**: Animation library for smooth transitions and effects
- **Animation Utilities** (`src/utils/animations.js`): Reusable animation variants

## Getting Started

### Quick Start

1. Install and setup MetaMask browser extension
2. Switch to Sepolia testnet in MetaMask
3. Get test ETH from [Sepolia faucet](https://sepoliafaucet.com/)
4. Install dependencies: `npm install`
5. Start the development server: `npm start`
6. Navigate to `http://localhost:3000`
7. Connect your wallet using the button in the top-right corner
8. Explore the lender or borrower dashboards

### First-Time User Flow

1. **Visit HomePage** (`/`): Learn about Ethica's features and benefits
2. **Connect Wallet**: Click "Connect Wallet" in the navbar
3. **Choose Role**:
   - **Lender**: Navigate to `/lender` to deposit ETH into the lending pool
   - **Borrower**: Navigate to `/borrower` to deposit collateral and borrow funds
4. **Monitor Liquidations**: Visit `/liquidation` to track at-risk loans

## Troubleshooting

### Common Issues

#### Wallet Connection Issues
- **Problem**: "Connect Wallet" button not working
- **Solution**: Ensure MetaMask is installed and unlocked. Refresh the page and try again.

#### Wrong Network
- **Problem**: "Please switch to Sepolia network" message
- **Solution**: Open MetaMask, click the network dropdown, and select "Sepolia Test Network"

#### Transaction Failures
- **Problem**: Transactions fail or revert
- **Solution**: 
  - Ensure you have sufficient ETH for gas fees
  - Check that you meet collateral requirements (150% for borrowing)
  - Verify contract addresses are correct

#### Development Server Issues
- **Problem**: `npm start` fails or shows errors
- **Solution**:
  - Delete `node_modules/` and `package-lock.json`
  - Run `npm install` again
  - Clear browser cache and restart development server

#### Contract Deployment Issues
- **Problem**: Deployment to Sepolia fails
- **Solution**:
  - Verify `.env` file has correct `SEPOLIA_RPC_URL` and `PRIVATE_KEY`
  - Ensure deployer account has sufficient Sepolia ETH
  - Check RPC endpoint is accessible

### Getting Help

- Check existing issues in the repository
- Review smart contract documentation
- Verify MetaMask configuration
- Ensure you're using the correct network (Sepolia)

## Performance Optimization

The application implements several performance optimizations:

- **Code Splitting**: Dashboard pages are lazy-loaded to reduce initial bundle size
- **React.memo**: Expensive components are memoized to prevent unnecessary re-renders
- **Efficient Re-renders**: Custom hooks minimize state updates
- **Optimized Animations**: Framer Motion animations are GPU-accelerated
- **Asset Optimization**: Production builds include minified and compressed assets

## Accessibility

The application follows WCAG 2.1 Level AA guidelines:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Labels**: Screen reader support for icon buttons and dynamic content
- **Color Contrast**: Text meets minimum contrast ratios
- **Semantic HTML**: Proper heading hierarchy and landmark regions
- **Focus Indicators**: Visible focus states for all interactive elements

## Security Considerations

- **No Private Key Storage**: Private keys never leave MetaMask
- **Network Validation**: Transactions only execute on correct network
- **Input Validation**: All user inputs are validated before submission
- **Error Handling**: Graceful error handling prevents information leakage
- **HTTPS Only**: Production deployment should use HTTPS

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

## License

ISC
