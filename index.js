#!/usr/bin/env node

const ethers = require('ethers')
const fg = require('fast-glob')
const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const BigNumber = require('bignumber.js')
const inquirer = require('inquirer')
const chalk = require('chalk')

const providers = require('./src/networks')
const greeting = require('./src/logo')
const utils = require('./src/utils')
const logic = require('./src/airdrop-logic')

console.log(greeting)

let config = {
  blockchain: '',
  provider: null,
  wallet: null,
  myAddress: '',
  airdropContractAddress: '',
  tokenAddress: '',
  tokenName: '',
  tokenSymbol: '',
  tokenDecimals: null,
  tokenIsERC223: false,
  airdropAmount: null,
  myTokenBalance: null,
  addresses: []
}

let chainPrompt = {
  type: 'list',
  name: 'chain',
  message: 'What blockchain does your token exist on?',
  choices: Object.keys(providers)
};

inquirer.prompt(chainPrompt).then(answers => {
  config.blockchain = answers.chain
  config.provider = providers[answers.chain].provider
  config.airdropContractAddress = providers[answers.chain].airdropContractAddress
}).then(() => {
  getWallet()
})


function getWallet() {
  let pkeyOrMnemonicPrompt = {
    type: 'list',
    name: 'usersecret',
    message: 'How would you like to access your wallet?',
    choices: ['Private Key', '12 Word Mnemonic']
  }

  inquirer.prompt(pkeyOrMnemonicPrompt).then(answers => {
    if (answers.usersecret === 'Private Key') {
      walletFromPkey()
    } else {
      walletFromMnemonic()
    }
  })
}

function walletFromPkey() {
  let pkeyinput = {
    type: 'password',
    message: 'Enter your Private Key',
    name: 'pkey'
  }

  inquirer.prompt(pkeyinput).then(answers => {
    try {
      let wallet = new ethers.Wallet(answers.pkey)
      wallet.connect(config.provider)
      config.wallet = wallet
      config.myAddress = wallet.address
      getTokenInfo()
    } catch(e) {
      console.error(`Unable to connect to ${config.chain} blockchain. Check that your private key is correct.`)
      walletFromPkey()
    }
  })
}

function walletFromMnemonic() {
  let mnemonicPrompt = {
    type: 'password',
    message: 'Enter your 12 Word Seed Phrase',
    name: 'mnemonic'
  }

  inquirer.prompt(mnemonicPrompt).then(answers => {
    let offsets = [...Array(10).keys()]
    try {
      let wallets = offsets.map(x => {
        return ethers.Wallet.fromMnemonic(answers.mnemonic, `m/44'/60'/0'/0/${x}`)
      })

      let selectWalletPrompt = {
        type: 'rawlist',
        message: 'Select wallet:',
        name: 'addy',
        choices: wallets.map(x => x.address)
      }
      inquirer.prompt(selectWalletPrompt).then(answers => {
        let filtered = _.filter(wallets, x => x.address === answers.addy)
        let wallet = filtered[0].connect(config.provider)
        config.wallet = wallet
        config.myAddress = wallet.address
        getTokenInfo()
      })
    } catch(e) {
      console.error(`Unable to connect to ${config.chain} blockchain. Check that your 12 word mnemonic is correct.`)
      walletFromMnemonic()
    }
  })
}

function getTokenInfo() {
  let tokenAddressPrompt = {
    type: 'input',
    message: 'Enter address of the token you wish to airdrop',
    name: 'tokenAddress'
  }

  inquirer.prompt(tokenAddressPrompt).then(async (answers) => {
    try {
      let tokenInfo = await utils.getTokenInfo(config.blockchain, answers.tokenAddress)
      let tokenIsERC223 = await utils.tokenIsERC223(answers.tokenAddress, config.provider)
      let myTokenBalance = await utils.myTokenBalance(
        config.blockchain,
        answers.tokenAddress,
        config.myAddress
      )
      let myEtherBalance = await utils.myEtherBalance(
        config.blockchain,
        config.myAddress
      )

      config.tokenAddress = tokenInfo.address
      config.tokenName = tokenInfo.name
      config.tokenSymbol = tokenInfo.symbol
      config.tokenDecimals = tokenInfo.decimals
      config.tokenIsERC223 = tokenIsERC223
      config.myTokenBalance = new BigNumber(myTokenBalance)
      config.myEtherBalance = new BigNumber(myEtherBalance)

      if (config.myTokenBalance.isEqualTo(new BigNumber(0))) {
        throw new Error(`You do not have any ${config.tokenSymbol} in your wallet. Please top up your airdrop wallet first. Having trouble? You can order an airdrop here ${chalk.red.underline('https://forms.gle/QjtUYcbttCeyUfK48')}`)
      }

      console.log(`Fetched information for ${chalk.underline(config.tokenName)}. Your current token balance is ${chalk.green(config.myTokenBalance.toFixed())} ${config.tokenSymbol}`)
      console.log(`Your ${config.blockchain.toUpperCase()} balance is ${chalk.green(config.myEtherBalance)}. Make sure you have enough ${config.blockchain.toUpperCase()} in your wallet before you start the airdrop. We recommend having ${chalk.green.underline('at least 0.3 ' + config.blockchain.toUpperCase())} in your wallet for a successful airdrop.`)
      getAirdropAmount()
    } catch(e) {
      console.error(e.message)
      console.error(`Unable to fetch token information for '${answers.tokenAddress}'. Please ensure you entered correct token address and try again`)
      getTokenInfo()
    }
  })
}

