"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

import Toast from '../../components/Toast';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressCard, faWallet } from "@fortawesome/free-solid-svg-icons";
import web3 from '../../utils/web3';  // Ensure this imports your configured web3 instance
import contract from '../../utils/contract';  // Ensure this imports your configured contract instance


export default function CreateGameToken() {
  const [tokenName, setTokenName] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // State to store the image preview URL
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<string[]>([]);
  const [balance, setBalance] = useState('');
  const [contarctOwner, setContractOwner] = useState<string | null>(null)
  const [toast, setToast] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    let subscription;
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

        if (contract && contract.events) {
          //Start listening for the AvatarMinted event
              // console.log("Avatarminted===>", await contract.events.AvatarMinted({ fromBlock: 'latest' }))
              if(contract.events === undefined || contract.events === null)
                return;
              subscription = await contract.events.AvatarMinted({ fromBlock: 'latest' })?.on('data', (event: any) => {
                if (!events.find(e => e.transactionHash === event.transactionHash)) {
                  setEvents(prevEvents => [...prevEvents, event]);
                  setToast('Token created successfully');
                }
                })?.on('error', (error: any) => {
                  console.error('Event Error:', error);
                  // setError(error.message);
                });

              // Cleanup on component unmount
              
        } else {
          console.error('Contract or event not found');
        }

      } catch (err) {
        setError(err.message);
        console.error(err);
      }
      return () => {
        subscription.unsubscribe();
       };
    };

    loadData();

  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile)); // Create a preview URL
    }
  };

  const createToken = async () => {
    if (!tokenName || !price || !file) {
      alert("Please fill in all fields");
      return;
    }

    const formData = new FormData();
    // formData.append('name', tokenName);
    // formData.append('price', price);
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        // const priceInWei = web3.utils.toWei(price, 'ether');
        const contractData = await contract.methods.mintAvatar(tokenName, data.filename, price).send({ from: accounts[0] });  // Replace 'yourMethod' with your contract method name
        console.log(contractData)
        setToast("Token created succussfully")
        // setData(contractData);
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="container mx-auto">
      {toast !== "" && <Toast message={toast} onClose={() => setToast(null)} />}
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
      <div className="mt-4 mx-40">
        <h2 className="text-xl font-semibold mb-4">Create Game Token</h2>
        <div className="mb-4">
          <label className="block text-gray-700">Token Name</label>
          <input
            type="text"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Price (ETH)</label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Upload File</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="mt-4 w-48 h-48 object-cover rounded-lg border-2 border-gray-300 shadow-lg"
            />
          )}
        </div>
        <button
          onClick={createToken}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Token
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
}
