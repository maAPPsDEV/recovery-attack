// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Recovery {
  //generate tokens
  function generateToken(string memory _name, uint256 _initialSupply) public {
    new SimpleToken(_name, msg.sender, _initialSupply);
  }
}

contract SimpleToken {
  using SafeMath for uint256;
  // public variables
  string public name;
  mapping(address => uint256) public balances;

  // constructor
  constructor(
    string memory _name,
    address _creator,
    uint256 _initialSupply
  ) public {
    name = _name;
    balances[_creator] = _initialSupply;
  }

  // collect ether in return for tokens
  fallback() external payable {
    balances[msg.sender] = msg.value.mul(10);
  }

  // get balance of an account
  function balanceOf(address _account) public view returns (uint256) {
    return balances[_account];
  }

  // allow transfers of tokens
  function transfer(address _to, uint256 _amount) public {
    require(balances[msg.sender] >= _amount);
    balances[msg.sender] = balances[msg.sender].sub(_amount);
    balances[_to] = _amount;
  }

  // clean up after ourselves
  function destroy(address payable _to) public {
    selfdestruct(_to);
  }
}