function getAirdropAmount() {
  let prompt = {
    type: 'input',
    message: `How many ${config.tokenSymbol} tokens do you wish to airdrop? Press [ENTER] to airdrop full wallet balance.`,
    name: 'airdropAmount',
    default: config.myTokenBalance.toFixed()
  }

  inquirer.prompt(prompt).then((answers) => {
    let airdropAmount = new BigNumber(answers.airdropAmount)
    if (airdropAmount.isNaN()) {
      console.error(`Incorrect input. Try again`)
      getAirdropAmount()
    } else if (airdropAmount.isGreaterThan(config.myTokenBalance)) {
      console.error(`You cannot airdrop more tokens than you have in your wallet.`)
      getAirdropAmount()
    } else {
      config.airdropAmount = airdropAmount
      airdropAddressSelect()
    }
  })
}

function airdropAddressSelect() {
  utils.hodlers().then(async (hodlers) => {
    let genesis = require('./src/saturn-genesis.json')

    let strntraders = await utils.toptraders('strn')
    let saturntraders = await utils.toptraders('strn')

    let daoGenesisString = `Saturn DAO Genesis (${genesis.length} addresses)`
    let hodlerString = `Saturn HODL Investors (${hodlers.length} addresses)`
    let strnString = `Top 100 STRN traders by volume over last 100 days`
    let saturnString = `Top 100 SATURN traders by volume over last 100 days`
    let customString = `Custom airdrop - follow guide at ${chalk.underline('https://www.saturn.network/blog/airdrop-tool/')}`

    let prompt = {
      type: 'list',
      message: `Who do you want to receive the airdrop?`,
      name: 'airdropType',
      choices: [
        daoGenesisString,
        hodlerString,
        strnString,
        saturnString,
        customString
      ]
    }

    inquirer.prompt(prompt).then((answers) => {
      if (answers.airdropType == customString) {
        customAirdropAddressInput()
      } else if (answers.airdropType == daoGenesisString) {
        config.addresses = genesis
        resume()
      } else if (answers.airdropType == hodlerString) {
        config.addresses = hodlers
        resume()
      } else  if (answers.airdropType == strnString) {
        config.addresses = strntraders
        resume()
      } else  if (answers.airdropType == saturnString) {
        config.addresses = saturntraders
        resume()
      } else {
        console.error(`Wrong input. Try again`)
        airdropAddressSelect()
      }
    })
  })
}

function customAirdropAddressInput() {
  let goback = 'I do not have a JSON file. Go back to previous menu.'
  let pattern = path.join(process.cwd(), '*.json').replace(/\\/g, '/')

  let prompt = {
    type: 'list',
    message: `Select the .json file with addresses that you have prepared in advance.`,
    name: 'customAddresses',
    choices: fg.sync(pattern).concat([goback])
  }

  inquirer.prompt(prompt).then((answers) => {
    if (answers.customAddresses == goback) {
      return airdropAddressSelect()
    } else {
      config.addresses = require(answers.customAddresses)
      resume()
    }
  })
}

async function activateAirdrop() {
  if (!config.tokenIsERC223) {
    console.log(`Activating the airdrop...`)
    await logic.approve(
      config.wallet,
      config.tokenAddress,
      config.airdropAmount,
      config.tokenDecimals,
      config.airdropContractAddress
    )
  }
}

async function doAirdrop() {
  let batchabi = require('./config/airdropabi.json')
  console.log(`Airdropping ${config.airdropAmount} ${config.tokenName} tokens to ${config.addresses.length} addresses`)
  let batch = new ethers.Contract(config.airdropContractAddress, batchabi, config.wallet)
  let gasPrice = await utils.gasPrice(config.blockchain)

  let tokenhash = {
    "name": config.tokenName,
    "address": config.tokenAddress,
    "amount": config.airdropAmount
  }

  await activateAirdrop()

  config.tokenIsERC223
    ? await logic.erc223Airdrop(tokenhash, config.wallet, batch, config.addresses, gasPrice)
    : await logic.erc20Airdrop(tokenhash, config.wallet, batch, config.addresses, gasPrice)
}

function resume() {
  let prompt = {
    type: 'confirm',
    message: `Press [ENTER] to confirm that you have entered information correctly and you authorize the airdrop.`,
    name: 'execute',
    default: true
  }

  inquirer.prompt(prompt).then(async (answers) => {
    if (answers.execute) {
      await doAirdrop()
      console.log(chalk.green.bold(`Airdrop complete! Tell your community to visit ${chalk.underline('https://www.saturn.network/my-airdrops')} to collect their new ${config.tokenSymbol} tokens!`))
      process.exit(0)
    } else {
      console.log(`You have decided to abort the airdrop and the program will now exit.\nHaving trouble? You can order an airdrop here ${chalk.red.underline('https://forms.gle/QjtUYcbttCeyUfK48')}`)
      process.exit(0)
    }
  })
}
