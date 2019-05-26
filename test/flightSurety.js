const Test = require('../config/testConfig.js');
const BigNumber = require('bignumber.js');

contract('FlightSurety Tests', async (accounts) => {

  let config;
  const firstAirline = accounts[1];

  before('setup contract', async () => {
    config = await Test.Config(accounts);
    // await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
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
  });

  it(`Only existing airline may register a new airline until there are at least four airlines registered`, async function () {
    let airlineToRegister = accounts[2];
    let errorThrown;

    await config.flightSuretyData.addAirline(
      airlineToRegister, "Test Airlines #1");

    try {
      await config.flightSuretyApp.registerAirline(airlineToRegister);
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

    await config.flightSuretyApp.registerAirline(
      accounts[5], {from: accounts[2]});
    await config.flightSuretyApp.registerAirline(
      accounts[5], {from: accounts[3]});

    // 3/5, 60% of the votes to register the airline have been cast
    let wasRegistered = (
      await config.flightSuretyData.hasAirlineBeenRegistered.call(
        accounts[5]));
    assert.equal(
      wasRegistered, true, "Airline not registered by consensus");
  });

  // it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

  //     await config.flightSuretyData.setOperatingStatus(false);

  //     let reverted = false;
  //     try 
  //     {
  //         await config.flightSurety.setTestingMode(true);
  //     }
  //     catch(e) {
  //         reverted = true;
  //     }
  //     assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

  //     // Set it back for other tests to work
  //     await config.flightSuretyData.setOperatingStatus(true);

  // });

  // it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
  //   // ARRANGE
  //   let newAirline = accounts[2];

  //   // ACT
  //   try {
  //       await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
  //   }
  //   catch(e) {

  //   }
  //   let result = await config.flightSuretyData.isAirline.call(newAirline); 

  //   // ASSERT
  //   assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  // });
 

});
