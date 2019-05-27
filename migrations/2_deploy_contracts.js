const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = async(deployer, network, accounts) => {
  let firstAirline = accounts[1];

  await deployer.deploy(FlightSuretyData);

  // Add and register the first airline during deploy
  let dataContract = await FlightSuretyData.deployed();
  await dataContract.addAirline(firstAirline, "JetFirst Airlines");
  await dataContract.addToRegisteredAirlines(firstAirline);

  // Deploy the app logic contract and authorize it with the data contract
  await deployer.deploy(FlightSuretyApp, FlightSuretyData.address);
  await dataContract.authorizeCaller(FlightSuretyApp.address);

  let config = {
    localhost: {
        url: 'http://localhost:8545',
        dataAddress: FlightSuretyData.address,
        appAddress: FlightSuretyApp.address
    }
  }
  fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
  fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
};
