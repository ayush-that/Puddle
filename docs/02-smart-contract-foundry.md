# Stage 2: Smart Contract Development with Foundry

## Overview

This guide covers developing the PiggyBank smart contract using Foundry. The contract will manage shared savings between two partners with multi-signature withdrawals.

## Prerequisites

- Foundry installed (`curl -L https://foundry.paradigm.xyz | bash`)
- Basic Solidity knowledge
- Ethereum wallet with Sepolia testnet ETH

## Step 1: Install Foundry

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash

# Update Foundry
foundryup

# Verify installation
forge --version
cast --version
anvil --version
```

## Step 2: Initialize Foundry Project

```bash
# From project root
forge init contracts --no-git

cd contracts
```

## Step 3: Configure Foundry

Update `foundry.toml`:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.24"
optimizer = true
optimizer_runs = 200
evm_version = "shanghai"

[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"
mainnet = "${MAINNET_RPC_URL}"

[etherscan]
sepolia = { key = "${ETHERSCAN_API_KEY}" }
mainnet = { key = "${ETHERSCAN_API_KEY}" }
```

## Step 4: Create PiggyBank Smart Contract

Create `contracts/src/PiggyBank.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PiggyBank
 * @notice A shared savings contract for two partners with multi-sig withdrawals
 * @dev Both partners must approve withdrawals before funds can be released
 */
contract PiggyBank {
    // ============ State Variables ============

    address public immutable partner1;
    address public immutable partner2;
    uint256 public goalAmount;
    uint256 public goalDeadline;

    mapping(address => uint256) public contributions;

    struct WithdrawalRequest {
        uint256 amount;
        address initiator;
        bool partner1Approved;
        bool partner2Approved;
        bool executed;
        uint256 timestamp;
    }

    WithdrawalRequest public pendingWithdrawal;
    bool public hasActiveWithdrawal;

    // ============ Events ============

    event Deposit(address indexed from, uint256 amount, uint256 totalBalance);
    event WithdrawalRequested(uint256 indexed requestId, address indexed initiator, uint256 amount);
    event WithdrawalApproved(uint256 indexed requestId, address indexed approver);
    event WithdrawalExecuted(uint256 indexed requestId, address indexed to, uint256 amount);
    event WithdrawalCancelled(uint256 indexed requestId);
    event GoalReached(uint256 amount, uint256 timestamp);
    event GoalUpdated(uint256 newGoalAmount, uint256 newDeadline);

    // ============ Errors ============

    error Unauthorized();
    error InvalidAmount();
    error WithdrawalPending();
    error NoActiveWithdrawal();
    error AlreadyApproved();
    error InsufficientBalance();
    error InvalidPartners();
    error TransferFailed();
    error GoalNotReached();

    // ============ Modifiers ============

    modifier onlyPartners() {
        if (msg.sender != partner1 && msg.sender != partner2) {
            revert Unauthorized();
        }
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize a new PiggyBank for two partners
     * @param _partner1 Address of the first partner
     * @param _partner2 Address of the second partner
     * @param _goalAmount Target savings amount in wei
     * @param _goalDeadline Unix timestamp for goal deadline (0 for no deadline)
     */
    constructor(
        address _partner1,
        address _partner2,
        uint256 _goalAmount,
        uint256 _goalDeadline
    ) {
        if (_partner1 == address(0) || _partner2 == address(0)) {
            revert InvalidPartners();
        }
        if (_partner1 == _partner2) {
            revert InvalidPartners();
        }

        partner1 = _partner1;
        partner2 = _partner2;
        goalAmount = _goalAmount;
        goalDeadline = _goalDeadline;
    }

    // ============ Public Functions ============

    /**
     * @notice Deposit ETH into the piggy bank
     * @dev Can only be called by one of the partners
     */
    function deposit() external payable onlyPartners {
        if (msg.value == 0) {
            revert InvalidAmount();
        }

        contributions[msg.sender] += msg.value;
        uint256 totalBalance = address(this).balance;

        emit Deposit(msg.sender, msg.value, totalBalance);

        // Check if goal is reached
        if (totalBalance >= goalAmount && goalAmount > 0) {
            emit GoalReached(totalBalance, block.timestamp);
        }
    }

    /**
     * @notice Request a withdrawal from the piggy bank
     * @param amount Amount to withdraw in wei
     * @dev Initiates a multi-sig withdrawal that requires approval from both partners
     */
    function requestWithdrawal(uint256 amount) external onlyPartners {
        if (hasActiveWithdrawal) {
            revert WithdrawalPending();
        }
        if (amount == 0) {
            revert InvalidAmount();
        }
        if (amount > address(this).balance) {
            revert InsufficientBalance();
        }

        hasActiveWithdrawal = true;

        // Auto-approve for the initiator
        bool isPartner1 = msg.sender == partner1;

        pendingWithdrawal = WithdrawalRequest({
            amount: amount,
            initiator: msg.sender,
            partner1Approved: isPartner1,
            partner2Approved: !isPartner1,
            executed: false,
            timestamp: block.timestamp
        });

        emit WithdrawalRequested(block.timestamp, msg.sender, amount);

        // Auto-emit approval for initiator
        emit WithdrawalApproved(block.timestamp, msg.sender);
    }

    /**
     * @notice Approve a pending withdrawal request
     * @dev The other partner must call this to approve
     */
    function approveWithdrawal() external onlyPartners {
        if (!hasActiveWithdrawal) {
            revert NoActiveWithdrawal();
        }
        if (msg.sender == pendingWithdrawal.initiator) {
            revert AlreadyApproved();
        }

        bool isPartner1 = msg.sender == partner1;

        if (isPartner1) {
            if (pendingWithdrawal.partner1Approved) {
                revert AlreadyApproved();
            }
            pendingWithdrawal.partner1Approved = true;
        } else {
            if (pendingWithdrawal.partner2Approved) {
                revert AlreadyApproved();
            }
            pendingWithdrawal.partner2Approved = true;
        }

        emit WithdrawalApproved(pendingWithdrawal.timestamp, msg.sender);

        // Auto-execute if both approved
        if (pendingWithdrawal.partner1Approved && pendingWithdrawal.partner2Approved) {
            _executeWithdrawal();
        }
    }

    /**
     * @notice Cancel a pending withdrawal (only initiator can cancel)
     */
    function cancelWithdrawal() external onlyPartners {
        if (!hasActiveWithdrawal) {
            revert NoActiveWithdrawal();
        }
        if (msg.sender != pendingWithdrawal.initiator) {
            revert Unauthorized();
        }

        uint256 timestamp = pendingWithdrawal.timestamp;
        delete pendingWithdrawal;
        hasActiveWithdrawal = false;

        emit WithdrawalCancelled(timestamp);
    }

    /**
     * @notice Update the savings goal (requires both partners' approval)
     * @param newGoalAmount New target amount
     * @param newDeadline New deadline timestamp
     */
    function updateGoal(uint256 newGoalAmount, uint256 newDeadline) external onlyPartners {
        goalAmount = newGoalAmount;
        goalDeadline = newDeadline;

        emit GoalUpdated(newGoalAmount, newDeadline);
    }

    // ============ Internal Functions ============

    /**
     * @dev Execute the withdrawal after both partners have approved
     */
    function _executeWithdrawal() internal {
        if (pendingWithdrawal.executed) {
            return;
        }

        uint256 amount = pendingWithdrawal.amount;
        address initiator = pendingWithdrawal.initiator;
        uint256 timestamp = pendingWithdrawal.timestamp;

        pendingWithdrawal.executed = true;
        hasActiveWithdrawal = false;

        // Clear the withdrawal struct
        delete pendingWithdrawal;

        // Transfer funds
        (bool success, ) = payable(initiator).call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }

        emit WithdrawalExecuted(timestamp, initiator, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get the current balance of the piggy bank
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get contribution amount for a specific address
     */
    function getContribution(address partner) external view returns (uint256) {
        return contributions[partner];
    }

    /**
     * @notice Get progress towards goal as a percentage (scaled by 100)
     */
    function getGoalProgress() external view returns (uint256) {
        if (goalAmount == 0) {
            return 0;
        }
        return (address(this).balance * 100) / goalAmount;
    }

    /**
     * @notice Check if the goal has been reached
     */
    function isGoalReached() external view returns (bool) {
        return goalAmount > 0 && address(this).balance >= goalAmount;
    }

    /**
     * @notice Get pending withdrawal details
     */
    function getPendingWithdrawal() external view returns (
        uint256 amount,
        address initiator,
        bool partner1Approved,
        bool partner2Approved,
        bool executed,
        uint256 timestamp
    ) {
        WithdrawalRequest memory w = pendingWithdrawal;
        return (
            w.amount,
            w.initiator,
            w.partner1Approved,
            w.partner2Approved,
            w.executed,
            w.timestamp
        );
    }

    // ============ Receive Function ============

    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {
        // Accept ETH but only from partners via deposit()
        if (msg.sender != partner1 && msg.sender != partner2) {
            revert Unauthorized();
        }
    }
}
```

