const ethers = require('ethers')


const etcprovider = new ethers.providers.JsonRpcProvider(
  'https://ethereumclassic.network', {
  chainId: 61,
  name: 'etc'
})

const ethprovider = new ethers.providers.JsonRpcProvider(
  'https://cloudflare-eth.com/', {
  chainId: 1,
  name: 'eth'
})

const providers = {
  etc: {
    provider: etcprovider,
    airdropContractAddress: '0x114Cd438F0403937256d2cff2f7fA3c7D01c6d50'
  },
  eth: {
    provider: ethprovider,
    airdropContractAddress: '0x1a3C8714b628b0958dc3ABEfC9f7BFD57FD65e77'
  }
}


module.exports = providers
