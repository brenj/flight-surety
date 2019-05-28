pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    address private contractOwner;
    bool private operational = true;
    address[] private registeredAirlines;

    struct Airline {
        address airlineID;
        string airlineName;
        bool isRegistered;
        bool fundingSubmitted;
        uint registrationVotes;
    }

    struct Flight {
        string flight;
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airlineID;
    }

    struct Insurance {
        address insuree;
        uint256 amountInsuredFor;
    }

    mapping(address => bool) private authorizedCallers;
    mapping(address => Airline) private airlines;
    mapping(bytes32 => bool) private airlineRegistrationVotes;
    mapping(bytes32 => Flight) private flights;
    mapping(bytes32 => Insurance[]) private policies;
    mapping(address => uint256) private credits;

    event AddedAirline(address airlineID);
    event Debug(uint test);
    event DebugPolicies(uint test);

    constructor() public {
        contractOwner = msg.sender;
        authorizedCallers[msg.sender] = true;
    }

    /** @dev Fallback function for funding smart contract. */
    function() external payable {
        // fund();
    }

    /** @dev Require the owner account to be the function caller. */
    modifier requireContractOwner() {
        require(
            msg.sender == contractOwner, "Requires caller is contract owner");
        _;
    }

    /** @dev Require contract to be operational. Used to pause a contract. */
    modifier requireIsOperational() {
        require(isOperational(), "Requires contract is operational");
        _;
    }

    modifier requireAuthorizedCaller() {
        require(
            authorizedCallers[msg.sender] == true,
            "Requires caller is authorized to call this function");
        _;
    }

    /** @dev Returns whether contract is operational. */
    function isOperational(
    )
        public
        view
        requireAuthorizedCaller
        returns (bool)
    {
        return operational;
    }

    /** @dev Sets contract operations on/off. */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function authorizeCaller(address caller) external requireContractOwner {
        authorizedCallers[caller] = true;
    }

    function deauthorizeCaller(address caller) external requireContractOwner {
        authorizedCallers[caller] = false;
    }

    /** @dev Add a new airline to storage. Still must be registered. */
    function addAirline(
        address airlineID,
        string airlineName
    )
        external
        requireAuthorizedCaller
        requireIsOperational
    {
        airlines[airlineID] = Airline({
            airlineID: airlineID,
            airlineName: airlineName,
            isRegistered: false,
            fundingSubmitted: false,
            registrationVotes: 0
        });

        emit AddedAirline(airlineID);
    }

    /** @dev Check if airline has been added. */
    function hasAirlineBeenAdded(
        address airlineID
    )
        external
        requireAuthorizedCaller
        requireIsOperational
        returns (bool)
    {
        return airlines[airlineID].airlineID == airlineID;
    }

    /** @dev Add an airline. */
    function addToRegisteredAirlines(
        address airlineID
    )
        external
        requireAuthorizedCaller
        requireIsOperational
    {
        airlines[airlineID].isRegistered = true;
        registeredAirlines.push(airlineID);
    }

    /** @dev Check if airline has been registered. */
    function hasAirlineBeenRegistered(
        address airlineID
    )
        external
        requireAuthorizedCaller
        requireIsOperational
        returns (bool)
    {
        return airlines[airlineID].isRegistered;
    }

    /** @dev Get all registered airlines. */
    function getRegisteredAirlines(
    )
        external
        requireAuthorizedCaller
        requireIsOperational
        returns (address[] memory)
    {
        return registeredAirlines;
    }

    function hasAirlineVotedFor(
        address airlineVoterID,
        address airlineVoteeID
    )
        external
        requireAuthorizedCaller
        requireIsOperational
        returns (bool)
    {
        bytes32 voteHash = keccak256(
            abi.encodePacked(airlineVoterID, airlineVoteeID));
        return airlineRegistrationVotes[voteHash] == true;
    }

    function voteForAirline(
        address airlineVoterID,
        address airlineVoteeID
    )
        external
        requireAuthorizedCaller
        requireIsOperational
        returns (uint)
    {
        bytes32 voteHash = keccak256(
            abi.encodePacked(airlineVoterID, airlineVoteeID));
        airlineRegistrationVotes[voteHash] = true;
        airlines[airlineVoteeID].registrationVotes += 1;

        return airlines[airlineVoteeID].registrationVotes;
    }

    function setFundingSubmitted(
        address airlineID
    )
        external
        requireAuthorizedCaller
        requireIsOperational
    {
        airlines[airlineID].fundingSubmitted = true;
    }

    function hasFundingBeenSubmitted(
        address airlineID
    )
        external
        requireAuthorizedCaller
        requireIsOperational
        returns (bool)
    {
        return airlines[airlineID].fundingSubmitted == true;
    }

    function addToRegisteredFlights(
        address airlineID,
        string flight,
        uint256 timestamp
    )
        external
        requireAuthorizedCaller
        requireIsOperational
    {
        flights[getFlightKey(airlineID, flight, timestamp)] = Flight({
            isRegistered: true,
            statusCode: 0, // STATUS_CODE_LATE_AIRLINE
            updatedTimestamp: timestamp,
            airlineID: airlineID,
            flight: flight
        });
    }

    function addToInsurancePolicy(
        address airlineID,
        string flight,
        address _insuree,
        uint256 amountToInsureFor
    )
        external
        requireAuthorizedCaller
        requireIsOperational
    {
        policies[keccak256(abi.encodePacked(airlineID, flight))].push(
            Insurance({
                insuree: _insuree,
                amountInsuredFor: amountToInsureFor
            })
        );
    }

    function creditInsurees(
        address airlineID,
        string flight,
        uint256 creditMultiplier
    )
        external
        requireAuthorizedCaller
        requireIsOperational
    {
        Insurance[] memory policiesToCredit = policies[
            keccak256(abi.encodePacked(airlineID, flight))];

        uint256 currentCredits;
        for (uint i = 0; i < policiesToCredit.length; i++) {
            currentCredits = credits[policiesToCredit[i].insuree];
            // Calculate payout with multiplier and add to existing credits
            credits[policiesToCredit[i].insuree] = SafeMath.add(
                currentCredits,
                policiesToCredit[i].amountInsuredFor.mul(
                    creditMultiplier).div(10));
        }
    }

    function getCredits(
        address insuree
    )
        external
        requireAuthorizedCaller
        requireIsOperational
        returns (uint256)
    {
        return credits[insuree];
    }

    function getFlightKey(
        address airlineID,
        string memory flight,
        uint256 timestamp
    )
        internal
        view
        requireAuthorizedCaller
        requireIsOperational
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(airlineID, flight, timestamp));
    }
}
