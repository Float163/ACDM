//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../contracts/m63.sol";
import "../contracts/staking.sol";

import "hardhat/console.sol";

contract mDAO {

    address public owner;
    address public chairMan;
    address public stakeContr;
    uint public daysVote;
    uint public quorum;

    struct Voters {
        uint256 endVotes;
    }

    mapping (address => uint256) private _endVote;

    uint private numProposals = 0;

    mapping (uint => Proposal) proposals;

    struct Proposal {
        address contr;
        bytes func;
        string description;
        uint totalVotes;
        uint positiveVotes;
        uint endTime;
        bool isFinished;
        mapping (address => bool) voters;
    }

    constructor(address _chairMan, uint _days, uint _quorum, address _stakeContr) {
        owner = msg.sender;
        chairMan = _chairMan;
        daysVote = _days;
        quorum = _quorum;
        stakeContr = _stakeContr;
    }    

    function addProposal (address _contr, bytes memory _func, string memory _desc) public returns (uint) {
        require(chairMan == msg.sender, "Chairman only can create a proposal");
        uint proposalID = numProposals++; 
        Proposal storage p = proposals[proposalID];
        p.endTime = block.timestamp + 60 * 60 * 24 * daysVote;
        p.contr = _contr;
        p.func = _func;
        p.description = _desc;
        return proposalID;
    }

    function vote (uint _proposal, bool _vote) public {
        require(_proposal < numProposals, "Proposal not found");
        require(!proposals[_proposal].isFinished, "Proposal is already finished");
        require(!proposals[_proposal].voters[msg.sender], "Already voted");
        uint _bal = stakingLP(stakeContr).balance(msg.sender);
        require(_bal > 0, "Not enough token");        
        proposals[_proposal].totalVotes += _bal;
        if (_vote) {
            proposals[_proposal].positiveVotes += _bal;            
        }
        proposals[_proposal].voters[msg.sender] = true;
        if (_endVote[msg.sender] < proposals[_proposal].endTime) {
            _endVote[msg.sender] = proposals[_proposal].endTime;
        }
    }

    function finishProposal (uint256 _proposal) public returns (bool) {
        require(_proposal < numProposals, "Proposal not found"); 
        bool result = true;       
        require(block.timestamp > proposals[_proposal].endTime  , "Time has not expired");
        require(!proposals[_proposal].isFinished, "Proposal is already finished");        
        if ((proposals[_proposal].totalVotes > (stakingLP(stakeContr).totalSupply() * quorum / 100)) && (proposals[_proposal].positiveVotes > (proposals[_proposal].totalVotes - proposals[_proposal].positiveVotes))) {
            (result, ) =proposals[_proposal].contr.call(proposals[_proposal].func);
            require(result, "ERROR call func");
        } 
        proposals[_proposal].isFinished = true;
        return result;
    }

    function notVoter (address _sender) public view returns (bool) {
        return block.timestamp > _endVote[_sender];
    }

}