const eBOMB = artifacts.require("eBOMB");
const ERC20Token = artifacts.require("ERC20Token");
const ERC223Token = artifacts.require("ERC223Token");

module.exports = (deployer, network, accounts) => {
  deployer.deploy(ERC20Token).then(() => {
    return deployer.deploy(ERC223Token).then(() => {
      return deployer.deploy(eBOMB);
    });
  });
};
