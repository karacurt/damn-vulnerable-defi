const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("[Challenge] Unstoppable", function () {
  let deployer, attacker, someUser;
  let token, pool, receiverContract, fakeReceiver;
  // Pool has 1M * 10**18 tokens
  const TOKENS_IN_POOL = ethers.utils.parseEther("1000000");
  const INITIAL_ATTACKER_TOKEN_BALANCE = ethers.utils.parseEther("100");

  before(async function () {
    /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */

    [deployer, attacker, someUser] = await ethers.getSigners();

    const DamnValuableTokenFactory = await ethers.getContractFactory(
      "DamnValuableToken",
      deployer
    );
    const UnstoppableLenderFactory = await ethers.getContractFactory(
      "UnstoppableLender",
      deployer
    );

    token = await DamnValuableTokenFactory.deploy();

    pool = await UnstoppableLenderFactory.deploy(token.address);

    await token.approve(pool.address, TOKENS_IN_POOL);
    await pool.depositTokens(TOKENS_IN_POOL);

    await token.transfer(attacker.address, INITIAL_ATTACKER_TOKEN_BALANCE);

    expect(await token.balanceOf(pool.address)).to.equal(TOKENS_IN_POOL);

    expect(await token.balanceOf(attacker.address)).to.equal(
      INITIAL_ATTACKER_TOKEN_BALANCE
    );

    // Show it's possible for someUser to take out a flash loan
    const ReceiverContractFactory = await ethers.getContractFactory(
      "ReceiverUnstoppable",
      someUser
    );
    receiverContract = await ReceiverContractFactory.deploy(pool.address);
    await receiverContract.executeFlashLoan(10);

    const FakeReceiverContractFactory = await ethers.getContractFactory(
      "FakeReceiverUnstoppable",
      attacker
    );
    fakeReceiver = await FakeReceiverContractFactory.deploy(pool.address);
  });

  async function printBalances() {
    const tokenPoolBalance = await token.balanceOf(pool.address);
    const attackerBalance = await token.balanceOf(attacker.address);
    const someUserBalance = await token.balanceOf(someUser.address);
    const poolBalance = await pool.poolBalance();

    console.group("######### Balances  ##########");

    console.log("pool Balance", poolBalance.toString());
    console.log("token PoolBalance", tokenPoolBalance.toString());
    console.log("token AttackerBalance", attackerBalance.toString());
    console.log("token SomeUserBalance", someUserBalance.toString());

    console.groupEnd();
    console.log("\n");
  }

  async function printAllowances() {
    const attackerAllowance = await token.allowance(
      attacker.address,
      pool.address
    );
    const fakeReceriverAllowance = await token.allowance(
      fakeReceiver.address,
      pool.address
    );
    const someUserAllowance = await token.allowance(
      someUser.address,
      pool.address
    );

    console.group("checking allowances");
    console.log("attacker allowance", attackerAllowance.toString());
    console.log("fake receiver allowance", fakeReceriverAllowance.toString());
    console.log("some user allowance", someUserAllowance.toString());
    console.groupEnd();
    console.log("\n");
  }
  async function approveAndDepositToPool(amount) {
    await token.connect(attacker).approve(pool.address, amount);
    await pool.connect(attacker).depositTokens(amount);
  }

  it("Exploit", async function () {
    /** CODE YOUR EXPLOIT HERE */
    const DEPOSIT_AMOUNT = ethers.utils.parseEther("99");
    console.log("DEPOSIT_AMOUNT", DEPOSIT_AMOUNT.toString());

    await printBalances();

    await approveAndDepositToPool(DEPOSIT_AMOUNT);
    await printBalances();

    console.log("fake receiving");
    await printAllowances();
    await fakeReceiver.connect(attacker).executeFlashLoan(DEPOSIT_AMOUNT);
    await printBalances();
    await printAllowances();

    console.log("atacking");
    //await fakeReceiver.connect(attacker).attack(token.address, DEPOSIT_AMOUNT);

    //await pool.connect(attacker).flashLoan(10);
  });

  after(async function () {
    /** SUCCESS CONDITIONS */

    // It is no longer possible to execute flash loans
    await expect(receiverContract.executeFlashLoan(10)).to.be.reverted;
  });
});
