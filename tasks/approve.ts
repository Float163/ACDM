import * as conf from "../config";
import { task } from "hardhat/config";

task("approve", "Approve transfer amount token to address")
    .addParam("recipient", "The recipient address")
    .addParam("value", "Amount of token")
    .setAction(async (taskArgs, { ethers }) => {
    let hardhatToken = await ethers.getContractAt(conf.TOKEN_NAME, conf.TOKEN_ADDR);
    const result = await hardhatToken.approve(taskArgs.recipient, ethers.utils.parseEther(taskArgs.value));
    console.log(result);
  });

  
export default {
  solidity: "0.8.4"
};
