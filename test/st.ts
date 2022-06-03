// We import Chai to use its asserting functions here.
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
//import { IUniswapV2Router02 } from '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02';
import * as conf from "../config";

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
  let TokenERC20, TokenERC201 : ContractFactory;
  let Staking : ContractFactory;
 
  let dao : Contract;
  let tkn: Contract;
  let rwToken: Contract;
  let stToken: Contract;
  let stk : Contract;
  let owner: SignerWithAddress;
  let chair : SignerWithAddress;
  let addr1 : SignerWithAddress;  
  let addr2 : SignerWithAddress;
  let addr3 : SignerWithAddress;
  let calldata: string;

  const delay : number = 60 * 60 * 24 * 1 + 10;
  
//  let UniswapV2Router02 : IUniswapV2Router02; 

  beforeEach(async function () {
  
    [owner, chair, addr1, addr2, addr3 ] = await ethers.getSigners();    
    TokenERC20 = await ethers.getContractFactory("m63");    
    rwToken = await TokenERC20.deploy('XXXCoin', 'XXX', 18, ethers.utils.parseEther('500'));

    TokenERC201 = await ethers.getContractFactory("m63");    
    stToken = await TokenERC20.deploy('XXXCoin', 'XXX', 18, ethers.utils.parseEther('500'));


    Staking = await ethers.getContractFactory("stakingLP");
    stk = await Staking.deploy(stToken.address, rwToken.address, 1, 1, 10);    

    Mp = await ethers.getContractFactory("mDAO");
    dao = await Mp.deploy(chair.address, 1, 10, stk.address);    

    await stk.setDAO(dao.address);

    let jsonAbi =    [  {
      "inputs": [],
      "name": "sendOwner",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
   }
   ];
   const iface = new ethers.utils.Interface(jsonAbi);
   calldata = iface.encodeFunctionData('sendOwner');
  });

  /*
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await rwToken.owner()).to.equal(owner.address);
      expect(await dao.owner()).to.equal(owner.address);      
    });
  });
  */
  describe("ACDM platform - staking", function () { 
    it("Should stake", async function () {
      await stToken.approve(stk.address, ethers.utils.parseEther('100'));
      await stk.stake(ethers.utils.parseEther('50'));
      const addr1Balance = await stToken.balanceOf(owner.address);
      const contrBalance = await stToken.balanceOf(stk.address);
      expect(addr1Balance).to.equal(ethers.utils.parseEther('450'));
      expect(contrBalance).to.equal(ethers.utils.parseEther('50'));      
    });

    it("Should unstake", async function () {
      await stToken.approve(stk.address, ethers.utils.parseEther('100'));
      await stk.stake(ethers.utils.parseEther('50'));
      const addr1Balance = await stToken.balanceOf(owner.address);
      const contrBalance = await stToken.balanceOf(stk.address);
      expect(addr1Balance).to.equal(ethers.utils.parseEther('450'));
      expect(contrBalance).to.equal(ethers.utils.parseEther('50'));
      await ethers.provider.send('evm_increaseTime', [delay]);
      await ethers.provider.send('evm_mine', []);
      await stk.unstake();
      const addr1Balance1 = await stToken.balanceOf(owner.address);
      const contrBalance1 = await stToken.balanceOf(stk.address);
      expect(addr1Balance1).to.equal(ethers.utils.parseEther('500'));
      expect(contrBalance1).to.equal(ethers.utils.parseEther('0'));
    });

    it("Should claim", async function () {
      await stToken.approve(stk.address, ethers.utils.parseEther('100'));
      await stk.stake(ethers.utils.parseEther('50'));
      await ethers.provider.send('evm_increaseTime', [ delay ]);
      await ethers.provider.send('evm_mine', []);
      await stk.connect(owner).claim();
      const addr1Balance1 = await rwToken.balanceOf(owner.address);
      expect(addr1Balance1).to.equal(ethers.utils.parseEther('505'));
    });

      it("Should claim x1.5", async function () {
        await stToken.approve(stk.address, ethers.utils.parseEther('100'));
        await stk.stake(ethers.utils.parseEther('50'));
        await ethers.provider.send('evm_increaseTime', [1.5*delay ]);
        await ethers.provider.send('evm_mine', []);
        await stk.connect(owner).claim();
        const addr1Balance1 = await rwToken.balanceOf(owner.address);
        expect(addr1Balance1).to.equal(ethers.utils.parseEther('505'));
        });


      it("Should claim x2", async function () {
        await stToken.approve(stk.address, ethers.utils.parseEther('100'));
        await stk.stake(ethers.utils.parseEther('50'));
        await ethers.provider.send('evm_increaseTime', [2*delay ]);
        await ethers.provider.send('evm_mine', []);
        await stk.connect(owner).claim();
        const addr1Balance1 = await rwToken.balanceOf(owner.address);
        expect(addr1Balance1).to.equal(ethers.utils.parseEther('510'));
        });

      it("Should stake stake claim", async function () {
        await stToken.approve(stk.address, ethers.utils.parseEther('100'));
        await stk.stake(ethers.utils.parseEther('50'));
        await ethers.provider.send('evm_increaseTime', [ delay ]);
        await ethers.provider.send('evm_mine', []);
        await stk.stake(ethers.utils.parseEther('50'));          
        await ethers.provider.send('evm_increaseTime', [ delay ]);
        await ethers.provider.send('evm_mine', []);
        await stk.connect(owner).claim();          
        const addr1Balance1 = await rwToken.balanceOf(owner.address);
        expect(addr1Balance1).to.equal(ethers.utils.parseEther('515'));
      });

      it("Should claim after unstake", async function () {
        await stToken.approve(stk.address, ethers.utils.parseEther('100'));
        await stk.stake(ethers.utils.parseEther('50'));
        await ethers.provider.send('evm_increaseTime', [ delay ]);
        await ethers.provider.send('evm_mine', []);
        await stk.unstake();
        await stk.claim();          
        const addr1Balance1 = await rwToken.balanceOf(owner.address);
        expect(addr1Balance1).to.equal(ethers.utils.parseEther('505'));
      });

      it("Should fail unstake (not enough token)", async function () {
        await expect(
          stk.connect(addr1).unstake()
        ).to.be.revertedWith("No enough token");
      });

      it("Should fail claim (not enough token)", async function () {
        await expect(
          stk.connect(addr1).unstake()
        ).to.be.revertedWith("No enough token");
      });

      it("Should fail unstake (not enough time)", async function () {
        await stToken.approve(stk.address, ethers.utils.parseEther('100'));
        await stk.stake(ethers.utils.parseEther('50'));
        await expect(
          stk.unstake()
        ).to.be.revertedWith("Timing error");
      });

      it("Should fail claim (not enough time)", async function () {
        await stToken.approve(stk.address, ethers.utils.parseEther('100'));
        await stk.stake(ethers.utils.parseEther('50'));
        await expect(
          stk.unstake()
        ).to.be.revertedWith("Timing error");
      });

      it("Should unstake after DAO voters", async function () {
        await stToken.approve(stk.address, ethers.utils.parseEther('100'));
        await stk.stake(ethers.utils.parseEther('50'));
        await dao.connect(chair).addProposal(stToken.address, calldata, "test proposal");      
        await dao.vote(0, true);
        await ethers.provider.send('evm_increaseTime', [ delay ]);
        await ethers.provider.send('evm_mine', []);
        await stk.unstake();
      });
      
      it("Should fail unstake DAO voters", async function () {
        await stToken.approve(stk.address, ethers.utils.parseEther('100'));
        await stk.stake(ethers.utils.parseEther('50'));
        await ethers.provider.send('evm_increaseTime', [ delay ]);
        await ethers.provider.send('evm_mine', []);
        await dao.connect(chair).addProposal(stToken.address, calldata, "test proposal");                      
        await dao.vote(0, true);
        await expect(
          stk.unstake()
        ).to.be.revertedWith("DAO voter");
      });

  });

  describe("Transactions - DAO", function () { 
    
    it("Should add proposal", async function () {
        await dao.connect(chair).addProposal(stToken.address, calldata, "test proposal");
      });

    it("Should fail add proposal if not chair", async function () {
        await expect(dao.addProposal(stToken.address, calldata, "test proposal")).revertedWith("Chairman only can create a proposal");
    });

    it("Should vote", async function () {
      await stToken.approve(stk.address, ethers.utils.parseEther('100'));
      await stk.stake(ethers.utils.parseEther('50'));
      await dao.connect(chair).addProposal(stToken.address, calldata, "test proposal");      
      await dao.vote(0, true);
    });

    it("Should fail vote if not stake", async function () {
      await dao.connect(chair).addProposal(stToken.address, calldata, "test proposal");      
      await expect(dao.connect(addr1).vote(0, true)).to.be.revertedWith("Not enough token");
    });

    it("Should fail vote proposal not found", async function () {
      await stToken.approve(stk.address, ethers.utils.parseEther('100'));
      await stk.stake(ethers.utils.parseEther('50'));
      await expect(dao.vote(1, true)).to.be.revertedWith("Proposal not found");
    });

    it("Should fail vote if already voted", async function () {
      await stToken.approve(stk.address, ethers.utils.parseEther('100'));
      await stk.stake(ethers.utils.parseEther('50'));
      await dao.connect(chair).addProposal(stToken.address, calldata, "test proposal");      
      await dao.vote(0, true);
      await expect(dao.vote(0, false)).to.be.revertedWith("Already voted");
    });

    it("Should finish proposal", async function () {
      await dao.connect(chair).addProposal(stToken.address, calldata, "test proposal");   
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await dao.connect(addr1).finishProposal(0);
    });

    it("Should fail finish proposal by time", async function () {
      await dao.connect(chair).addProposal(stToken.address, calldata, "test proposal");  
      await expect(dao.connect(addr1).finishProposal(0)).to.be.revertedWith("Time has not expired");            
    });

    it("Should fail finish proposal if already finished", async function () {
      await dao.connect(chair).addProposal(stToken.address, calldata, "test proposal");   
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await dao.connect(addr1).finishProposal(0);
      await expect(dao.connect(addr1).finishProposal(0)).to.be.revertedWith("Proposal is already finished");            
    });

/*

    it("Should finish proposal without execute function - no quorum", async function () {
      await stToken.connect(addr1).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr1).deposit(ethers.utils.parseEther('5'));
      await stToken.connect(addr2).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr2).deposit(ethers.utils.parseEther('5'));
      await dao.connect(chair).addProposal(stToken.address, calldata, "test proposal");   
      await dao.connect(addr1).vote(0, false);
      await dao.connect(addr2).vote(0, true);            
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await dao.connect(addr1).finishProposal(0);
      expect(await stToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("95"));            
    });

    it("Should finish proposal with execute function", async function () {
      await stToken.connect(addr1).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr1).deposit(ethers.utils.parseEther('100'));
      await stToken.connect(addr2).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr2).deposit(ethers.utils.parseEther('40'));
      await dao.connect(chair).addProposal(stToken.address, calldata, "test proposal");   
      await dao.connect(addr1).vote(0, true);
      await dao.connect(addr2).vote(0, false); 
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await dao.connect(addr1).finishProposal(0);
      expect(await stToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("50"));            
    });

    it("Should finish proposal without execute function", async function () {
      await stToken.connect(addr1).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr1).deposit(ethers.utils.parseEther('100'));
      await stToken.connect(addr2).approve(dao.address, ethers.utils.parseEther('100'));
      await dao.connect(addr2).deposit(ethers.utils.parseEther('40'));
      await dao.connect(chair).addProposal(stToken.address, calldata, "test proposal");   
      await dao.connect(addr1).vote(0, false);
      await dao.connect(addr2).vote(0, true);            
      await ethers.provider.send('evm_increaseTime', [(3 * 60 * 60 * 24 + 10)]);
      await ethers.provider.send('evm_mine', []);
      await dao.connect(addr1).finishProposal(0);
      expect(await stToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("0"));            
    });
*/

  });

});
