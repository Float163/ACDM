import * as conf from "../config";
import { task } from "hardhat/config";
//string memory _symbol, uint256 _id, uint256 _amount, address _recipient, uint256 _nonce, uint8 v, bytes32 r, bytes32 s
task("vote", "Vote")
    .addParam("proposal", "The proposal ID")
    .addParam("choice", "The choice")    
    .setAction(async (taskArgs, { ethers }) => {
    let hardhatToken = await ethers.getContractAt(conf.DAO_NAME, conf.DAO_ADDR);
    const result = await hardhatToken.vote(taskArgs.proposal, taskArgs.choice);
    console.log(result);
  });

  
export default {
  solidity: "0.8.4"
};
