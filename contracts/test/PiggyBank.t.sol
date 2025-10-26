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

    function test_RevertIf_DepositFromStranger() public {
        vm.prank(stranger);
        vm.expectRevert(PiggyBank.Unauthorized.selector);
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

        (
            uint256 amount,
            address initiator,
            bool p1Approved,
            bool p2Approved,
            bool executed,

        ) = piggyBank.getPendingWithdrawal();

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

    function test_RevertIf_WithdrawalExceedsBalance() public {
        vm.prank(partner1);
        piggyBank.deposit{value: 1 ether}();

        vm.prank(partner1);
        vm.expectRevert(PiggyBank.InsufficientBalance.selector);
        piggyBank.requestWithdrawal(5 ether);
    }

    function test_RevertWhen_NonInitiatorCancelsWithdrawal() public {
        vm.prank(partner1);
        piggyBank.deposit{value: 5 ether}();

        vm.prank(partner1);
        piggyBank.requestWithdrawal(2 ether);

        vm.prank(partner2);
        vm.expectRevert(PiggyBank.Unauthorized.selector);
        piggyBank.cancelWithdrawal(); // Only initiator can cancel
    }
}
