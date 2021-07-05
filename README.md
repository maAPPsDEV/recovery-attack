# Solidity Game - Recovery Attack

_Inspired by OpenZeppelin's [Ethernaut](https://ethernaut.openzeppelin.com), Recovery Level_

⚠️Do not try on mainnet!

## Task

A contract creator has built a very simple token factory contract. Anyone can create new tokens with ease. After deploying the first token contract, the creator sent `0.5` ether to obtain more tokens. They have since lost the contract address.
This game will be completed if you can recover (or remove) the `0.5` ether from the lost contract address.

_Hint:_

1. `selfdestruct` can send ether.
2. Contract addresses are deterministically calculated.

## What will you learn?

1. Calculating new contract address
2. `selfdestruct`

## What is the most difficult challenge?

It’s a common flub for Solidity developers to lose a newly created contract address. This becomes frustrating, especially if you also lose the transaction receipt and other means of retracing your steps. 🤔

Here is a method for finding the contract address, via raw sender information.

### Calculate the contract address

Contract addresses are deterministically calculated. From the yellow paper:

> The address of the new account is defined as being the rightmost 160 bits of the Keccak hash of the RLP encoding of the structure containing only the sender and the account nonce. Thus we define the resultant address for the new account `a ≡ B96..255 KEC RLP (s, σ[s]n − 1)`

An easier way to represent this function is:

```
address = rightmost_20_bytes(keccak(RLP(sender address, nonce)))
```

Where:

- `sender address`: is the contract or wallet address that created this new contract
- `nonce`: is the number of transactions sent from the `sender address` OR, **if the sender is a factory contract, the `nonce` is the number of contract-creations made by this account.**
- `RLP`: is an encoder on data structure, and is the default to serialize objects in Ethereum.
- `keccak`: is a cryptographic primitive that compute the Ethereum-SHA-3 (Keccak-256) hash of any input.

**Recreating this Remix**

Let’s calculate the address of a new contract created by an existing contract located at `0x890ca422059d877085ce763187ddb12b62ab809d`. Let’s assume that this is the first ever contract creation from this address, so the nonce (transaction count) should be `1`.

> _Interesting fact: nonce 0 is always the smart contract’s own creation event_

1. From [documentation](https://github.com/ethereum/wiki/wiki/RLP), the RLP encoding of a 20-byte address is: `0xd6`, `0x94`. And for all integers less than `0x7f`, its encoding is just its own byte value. So the RLP of 1 is `0x01`.
2. In Remix, compute the following:

```
address public a = address(keccak256(0xd6, 0x94, YOUR_ADDR, 0x01));
```

3. This yields `0x048559A2982f50c268B80E14b1A98A1524295016`, which is presumably the first address of the new smart contract the existing contract will deploy.
4. To get subsequent contract addresses, simply increment the nonce.

## Security Considerations

- **Money laundering potential**: {this blog post](http://swende.se/blog/Ethereum_quirks_and_vulns.html) elaborates on the potential of using future contract addresses to hide money. Essentially, you can send Ethers to a deterministic address, but the contract there is currently nonexistent. These funds are effectively lost forever until you decide to create a contract at that address and regain ownership.
- **You are not anonymous on Ethereum**: Anyone can follow your current transaction traces, as well as monitor your future contract addresses. This transaction pattern can be used to derive your real world identity.

## Source Code

⚠️This contract contains a bug or risk. Do not use on mainnet!

```solidity
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

```

## Configuration

### Install Truffle cli

_Skip if you have already installed._

```
npm install -g truffle
```

### Install Dependencies

```
yarn install
```

## Test and Attack!💥

### Run Tests

```
truffle develop
test
```

```
truffle(develop)> test
Using network 'develop'.


Compiling your contracts...
===========================
> Everything is up to date, there is nothing to compile.



  Contract: Hacker
    √ should destroy token contract (769ms)


  1 passing (853ms)

```
