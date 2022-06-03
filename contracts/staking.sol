//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol";

import "../contracts/m63.sol";
import "../contracts/DAO.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";

contract stakingLP {

    address public owner;
    uint8 public days_reward;
    uint8 public days_staking;    
    uint8 public percent;
    address private st_token;
    address private rw_token;

    address private dao;

    struct _stake {
        uint startTime;
        uint256 amount;
        uint256 amountPay;
        uint timePay;
    }

    mapping (address => _stake) private _balances;

    constructor(address _st_token, address _rw_token, uint8 _day_reward, uint8 _day_staking, uint8 _percent) {
        owner = msg.sender; 
        st_token = _st_token;
        rw_token = _rw_token;        
        days_reward = _day_reward;
        days_staking = _day_staking;
        percent = _percent;
    }

    function stake(uint256 _amount) public returns (bool success) {
        //заводим lp токены
        ERC20(st_token).transferFrom(msg.sender, address(this), _amount);
        if (_balances[msg.sender].amount > 0) {
            _balances[msg.sender].amountPay += calcClaim(msg.sender);
        }
        _balances[msg.sender].startTime = block.timestamp;                
        _balances[msg.sender].amount += _amount;
        return true;
    }

    function claim() public returns (bool success) {
        require ((_balances[msg.sender].amount > 0) || (_balances[msg.sender].amountPay > 0), "No enough token");        
        require((block.timestamp - _balances[msg.sender].startTime) / 60 > days_reward , "Timing error");                
        //выводим ревард токены
        //transfer amount - amountPay
//        uint256 toPay = (_balances[msg.sender].amount - _balances[msg.sender].amountPay) / 100 * percent;
        uint256 toPay = calcClaim(msg.sender) + _balances[msg.sender].amountPay;
        m63(rw_token).mint(msg.sender, toPay);
        _balances[msg.sender].startTime = block.timestamp;
        _balances[msg.sender].amountPay = 0;
        return true;
    }

    function unstake() public returns (bool success) {
        require (_balances[msg.sender].amount > 0, "No enough token");
        require((block.timestamp - _balances[msg.sender].startTime) / 60 * 60 * 24  >= days_staking, "Timing error");                        
        require(mDAO(dao).notVoter(msg.sender), "DAO voter");                                
//выводим lp токены
        ERC20(st_token).transfer(msg.sender, _balances[msg.sender].amount);
        _balances[msg.sender].amountPay = calcClaim(msg.sender);        
        _balances[msg.sender].amount = 0;                
        //transfer
        return true;
    }

    function calcClaim(address _sender) private view returns (uint256 _amount) {
        _amount = (_balances[_sender].amount) / 100 * percent * ((block.timestamp - _balances[msg.sender].startTime) / 60 / 60 / 24 / days_reward);
        return _amount;
    }

    function balance(address _sender) public view returns(uint) {
        return _balances[_sender].amount;
    }

    function totalSupply() public view returns(uint) {
        return ERC20(st_token).totalSupply();
    }

    function setDaysReward(uint8 _days) public isDAO() {
        days_reward = _days;
    }

    function setDaysStake(uint8 _days) public isDAO() {
        days_staking = _days;
    }

    function setPercent(uint8 _percent) public isDAO() {
        percent = _percent;
    }

    function setDAO(address _DAO) public isOwner() {
        dao = _DAO;
    }

    modifier isOwner {
        require(msg.sender == owner, "Only owner");
            _;
    }        

    modifier isDAO {
        require(msg.sender == dao, "Only DAO");
            _;
    }

}