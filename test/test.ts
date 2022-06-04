// We import Chai to use its asserting functions here.
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// `describe` receives the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.
describe("ACDM contract", function () {
  // Mocha has four functions that let you hook into the test runner's
  // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

  // They're very useful to setup the environment for tests, and to clean it
  // up after they run.

  // A common pattern is to declare some variables, and assign them in the
  // `before` and `beforeEach` callbacks.

  let Mp : ContractFactory;
  let TokenERC20 : ContractFactory;
  let ACDM : ContractFactory;
 
  let dao : Contract;
  let tkn: Contract;
  let plat : Contract;
  let owner : SignerWithAddress;
  let chair : SignerWithAddress;
  let addr1 : SignerWithAddress;  
  let addr2 : SignerWithAddress;
  let addr3 : SignerWithAddress;
  let calldata: string;
  let clean : any;

  before(async function () {
    [owner, chair, addr1, addr2, addr3 ] = await ethers.getSigners();    
    TokenERC20 = await ethers.getContractFactory("m63");    
    tkn = await TokenERC20.deploy('ACADEMCoin', 'ACDM', 6, ethers.utils.parseEther('0'));    
    Mp = await ethers.getContractFactory("mDAO");
    dao = await Mp.deploy(chair.address, 3, 20, tkn.address);    
    ACDM = await ethers.getContractFactory("ACDM");
    plat = await ACDM.deploy(tkn.address, 3);  
    clean = await ethers.provider.send("evm_snapshot",[])  
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [clean]);
    clean = await ethers.provider.send("evm_snapshot",[])
    });

  
  describe("Deployment & initialization", function () {
    it("Should set the right owner", async function () {
      expect(await plat.owner()).to.equal(owner.address);
    });

    it("Only owner could set DAO", async function () {
      await expect(plat.setDAO(addr1.address)).to.be.not.reverted;
      await expect(plat.connect(addr1).setDAO(addr1.address)).to.be.revertedWith("Only owner");
    });

    it("Only DAO could set percent", async function () {
      await plat.setDAO(addr1.address);
      await expect(plat.connect(addr1).setPercent(1, 1, 1, 1)).to.be.not.reverted;
      await expect(plat.connect(addr2).setPercent(1, 1, 1, 1)).to.be.revertedWith("Only DAO");
    });

  });
  
  describe("ACDM platform", function () { 
    
    it("Should start sale", async function () {
        await plat.startSale();
        expect(await tkn.balanceOf(plat.address)).to.equal(ethers.utils.parseUnits("100000", 6));              
    });

    it("Should fail second start sale", async function () {
      await plat.startSale();
      expect(await tkn.balanceOf(plat.address)).to.equal(ethers.utils.parseUnits("100000", 6));              
      await expect(plat.startSale()).to.be.revertedWith("Already sale");      
    });

    it("Should register", async function () {
      await plat.connect(addr1).register(ethers.constants.AddressZero)
    });

    it("Should fail register if already register", async function () {
      await plat.connect(addr1).register(ethers.constants.AddressZero);
      await expect(plat.connect(addr1).register(addr3.address)).to.be.revertedWith("Already registred");      
    });

    it("Should fail register if referer is sender", async function () {
      await expect(plat.connect(addr1).register(addr1.address)).to.be.revertedWith("Bad referal");      
    });

    it("Should fail register if referer is not registred", async function () {
      await expect(plat.connect(addr1).register(addr2.address)).to.be.revertedWith("Bad referal");      
    });

    it("Should buy token", async function () {
      await plat.startSale();
//      const a1Bal = await addr1.getBalance();                 
      await plat.connect(addr1).register(ethers.constants.AddressZero);      

      //const gasPrice = await ethers.provider.getGasPrice()      
      //const gasLimit = await plat.estimateGas.register(ethers.constants.AddressZero, {gasLimit: 100000});      

      //const gas = gasPrice.mul(gasLimit);
      //const a1BalA = await addr1.getBalance();           
      //expect(a1Bal).to.eq(a1BalA.add(gas));


      await plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("0.00001") });
      expect(await ethers.provider.getBalance(plat.address)).to.equal(ethers.utils.parseEther("0.00001"));                          
      expect(await tkn.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits("1", 6));              
      expect(await tkn.balanceOf(plat.address)).to.equal(ethers.utils.parseUnits("99999", 6));          

    });

    it("Should fail buy token if not sale round", async function () {
      await plat.connect(addr1).register(ethers.constants.AddressZero);
      await expect(plat.connect(addr1).buyACDM()).to.be.revertedWith("Not sale round");      
    });

    it("Should fail buy token if not register", async function () {
      await plat.startSale();
      await expect(plat.connect(addr1).buyACDM()).to.be.revertedWith("Not register");            
    });

    it("Should fail buy if tokens more then sale", async function () {
      await plat.startSale();
      await plat.connect(addr1).register(ethers.constants.AddressZero);
      await expect(plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("11") })).to.be.revertedWith("Not enough token");
    });

    it("Should start trade if time", async function () {
      await plat.startSale();
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await plat.startTrade();      
    });

    it("Should start trade if all tokens sold", async function () {
      await plat.startSale();
      await plat.connect(addr1).register(ethers.constants.AddressZero);
      await plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("1") });
      await plat.startTrade();      
    });

    it("Should start trade if all tokens sold & time", async function () {
      await plat.startSale();
      await plat.connect(addr1).register(ethers.constants.AddressZero);
      await plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("1") });
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await plat.startTrade();      
    });

    it("Should fail start trade if not enough time", async function () {
      await plat.startSale();
      await expect(plat.startTrade()).to.be.revertedWith("Time for sale");      
    });

    it("Should add order", async function () {
      await plat.startSale();
      await plat.connect(addr1).register(ethers.constants.AddressZero);      
      await plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("0.1") });      
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await plat.startTrade();      
      await tkn.connect(addr1).approve(plat.address, 10);
      await plat.connect(addr1).addOrder(1, 1);
    });

    it("Should fail add order if not enough tokens", async function () {
      await plat.startSale();
      await plat.connect(addr1).register(ethers.constants.AddressZero);      
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await plat.startTrade();      
      await expect(plat.connect(addr1).addOrder(1, 1)).to.be.revertedWith("Not enough tokens");
    });
    
    it("Should cancel order", async function () {
      await plat.startSale();
      await plat.connect(addr1).register(ethers.constants.AddressZero);      
      await plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("0.1") });      
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await plat.startTrade();      
      await tkn.connect(addr1).approve(plat.address, 10);
      await plat.connect(addr1).addOrder(1, 1);
      await plat.connect(addr1).removeOrder(0);
      await expect(plat.connect(addr1).removeOrder(0)).to.be.revertedWith("Order is closed");      
    });

    it("Should fail cancel order if not seller", async function () {
      await plat.startSale();
      await plat.connect(addr1).register(ethers.constants.AddressZero);      
      await plat.connect(addr2).register(ethers.constants.AddressZero);            
      await plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("0.1") });      
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await plat.startTrade();      
      await tkn.connect(addr1).approve(plat.address, 10);
      await plat.connect(addr1).addOrder(1, 1);
      await expect(plat.connect(addr2).removeOrder(0)).to.be.revertedWith("Not seller");      
    });

    it("Should buy token from order", async function () {
      await plat.startSale();
      await plat.connect(addr1).register(ethers.constants.AddressZero);      
      await plat.connect(addr2).register(ethers.constants.AddressZero);            
      await plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("0.1") });      
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await plat.startTrade();      
      await tkn.connect(addr1).approve(plat.address, ethers.utils.parseUnits("10", 6));
      await plat.connect(addr1).addOrder(ethers.utils.parseUnits("10", 6), ethers.utils.parseEther("0.1"));

      await plat.connect(addr2).redeemOrder(0, { value: ethers.utils.parseEther("0.25") });
      expect(await tkn.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits("2.5", 6)); 
      //expect(await addr1.getBalance()).to.equal(2);
    });

    it("Should fail buy token from order of too many ETH", async function () {
      await plat.startSale();
      await plat.connect(addr1).register(ethers.constants.AddressZero);      
      await plat.connect(addr2).register(ethers.constants.AddressZero);            
      await plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("0.1") });      
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await plat.startTrade();      
      await tkn.connect(addr1).approve(plat.address, 10);
      await plat.connect(addr1).addOrder(1, ethers.utils.parseEther("0.1"));
      await expect(plat.connect(addr2).redeemOrder(0, { value: ethers.utils.parseEther("0.11") })).to.be.revertedWith("Too many ETH");
    });

    it("Should close order if fully buyed", async function () {
      await plat.startSale();
      await plat.connect(addr1).register(ethers.constants.AddressZero);      
      await plat.connect(addr2).register(ethers.constants.AddressZero);            
      await plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("0.1") });      
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await plat.startTrade();      
      await tkn.connect(addr1).approve(plat.address, ethers.utils.parseUnits("100", 6));
      await plat.connect(addr1).addOrder(ethers.utils.parseUnits("1", 6), ethers.utils.parseEther("0.1"));
      await plat.connect(addr2).redeemOrder(0, { value: ethers.utils.parseEther("0.1") });
      await expect(plat.connect(addr2).redeemOrder(0, { value: ethers.utils.parseEther("0.11") })).to.be.revertedWith("Order is closed");
    });

    it("Should send ref percent to first refer (sale round)", async function () {
      await plat.startSale();
      await plat.connect(addr2).register(ethers.constants.AddressZero);                  
      await plat.connect(addr1).register(addr2.address); 
      const a2Bal = await addr2.getBalance();     
      await plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("0.1") });      
      const a2balRef = await addr2.getBalance();           
      expect(a2Bal).to.eq(a2balRef.sub(ethers.utils.parseEther("0.005")));
    });

    it("Should send ref percent to second refer (sale round)", async function () {
      await plat.startSale();
      await plat.connect(addr3).register(ethers.constants.AddressZero);                  
      await plat.connect(addr2).register(addr3.address);                        
      await plat.connect(addr1).register(addr2.address); 
      const a3Bal = await addr3.getBalance();     
      await plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("0.1") });      
      const a3balRef = await addr3.getBalance();           
      expect(a3Bal).to.eq(a3balRef.sub(ethers.utils.parseEther("0.003")));
    });

    it("Should send ref percent to first refer (trade round)", async function () {
      await plat.startSale();
      await plat.connect(addr2).register(ethers.constants.AddressZero);                  
      await plat.connect(addr3).register(addr2.address);                              
      await plat.connect(addr1).register(addr2.address); 
      await plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("0.1") });      
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await plat.startTrade();      
      await tkn.connect(addr1).approve(plat.address, ethers.utils.parseUnits("1", 6));
      await plat.connect(addr1).addOrder(ethers.utils.parseUnits("1", 6), ethers.utils.parseEther("0.1"));
      const a2Bal = await addr2.getBalance();     
      await plat.connect(addr3).redeemOrder(0, { value: ethers.utils.parseEther("0.1") });
      const a2balRef = await addr2.getBalance();           
      expect(a2Bal).to.eq(a2balRef.sub(ethers.utils.parseEther("0.0025")));
    });

    it("Should send ref percent to second refer (trade round)", async function () {
      await plat.startSale();
      await plat.connect(addr3).register(ethers.constants.AddressZero);                  
      await plat.connect(addr2).register(addr3.address);                              
      await plat.connect(addr1).register(addr2.address); 
      await plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("0.1") });      
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await plat.startTrade();      
      await tkn.connect(addr1).approve(plat.address, ethers.utils.parseUnits("1", 6));
      await plat.connect(addr1).addOrder(ethers.utils.parseUnits("1", 6), ethers.utils.parseEther("0.1"));
      const a3Bal = await addr3.getBalance();     
      await plat.connect(addr1).redeemOrder(0, { value: ethers.utils.parseEther("0.1") });
      const a3balRef = await addr3.getBalance();           
      expect(a3Bal).to.eq(a3balRef.sub(ethers.utils.parseEther("0.0025")));
    });

    it("Should send comission to owner", async function () {
      await plat.startSale();
      await plat.connect(addr3).register(ethers.constants.AddressZero);                  
      await plat.connect(addr2).register(ethers.constants.AddressZero);                              
      await plat.connect(addr1).register(ethers.constants.AddressZero); 
      await plat.connect(addr1).buyACDM({ value: ethers.utils.parseEther("0.1") });      
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await plat.startTrade();      
      await tkn.connect(addr1).approve(plat.address, ethers.utils.parseUnits("1", 6));
      await plat.connect(addr1).addOrder(ethers.utils.parseUnits("1", 6), ethers.utils.parseEther("0.1"));
      await plat.setDAO(addr2.address);
      const a3Bal = await owner.getBalance();     
      await plat.connect(addr1).redeemOrder(0, { value: ethers.utils.parseEther("0.1") });
      await plat.connect(addr2).sendOwner();
      const a3balRef = await owner.getBalance();           
      expect(a3Bal).to.eq(a3balRef.sub(ethers.utils.parseEther("0.005")));
    });
    


