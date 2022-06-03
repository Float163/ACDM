import * as conf from "../config";
import { task } from "hardhat/config";

let tokenA, tokenB, factory, router

task("liquidity", "Add liquidity")
    .setAction(async (taskArgs, { ethers }) => {

//      const UniswapV2Factory = await ethers.getContractAt('UniswapV2Factory', conf.UNI_FABRIC_ADDR) //как получать - по адресу?
      const UniswapV2Router02 = await ethers.getContractAt('UniswapV2Router02',conf.UNI_ROUTER_ADDR)
      const tknX = await ethers.getContractAt('m63', conf.TKX_ADDR);
      
      await tknX.approve(conf.UNI_ROUTER_ADDR, ethers.constants.MaxUint256)
//      await tokenB.approve(pair_addr, ethers.constants.MaxUint256)
//      tokenA.transfer("0xAe022781cB094403dD76d97430b2b67Ad1A8Ca96",  ethers.utils.parseEther('50'))

      
      const res = await UniswapV2Router02.addLiquidityETH(
          tknX.address,
          ethers.utils.parseEther('10000'),
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('1'),
          ethers.utils.parseEther('0.00001'),
          conf.RW_ADDRESS,
          Date.now() + 200 * 1000
      )
  });
  
export default {
  solidity: "0.8.4"
};
