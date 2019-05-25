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
    }

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }

    mapping(address => Airline) private airlines;
    mapping(bytes32 => Flight) private flights;

    constructor() public {
        contractOwner = msg.sender;
    }

    /** @dev Fallback function for funding smart contract. */
    function() external payable {
        fund();
    }

    /** @dev Require the owner account to be the function caller. */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /** @dev Require contract to be operational. Used to pause a contract. */
    modifier requireIsOperational() {
        // Modify to call data contract's status
        require(operational, "Contract is currently not operational");
        _;
    }

    /** @dev Sets contract operations on/off. */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    /** @dev Add a new airline to storage. Still must be registered. */
    function addAirline(
        address airlineID,
        string airlineName
    )
        external
    {
        airlines[airlineID] = Airline({
            airlineID: airlineID,
            airlineName: airlineName,
            isRegistered: false

        });
    }

    /** @dev Check if airline has been added. */
    function hasAirline(address airlineID) external returns (bool) {
        return airlines[airlineID].airlineID == airlineID;
    }

    /** @dev Register an airline. */
    function registerAirline(address airlineID) external {
        airlines[airlineID].isRegistered = true;
        registeredAirlines.push(airlineID);
    }

    /** @dev Check if airline has been registered. */
    function hasAirlineBeenRegistered(
        address airlineID
    )
        external
        returns (bool)
    {
        return airlines[airlineID].isRegistered;
    }

    /** @dev Get all registered airlines. */
    function getRegisteredAirlines() external returns (address[] memory) {
        return registeredAirlines;
    }

    /** @dev Buy insurance for a flight. */
    function buy() external payable {
    }

    /** @dev Credits payouts to insurees. */
    function creditInsurees() external pure {
    }

    /** @dev Transfers eligible payout funds to insuree. */
    function pay() external pure {
    }

    /** @dev Add an airline to the registration queue. */
    function registerAirline() external pure {
    }

    /** @dev Initial funding for the insurance. */
    function fund() public payable {
    }

    /** @dev Returns whether contract is operational. */
    function isOperational() public view returns (bool) {
        // Modify to call data contract's status
        return operational;
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    )
        pure
        internal
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }
}
