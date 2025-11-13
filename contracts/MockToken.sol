// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockToken
 * @dev ERC-20 token implementation for Mock DAI (mDAI)
 * Used as the loan currency in the Ethica lending system
 */
contract MockToken {
    // Token metadata
    string public constant name = "Mock DAI";
    string public constant symbol = "mDAI";
    uint8 public constant decimals = 18;
    
    // Total supply
    uint256 private _totalSupply;
    
    // Balances and allowances
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    /**
     * @dev Constructor mints initial supply to deployer
     * Initial supply: 1,000,000 mDAI
     */
    constructor() {
        uint256 initialSupply = 1_000_000 * 10**decimals;
        _totalSupply = initialSupply;
        _balances[msg.sender] = initialSupply;
        emit Transfer(address(0), msg.sender, initialSupply);
    }
    
    /**
     * @dev Returns the total token supply
     */
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
    
    /**
     * @dev Returns the balance of an account
     */
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
    
    /**
     * @dev Transfers tokens to a recipient
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return bool Success status
     */
    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "Transfer to zero address");
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    /**
     * @dev Approves spender to spend tokens on behalf of owner
     * @param spender Address authorized to spend
     * @param amount Amount approved for spending
     * @return bool Success status
     */
    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "Approve to zero address");
        
        _allowances[msg.sender][spender] = amount;
        
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @dev Returns the allowance of spender for owner's tokens
     */
    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }
    
    /**
     * @dev Transfers tokens from one address to another using allowance
     * @param from Address to transfer from
     * @param to Address to transfer to
     * @param amount Amount to transfer
     * @return bool Success status
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(_balances[from] >= amount, "Insufficient balance");
        require(_allowances[from][msg.sender] >= amount, "Insufficient allowance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
}
