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
    function getUserPiggyBanks(
        address user
    ) external view returns (address[] memory) {
        return userPiggyBanks[user];
    }

    /**
     * @notice Get total number of piggy banks created
     */
    function getTotalPiggyBanks() external view returns (uint256) {
        return allPiggyBanks.length;
    }
}