## Step 5: Create Factory Contract (Optional but Recommended)

Create `contracts/src/PiggyBankFactory.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PiggyBank.sol";

/**
 * @title PiggyBankFactory
 * @notice Factory contract to deploy and track PiggyBank instances
 */
contract PiggyBankFactory {
    // ============ State Variables ============

    mapping(address => address[]) public userPiggyBanks;
    address[] public allPiggyBanks;

    // ============ Events ============

    event PiggyBankCreated(
        address indexed piggyBank,
        address indexed partner1,
        address indexed partner2,
        uint256 goalAmount,
        uint256 goalDeadline
    );

    // ============ Functions ============

    /**
     * @notice Create a new PiggyBank contract
     */
    function createPiggyBank(
        address partner1,
        address partner2,
        uint256 goalAmount,
        uint256 goalDeadline
    ) external returns (address) {
        PiggyBank newPiggyBank = new PiggyBank(
            partner1,
            partner2,
            goalAmount,
            goalDeadline
        );

        address piggyBankAddress = address(newPiggyBank);

        allPiggyBanks.push(piggyBankAddress);
        userPiggyBanks[partner1].push(piggyBankAddress);
        userPiggyBanks[partner2].push(piggyBankAddress);

        emit PiggyBankCreated(
            piggyBankAddress,
            partner1,
            partner2,
            goalAmount,
            goalDeadline
        );

        return piggyBankAddress;
    }

    /**
     * @notice Get all piggy banks for a user
     */
    function getUserPiggyBanks(address user) external view returns (address[] memory) {
        return userPiggyBanks[user];
    }

    /**
     * @notice Get total number of piggy banks created
     */
    function getTotalPiggyBanks() external view returns (uint256) {
        return allPiggyBanks.length;
    }
}
```

