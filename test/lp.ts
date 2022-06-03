// We import Chai to use its asserting functions here.
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import * as conf from "../config";
import { exit } from "process";

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
  let tkn1: Contract;
  let plat : Contract;
  let owner : SignerWithAddress;
  let chair : SignerWithAddress;
  let addr1 : SignerWithAddress;  
  let addr2 : SignerWithAddress;
  let addr3 : SignerWithAddress;
  let calldata: string;

  beforeEach(async function () {
    [owner, chair, addr1, addr2, addr3 ] = await ethers.getSigners();    
    TokenERC20 = await ethers.getContractFactory("m63");    
    ACDM = await ethers.getContractFactory("m63");    
    tkn = await TokenERC20.deploy('bCADEMCoin', 'bCDM', 18, ethers.utils.parseEther('10000')); 
    tkn1 = await ACDM.deploy('cCADEMCoin', 'cCDM', 18, ethers.utils.parseEther('10000')); 
    /*
    Mp = await ethers.getContractFactory("mDAO");
    dao = await Mp.deploy(chair.address, 3, 20, tkn.address);    
    ACDM = await ethers.getContractFactory("ACDM");
    plat = await ACDM.deploy(tkn.address, 3);    
*/
    const UniswapV2Router02 = await ethers.getContractAt('IUniswapV2Router02',conf.UNI_ROUTER_ADDR)
    console.log("UNI - " + UniswapV2Router02.address);
    await tkn.connect(owner).approve(UniswapV2Router02.address, ethers.utils.parseEther('10000'))    
    const res = await UniswapV2Router02.connect(owner).addLiquidityETH(
      tkn.address,
      ethers.utils.parseEther('10'),
      ethers.utils.parseEther('1'),
      ethers.utils.parseEther('1'),
      owner.address,
      Date.now() + 200 * 1000,
      { value: ethers.utils.parseEther("1") }
    )
    console.log(res);

/*
  const UniswapV2Factory = await ethers.getContractAt('IUniswapV2Factory', conf.UNI_FABRIC_ADDR) //как получать - по адресу?
  const UniswapV2Router02 = await ethers.getContractAt('IUniswapV2Router02',conf.UNI_ROUTER_ADDR)
  const pair_addr = await UniswapV2Factory.createPair(tkn.address, tkn1.address);
  console.log(pair_addr);  
  exit();
      await tkn.approve(pair_addr, ethers.constants.MaxUint256)
      await tkn1.approve(pair_addr, ethers.constants.MaxUint256)

      
exit();
const res = await UniswapV2Router02.addLiquidity(
    tkn.address,
    tkn1.address,
    ethers.utils.parseEther('100'),
    ethers.utils.parseEther('50'),
    ethers.utils.parseEther('1'),
    ethers.utils.parseEther('1'),
    owner.address,
    Date.now() + 200 * 1000
)

console.log(res);
exit();

/*
    const UniswapV2Router02 = await ethers.getContractAt(
        "IUniswapV2Router02",
        conf.UNI_ROUTER_ADDR
      );
  
      console.log('UNI: ' + UniswapV2Router02.address);  
    
      await tkn.connect(owner).approve(UniswapV2Router02.address, ethers.utils.parseEther('10000'))
      const b = await tkn.allowance(owner.address, UniswapV2Router02.address)
//      console.log(b);
  
      const a = await tkn.balanceOf(owner.address)
//      console.log(a);
  
      //      await tokenB.approve(pair_addr, ethers.constants.MaxUint256)
      //      tokenA.transfer("0xAe022781cB094403dD76d97430b2b67Ad1A8Ca96",  ethers.utils.parseEther('50'))
      
          console.log(await tkn.allowance(owner.address, UniswapV2Router02.address))
      
          const res = await UniswapV2Router02.connect(owner).addLiquidityETH(
              tkn.address,
              ethers.utils.parseEther('10'),
              ethers.utils.parseEther('1'),
              ethers.utils.parseEther('1'),
              owner.address,
              Date.now() + 200 * 1000,
              { value: ethers.utils.parseEther("1") }
          )

          console.log(res); 
          const ABI = [
            'function addLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline)'
        ]
          const iface = new ethers.utils.Interface(ABI);
          let decodedData = iface.decodeFunctionData("addLiquidityETH", res.data );
          //console.log(decodedData);
     
  /*
      const UniswapV2Factory = await ethers.getContractAt('IUniswapV2Factory', conf.UNI_FABRIC_ADDR)
      );
      // как получать - по адресу?
      const pair_addr = await UniswapV2Factory.createPair(tkn.address, UniswapV2Router02.WETH());
  
      await tkn.approve(pair_addr, ethers.constants.MaxUint256)
  /*
      const res = await UniswapV2Router02.addLiquidity(
          tkn.address,
          UniswapV2Router02.WETH(),
          ethers.utils.parseEther('100'),
          ethers.utils.parseEther('50'),
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('1'),
          owner.address,
          Date.now() + 200 * 1000
      )
  /*    
     
      await tkn.connect(owner).approve(UniswapV2Router02.address, ethers.utils.parseEther('10000'))
  //      await tokenB.approve(pair_addr, ethers.constants.MaxUint256)
  //      tokenA.transfer("0xAe022781cB094403dD76d97430b2b67Ad1A8Ca96",  ethers.utils.parseEther('50'))
  
      console.log(await tkn.allowance(owner.address, UniswapV2Router02.address))
  
      const res = await UniswapV2Router02.connect(owner).addLiquidityETH(
          tkn.address,
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('1'),
          owner.address,
          Date.now() + 200 * 1000,
          { value: ethers.utils.parseEther("1") }
      )
  */
  //    Mp = await ethers.getContractFactory("DAO");
  //    dao = await Mp.deploy(chair.address, 3, 20, tkn.address);    

  });

  
  describe("Deployment & initialization", function () {
    it("Should set the right owner", async function () {
      expect(await plat.owner()).to.equal(owner.address);
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