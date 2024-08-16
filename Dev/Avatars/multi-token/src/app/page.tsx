"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import web3 from '../utils/web3';  // Ensure this imports your configured web3 instance
import contract from '../utils/contract';  // Ensure this imports your configured contract instance
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressCard, faLocation, faWallet } from "@fortawesome/free-solid-svg-icons";


export default function Home() {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [contarctOwner, setContractOwner] = useState<string | null>(null)
  useEffect(() => {
    const loadData = async () => {
      try {
        // Ensure Web3 is initialized
        if (!web3) {
          throw new Error("Web3 is not initialized");
        }

        // Request accounts from MetaMask
        const accounts = await web3.eth.requestAccounts();
        if (accounts.length === 0) {
          throw new Error("No accounts found. Make sure MetaMask is installed and accounts are unlocked.");
        }
        setAccounts(accounts);
        // Fetch balance of the first account
        const balanceWei = await web3.eth.getBalance(accounts[0]);
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
        setBalance(balanceEth);

        // Call the contract method to get the owner's address
        const ownerAddress = await contract.methods.owner().call({ from: accounts[0] }); // Assuming `owner()` is the method
        setContractOwner(ownerAddress);

        const avatars = await contract.methods.avatarList().call({ from: accounts[0] });
        console.log(avatars)
          setData(avatars);
      } catch (err) {
        setError(err.message);
        console.error(err);
      }
    };

    loadData();

  }, []);

  return (
    <div className="container mx-auto">
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-white text-xl font-bold">
            <Link href="/" className="hover:underline">
              Pegasus's first Project
            </Link>
          </div>
          <div className="flex space-x-4">
            <Link href="/new" className="text-white hover:bg-gray-700 px-3 py-2 rounded">
              Create Avatar
            </Link>
          </div>
        </div>
      </nav>
      <div className="mt-4 mx-4">
        {accounts.length > 0 && (
          <div>
            <p className="text-xl font-semibold">Connected Account:</p>
            <p className="flex items-center text-lg mt-2">
              <FontAwesomeIcon icon={faAddressCard} className="text-2xl mr-2" />
              <code className="bg-gray-100 p-2 rounded font-mono">{accounts[0]}</code>
            </p>
            <p className="flex items-center text-lg mt-2">
              <FontAwesomeIcon icon={faWallet} className="text-2xl mr-2" />
              {balance} ETH
            </p>
          </div>
        )}
        {error && <p className="text-red-500">{error}</p>}
      </div>

      <div className="">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.tokenId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item._tokenId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img src={`/uploads/${item.fileName}`} alt={item.name} className="w-16 h-16 object-cover rounded" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.price.toString()} Gwei</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}