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
