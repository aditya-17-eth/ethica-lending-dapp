# Ethica Lending dApp

Decentralized peer-to-peer lending platform built on Ethereum that enables collateral-based lending using ETH.

## Project Structure

```
├── contracts/          # Smart contracts
├── scripts/           # Deployment scripts
├── test/              # Contract tests
├── src/               # React frontend
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   └── utils/         # Utility functions
├── public/            # Static assets
└── .kiro/specs/       # Project specifications
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

## Development

### Smart Contracts

- **Compile contracts**: `npm run compile`
- **Run tests**: `npm run test:contracts`
- **Start local node**: `npm run node`
- **Deploy locally**: `npm run deploy`
- **Deploy to Sepolia**: `npm run deploy:sepolia`

### Frontend

- **Start development server**: `npm start`
- **Build for production**: `npm run build`
- **Run tests**: `npm test`

## Technology Stack

- **Smart Contracts**: Solidity 0.8.20+, Hardhat
- **Frontend**: React 19, TailwindCSS
- **Blockchain Interaction**: Ethers.js v6
- **Network**: Ethereum Sepolia Testnet

## Features

- **Lenders**: Deposit ETH into lending pool, withdraw funds with interest
- **Borrowers**: Deposit collateral, borrow against 150% collateral ratio
- **Automated Liquidation**: Time-based and ratio-based liquidation system
- **Fixed Interest**: 5% interest rate on all loans
- **MetaMask Integration**: Secure wallet connection

## Getting Started

1. Install and setup MetaMask
2. Switch to Sepolia testnet
3. Get test ETH from Sepolia faucet
4. Start the development server: `npm start`
5. Connect your wallet and start lending or borrowing

## License

ISC