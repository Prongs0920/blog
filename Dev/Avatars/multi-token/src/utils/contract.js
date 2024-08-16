import web3 from './web3';
import gameTokenABI from './gameTokenAbi.json'

// Replace with your contract's ABI and address
  
const CONTRACT_ADDRESS = '0xADF4B163F3F17181466F84d7F8B0B234B7Ca9a2C';


const contract = new web3.eth.Contract(gameTokenABI, CONTRACT_ADDRESS);

export default contract;