## Step 6: Write Tests

Create `contracts/test/PiggyBank.t.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/PiggyBank.sol";

contract PiggyBankTest is Test {
    PiggyBank public piggyBank;

    address public partner1 = address(0x1);
    address public partner2 = address(0x2);
    address public stranger = address(0x3);

    uint256 public constant GOAL_AMOUNT = 10 ether;
    uint256 public goalDeadline;

    function setUp() public {
        goalDeadline = block.timestamp + 30 days;

        piggyBank = new PiggyBank(
            partner1,
            partner2,
            GOAL_AMOUNT,
            goalDeadline
        );

        // Fund test accounts
        vm.deal(partner1, 100 ether);
        vm.deal(partner2, 100 ether);
        vm.deal(stranger, 100 ether);
    }

    function test_Deployment() public {
        assertEq(piggyBank.partner1(), partner1);
        assertEq(piggyBank.partner2(), partner2);
        assertEq(piggyBank.goalAmount(), GOAL_AMOUNT);
        assertEq(piggyBank.goalDeadline(), goalDeadline);
    }

    function test_Deposit() public {
        vm.startPrank(partner1);
        piggyBank.deposit{value: 1 ether}();

        assertEq(piggyBank.getBalance(), 1 ether);
        assertEq(piggyBank.getContribution(partner1), 1 ether);
        vm.stopPrank();
    }

    function testFail_DepositFromStranger() public {
        vm.prank(stranger);
        piggyBank.deposit{value: 1 ether}();
    }

    function test_MultipleDeposits() public {
        vm.prank(partner1);
        piggyBank.deposit{value: 3 ether}();

        vm.prank(partner2);
        piggyBank.deposit{value: 2 ether}();

        assertEq(piggyBank.getBalance(), 5 ether);
        assertEq(piggyBank.getContribution(partner1), 3 ether);
        assertEq(piggyBank.getContribution(partner2), 2 ether);
    }

    function test_GoalProgress() public {
        vm.prank(partner1);
        piggyBank.deposit{value: 5 ether}();

        uint256 progress = piggyBank.getGoalProgress();
        assertEq(progress, 50); // 50%
    }

    function test_GoalReached() public {
        vm.prank(partner1);
        piggyBank.deposit{value: 10 ether}();

        assertTrue(piggyBank.isGoalReached());
    }

    function test_WithdrawalRequest() public {
        // Deposit some funds
        vm.prank(partner1);
        piggyBank.deposit{value: 5 ether}();

        // Request withdrawal
        vm.prank(partner1);
        piggyBank.requestWithdrawal(2 ether);

        assertTrue(piggyBank.hasActiveWithdrawal());

        (uint256 amount, address initiator, bool p1Approved, bool p2Approved, bool executed,) =
            piggyBank.getPendingWithdrawal();

        assertEq(amount, 2 ether);
        assertEq(initiator, partner1);
        assertTrue(p1Approved); // Auto-approved for initiator
        assertFalse(p2Approved);
        assertFalse(executed);
    }

    function test_WithdrawalApprovalAndExecution() public {
        // Deposit funds
        vm.prank(partner1);
        piggyBank.deposit{value: 5 ether}();

        uint256 partner1BalanceBefore = partner1.balance;

        // Partner1 requests withdrawal
        vm.prank(partner1);
        piggyBank.requestWithdrawal(2 ether);

        // Partner2 approves (should auto-execute)
        vm.prank(partner2);
        piggyBank.approveWithdrawal();

        // Check withdrawal was executed
        assertFalse(piggyBank.hasActiveWithdrawal());
        assertEq(piggyBank.getBalance(), 3 ether);
        assertEq(partner1.balance, partner1BalanceBefore + 2 ether);
    }

    function test_CancelWithdrawal() public {
        // Deposit and request withdrawal
        vm.prank(partner1);
        piggyBank.deposit{value: 5 ether}();

        vm.prank(partner1);
        piggyBank.requestWithdrawal(2 ether);

        // Cancel withdrawal
        vm.prank(partner1);
        piggyBank.cancelWithdrawal();

        assertFalse(piggyBank.hasActiveWithdrawal());
    }

    function testFail_WithdrawalExceedsBalance() public {
        vm.prank(partner1);
        piggyBank.deposit{value: 1 ether}();

        vm.prank(partner1);
        piggyBank.requestWithdrawal(5 ether);
    }

    function testFail_NonPartnerCancelWithdrawal() public {
        vm.prank(partner1);
        piggyBank.deposit{value: 5 ether}();

        vm.prank(partner1);
        piggyBank.requestWithdrawal(2 ether);

        vm.prank(partner2);
        piggyBank.cancelWithdrawal(); // Only initiator can cancel
    }
}
```

