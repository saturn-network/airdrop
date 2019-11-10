pragma solidity ^0.4.18;

import "./ERC223.sol";

contract ERC223Token is ERC223I {
  function ERC223Token() public {
    name = "ERC223 Token";
    symbol = "ERC223";
    decimals = 8;
    totalSupply = 1000 * 10**uint256(decimals);
    balances[msg.sender] = totalSupply;
  }
}
