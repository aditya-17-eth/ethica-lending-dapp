import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LenderDashboard from '../LenderDashboard';

// Mock the hooks
jest.mock('../../hooks/useWallet', () => ({
  __esModule: true,
  default: () => ({
    isConnected: true,
    account: '0x1234567890123456789012345678901234567890',
    isCorrectNetwork: true
  })
}));

const mockContract = {
  isReady: true,
  isLoading: false,
  error: '',
  getLenderDetails: jest.fn().mockResolvedValue({
    depositAmount: '1000000000000000000' // 1 ETH in wei
  }),
  getPoolBalance: jest.fn().mockResolvedValue('5000000000000000000'), // 5 ETH in wei
  getActiveLoanCount: jest.fn().mockResolvedValue(3), // Mock 3 active loans
  depositFunds: jest.fn(),
  withdrawFunds: jest.fn(),
  setupEventListeners: jest.fn(() => () => {}) // Return cleanup function
};

jest.mock('../../hooks/useContract', () => ({
  __esModule: true,
  default: () => mockContract
}));

// Mock the contract helpers
jest.mock('../../utils/contractHelpers', () => ({
  formatEther: (value) => {
    // Simple mock implementation
    if (value === '1000000000000000000') return '1.0';
    if (value === '5000000000000000000') return '5.0';
    return '0';
  }
}));

