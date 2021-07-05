const Recovery = artifacts.require("Recovery");

module.exports = function (_deployer) {
  // Use deployer to state migration tasks.
  _deployer.deploy(Recovery);
};
