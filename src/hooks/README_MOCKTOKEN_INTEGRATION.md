# MockToken Integration - Implementation Summary

## Overview
This document summarizes the MockToken integration added to the frontend, enabling the dApp to work with MockDAI as the loan currency while using ETH as collateral.

## Files Created

### 1. `src/hooks/useTokenContract.js`
A custom React hook for interacting with the MockToken (ERC-20) contract.

**Features:**
- Balance tracking with automatic updates
- Token approval management
- Transfer functionality
- Allowance checking
- Event listeners for Transfer and Approval events
- Real-time balance updates when transactions occur
- Error handling with user-friendly messages

**Key Functions:**
- `balanceOf(address)` - Get MockDAI balance for any address
- `approve(spender, amount)` - Approve spending allowance
- `allowance(owner, spender)` - Check current allowance
- `transfer(to, amount)` - Transfer MockDAI tokens
- `getTokenInfo()` - Get token metadata (name, symbol, decimals, totalSupply)
- `setupEventListeners(callbacks)` - Subscribe to token events

### 2. `src/components/MockDaiBalance.jsx`
A React component that displays the user's MockDAI balance and allowance status.

**Features:**
- Real-time balance display with proper formatting
- Allowance status indicator for LoanContract
- Color-coded status (Not Approved, Limited, Unlimited)
- Auto-refresh on Transfer and Approval events
- Manual refresh button
- Loading states
- Responsive design

**Display Elements:**
- Current MockDAI balance (formatted with 2 decimals)
- Token symbol and name
- Allowance status for LoanContract
- Visual indicators (colors, badges)

## Files Modified

### 1. `src/hooks/useContract.js`
Updated to integrate MockToken functionality with the LoanContract.

**Changes:**
- Imported `useTokenContract` hook
- Added `tokenContract` instance to the hook
- Updated `borrow()` to work with MockDAI amounts (instead of ETH)
- Updated `repayLoan()` to handle MockDAI repayment (instead of ETH)
- Added helper functions:
  - `getMockDaiBalance(address)` - Get user's MockDAI balance
  - `getMockDaiAllowance(owner, spender)` - Check MockDAI allowance
  - `approveMockDai(amount)` - Approve LoanContract to spend MockDAI
- Exposed `tokenContract` in the return object for direct access

### 2. `src/utils/contractHelpers.js`
Added MockToken contract configuration and ABI.

**Changes:**
- Added `MOCK_TOKEN_ADDRESS` constant (from environment variable)
- Added `MOCK_TOKEN_ABI` with ERC-20 standard functions:
  - View functions: name, symbol, decimals, totalSupply, balanceOf, allowance
  - State-changing: transfer, approve, transferFrom
  - Events: Transfer, Approval
- Updated `LOAN_CONTRACT_ABI` to reflect MockToken integration:
  - Added `mockToken()` view function
  - Updated `borrow(uint256 mockDaiAmount)` signature
  - Updated `repayLoan(uint256 mockDaiAmount)` signature

### 3. `.env.example`
Added MockToken contract address configuration.

**Changes:**
- Added `REACT_APP_MOCK_TOKEN_ADDRESS` environment variable
- Added comments explaining contract address configuration

## Usage Examples

### Using the Token Contract Hook

```javascript
import useTokenContract from '../hooks/useTokenContract';

function MyComponent({ account, isCorrectNetwork }) {
  const tokenContract = useTokenContract(account, isCorrectNetwork);
  
  // Get balance
  const balance = await tokenContract.balanceOf(account);
  
  // Approve spending
  await tokenContract.approve(
    LOAN_CONTRACT_ADDRESS,
    ethers.parseEther('1000'),
    (receipt) => console.log('Approved!'),
    (error) => console.error('Failed:', error)
  );
  
  // Check allowance
  const allowance = await tokenContract.allowance(account, LOAN_CONTRACT_ADDRESS);
  
  // Listen to events
  useEffect(() => {
    const cleanup = tokenContract.setupEventListeners({
      onTransfer: (from, to, value) => {
        console.log('Transfer:', from, to, value);
      },
      onApproval: (owner, spender, value) => {
        console.log('Approval:', owner, spender, value);
      }
    });
    
    return cleanup;
  }, [tokenContract]);
}
```

