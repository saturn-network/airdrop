const AirdropBatcher = artifacts.require("AirdropBatcher");
const TokenAirdrop = artifacts.require("TokenAirdrop");

module.exports = (deployer, network, accounts) => {
  deployer.deploy(TokenAirdrop).then(() => {
    return deployer.deploy(AirdropBatcher,
      TokenAirdrop.address
    );
  });
};
