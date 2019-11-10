const axios = require('axios')
const chalk = require('chalk')

const etherAddress = '0x0000000000000000000000000000000000000000'

let getTokenInfo = async (blockchain, address) => {
  let url = `https://ticker.saturn.network/api/v2/tokens/show/${blockchain}/${address}.json`
  try {
    let token = await axios.get(url)
    if (token.status !== 200) { throw new Error('No such token!') }
    return token.data
  } catch (e) {
    throw new Error(`API error while fetching token info. Having trouble? You can order an airdrop here ${chalk.red.underline('https://forms.gle/QjtUYcbttCeyUfK48')}`)
  }
}

let myTokenBalance = async (blockchain, address, myAddress) => {
  let url = `https://ticker.saturn.network/api/v2/tokens/balances/${blockchain}/${myAddress}/${address}.json`
  try {
    let token = await axios.get(url)
    if (token.status !== 200) { throw new Error('No such token!') }
    return token.data.balances.walletbalance
  } catch (e) {
    throw new Error(`Unable to fetch your token balance. Having trouble? You can order an airdrop here ${chalk.red.underline('https://forms.gle/QjtUYcbttCeyUfK48')}`)
  }
}

let myEtherBalance = async (blockchain, myAddress) => {
  try {
    return await myTokenBalance(blockchain, etherAddress, myAddress)
  } catch (e) {
    throw new Error(`Unable to fetch your ${blockchain.toUpperCase()} balance. Having trouble? You can order an airdrop here ${chalk.red.underline('https://forms.gle/QjtUYcbttCeyUfK48')}`)
  }
}


let tokenIsERC223 = async (address, provider) => {
  try {
    let code = await provider.getCode(address)
    let hash = 'be45fd62'
    return (code.indexOf(hash.slice(2, hash.length)) > 0)
  } catch (e) {
    throw new Error(`Unable to determine token type. Having trouble? You can order an airdrop here ${chalk.red.underline('https://forms.gle/QjtUYcbttCeyUfK48')}`)
  }
}

let hodlers = async () => {
  let url = `https://ticker.saturn.network/api/v2/hodl/allinvestors.json`
  try {
    let answer = await axios.get(url)
    if (answer.status !== 200) { throw new Error('') }
    return answer.data
  } catch (e) {
    throw new Error(`Unable to fetch list of Saturn HODLers. Having trouble? You can order an airdrop here ${chalk.red.underline('https://forms.gle/QjtUYcbttCeyUfK48')}`)
  }
}

let toptraders = async (token) => {
  let url = `https://ticker.saturn.network/api/v2/airdrops/toptraders/${token}.json`
  try {
    let answer = await axios.get(url)
    if (answer.status !== 200) { throw new Error('') }
    if (answer.data.error_message) {
      throw new Error(answer.data.error_message)
    }
    return answer.data
  } catch (e) {
    if (e.message) { console.error(e.message) }
    throw new Error(`Unable to fetch list of Saturn HODLers. Having trouble? You can order an airdrop here ${chalk.red.underline('https://forms.gle/QjtUYcbttCeyUfK48')}`)
  }
}

let gasPrice = async (chain) => {
  if (chain.toUpperCase() === 'ETH') {
    try {
      let gasApiUrl = 'https://www.ethgasstationapi.com/api/standard'
      return (await axios.get(gasApiUrl)).data * 1000000000
    } catch (e) {
      throw new Error(`Unable to estimate cost of your airdrop, Ethereum blockchain infrastructure might be under DDOS attack. Having trouble? You can order an airdrop here and we will take care of these issues for you ${chalk.red.underline('https://forms.gle/QjtUYcbttCeyUfK48')}`)
    }
  }

  // for all other chains set a small gas price
  return 1000000
}

module.exports = {
  getTokenInfo: getTokenInfo,
  tokenIsERC223: tokenIsERC223,
  myTokenBalance: myTokenBalance,
  myEtherBalance: myEtherBalance,
  hodlers: hodlers,
  toptraders: toptraders,
  gasPrice: gasPrice
}