### Using the MockDAI Balance Component

```javascript
import MockDaiBalance from '../components/MockDaiBalance';

function Dashboard({ account, isCorrectNetwork }) {
  return (
    <div>
      <MockDaiBalance 
        account={account}
        isCorrectNetwork={isCorrectNetwork}
      />
    </div>
  );
}
```

### Using Updated Contract Hook

```javascript
import useContract from '../hooks/useContract';

function BorrowingComponent({ account, isCorrectNetwork }) {
  const contract = useContract(account, isCorrectNetwork);
  
  // Borrow MockDAI (not ETH)
  await contract.borrow(
    '100', // 100 MockDAI
    (receipt) => console.log('Borrowed!'),
    (error) => console.error('Failed:', error)
  );
  
  // Check MockDAI balance
  const balance = await contract.getMockDaiBalance(account);
  
  // Approve MockDAI for repayment
  await contract.approveMockDai(
    ethers.parseEther('105'), // 100 + 5% interest
    (receipt) => console.log('Approved!'),
    (error) => console.error('Failed:', error)
  );
  
  // Repay loan with MockDAI
  await contract.repayLoan(
    '105', // 105 MockDAI (principal + interest)
    (receipt) => console.log('Repaid!'),
    (error) => console.error('Failed:', error)
  );
}
```

## Integration Flow

### Borrowing Flow
1. User deposits ETH collateral via `depositCollateral()`
2. User calls `borrow(mockDaiAmount)` with desired MockDAI amount
3. LoanContract verifies:
   - Sufficient ETH collateral (150% ratio)
   - Sufficient MockDAI in contract
   - Sufficient ETH backing in pool
4. LoanContract transfers MockDAI to user
5. User's MockDAI balance updates automatically via event listener

### Repayment Flow
1. User checks total repayment amount (principal + 5% interest)
2. User approves LoanContract to spend MockDAI via `approveMockDai()`
3. User calls `repayLoan(mockDaiAmount)` with repayment amount
4. LoanContract calls `transferFrom()` to receive MockDAI from user
5. LoanContract returns ETH collateral to user
6. User's MockDAI balance and allowance update automatically

## Environment Configuration

Add these to your `.env` file after deployment:

```bash
# LoanContract address
REACT_APP_CONTRACT_ADDRESS=0x...

# MockToken address
REACT_APP_MOCK_TOKEN_ADDRESS=0x...

# Network configuration
REACT_APP_NETWORK_NAME=sepolia
REACT_APP_NETWORK_ID=11155111
```

## Next Steps

To complete the MockToken integration:

1. **Update Dashboards** (Task 6):
   - Modify BorrowerDashboard to show MockDAI loan amounts
   - Add MockDAI balance display
   - Add approval button before repayment
   - Update LenderDashboard to clarify ETH/MockDAI relationship

2. **Deploy Contracts** (Task 8):
   - Deploy MockToken contract
   - Deploy LoanContract with MockToken address
   - Transfer MockDAI to LoanContract for lending
   - Update .env with deployed addresses

3. **Testing**:
   - Test token approval flow
   - Test borrowing with MockDAI
   - Test repayment with MockDAI
   - Verify event listeners work correctly

## Technical Notes

- All MockDAI amounts use 18 decimals (same as ETH)
- Use `ethers.parseEther()` to convert from human-readable to wei
- Use `ethers.formatEther()` to convert from wei to human-readable
- Event listeners automatically update balances when transactions occur
- Allowance should be checked before calling `repayLoan()`
- Users must approve LoanContract before repaying loans
