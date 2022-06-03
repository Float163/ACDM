import * as conf from "../config";
import { task } from "hardhat/config";
//string memory _symbol, uint256 _id, uint256 _amount, address _recipient
task("addProposal", "Add proposal")
    .addParam("contr", "Contract address")
    .addParam("func", "Function")    
    .addParam("desc", "Description")    
    .setAction(async (taskArgs, { ethers }) => {
    let hardhatToken = await ethers.getContractAt(conf.DAO_NAME, conf.DAO_ADDR);
    const result = await hardhatToken.addProposal(taskArgs.contr, taskArgs.func, taskArgs.desc);
    console.log(result);
  });

  
export default {
  solidity: "0.8.4"
};