describe('LenderDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockContract.getLenderDetails.mockResolvedValue({
      depositAmount: '1000000000000000000'
    });
    mockContract.getPoolBalance.mockResolvedValue('5000000000000000000');
    mockContract.getActiveLoanCount.mockResolvedValue(3);
  });

  test('renders lender dashboard with correct title', () => {
    render(<LenderDashboard />);
    
    expect(screen.getByText('Lender Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage your lending positions and earn interest')).toBeInTheDocument();
  });

  test('displays user account information', () => {
    render(<LenderDashboard />);
    
    expect(screen.getByText(/Connected: 0x1234...7890/)).toBeInTheDocument();
  });

  test('displays balance information', async () => {
    render(<LenderDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Your Balance')).toBeInTheDocument();
      expect(screen.getByText('Total Deposited')).toBeInTheDocument();
      expect(screen.getByText('Available to Withdraw')).toBeInTheDocument();
    });
  });

  test('displays pool statistics', async () => {
    render(<LenderDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Pool Statistics')).toBeInTheDocument();
      expect(screen.getByText('Total Pool Balance')).toBeInTheDocument();
      expect(screen.getByText('Active Loans')).toBeInTheDocument();
      expect(screen.getByText('Utilization Rate')).toBeInTheDocument();
    });
  });

  test('renders deposit form with correct elements', () => {
    render(<LenderDashboard />);
    
    expect(screen.getAllByText('Deposit ETH')).toHaveLength(2); // Header and button
    expect(screen.getByRole('button', { name: /Deposit ETH/i })).toBeInTheDocument();
  });

  test('renders withdrawal form with correct elements', () => {
    render(<LenderDashboard />);
    
    expect(screen.getAllByText('Withdraw ETH')).toHaveLength(2); // Header and button
    expect(screen.getByRole('button', { name: /Withdraw ETH/i })).toBeInTheDocument();
  });

  test('validates deposit amount input', async () => {
    render(<LenderDashboard />);
    
    const depositInputs = screen.getAllByDisplayValue('');
    const depositInput = depositInputs[0]; // First input should be deposit
    const depositButton = screen.getByRole('button', { name: /Deposit ETH/i });
    
    // Test invalid amount (negative)
    fireEvent.change(depositInput, { target: { value: '-1' } });
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid amount between 0 and 1000 ETH/)).toBeInTheDocument();
    });
    
    // Test valid amount
    fireEvent.change(depositInput, { target: { value: '1.5' } });
    await waitFor(() => {
      expect(depositButton).not.toBeDisabled();
    });
  });

  test('handles max deposit button click', () => {
    render(<LenderDashboard />);
    
    const depositInputs = screen.getAllByDisplayValue('');
    const depositInput = depositInputs[0];
    const maxButtons = screen.getAllByRole('button', { name: /Max/i });
    const maxButton = maxButtons[0];
    
    fireEvent.click(maxButton);
    expect(depositInput.value).toBe('1.0');
  });

  test('handles form submission for deposit', async () => {
    const mockDepositFunds = jest.fn();
    mockContract.depositFunds = mockDepositFunds;

    render(<LenderDashboard />);
    
    const depositInputs = screen.getAllByDisplayValue('');
    const depositInput = depositInputs[0];
    const depositButton = screen.getByRole('button', { name: /Deposit ETH/i });
    
    fireEvent.change(depositInput, { target: { value: '1.5' } });
    fireEvent.click(depositButton);
    
    expect(mockDepositFunds).toHaveBeenCalledWith(
      '1.5',
      expect.any(Function),
      expect.any(Function)
    );
  });

  test('displays error message when deposit validation fails', async () => {
    render(<LenderDashboard />);
    
    const depositButton = screen.getByRole('button', { name: /Deposit ETH/i });
    
    // Try to submit without amount
    fireEvent.click(depositButton);
    
    // Should be disabled when no amount is entered
    expect(depositButton).toBeDisabled();
  });

  test('displays loading state while fetching data', () => {
    // Mock loading state
    mockContract.isReady = false;

    render(<LenderDashboard />);
    
    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('displays success message when transaction succeeds', async () => {
    const mockDepositFunds = jest.fn((amount, onSuccess, onError) => {
      onSuccess({ hash: '0xabc123' });
    });
    mockContract.depositFunds = mockDepositFunds;

    render(<LenderDashboard />);
    
    const depositInputs = screen.getAllByDisplayValue('');
    const depositInput = depositInputs[0];
    const depositButton = screen.getByRole('button', { name: /Deposit ETH/i });
    
    fireEvent.change(depositInput, { target: { value: '1.5' } });
    fireEvent.click(depositButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Successfully deposited 1.5 ETH/)).toBeInTheDocument();
    });
  });

  test('displays error message when transaction fails', async () => {
    const mockDepositFunds = jest.fn((amount, onSuccess, onError) => {
      onError(new Error('Transaction failed'));
    });
    mockContract.depositFunds = mockDepositFunds;

    render(<LenderDashboard />);
    
    const depositInputs = screen.getAllByDisplayValue('');
    const depositInput = depositInputs[0];
    const depositButton = screen.getByRole('button', { name: /Deposit ETH/i });
    
    fireEvent.change(depositInput, { target: { value: '1.5' } });
    fireEvent.click(depositButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Transaction failed/)).toBeInTheDocument();
    });
  });

  // Tests for Active Loan Count functionality (Task 9)
  describe('Active Loan Count Display', () => {
    test('fetches and displays active loan count from contract', async () => {
      mockContract.getActiveLoanCount.mockResolvedValue(5);

      render(<LenderDashboard />);
      
      await waitFor(() => {
        expect(mockContract.getActiveLoanCount).toHaveBeenCalled();
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    test('displays zero active loans when no loans exist', async () => {
      mockContract.getActiveLoanCount.mockResolvedValue(0);

      render(<LenderDashboard />);
      
      await waitFor(() => {
        expect(mockContract.getActiveLoanCount).toHaveBeenCalled();
        const activeLoanElements = screen.getAllByText('0');
        expect(activeLoanElements.length).toBeGreaterThan(0);
      });
    });

    test('updates active loan count when new loan is created', async () => {
      mockContract.getActiveLoanCount.mockResolvedValue(3);

      const { rerender } = render(<LenderDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });

      // Simulate loan creation event
      mockContract.getActiveLoanCount.mockResolvedValue(4);
      rerender(<LenderDashboard />);

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });
    });

    test('updates active loan count when loan is repaid', async () => {
      mockContract.getActiveLoanCount.mockResolvedValue(5);

      const { rerender } = render(<LenderDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });

      // Simulate loan repayment event
      mockContract.getActiveLoanCount.mockResolvedValue(4);
      rerender(<LenderDashboard />);

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });
    });

    test('updates active loan count when loan is liquidated', async () => {
      mockContract.getActiveLoanCount.mockResolvedValue(3);

      const { rerender } = render(<LenderDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });

      // Simulate loan liquidation event
      mockContract.getActiveLoanCount.mockResolvedValue(2);
      rerender(<LenderDashboard />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    test('displays active loan count in pool statistics section', async () => {
      mockContract.getActiveLoanCount.mockResolvedValue(7);

      render(<LenderDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Pool Statistics')).toBeInTheDocument();
        expect(screen.getByText('Active Loans')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
      });
    });

    test('handles error when fetching active loan count fails', async () => {
      mockContract.getActiveLoanCount.mockRejectedValue(new Error('Failed to fetch'));

      render(<LenderDashboard />);
      
      await waitFor(() => {
        // Should fallback to 0 or handle error gracefully
        expect(mockContract.getActiveLoanCount).toHaveBeenCalled();
      });
    });
  });
});