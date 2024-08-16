require("@nomicfoundation/hardhat-toolbox");

require("dotenv").config();

const { INFURA_PROJECT_ID, MNEMONIC } = process.env;
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: {
        mnemonic: MNEMONIC,
      },
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: {
        mnemonic: MNEMONIC,
      },
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${INFURA_PROJECT_ID}`,
      accounts: { mnemonic: MNEMONIC },
      timeout: 20000 // Increase timeout to 20 seconds
    },
  }
};
