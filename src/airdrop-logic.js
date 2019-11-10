const BigNumber = require('bignumber.js')
const ethers = require('ethers')
const _ = require('lodash')

const defaultBatchSize = 50

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeuint(number) {
  return ethers.utils.hexlify(number).substring(2).padStart(64, '0')
}

function makePayload(amount, addressArray) {
  return '0x'
    + makeuint(amount)
    + makeuint(addressArray.length)
    + addressArray.map(x => x.toLowerCase()).reduce((acc, v) => acc + v.substring(2), '')
}

let approve = async (wallet, tokenAddress, amount, decimals, airdropAddress) => {
  let abi = [
    'function decimals() constant public returns (uint8)',
    'function approve(address other, uint amount) public returns (bool)',
    'function allowance(address holder, address other) public view returns (uint)'
  ]

  let token = new ethers.Contract(tokenAddress, abi, wallet)
  let rawamount = new BigNumber(amount).shiftedBy(decimals)
  let tx = await token.approve(
    airdropAddress,
    ethers.utils.bigNumberify(rawamount.toFixed())
  )
  console.log(`Setting allowance, tx: ${tx.hash}`)
  await tx.wait()
  await sleep(100)
}

let erc20Airdrop = async (tokenhash, wallet, batch, addresses, gasPrice) => {
  let abi = [
    'function decimals() constant public returns (uint8)',
    'function approve(address other, uint amount) public returns (bool)',
    'function allowance(address holder, address other) public view returns (uint)'
  ]

  let token = new ethers.Contract(tokenhash.address, abi, wallet)
  let decimals = (await token.decimals()).toString()
  let totalAmount = new BigNumber(tokenhash.amount).shiftedBy(parseInt(decimals))
  let amountPerPerson = totalAmount.dividedBy(addresses.length).integerValue(BigNumber.ROUND_DOWN)
  console.log(`Amount per person: ${amountPerPerson.shiftedBy(-parseInt(decimals))} ${tokenhash.name}`)

  let allowance = (await token.allowance(wallet.address, batch.address)).toString()
  if (new BigNumber(allowance).isLessThan(totalAmount)) {
    let tx = await token.approve(
      batch.address,
      ethers.utils.bigNumberify(totalAmount.toFixed())
    )
    console.log(`Setting allowance, tx: ${tx.hash}`)
    await tx.wait()
  }

  let chunks = _.chunk(addresses, defaultBatchSize)
  let i = 0
  for (block of chunks) {
    ++i;
    if (i > 0) {
      let tx = await batch.batchERC20Airdrop(
        token.address,
        ethers.utils.bigNumberify(amountPerPerson.valueOf()),
        block,
        { gasPrice: gasPrice }
      )
      console.log(`Airdropping batch ${i}/${chunks.length}, tx: ${tx.hash}`)
      await tx.wait()
      await sleep(100)
    }
  }
}

let erc223Airdrop = async (tokenhash, wallet, batch, addresses, gasPrice) => {
  let abi = [
    'function decimals() constant public returns (uint8)',
    'function transfer(address to, uint value, bytes data) public returns (bool ok)'
  ]
  let token = new ethers.Contract(tokenhash.address, abi, wallet)
  let decimals = (await token.decimals()).toString()
  let totalAmount = new BigNumber(tokenhash.amount).shiftedBy(parseInt(decimals))
  let amountPerPerson = totalAmount.dividedBy(addresses.length).integerValue(BigNumber.ROUND_DOWN)
  console.log(`Amount per person: ${amountPerPerson.shiftedBy(-parseInt(decimals))} ${tokenhash.name}`)

  let chunks = _.chunk(addresses, defaultBatchSize)
  let i = 0
  for (block of chunks) {
    ++i;
    let payload = makePayload(ethers.utils.bigNumberify(amountPerPerson.valueOf()), block)
    let batchValueAmount = amountPerPerson.times(block.length)

    let tx = await token.transfer(
      batch.address,
      ethers.utils.bigNumberify(batchValueAmount.toFixed()),
      payload,
      { gasPrice: gasPrice }
    )
    console.log(`Airdropping batch ${i}/${chunks.length}, tx: ${tx.hash}`)
    await tx.wait()
    await sleep(100)
  }
}

module.exports = {
  erc223Airdrop: erc223Airdrop,
  erc20Airdrop: erc20Airdrop,
  approve: approve
}
