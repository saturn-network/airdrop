let BigNumber = require('bignumber.js')
let ethers = require('ethers')

var eBOMB = artifacts.require("./eBOMB.sol")
var ERC223Token = artifacts.require("./ERC223Token.sol")
var ERC20Token = artifacts.require("./ERC20Token.sol")
var TokenAirdrop = artifacts.require("./TokenAirdrop.sol")
var AirdropBatcher = artifacts.require("./AirdropBatcher.sol")

function makeuint(number) {
  return ethers.utils.hexlify(number).substring(2).padStart(64, '0')
}

function makePayload(amount, addressArray) {
  return '0x'
    + makeuint(amount)
    + makeuint(addressArray.length)
    + addressArray.reduce((acc, v) => acc + v.substring(2), '')
}

function assertJump(error) {
  let revertOrInvalid = error.message.search('invalid opcode|revert')
  assert.isAbove(revertOrInvalid, -1, 'Invalid opcode error must be returned')
}

contract('AirdropBatcher', function(accounts) {
  var beneficiaries, amountPerAirdrop

  before("Set up helpful constants", () => {
    beneficiaries = [
      accounts[4],
      accounts[5],
      accounts[6],
      accounts[7],
      accounts[8],
      accounts[9]
    ]

    amountPerAirdrop = 100
  })

  it("Can manually airdrop eBOMB", async () => {
    const ta = await TokenAirdrop.deployed()
    const ebomb = await eBOMB.deployed()

    try {
      await ta.giftERC20(accounts[1], amountPerAirdrop, ebomb.address)
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }

    await ebomb.approve(ta.address, amountPerAirdrop)
    await ta.giftERC20(accounts[1], amountPerAirdrop, ebomb.address)

    try {
      await ta.claim(ebomb.address, {from: accounts[0]})
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }

    await ta.claim(ebomb.address, {from: accounts[1]})
  })

  it("Can batch airdrop eBOMB", async () => {
    const ta = await TokenAirdrop.deployed()
    const batch = await AirdropBatcher.deployed()
    const ebomb = await eBOMB.deployed()

    await ebomb.approve(batch.address, amountPerAirdrop*beneficiaries.length)
    await batch.batchERC20Airdrop(ebomb.address, amountPerAirdrop, beneficiaries)

    for (var addy of beneficiaries) {
      await ta.claim(ebomb.address, {from: addy})
    }
  })

  it("Can manually airdrop ERC20 token", async () => {
    const ta = await TokenAirdrop.deployed()
    const erc20t = await ERC20Token.deployed()

    try {
      await ta.giftERC20(accounts[1], amountPerAirdrop, erc20t.address)
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }

    await erc20t.approve(ta.address, amountPerAirdrop)
    await ta.giftERC20(accounts[1], amountPerAirdrop, erc20t.address)

    try {
      await ta.claim(erc20t.address, {from: accounts[0]})
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }

    await ta.claim(erc20t.address, {from: accounts[1]})
  })

  it("Can batch airdrop ERC20 token", async () => {
    const ta = await TokenAirdrop.deployed()
    const batch = await AirdropBatcher.deployed()
    const erc20t = await ERC20Token.deployed()

    await erc20t.approve(batch.address, amountPerAirdrop*beneficiaries.length)
    await batch.batchERC20Airdrop(erc20t.address, amountPerAirdrop, beneficiaries)

    for (var addy of beneficiaries) {
      await ta.claim(erc20t.address, {from: addy})
    }
  })

  it("Can manually airdrop ERC223 token", async () => {
    const ta = await TokenAirdrop.deployed()
    const erc223t = await ERC223Token.deployed()

    await erc223t.transfer(
      ta.address,
      amountPerAirdrop,
      accounts[1]
    )

    try {
      await ta.claim(erc223t.address, {from: accounts[0]})
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }

    await ta.claim(erc223t.address, {from: accounts[1]})
  })

  it("Can batch airdrop ERC223 token", async () => {
    const ta = await TokenAirdrop.deployed()
    const batch = await AirdropBatcher.deployed()
    const erc223t = await ERC223Token.deployed()

    let payload = makePayload(amountPerAirdrop, beneficiaries)

    try {
      await erc223t.transfer(
        batch.address,
        amountPerAirdrop*beneficiaries.length + 1,
        payload
      )
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }

    await erc223t.transfer(
      batch.address,
      amountPerAirdrop*beneficiaries.length,
      payload
    )

    try {
      await ta.claim(erc223t.address, {from: accounts[0]})
      assert.fail('Rejected!')
    } catch(error) {
      assertJump(error)
    }

    for (var addy of beneficiaries) {
      await ta.claim(erc223t.address, {from: addy})
    }
  })
})
