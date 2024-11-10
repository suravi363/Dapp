import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './App.css';

function App() {
  const CONTRACT_ADDRESS = "0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8";
  const ABI = [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_price",
          "type": "uint256"
        }
      ],
      "name": "listItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "purchaseItem",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        }
      ],
      "name": "transferItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "getItemsByOwner",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "itemCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "items",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "internalType": "address payable",
          "name": "seller",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "isSold",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "ownedItems",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];
  
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [items, setItems] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const providerInstance = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(providerInstance);

        const accounts = await providerInstance.send("eth_requestAccounts", []);
        setAccount(accounts[0]);

        const signerInstance = providerInstance.getSigner();
        setSigner(signerInstance);

        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI, signerInstance);
        setContract(contractInstance);

        await loadItems(contractInstance);
        await loadOwnedItems(contractInstance, accounts[0]);

        window.ethereum.on("accountsChanged", async (accounts) => {
          setAccount(accounts[0]);
          const newSigner = providerInstance.getSigner();
          setSigner(newSigner);
          const newContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, newSigner);
          setContract(newContract);
          await loadItems(newContract);
          await loadOwnedItems(newContract, accounts[0]);
        });
      } else {
        console.error("Please install MetaMask!");
      }
    };
    init();
  }, []);

  const loadItems = async (contract) => {
    try {
      const itemCount = await contract.itemCount();
      const itemsArray = [];
      for (let i = 1; i <= itemCount; i++) {
        const item = await contract.items(i);
        itemsArray.push(item);
      }
      setItems(itemsArray);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  const loadOwnedItems = async (contract, owner) => {
    try {
      const ownedItemIds = await contract.getItemsByOwner(owner);
      const ownedItemsArray = [];
      for (const itemId of ownedItemIds) {
        const item = await contract.items(itemId);
        ownedItemsArray.push(item);
      }
      setOwnedItems(ownedItemsArray);
    } catch (error) {
      console.error("Error loading owned items:", error);
    }
  };

  const refreshItems = async () => {
    await loadItems(contract);
    await loadOwnedItems(contract, account);
  };

  const listItem = async (name, price) => {
    if (!contract) return;
    try {
      const tx = await contract.listItem(name, ethers.utils.parseEther(price));
      console.log("Listing item transaction sent:", tx);
      await tx.wait();
      await refreshItems();
      console.log("Item listed and state refreshed!");
    } catch (error) {
      console.error("Error listing item:", error);
    }
  };

  const purchaseItem = async (id, price) => {
    if (!contract) return;
    try {
      
      const tx = await contract.purchaseItem(id, { value: ethers.utils.parseEther(price) });
      console.log("Purchase item transaction sent:", tx);
      await tx.wait();
      await refreshItems();
      console.log("Item purchased and state refreshed!");
    } catch (error) {
      console.error("Error purchasing item:", error);
    }
  };

  const transferItem = async (id, toAddress) => {
    if (!contract) return;
    try {
      const tx = await contract.transferItem(id, toAddress);
      console.log("Transfer item transaction sent:", tx);
      await tx.wait();
      await refreshItems();
      console.log("Item transferred and state refreshed!");
    } catch (error) {
      console.error("Error transferring item:", error);
    }
  };

  return (
    <div className="App">
      <h1>Marketplace</h1>
      <div className="list-item">
        <h2>List Item</h2>
        <input id="itemName" placeholder="Item Name" className="input-field" />
        <input id="itemPrice" placeholder="Item Price (in ETH)" className="input-field" />
        <button className="button" onClick={() => listItem(
          document.getElementById("itemName").value,
          document.getElementById("itemPrice").value
        )}>
          List Item
        </button>
      </div>
    </div>
  );
}

export default App;
