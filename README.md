FlightSurety
============

About
-----

`FlightSurety` is a decentralized application that offers flight delay insurance to airline passengers. This project is a learning exercise and will not be deployed to the Ethereum network. In short, mock oracles will provide flight status information to this Dapp and if a flight is delayed due to airline fault, passengers will be paid 1.5 times the amount they paid for the insurance. The dapp is managed as a collaboration between multiple airlines.

In light of this project being purely for learning purposes with no intention of ever becoming published, I make the assumption that flight numbers or IDs are unique within an airline. The front-end only exercises part of the dapp for a single airline and could be improved greatly. It is merely to demo a couple features and understand how everything fits together in a dapp.

From Udacity:
> Learn to build a Dapp with multiple smart contracts which are autonomously triggered by external sources, and which handle payments based on flight delay scenarios.

Supporting courses:
* Advanced Blockchain Concepts and Oracles

Requirements
------------
* Node v10.x.x
* Node Package Manager (npm)
* Truffle
* Ganache
* Infura

Install, Test, & Run
--------------------
1. `npm install`
2. `npm test`
3. `npm run server`
4. `npm run web`
5. Navigate to http://localhost:8000/

Screenshot
----------
![FlightSurety Homepage](screenshots/homepage.png?raw=true)

Code Organization
-----------------
```console
contracts/
├── FlightSuretyApp.sol
├── FlightSuretyData.sol
└── Migrations.sol
src/
├── dapp
│   ├── config.json
│   ├── contract.js
│   ├── dom.js
│   ├── favicon.ico
│   ├── flight.jpg
│   ├── flightsurety.css
│   ├── index.html
│   └── index.js
└── server
    ├── config.json
    ├── index.js
    └── server.js
test
├── flightSurety.js
└── oracles.js
```

Grading (by Udacity)
--------------------

Criteria                                                    |Highest Grade Possible  |Grade Recieved
------------------------------------------------------------|------------------------|--------------------
Separation of Concerns, Operational Control and “Fail Fast” |Meets Specifications    |Meets Specifications
Airlines                                                    |Meets Specifications    |Meets Specifications
Passengers                                                  |Meets Specifications    |Meets Specifications
Oracles (Server App)                                        |Meets Specifications    |Meets Specifications
