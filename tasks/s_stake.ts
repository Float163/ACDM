import * as conf from "../config";
import { task } from "hardhat/config";

task("stake", "Stake")
    .addParam("value", "Amount of token")
    .setAction(async (taskArgs, { ethers }) => {
    let hardhatToken = await ethers.getContractAt(conf.STAKE_NAME, conf.STAKE_ADDR);
    const result = await hardhatToken.stake(ethers.utils.parseEther(taskArgs.value));
    console.log(result);
  });

  export default {
    solidity: "0.8.4"
  };
  