import { render, screen, waitFor } from '@testing-library/react';
import LiquidationMonitor from '../LiquidationMonitor';

// Mock the hooks
const mockContract = {
  isReady: true,
  isLoading: false,
  error: '',
  getLoanDetails: jest.fn().mockResolvedValue({
    collateralAmount: '1500000000000000000', // 1.5 ETH
    loanAmount: '1000000000000000000', // 1 ETH
    interest: '50000000000000000',
    startTime: Math.floor(Date.now() / 1000),
    dueTime: Math.floor(Date.now() / 1000) + 2592000,
    repaid: false,
    liquidated: false
  }),
  isLoanLiquidatable: jest.fn().mockResolvedValue(false),
  liquidate: jest.fn(),
  setupEventListeners: jest.fn(() => () => {})
};

jest.mock('../../hooks/useContract', () => ({
  __esModule: true,
  default: () => mockContract
}));

// Mock the contract helpers
jest.mock('../../utils/contractHelpers', () => ({
  formatEther: (value) => {
    const weiToEth = {
      '1500000000000000000': '1.5',
      '1000000000000000000': '1.0',
      '1400000000000000000': '1.4',
      '50000000000000000': '0.05',
      '0': '0'
    };
    return weiToEth[value] || '0';
  },
  formatTimeRemaining: (seconds) => {
    if (seconds > 86400) return `${Math.floor(seconds / 86400)} days`;
    if (seconds > 3600) return `${Math.floor(seconds / 3600)} hours`;
    return `${Math.floor(seconds / 60)} minutes`;
  },
  calculateTimeRemaining: (dueTime) => {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, dueTime - now);
  }
}));

