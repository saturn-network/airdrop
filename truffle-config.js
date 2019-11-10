const web3 = require('ethers')
const ProviderEngine = require("web3-provider-engine");
const RpcProvider = require("web3-provider-engine/subproviders/rpc.js");

// 7535 for Ganache
// Use 8545 for ganache-cli
const rpcurl = "http://localhost:7545"
const provider = new ProviderEngine();
const solcVersion = require('./compiler.json').solcVersion

provider.addProvider(new RpcProvider({ rpcUrl: rpcurl }));
provider.start(err => {
  if (err !== undefined) {
    console.log(err);
    process.exit(1);
  }
});
/**
 * HACK: Truffle providers should have `send` function, while `ProviderEngine` creates providers with `sendAsync`,
 * but it can be easily fixed by assigning `sendAsync` to `send`.
 */
provider.send = provider.sendAsync.bind(provider);

module.exports = {
  networks: {
    development: {
      provider,
      network_id: "*"
    }
  },
  compilers: {
    solc: {
      version: solcVersion,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};
