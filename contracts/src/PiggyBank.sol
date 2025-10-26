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
    event WithdrawalRequested(
        uint256 indexed requestId,
        address indexed initiator,
        uint256 amount
    );
    event WithdrawalApproved(
        uint256 indexed requestId,
        address indexed approver
    );
    event WithdrawalExecuted(
        uint256 indexed requestId,
        address indexed to,
        uint256 amount
    );
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
        if (
            pendingWithdrawal.partner1Approved &&
            pendingWithdrawal.partner2Approved
        ) {
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
    function updateGoal(
        uint256 newGoalAmount,
        uint256 newDeadline
    ) external onlyPartners {
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
    function getPendingWithdrawal()
        external
        view
        returns (
            uint256 amount,
            address initiator,
            bool partner1Approved,
            bool partner2Approved,
            bool executed,
            uint256 timestamp
        )
    {
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
