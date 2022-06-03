// We import Chai to use its asserting functions here.
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
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

  let WETH : ContractFactory;
  let TokenERC20 : ContractFactory;
  let ACDM : ContractFactory;
 
  let weth1 : Contract;
  let tkn: Contract;
  let tkn1: Contract;
  let plat : Contract;
  let owner : SignerWithAddress;
  let chair : SignerWithAddress;
  let addr1 : SignerWithAddress;  
  let addr2 : SignerWithAddress;
  let addr3 : SignerWithAddress;
  let calldata: string;
  let abc: string;

  beforeEach(async function () {
    [owner, chair, addr1, addr2, addr3 ] = await ethers.getSigners();    
    TokenERC20 = await ethers.getContractFactory("m63");    
    ACDM = await ethers.getContractFactory("m63");    
    tkn = await TokenERC20.deploy('bCADEMCoin', 'bCDM', 18, ethers.utils.parseEther('10000')); 

    const UniswapV2Factory = await ethers.getContractAt('IUniswapV2Factory', conf.UNI_FABRIC_ADDR) 
    const UniswapV2Router02 = await ethers.getContractAt('IUniswapV2Router02',conf.UNI_ROUTER_ADDR)

    weth1 = await ethers.getContractAt('IWETH10', conf.WETH_ADDR) 

    await weth1.deposit({ value: ethers.utils.parseEther("100") });
    await weth1.connect(addr1).deposit({ value: ethers.utils.parseEther("50") });    

    const pair = await UniswapV2Factory.createPair(tkn.address, weth1.address);

    const filterTo = UniswapV2Factory.filters.PairCreated(tkn.address);
    const log = await UniswapV2Factory.queryFilter(filterTo)
    const pair_addr  = (log[0].args ?? [])["pair"];
    console.log("PAIR:" + pair_addr);

    await tkn.approve(pair_addr, ethers.constants.MaxUint256)    
    await tkn.connect(addr1).approve(pair_addr, ethers.constants.MaxUint256)        

    await weth1.approve(pair_addr, ethers.constants.MaxUint256)    
    await weth1.approve(owner.address, ethers.constants.MaxUint256)    
    await weth1.connect(addr1).approve(pair_addr, ethers.constants.MaxUint256)        
    
    const s = await weth1.balanceOf(owner.address);
    console.log(s);
    
    const res = await UniswapV2Router02.addLiquidity(
      tkn.address,
      weth1.address,
      ethers.utils.parseEther('10'),
      ethers.utils.parseEther('5'),      
      ethers.utils.parseEther('1'),
      ethers.utils.parseEther('1'),
      owner.address,
      Date.now() + 200 * 1000,
    )

  });

  
  describe("Deployment & initialization", function () {
    it("Should set the right owner", async function () {
      expect(await tkn.owner()).to.equal(owner.address);
    });
/*
    it("Only owner could set DAO", async function () {
      await expect(plat.setDAO(addr1.address)).to.be.not.reverted;
      await expect(plat.connect(addr1).setDAO(addr1.address)).to.be.revertedWith("Only owner");
    });

    it("Only DAO could set percent", async function () {
      await plat.setDAO(addr1.address);
      await expect(plat.connect(addr1).setPercent(1, 1, 1, 1)).to.be.not.reverted;
      await expect(plat.connect(addr2).setPercent(1, 1, 1, 1)).to.be.revertedWith("Only DAO");
    });
*/
  });
  

});