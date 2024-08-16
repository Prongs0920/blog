const hre = require("hardhat");

async function main() {
  const GameToken = await hre.ethers.getContractFactory('GameToken');
  
  // Deploy the contract
  const gameToken = await GameToken.deploy();
  
  // Wait until the contract is deployed
  await gameToken.waitForDeployment().wait();
  
  // Log the deployed contract address
  console.log('GameToken deployed to:', gameToken.address);
  
}

// Handle errors and exit
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });