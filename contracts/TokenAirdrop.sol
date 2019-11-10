pragma solidity ^0.4.18;

import "./SafeMath.sol";
import "./BytesLib.sol";
import "./ERC223.sol";
import "./ERC20.sol";

contract TokenAirdrop is ContractReceiver {
  using SafeMath for uint256;
  using BytesLib for bytes;

  // let users withdraw their tokens
  // person => token => balance
  mapping(address => mapping(address => uint256)) private balances;
  address private etherAddress = 0x0;

  event Airdrop(
    address from,
    address to,
    address token,
    uint amount,
    uint time
  );
  event Claim(
    address claimer,
    address token,
    uint amount,
    uint time
  );


  // handle incoming ERC223 tokens
  function tokenFallback(address from, uint value, bytes data) public {
    require(data.length == 20);
    address beneficiary = data.toAddress(0);
    balances[beneficiary][msg.sender] = balances[beneficiary][msg.sender].add(value);
    Airdrop(from, beneficiary, msg.sender, value, now);
  }

  // handle ether
  function giftEther(address to) public payable {
    require(msg.value > 0);
    balances[to][etherAddress] = balances[to][etherAddress].add(msg.value);
    Airdrop(msg.sender, to, etherAddress, msg.value, now);
  }

  // handle ERC20
  function giftERC20(address to, uint amount, address token) public {
    ERC20(token).transferFrom(msg.sender, address(this), amount);
    balances[to][token] = balances[to][token].add(amount);
    Airdrop(msg.sender, to, token, amount, now);
  }

  function claim(address token) public {
    uint amount = balanceOf(msg.sender, token);
    require(amount > 0);
    balances[msg.sender][token] = 0;
    require(sendTokensTo(msg.sender, amount, token));
    Claim(msg.sender, token, amount, now);
  }

  function balanceOf(address person, address token) public view returns(uint) {
    return balances[person][token];
  }

  function sendTokensTo(address destination, uint256 amount, address tkn) private returns(bool) {
    if (tkn == etherAddress) {
      destination.transfer(amount);
    } else {
      require(ERC20(tkn).transfer(destination, amount));
    }
    return true;
  }
}
