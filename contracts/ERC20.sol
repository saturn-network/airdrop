pragma solidity ^0.4.18;

contract ERC20 {
  function totalSupply() public view returns (uint);
  function balanceOf(address holder) public view returns (uint);
  function allowance(address holder, address other) public view returns (uint);

  function approve(address other, uint amount) public returns (bool);
  function transfer(address to, uint amount) public returns (bool);
  function transferFrom(address from, address to, uint amount) public returns (bool);
}
