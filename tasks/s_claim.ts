import * as conf from "../config";
import { task } from "hardhat/config";

task("claim", "Claim")
    .setAction(async (taskArgs, { ethers }) => {
    let hardhatToken = await ethers.getContractAt(conf.STAKE_NAME, conf.STAKE_ADDR);
    const result = await hardhatToken.claim();
    console.log(result);
  });

  export default {
    solidity: "0.8.4"
  };
  