/*

вопросы по - дробным частям
            по эфиру

    it("Should fail add proposal if not chair", async function () {
        await expect(dao.addProposal(token.address, calldata, "test proposal")).revertedWith("Chairman only can create a proposal");
    });

    it("Should deposit token", async function () {
        await token.connect(addr1).approve(dao.address, ethers.utils.parseEther('100'));
        await dao.connect(addr1).deposit(ethers.utils.parseEther('40'));
        expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("60"));      
        expect(await token.balanceOf(dao.address)).to.equal(ethers.utils.parseEther("40"));              
    });

    it("Should vote", async function () {
      await token.connect(addr1).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr1).deposit(ethers.utils.parseEther('40'));
      await dao.connect(chair).addProposal(token.address, calldata, "test proposal");      
      await dao.connect(addr1).vote(0, true);
    });

    it("Should fail vote if not deposit", async function () {
      await dao.connect(chair).addProposal(token.address, calldata, "test proposal");      
      await expect(dao.connect(addr1).vote(0, true)).to.be.revertedWith("Not enough token");
    });

    it("Should fail vote proposal not found", async function () {
      await token.connect(addr1).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr1).deposit(ethers.utils.parseEther('40'));
      await expect(dao.connect(addr1).vote(1, true)).to.be.revertedWith("Proposal not found");
    });

    it("Should fail vote if already voted", async function () {
      await token.connect(addr1).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr1).deposit(ethers.utils.parseEther('40'));
      await dao.connect(chair).addProposal(token.address, calldata, "test proposal");      
      await dao.connect(addr1).vote(0, true);
      await expect(dao.connect(addr1).vote(0, false)).to.be.revertedWith("Already voted");
    });


    it("Should withdraw", async function () {
      await token.connect(addr1).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr1).deposit(ethers.utils.parseEther('40'));
      await dao.connect(addr1).withdraw();      
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));      
      expect(await token.balanceOf(dao.address)).to.equal(ethers.utils.parseEther("0"));              
    });

    it("Should fail withdraw if not enough token", async function () {
      await token.connect(addr1).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr1).deposit(ethers.utils.parseEther('40'));
      await dao.connect(addr1).withdraw();      
      await expect(dao.connect(addr1).withdraw()).to.be.revertedWith("Not enough token");            
    });


    it("Should fail withdraw if active proposal", async function () {
      await token.connect(addr1).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr1).deposit(ethers.utils.parseEther('40'));
      await dao.connect(chair).addProposal(token.address, calldata, "test proposal");      
      await dao.connect(addr1).vote(0, true);
      await expect(dao.connect(addr1).withdraw()).to.be.revertedWith("Active proposal");            
    });

    it("Should finish proposal", async function () {
      await dao.connect(chair).addProposal(token.address, calldata, "test proposal");   
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await dao.connect(addr1).finishProposal(0);
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));            
    });

    it("Should finish proposal with execute function", async function () {
      await token.connect(addr1).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr1).deposit(ethers.utils.parseEther('100'));
      await token.connect(addr2).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr2).deposit(ethers.utils.parseEther('40'));
      await dao.connect(chair).addProposal(token.address, calldata, "test proposal");   
      await dao.connect(addr1).vote(0, true);
      await dao.connect(addr2).vote(0, false); 
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await dao.connect(addr1).finishProposal(0);
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("50"));            
    });

    it("Should finish proposal without execute function", async function () {
      await token.connect(addr1).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr1).deposit(ethers.utils.parseEther('100'));
      await token.connect(addr2).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr2).deposit(ethers.utils.parseEther('40'));
      await dao.connect(chair).addProposal(token.address, calldata, "test proposal");   
      await dao.connect(addr1).vote(0, false);
      await dao.connect(addr2).vote(0, true);            
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await dao.connect(addr1).finishProposal(0);
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("0"));            
    });

    it("Should finish proposal without execute function - no quorum", async function () {
      await token.connect(addr1).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr1).deposit(ethers.utils.parseEther('5'));
      await token.connect(addr2).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr2).deposit(ethers.utils.parseEther('5'));
      await dao.connect(chair).addProposal(token.address, calldata, "test proposal");   
      await dao.connect(addr1).vote(0, false);
      await dao.connect(addr2).vote(0, true);            
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await dao.connect(addr1).finishProposal(0);
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("95"));            
    });

    it("Should withdraw after finish proposal", async function () {
      await token.connect(addr1).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr1).deposit(ethers.utils.parseEther('40'));
      await dao.connect(chair).addProposal(token.address, calldata, "test proposal");      
      await dao.connect(addr1).vote(0, true);
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await dao.connect(addr1).withdraw();      
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));      
      expect(await token.balanceOf(dao.address)).to.equal(ethers.utils.parseEther("0"));              
    });

    it("Should fail finish proposal by time", async function () {
      await dao.connect(chair).addProposal(token.address, calldata, "test proposal");  
      await expect(dao.connect(addr1).finishProposal(0)).to.be.revertedWith("Time has not expired");            
    });

    it("Should fail finish proposal if already finished", async function () {
      await dao.connect(chair).addProposal(token.address, calldata, "test proposal");   
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await dao.connect(addr1).finishProposal(0);
      await expect(dao.connect(addr1).finishProposal(0)).to.be.revertedWith("Proposal is already finished");            
    });
*/
  });

});