const chalk = require('chalk')

let version = require('../package.json').version
let logo = chalk.green.bold.underline(`Airdrop Tool v${version}. Made by Saturn Network. ${chalk.white('https://saturn.network')}`)

module.exports = logo