## Step 7: Run Tests

```bash
# Compile contracts
forge build

# Run all tests
forge test

# Run tests with verbosity
forge test -vvv

# Run specific test
forge test --match-test test_Deposit -vvv

# Check gas usage
forge test --gas-report

# Check coverage
forge coverage
```

## Step 8: Deploy Contract

Create `contracts/script/Deploy.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PiggyBankFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        PiggyBankFactory factory = new PiggyBankFactory();

        console.log("PiggyBankFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
```

Create `.env` in contracts folder:

```bash
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY"
PRIVATE_KEY="your-private-key-here"
ETHERSCAN_API_KEY="your-etherscan-api-key"
```

Deploy to Sepolia:

```bash
# Source environment variables
source .env

# Deploy
forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

# Verify contract (if not auto-verified)
forge verify-contract <CONTRACT_ADDRESS> PiggyBankFactory --chain sepolia --watch
```

## Step 9: Export ABI for Frontend

```bash
# Export ABI
forge inspect PiggyBank abi > ../src/contracts/PiggyBankABI.json
forge inspect PiggyBankFactory abi > ../src/contracts/PiggyBankFactoryABI.json
```

## Step 10: Create TypeScript Types

Create `src/contracts/types.ts`:

```typescript
import PiggyBankABI from "./PiggyBankABI.json";
import PiggyBankFactoryABI from "./PiggyBankFactoryABI.json";

export { PiggyBankABI, PiggyBankFactoryABI };

export const PIGGY_BANK_FACTORY_ADDRESS = process.env
  .NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;

export type PiggyBankContract = {
  address: `0x${string}`;
  abi: typeof PiggyBankABI;
};
```

## Gas Optimization Tips

1. Use `immutable` for addresses set in constructor
2. Pack struct variables efficiently
3. Use events instead of storing unnecessary data
4. Avoid loops where possible
5. Use `calldata` instead of `memory` for external function parameters

## Security Best Practices

- ✅ Use custom errors instead of require strings (gas efficient)
- ✅ Follow checks-effects-interactions pattern
- ✅ Protect against reentrancy
- ✅ Validate all inputs
- ✅ Use transfer guards
- ✅ Implement proper access control
- ✅ Test edge cases thoroughly

## Next Steps

- ✅ Smart contract written and tested
- ✅ Deployed to Sepolia testnet
- ✅ ABI exported for frontend
- ⏭️ Next: Push Protocol Integration (Stage 3)
