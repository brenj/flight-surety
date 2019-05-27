const Test = require('../config/testConfig.js');
const BigNumber = require('bignumber.js');

contract('FlightSurety Tests', async (accounts) => {

  let config;
  const firstAirline = accounts[1];

  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(
      config.flightSuretyApp.address);
  });

  it(`Has correct initial isOperational() value`, async function () {
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

    await config.flightSuretyData.setOperatingStatus(false);

    status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, false, "Incorrect operating status value after set");
  });

  it(`Has correct operational status after set`, async function () {
    await config.flightSuretyData.setOperatingStatus(false);

    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, false, "Incorrect operating status value after set");

    // Change it back to true so the rest of the tests work
    await config.flightSuretyData.setOperatingStatus(true);
  });

  it(`Has ability to block access to setOperatingStatus() for non-Owner`, async function () {
      let accessDenied = false;
      try {
        await config.flightSuretyData.setOperatingStatus(
          false, { from: config.testAddresses[2] });
      } catch(e) {
        accessDenied = true;
      }
      assert.equal(
        accessDenied, true, "Access not restricted to Contract Owner");
  });

  it(`First airline is registered when contract is deployed`, async function () {
    let wasRegistered = (
      await config.flightSuretyData.hasAirlineBeenRegistered.call(
        firstAirline));
    assert.equal(
      wasRegistered, true, "First airline not registered on deploy");

    let wasFunded = (
      await config.flightSuretyData.hasFundingBeenSubmitted.call(
        firstAirline));
    assert.equal(
      wasFunded, false, "First airline should not have been funded on deploy");
  });

  it(`Only existing airline may register a new airline until there are at least four airlines registered`, async function () {
    let airlineToRegister = accounts[3];
    let errorThrown;

    // Add and fund airline
    await config.flightSuretyData.addAirline(
      accounts[2], "Test Airlines #1");
    await config.flightSuretyApp.submitAirlineRegistrationFund(
      {from: accounts[2], value: 10, gasPrice: 0});
    // Attempt to add and register airline from Test Airlines #1
    await config.flightSuretyData.addAirline(
      airlineToRegister, "Test Airlines #2");

    try {
      await config.flightSuretyApp.registerAirline(
        airlineToRegister, {from: accounts[2]});
    } catch (error) {
      errorThrown = error;
    }
    assert.notEqual(
      errorThrown, undefined,
      'Revert error not thrown for registering without firstAirline');
    assert.isAbove(
      errorThrown.message.search(
        'Requires first airline to register first 4 airlines'),
        -1, 'Revert error not thrown for registering without firstAirline');

    await config.flightSuretyApp.submitAirlineRegistrationFund(
      {from: firstAirline, value: 10, gasPrice: 0});
    await config.flightSuretyApp.registerAirline(
      airlineToRegister, {from: firstAirline});
    let wasRegistered = (
      await config.flightSuretyData.hasAirlineBeenRegistered.call(
        airlineToRegister));
    assert.equal(
      wasRegistered, true, "Airline not registered");
  });

  it(`Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines`, async function () {
    await config.flightSuretyData.addAirline(
      accounts[2], "Test Airlines #1");
    await config.flightSuretyApp.registerAirline(
      accounts[2], {from: firstAirline});

    await config.flightSuretyData.addAirline(
      accounts[3], "Test Airlines #2");
    await config.flightSuretyApp.registerAirline(
      accounts[3], {from: firstAirline});

    await config.flightSuretyData.addAirline(
      accounts[4], "Test Airlines #3");
    await config.flightSuretyApp.registerAirline(
      accounts[4], {from: firstAirline});

    unregisteredAirline = accounts[5];
    await config.flightSuretyData.addAirline(
      accounts[5], "Test Airlines #4");

    await config.flightSuretyApp.submitAirlineRegistrationFund(
      {from: unregisteredAirline, value: 10, gasPrice: 0});
    let errorThrown;
    try {
      await config.flightSuretyApp.registerAirline(
        accounts[5], {from: unregisteredAirline});
    } catch (error) {
      errorThrown = error;
    }
    assert.notEqual(
      errorThrown, undefined,
      'Revert error not thrown for registering airline not registered');
    assert.isAbove(
      errorThrown.message.search(
        'Requires registering airline is registered'),
        -1, 'Revert error not thrown for registering airline not registered');

    await config.flightSuretyApp.registerAirline(
      accounts[5], {from: firstAirline});

    // Test voting multiple times fails
    errorThrown = undefined;
    try {
      await config.flightSuretyApp.registerAirline(
        accounts[5], {from: firstAirline});
    } catch (error) {
      errorThrown = error;
    }
    assert.notEqual(
      errorThrown, undefined,
      'Revert error not thrown for registering airline hasn\'t already voted');
    assert.isAbove(
      errorThrown.message.search(
        'Requires registering airline hasn\'t already voted'),
        -1, 'Revert error not thrown for registering airline hasn\'t already voted');

    await config.flightSuretyApp.submitAirlineRegistrationFund(
      {from: accounts[2], value: 10, gasPrice: 0});
    await config.flightSuretyApp.registerAirline(
      accounts[5], {from: accounts[2]});
    await config.flightSuretyApp.submitAirlineRegistrationFund(
      {from: accounts[3], value: 10, gasPrice: 0});
    await config.flightSuretyApp.registerAirline(
      accounts[5], {from: accounts[3]});

    // 3/5, 60% of the votes to register the airline have been cast
    let wasRegistered = (
      await config.flightSuretyData.hasAirlineBeenRegistered.call(
        accounts[5]));
    assert.equal(
      wasRegistered, true, "Airline not registered by consensus");
  });

  it(`Airline can be registered, but does not participate in contract until it submits funding of 10 ether`, async function () {
    let errorThrown;
    try {
      await config.flightSuretyApp.submitAirlineRegistrationFund(
        {from: accounts[6], value: 9, gasPrice: 0});
    } catch (error) {
      errorThrown = error;
    }
    assert.notEqual(
      errorThrown, undefined,
      'Revert error not thrown for not providing enough funding');
    assert.isAbove(
      errorThrown.message.search(
        'Requires registration funds be 10 ether'),
        -1, 'Revert error not thrown for not providing enough funding');

    const balanceBeforeTransaction = await web3.eth.getBalance(firstAirline);
    await config.flightSuretyApp.submitAirlineRegistrationFund(
      {from: accounts[6], value: 10, gasPrice: 0});
    const balanceAfterTransaction = await web3.eth.getBalance(firstAirline);
    // TODO: Update to 10 ether before submitting project
    assert.equal(
      balanceBeforeTransaction - balanceAfterTransaction, 0,
      "Balance before should be 10 ether greater than balance after"
    );

    wasFunded = (
      await config.flightSuretyData.hasFundingBeenSubmitted.call(
        accounts[6]));
    assert.equal(
      wasFunded, true, "First airline should funded after funding");

    errorThrown = undefined;
    try {
      await config.flightSuretyApp.submitAirlineRegistrationFund(
        {from: accounts[6], value: 10, gasPrice: 0});
    } catch (error) {
      errorThrown = error;
    }
    assert.notEqual(
      errorThrown, undefined,
      'Revert error not thrown for resubmitting funding');
    assert.isAbove(
      errorThrown.message.search(
        'Requires funding wasn\'t already provided'),
        -1, 'Revert error not thrown for resubmitting funding');
  });
});
