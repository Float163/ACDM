//SPDX-License-Identifier: MIT

pragma solidity <0.9.0;

import "../contracts/m63.sol";
import "hardhat/console.sol";

contract ACDM {

    address public owner;
    address public DAO;
    address public token;
    uint public daysRound;
    uint public currentRound;
    uint private _currentDays;
    uint public _lastPrice = 10000000000000;

    uint private _volume = 1000000000000000000;  

    uint private _decimals = 1000000000000000000;      
    uint private _decimalsTKN;
                                                  
    uint private _balance;
    uint public comission;

    mapping (address => bool) public users;    
    mapping (address => address) public referals;

    uint private numOrders;

    struct Order {
        address seller;
        uint256 amount;
        uint256 price;
    }

    mapping (uint => Order) private _orders;

    uint public percentSale1 = 50;
    uint public percentSale2 = 30;    
    uint public percentTrade1 = 25;
    uint public percentTrade2 = 25;    

    constructor(address _token, uint _days) {
        owner = msg.sender;
        daysRound = _days;
        token = _token;
        _decimalsTKN = _decimals / (10 ** m63(token).decimals());
        _decimals = 1000000;
        _decimalsTKN = 1;
    }    

    function register(address _referal) public {
        require(!users[msg.sender], "Already registred");
        require(msg.sender != _referal, "Bad referal");        
        require(((_referal == address(0)) || users[_referal]), "Bad referal");                
        users[msg.sender] = true;
        if (_referal != address(0)) {
            referals[msg.sender] = _referal;
        }
    }

    function startSale() public {
        require(msg.sender == owner, "Only owner");                
        require(currentRound != 1, "Already sale");                                
        require( (block.timestamp > _currentDays + daysRound * 24 * 60 * 60) || (currentRound == 0), "Time for trade");        
        currentRound = 1;
        _currentDays = block.timestamp;
        _balance = _volume / _lastPrice * _decimals;
        m63(token).mint(address(this), _balance);
    }

    function buyACDM() public payable isReg() returns(bool) {
        require(currentRound == 1, "Not sale round");                                        
        require(_balance >= (msg.value / _lastPrice) * _decimals, "Not enough tokens"); 
        payRef(msg.sender, msg.value);               
        m63(token).transfer(msg.sender, (msg.value / _lastPrice) * _decimals);
        _balance -= (msg.value / _lastPrice) * _decimals;
        return true;
    }

    function startTrade() public {
        require(msg.sender == owner, "Only owner");
        require(currentRound != 2, "Already trade");                                
        //запуск трейд раунда без сейл раунда (перв запуск????)
        require( (block.timestamp > _currentDays + daysRound * 24 * 60 * 60) || (_balance == 0), "Time for sale");
        currentRound = 2;        
        _currentDays = block.timestamp;                
        m63(token).burn(address(this), _balance);        
        _lastPrice = _lastPrice + _lastPrice/100*3+4000000000000;        
        _volume = 0;
    }

    function addOrder(uint _amount, uint _price) public isReg() returns(uint) {
        require(currentRound == 2, "Not trade round");                        
        require(_price > 0, "Price is zero");
        require(m63(token).balanceOf(msg.sender) >= _amount, "Not enough tokens");
        m63(token).transferFrom(msg.sender, address(this), _amount);
        uint orderID = numOrders++; 
        Order storage o = _orders[orderID];
        o.seller = msg.sender;
        o.amount = _amount;
        o.price = _price;
        return orderID;
    }

    function redeemOrder(uint _id) public payable isReg() {
        require(currentRound == 2, "Not trade round");      
        require(_id < numOrders, "Order not found");                                          
        require(_orders[_id].amount > 0, "Order is closed");        
        require(msg.value  <= _orders[_id].price * _orders[_id].amount, "Too many ETH");                
        uint _v = msg.value * _decimals / _orders[_id].price;
        m63(token).transfer(msg.sender, _v);
        _orders[_id].amount -= _v;
        _volume += msg.value;
        uint _toSend = payRef(msg.sender, msg.value);               
        payable(_orders[_id].seller).transfer(_toSend);
    }

    function removeOrder(uint _id) public isReg() {
        require(_id < numOrders, "Order not found");        
        require(_orders[_id].seller == msg.sender, "Not seller");        
        require(_orders[_id].amount > 0, "Order is closed");                
        m63(token).transfer(msg.sender,_orders[_id].amount);        
        _orders[_id].amount = 0;
    }

    function payRef(address _sender, uint _amount) private returns(uint) {
        //todo посмотреть вниматльнее, переписать
        uint percent;
        uint result = _amount;
        uint ref1 = percentTrade1;            
        uint ref2 = percentTrade2;            

        if (currentRound == 2) {
            ref1 = percentTrade1;            
            ref2 = percentTrade2;            
        } else {
            ref1 = percentSale1;            
            ref2 = percentSale2;            
        }

        if (referals[_sender] != address(0)) {
            percent = _amount /1000 * ref1;
            result -= percent;
            payable(referals[_sender]).transfer(percent);
            if (referals[referals[_sender]] != address(0)) {
                percent = _amount /1000 * ref2;
                result -= percent;
                payable(referals[referals[_sender]]).transfer(percent);                
            } else if (currentRound == 2) {
                comission += _amount /1000 * ref2;                
                result -= _amount /1000 * ref2;
            }
        } else if (currentRound == 2) {
            comission += _amount /1000 * (ref1 + ref2);
            result -= _amount /1000 * (ref1 + ref2);            
        }
        return result;
    }

    function sendOwner() public isDAO() {
        uint _comm = comission;
        comission = 0;                
        payable(owner).transfer(_comm); 
    }

    function swapToken() public isDAO() {
        require(msg.sender == owner, "Only DAO");        
    }

    function setPercent(uint _percentSale1, uint _percentSale2, uint _percentTrade1, uint _percentTrade2 ) public isDAO() {
        percentSale1 = _percentSale1;
        percentSale2 = _percentSale2;
        percentTrade1 = _percentTrade1;
        percentTrade2 = _percentTrade2;        
    }

    function setDAO(address _dao) public {
        require(msg.sender == owner, "Only owner");        
        DAO = _dao;
    }

    modifier isReg {
        require(users[msg.sender], "Not register");               
            _;
    }        

    modifier isDAO {
        require(msg.sender == DAO, "Only DAO");               
            _;
    }        

}