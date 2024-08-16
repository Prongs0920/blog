import Web3 from 'web3';

// Function to initialize Web3
const initializeWeb3 = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    // MetaMask or other Ethereum provider is available
    const web3 = new Web3(window.ethereum);

    // Request account access if needed
    window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(() => {
        console.log('Account access granted');
      })
      .catch((error) => {
        console.error('Account access request failed:', error);
      });

    return web3;
  } else {
    // No Ethereum provider detected, use fallback provider
    console.warn('No Ethereum provider detected, using fallback provider');
    return new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID')); // Replace with your Infura or Alchemy URL
  }
};

const web3 = initializeWeb3();

export default web3;