pragma solidity 0.4.18;

import "./SafeMath.sol";
import "./BytesLib.sol";
import "./ERC223.sol";
import "./ERC20.sol";
import "./TokenAirdrop.sol";


contract AirdropBatcher is ContractReceiver {
  using SafeMath for uint256;
  using BytesLib for bytes;

  TokenAirdrop private airdropContract;

  function AirdropBatcher(address airdropWallet) public {
    airdropContract = TokenAirdrop(airdropWallet);
  }

  // handle ERC223 batch airdrop
  // airdrop format
  // [uint256 amount][uint256 length][address a_1]...[address a_length]
  function tokenFallback(address /* from */, uint value, bytes data) public {
    uint256 amount = data.toUint(0);
    uint256 batchSize = data.toUint(32);
    uint256 totalAmount = amount.mul(batchSize);
    require(value == totalAmount);

    ERC223 token = ERC223(msg.sender);
    uint256 offset = 64;
    for (uint i = 0; i < batchSize; i++) {
      token.transfer(address(airdropContract), amount, data.slice(offset, 20));
      offset += 20;
    }
  }

  function batchERC20Airdrop(address token, uint256 amount, address[] recipients) public {
    ERC20 gift = ERC20(token);
    uint256 totalAmount = amount.mul(recipients.length);
    gift.transferFrom(msg.sender, address(this), amount.mul(recipients.length));
    uint256 received = gift.balanceOf(address(this));
    uint256 dropAmount;
    if (received != totalAmount) {
      dropAmount = received.div(recipients.length);
    } else {
      dropAmount = amount;
    }
    ERC20(token).approve(address(airdropContract), 0);
    ERC20(token).approve(address(airdropContract), totalAmount);
    for (uint i = 0; i < recipients.length; i++) {
      airdropContract.giftERC20(recipients[i], dropAmount, token);
    }
  }
}