describe('LiquidationMonitor', () => {
  const mockAccount = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    jest.clearAllMocks();
    mockContract.getLoanDetails.mockResolvedValue({
      collateralAmount: '1500000000000000000',
      loanAmount: '1000000000000000000',
      interest: '50000000000000000',
      startTime: Math.floor(Date.now() / 1000),
      dueTime: Math.floor(Date.now() / 1000) + 2592000,
      repaid: false,
      liquidated: false
    });
    mockContract.isLoanLiquidatable.mockResolvedValue(false);
  });

  // Tests for UI Alignment (Task 9)
  describe('UI Alignment and Centering', () => {
    test('renders liquidation monitor with centered title', () => {
      render(<LiquidationMonitor account={mockAccount} />);
      
      const title = screen.getByText('Liquidation Monitor');
      expect(title).toBeInTheDocument();
      
      // Check if title has center alignment class
      const titleContainer = title.closest('div');
      expect(titleContainer).toHaveClass('text-center');
    });

    test('applies center alignment to main container', () => {
      const { container } = render(<LiquidationMonitor account={mockAccount} />);
      
      // Check for center alignment classes in the component
      const centerAlignedElements = container.querySelectorAll('.text-center, .justify-center, .items-center');
      expect(centerAlignedElements.length).toBeGreaterThan(0);
    });

    test('applies consistent padding to container', () => {
      const { container } = render(<LiquidationMonitor account={mockAccount} />);
      
      // Check for padding classes
      const paddedElements = container.querySelectorAll('[class*="p-"]');
      expect(paddedElements.length).toBeGreaterThan(0);
    });

    test('applies responsive padding for mobile and desktop', () => {
      const { container } = render(<LiquidationMonitor account={mockAccount} />);
      
      // Check for responsive padding classes (e.g., p-4 md:p-6)
      const responsiveElements = container.querySelectorAll('[class*="md:p-"]');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });

    test('centers empty state message', async () => {
      // Mock no positions scenario
      mockContract.getLoanDetails.mockResolvedValue({
        collateralAmount: '0',
        loanAmount: '0',
        interest: '0',
        startTime: 0,
        dueTime: 0,
        repaid: false,
        liquidated: false
      });

      render(<LiquidationMonitor account={mockAccount} />);
      
      await waitFor(() => {
        const emptyMessage = screen.getByText('No positions at risk');
        expect(emptyMessage).toBeInTheDocument();
        
        // Check if empty state is centered
        const emptyContainer = emptyMessage.closest('div');
        expect(emptyContainer).toHaveClass('text-center');
      });
    });

    test('centers info box content', async () => {
      render(<LiquidationMonitor account={mockAccount} />);
      
      await waitFor(() => {
        const infoBox = screen.getByText('Liquidation Information');
        expect(infoBox).toBeInTheDocument();
        
        // Check for center alignment in info box
        const infoContainer = infoBox.closest('div');
        const parentContainer = infoContainer?.parentElement;
        expect(parentContainer).toHaveClass('text-center');
      });
    });

    test('applies responsive alignment classes for mobile viewports', () => {
      // Set viewport to mobile size
      global.innerWidth = 375;
      global.innerHeight = 667;

      const { container } = render(<LiquidationMonitor account={mockAccount} />);
      
      // Check for mobile-specific classes
      const mobileElements = container.querySelectorAll('[class*="flex-col"]');
      expect(mobileElements.length).toBeGreaterThan(0);
    });

    test('applies responsive alignment classes for desktop viewports', () => {
      // Set viewport to desktop size
      global.innerWidth = 1920;
      global.innerHeight = 1080;

      const { container } = render(<LiquidationMonitor account={mockAccount} />);
      
      // Check for responsive classes
      const responsiveElements = container.querySelectorAll('[class*="md:"]');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });

    test('centers status messages', async () => {
      render(<LiquidationMonitor account={mockAccount} />);
      
      // The component should have centered message containers
      const { container } = render(<LiquidationMonitor account={mockAccount} />);
      const messageContainers = container.querySelectorAll('[class*="justify-center"]');
      expect(messageContainers.length).toBeGreaterThan(0);
    });

    test('maintains center alignment with position data', async () => {
      // Mock position with data
      mockContract.getLoanDetails.mockResolvedValue({
        collateralAmount: '1500000000000000000',
        loanAmount: '1000000000000000000',
        interest: '50000000000000000',
        startTime: Math.floor(Date.now() / 1000),
        dueTime: Math.floor(Date.now() / 1000) + 2592000,
        repaid: false,
        liquidated: false
      });

      render(<LiquidationMonitor account={mockAccount} />);
      
      await waitFor(() => {
        const { container } = render(<LiquidationMonitor account={mockAccount} />);
        
        // Check that content maintains center alignment
        const centerElements = container.querySelectorAll('.text-center, .justify-center, .items-center');
        expect(centerElements.length).toBeGreaterThan(0);
      });
    });

    test('applies consistent spacing between elements', () => {
      const { container } = render(<LiquidationMonitor account={mockAccount} />);
      
      // Check for margin and spacing classes
      const spacedElements = container.querySelectorAll('[class*="space-y-"], [class*="mb-"], [class*="mt-"]');
      expect(spacedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Basic Functionality', () => {
    test('renders liquidation monitor component', () => {
      render(<LiquidationMonitor account={mockAccount} />);
      
      expect(screen.getByText('Liquidation Monitor')).toBeInTheDocument();
    });

    test('displays refresh button', () => {
      render(<LiquidationMonitor account={mockAccount} />);
      
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });

    test('displays no positions message when no loans exist', async () => {
      mockContract.getLoanDetails.mockResolvedValue({
        collateralAmount: '0',
        loanAmount: '0',
        interest: '0',
        startTime: 0,
        dueTime: 0,
        repaid: false,
        liquidated: false
      });

      render(<LiquidationMonitor account={mockAccount} />);
      
      await waitFor(() => {
        expect(screen.getByText('No positions at risk')).toBeInTheDocument();
        expect(screen.getByText('All loan positions are currently healthy')).toBeInTheDocument();
      });
    });

    test('displays position information when loan exists', async () => {
      render(<LiquidationMonitor account={mockAccount} />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Position')).toBeInTheDocument();
      });
    });

    test('displays liquidation information box', async () => {
      render(<LiquidationMonitor account={mockAccount} />);
      
      await waitFor(() => {
        expect(screen.getByText('Liquidation Information')).toBeInTheDocument();
        expect(screen.getByText(/Positions can be liquidated when:/)).toBeInTheDocument();
      });
    });

    test('hides component when isVisible is false', () => {
      const { container } = render(<LiquidationMonitor account={mockAccount} isVisible={false} />);
      
      expect(container.firstChild).toBeNull();
    });
  });
});
