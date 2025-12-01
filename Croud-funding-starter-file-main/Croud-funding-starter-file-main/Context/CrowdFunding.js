// import React, { useState, useEffect } from "react";
// import Web3Modal from "web3modal";
// import { ethers } from "ethers";

// // INTERNAL IMPORT
// import { CrowdFundingABI, CrowdFundingAddress } from "./contants";

// export const CrowdFundingContext = React.createContext();

// const fetchContract = (signerOrProvider) =>
//   new ethers.Contract(CrowdFundingAddress, CrowdFundingABI, signerOrProvider);

// export const CrowdFundingProvider = ({ children }) => {
//   const titleData = "Crowd Funding Contract";
//   const [currentAccount, setCurrentAccount] = useState("");

//   // ----------------------------------------------------------------
//   // CREATE CAMPAIGN
//   // ----------------------------------------------------------------
//   const createCampaign = async (campaign) => {
//     const { title, description, amount, deadline } = campaign;

//     try {
//       const web3Modal = new Web3Modal();
//       const connection = await web3Modal.connect();
//       const provider = new ethers.providers.Web3Provider(connection);
//       const signer = provider.getSigner();
//       const contract = fetchContract(signer);

//       const transaction = await contract.createCampaign(
//         currentAccount,
//         title,
//         description,
//         ethers.utils.parseUnits(amount, 18),
//         new Date(deadline).getTime()
//       );

//       await transaction.wait();
//       console.log("Contract call success:", transaction);
//     } catch (error) {
//       console.log("Contract call failure:", error);
//     }
//   };

//   // ----------------------------------------------------------------
//   // GET ALL CAMPAIGNS
//   // ----------------------------------------------------------------
//   const getCampaigns = async () => {
//     const provider = new ethers.providers.JsonRpcProvider();
//     const contract = fetchContract(provider);

//     const campaigns = await contract.getCampaigns();

//     const parsedCampaigns = campaigns.title.map((_, i) => ({
//       owner: campaigns.owners[i],
//       title: campaigns.titles[i],
//       description: campaigns.descriptions[i],
//       target: ethers.utils.formatEther(campaigns.targets[i].toString()),
//       deadline: campaigns.deadlines[i].toNumber(),
//       amountCollected: ethers.utils.formatEther(
//         campaigns.amountCollected[i].toString()
//       ),
//       pId: i,
//     }));

//     return parsedCampaigns;
//   };

//   // ----------------------------------------------------------------
//   // GET USER CAMPAIGNS
//   // ----------------------------------------------------------------
//   const getUserCampaigns = async () => {
//     const provider = new ethers.providers.JsonRpcProvider();
//     const contract = fetchContract(provider);

//     const campaigns = await contract.getCampaigns();
//     const accounts = await window.ethereum.request({
//       method: "eth_accounts",
//     });

//     const currentUser = accounts[0];

//     const parsedCampaigns = campaigns.titles
//       .map((_, i) => ({
//         owner: campaigns.owners[i],
//         title: campaigns.titles[i],
//         description: campaigns.descriptions[i],
//         target: ethers.utils.formatEther(campaigns.targets[i].toString()),
//         deadline: campaigns.deadlines[i].toNumber(),
//         amountCollected: ethers.utils.formatEther(
//           campaigns.amountCollected[i].toString()
//         ),
//         pId: i,
//       }))
//       .filter((campaign) => campaign.owner === currentUser);

//     return parsedCampaigns;
//   };

//   // ----------------------------------------------------------------
//   // DONATE
//   // ----------------------------------------------------------------
//   const donate = async (pId, amount) => {
//     try {
//       const web3Modal = new Web3Modal();
//       const connection = await web3Modal.connect();
//       const provider = new ethers.providers.Web3Provider(connection);
//       const signer = provider.getSigner();
//       const contract = fetchContract(signer);

//       const tx = await contract.donateToCampaign(pId, {
//         value: ethers.utils.parseEther(amount),
//       });

//       await tx.wait();
//       return tx;
//     } catch (error) {
//       console.log("Donation error:", error);
//     }
//   };

//   // ----------------------------------------------------------------
//   // GET DONATIONS
//   // ----------------------------------------------------------------
//   const getDonations = async (pId) => {
//     const provider = new ethers.providers.JsonRpcProvider();
//     const contract = fetchContract(provider);

//     const donations = await contract.getDonators(pId);

//     const numberOfDonations = donations[0].length;
//     const parsedDonations = [];

//     for (let i = 0; i < numberOfDonations; i++) {
//       parsedDonations.push({
//         donator: donations[0][i],
//         donation: ethers.utils.formatEther(donations[1][i].toString()),
//       });
//     }

//     return parsedDonations;
//   };

//   // ----------------------------------------------------------------
//   // CHECK WALLET CONNECTED
//   // ----------------------------------------------------------------
//   const checkIfWalletConnected = async () => {
//     try {
//       if (!window.ethereum) {
//         console.log("Install MetaMask");
//         return;
//       }

//       const accounts = await window.ethereum.request({
//         method: "eth_accounts",
//       });

//       if (accounts.length) {
//         setCurrentAccount(accounts[0]);
//       } else {
//         console.log("No Account Found");
//       }
//     } catch (error) {
//       console.log("Wallet connection error:", error);
//     }
//   };

//   useEffect(() => {
//     checkIfWalletConnected();
//   }, []);

//   // ----------------------------------------------------------------
//   // CONNECT WALLET
//   // ----------------------------------------------------------------
//   const connectWallet = async () => {
//     try {
//       if (!window.ethereum) return console.log("Install MetaMask");

//       const accounts = await window.ethereum.request({
//         method: "eth_requestAccounts",
//       });

//       setCurrentAccount(accounts[0]);
//     } catch (error) {
//       console.log("Error while connecting wallet");
//     }
//   };

//   // ----------------------------------------------------------------
//   // PROVIDER RETURN
//   // ----------------------------------------------------------------
//   return (
//     <CrowdFundingContext.Provider
//       value={{
//         titleData,
//         currentAccount,
//         createCampaign,
//         getCampaigns,
//         getUserCampaigns,
//         donate,
//         getDonations,
//         connectWallet,
//       }}
//     >
//       {children}
//     </CrowdFundingContext.Provider>
//   );
// };

//---------------------------------------------------------------------------------------------------------------------------

// CrowdFundingProvider.js
// import React, { useState, useEffect } from "react";
// import Web3Modal from "web3modal";
// import { ethers } from "ethers";
// import { CrowdFundingABI, CrowdFundingAddress } from "./contants"; // adjust path

// export const CrowdFundingContext = React.createContext();

// const fetchContract = (signerOrProvider) =>
//   new ethers.Contract(CrowdFundingAddress, CrowdFundingABI, signerOrProvider);

// /**
//  * getProvider:
//  * - Prefer MetaMask injected provider (window.ethereum) for local dev (localhost:3000).
//  * - Fallback to NEXT_PUBLIC_RPC_URL if MetaMask is not available.
//  */
// function getProvider() {
//   if (typeof window !== "undefined" && window.ethereum) {
//     return new ethers.providers.Web3Provider(window.ethereum);
//   }
//   const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";
//   return new ethers.providers.JsonRpcProvider(rpcUrl);
// }

// async function validateContractDeployed(provider) {
//   try {
//     const code = await provider.getCode(CrowdFundingAddress);
//     return code && code !== "0x";
//   } catch (err) {
//     console.warn("validateContractDeployed failed:", err);
//     return false;
//   }
// }

// export const CrowdFundingProvider = ({ children }) => {
//   const titleData = "Crowd Funding Contract";
//   const [currentAccount, setCurrentAccount] = useState("");
//   const [networkName, setNetworkName] = useState("");

//   // CREATE CAMPAIGN (write)
//   const createCampaign = async (campaign) => {
//     const { title, description, amount, deadline } = campaign;
//     try {
//       if (typeof window === "undefined" || !window.ethereum) {
//         throw new Error("MetaMask not detected - please install or configure NEXT_PUBLIC_RPC_URL");
//       }

//       const web3Modal = new Web3Modal();
//       const connection = await web3Modal.connect();
//       const provider = new ethers.providers.Web3Provider(connection);
//       const signer = provider.getSigner();
//       const contractWithSigner = fetchContract(signer);

//       const ownerAddress = await signer.getAddress();
//       const deadlineSeconds = Math.floor(new Date(deadline).getTime() / 1000);

//       const tx = await contractWithSigner.createCampaign(
//         ownerAddress,
//         title,
//         description,
//         ethers.utils.parseEther(amount.toString()),
//         deadlineSeconds
//       );
//       await tx.wait();
//       console.log("createCampaign success:", tx);
//       return tx;
//     } catch (error) {
//       console.error("createCampaign failure:", error);
//       throw error;
//     }
//   };

//   // GET ALL CAMPAIGNS (read)
//   const getCampaigns = async () => {
//     try {
//       const provider = getProvider();

//       // show network for debugging
//       try {
//         const net = await provider.getNetwork();
//         setNetworkName(`${net.name || "unknown"} (${net.chainId})`);
//       } catch {}

//       // ensure contract is deployed where provider points
//       const deployed = await validateContractDeployed(provider);
//       if (!deployed) {
//         console.error(
//           `No contract found at address ${CrowdFundingAddress} on current provider/network. ` +
//             `Make sure your contract is deployed and MetaMask (or RPC) is on the same network.`
//         );
//         return [];
//       }

//       const contract = fetchContract(provider);
//       const campaigns = await contract.getCampaigns();

//       // Defensive mapping: some ABIs return named arrays, others return tuple arrays
//       const titles = campaigns.titles || campaigns[1] || [];
//       const owners = campaigns.owners || campaigns[0] || [];
//       const descriptions = campaigns.descriptions || campaigns[2] || [];
//       const targets = campaigns.targets || campaigns[3] || [];
//       const deadlines = campaigns.deadlines || campaigns[4] || [];
//       const amountCollected = campaigns.amountCollected || campaigns[5] || [];

//       const parsed = (titles || []).map((_, i) => ({
//         owner: owners[i],
//         title: titles[i],
//         description: descriptions[i],
//         target: targets[i] ? ethers.utils.formatEther(targets[i].toString()) : "0",
//         deadline:
//           deadlines[i] && typeof deadlines[i].toNumber === "function"
//             ? deadlines[i].toNumber()
//             : Number(deadlines[i]) || 0,
//         amountCollected:
//           amountCollected[i] ? ethers.utils.formatEther(amountCollected[i].toString()) : "0",
//         pId: i,
//       }));

//       return parsed;
//     } catch (err) {
//       console.error("getCampaigns error:", err);
//       return [];
//     }
//   };

//   // GET USER CAMPAIGNS
//   const getUserCampaigns = async () => {
//     try {
//       const provider = getProvider();
//       const deployed = await validateContractDeployed(provider);
//       if (!deployed) {
//         console.error("getUserCampaigns: contract not deployed on network");
//         return [];
//       }

//       const contract = fetchContract(provider);
//       const campaigns = await contract.getCampaigns();

//       let currentUser = null;
//       if (typeof window !== "undefined" && window.ethereum) {
//         const accounts = await window.ethereum.request({ method: "eth_accounts" });
//         if (accounts && accounts[0]) currentUser = accounts[0].toLowerCase();
//       }
//       if (!currentUser) {
//         console.log("getUserCampaigns: no connected wallet account found (eth_accounts empty)");
//         return [];
//       }

//       const titles = campaigns.titles || campaigns[1] || [];
//       const owners = campaigns.owners || campaigns[0] || [];
//       const descriptions = campaigns.descriptions || campaigns[2] || [];
//       const targets = campaigns.targets || campaigns[3] || [];
//       const deadlines = campaigns.deadlines || campaigns[4] || [];
//       const amountCollected = campaigns.amountCollected || campaigns[5] || [];

//       const parsed = (titles || [])
//         .map((_, i) => ({
//           owner: owners[i],
//           title: titles[i],
//           description: descriptions[i],
//           target: targets[i] ? ethers.utils.formatEther(targets[i].toString()) : "0",
//           deadline:
//             deadlines[i] && typeof deadlines[i].toNumber === "function"
//               ? deadlines[i].toNumber()
//               : Number(deadlines[i]) || 0,
//           amountCollected:
//             amountCollected[i] ? ethers.utils.formatEther(amountCollected[i].toString()) : "0",
//           pId: i,
//         }))
//         .filter((c) => (c.owner || "").toLowerCase() === currentUser);

//       return parsed;
//     } catch (err) {
//       console.error("getUserCampaigns error:", err);
//       return [];
//     }
//   };

//   // DONATE (write)
//   const donate = async (pId, amount) => {
//     try {
//       if (typeof window === "undefined" || !window.ethereum) {
//         throw new Error("MetaMask not detected");
//       }
//       const web3Modal = new Web3Modal();
//       const connection = await web3Modal.connect();
//       const provider = new ethers.providers.Web3Provider(connection);
//       const signer = provider.getSigner();
//       const contractWithSigner = fetchContract(signer);

//       const tx = await contractWithSigner.donateToCampaign(pId, {
//         value: ethers.utils.parseEther(amount.toString()),
//       });

//       await tx.wait();
//       return tx;
//     } catch (error) {
//       console.error("donate error:", error);
//       throw error;
//     }
//   };

//   // GET DONATIONS (read)
//   const getDonations = async (pId) => {
//     try {
//       const provider = getProvider();
//       const deployed = await validateContractDeployed(provider);
//       if (!deployed) {
//         console.error("getDonations: contract not deployed");
//         return [];
//       }
//       const contract = fetchContract(provider);
//       const donations = await contract.getDonators(pId);

//       const numberOfDonations = donations[0].length;
//       const parsedDonations = [];
//       for (let i = 0; i < numberOfDonations; i++) {
//         parsedDonations.push({
//           donator: donations[0][i],
//           donation: ethers.utils.formatEther(donations[1][i].toString()),
//         });
//       }
//       return parsedDonations;
//     } catch (err) {
//       console.error("getDonations error:", err);
//       return [];
//     }
//   };

//   // CHECK WALLET CONNECTED
//   const checkIfWalletConnected = async () => {
//     try {
//       if (typeof window === "undefined" || !window.ethereum) {
//         console.log("checkIfWalletConnected: Install MetaMask");
//         return;
//       }
//       const accounts = await window.ethereum.request({ method: "eth_accounts" });
//       if (accounts.length) {
//         setCurrentAccount(accounts[0]);
//       } else {
//         console.log("No Account Found");
//       }
//     } catch (err) {
//       console.error("Wallet connection error:", err);
//     }
//   };

//   useEffect(() => {
//     checkIfWalletConnected();
//     (async () => {
//       try {
//         const provider = getProvider();
//         const net = await provider.getNetwork();
//         setNetworkName(`${net.name || "unknown"} (${net.chainId})`);
//       } catch (e) {
//         setNetworkName("unknown");
//       }
//     })();
//   }, []);

//   // CONNECT WALLET
//   const connectWallet = async () => {
//     try {
//       if (typeof window === "undefined" || !window.ethereum) {
//         console.log("Install MetaMask");
//         return;
//       }
//       const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
//       if (accounts && accounts[0]) setCurrentAccount(accounts[0]);
//     } catch (err) {
//       console.error("Error while connecting wallet:", err);
//     }
//   };

//   return (
//     <CrowdFundingContext.Provider
//       value={{
//         titleData,
//         currentAccount,
//         networkName,
//         createCampaign,
//         getCampaigns,
//         getUserCampaigns,
//         donate,
//         getDonations,
//         connectWallet,
//       }}
//     >
//       {children}
//     </CrowdFundingContext.Provider>
//   );
// };


//---------------------------------------------------------------------------------------------------------------------------

// CrowdFundingProvider.js
import React, { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { CrowdFundingABI, CrowdFundingAddress } from "./contants"; // adjust path

export const CrowdFundingContext = React.createContext();

const fetchContract = (signerOrProvider) =>
  new ethers.Contract(CrowdFundingAddress, CrowdFundingABI, signerOrProvider);

/**
 * getProvider:
 * - Prefer injected MetaMask provider (window.ethereum) for local dev.
 * - Fallback to NEXT_PUBLIC_RPC_URL or localhost:8545 if MetaMask not available.
 */
function getProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
  return new ethers.providers.JsonRpcProvider(rpcUrl);
}

/** Check if contract has code on current provider (to avoid CALL_EXCEPTION) */
async function validateContractDeployed(provider) {
  try {
    const code = await provider.getCode(CrowdFundingAddress);
    return !!code && code !== "0x";
  } catch (err) {
    console.warn("validateContractDeployed failed:", err);
    return false;
  }
}

export const CrowdFundingProvider = ({ children }) => {
  const titleData = "Crowd Funding Contract";

  // Use null/known defaults to avoid undefined in UI
  const [currentAccount, setCurrentAccount] = useState(null);
  const [networkName, setNetworkName] = useState("unknown");

  // -------------------------
  // CHECK WALLET CONNECTED
  // -------------------------
  const checkIfWalletConnected = async () => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        // no wallet injected
        setCurrentAccount(null);
        return;
      }

      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (Array.isArray(accounts) && accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      } else {
        setCurrentAccount(null);
      }
    } catch (err) {
      console.error("Wallet connection check error:", err);
      setCurrentAccount(null);
    }
  };

  // -------------------------
  // CONNECT WALLET (user action)
  // -------------------------
  const connectWallet = async () => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        console.log("Install MetaMask");
        return null;
      }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (Array.isArray(accounts) && accounts.length > 0) {
        setCurrentAccount(accounts[0]);
        return accounts[0];
      }
      return null;
    } catch (err) {
      console.error("Error while connecting wallet:", err);
      return null;
    }
  };

  // -------------------------
  // DISCONNECT WALLET (user action)
  // -------------------------
  const disconnectWallet = () => {
    setCurrentAccount(null);
  };

  // -------------------------
  // CREATE CAMPAIGN (write)
  // -------------------------
  const createCampaign = async (campaign) => {
    const { title, description, amount, deadline } = campaign;
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask not detected - please install or configure NEXT_PUBLIC_RPC_URL");
      }

      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contractWithSigner = fetchContract(signer);

      const ownerAddress = await signer.getAddress();
      const deadlineSeconds = Math.floor(new Date(deadline).getTime() / 1000);

      const tx = await contractWithSigner.createCampaign(
        ownerAddress,
        title,
        description,
        ethers.utils.parseEther(amount.toString()),
        deadlineSeconds
      );
      await tx.wait();
      console.log("createCampaign success");
      return tx;
    } catch (error) {
      console.error("createCampaign failure:", error);
      throw error;
    }
  };

  // -------------------------
  // GET CAMPAIGNS (read)
  // -------------------------
  const getCampaigns = async () => {
    try {
      const provider = getProvider();

      // set network for debugging (non-blocking)
      try {
        const net = await provider.getNetwork();
        setNetworkName(`${net.name || "unknown"} (${net.chainId})`);
      } catch (e) {
        setNetworkName("unknown");
      }

      // ensure contract code exists
      const deployed = await validateContractDeployed(provider);
      if (!deployed) {
        console.error("No contract found at address", CrowdFundingAddress, "on current provider/network");
        return []; // return empty array, not undefined
      }

      const contract = fetchContract(provider);
      const campaigns = await contract.getCampaigns();

      // Defensive parsing: named arrays or tuple array fallback
      const owners = campaigns.owners || campaigns[0] || [];
      const titles = campaigns.titles || campaigns[1] || [];
      const descriptions = campaigns.descriptions || campaigns[2] || [];
      const targets = campaigns.targets || campaigns[3] || [];
      const deadlines = campaigns.deadlines || campaigns[4] || [];
      const amountCollected = campaigns.amountCollected || campaigns[5] || [];

      const parsed = (titles || []).map((_, i) => ({
        owner: owners[i] || null,
        title: titles[i] || "",
        description: descriptions[i] || "",
        target: targets[i] ? ethers.utils.formatEther(targets[i].toString()) : "0",
        deadline:
          deadlines[i] && typeof deadlines[i].toNumber === "function"
            ? deadlines[i].toNumber()
            : Number(deadlines[i]) || 0,
        amountCollected:
          amountCollected[i] ? ethers.utils.formatEther(amountCollected[i].toString()) : "0",
        pId: i,
      }));

      return parsed;
    } catch (err) {
      console.error("getCampaigns error:", err);
      return [];
    }
  };

  // -------------------------
  // GET USER CAMPAIGNS
  // -------------------------
  const getUserCampaigns = async () => {
    try {
      const provider = getProvider();
      const deployed = await validateContractDeployed(provider);
      if (!deployed) {
        console.error("getUserCampaigns: contract not deployed on network");
        return [];
      }

      const contract = fetchContract(provider);
      const campaigns = await contract.getCampaigns();

      // determine current user address (prefer window.ethereum)
      let currentUser = null;
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (Array.isArray(accounts) && accounts[0]) currentUser = accounts[0].toLowerCase();
      }
      if (!currentUser) return [];

      const owners = campaigns.owners || campaigns[0] || [];
      const titles = campaigns.titles || campaigns[1] || [];
      const descriptions = campaigns.descriptions || campaigns[2] || [];
      const targets = campaigns.targets || campaigns[3] || [];
      const deadlines = campaigns.deadlines || campaigns[4] || [];
      const amountCollected = campaigns.amountCollected || campaigns[5] || [];

      const parsed = (titles || [])
        .map((_, i) => ({
          owner: owners[i] || null,
          title: titles[i] || "",
          description: descriptions[i] || "",
          target: targets[i] ? ethers.utils.formatEther(targets[i].toString()) : "0",
          deadline:
            deadlines[i] && typeof deadlines[i].toNumber === "function"
              ? deadlines[i].toNumber()
              : Number(deadlines[i]) || 0,
          amountCollected:
            amountCollected[i] ? ethers.utils.formatEther(amountCollected[i].toString()) : "0",
          pId: i,
        }))
        .filter((c) => (c.owner || "").toLowerCase() === currentUser);

      return parsed;
    } catch (err) {
      console.error("getUserCampaigns error:", err);
      return [];
    }
  };

  // -------------------------
  // DONATE (write)
  // -------------------------
  const donate = async (pId, amount) => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask not detected");
      }
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contractWithSigner = fetchContract(signer);

      const tx = await contractWithSigner.donateToCampaign(pId, {
        value: ethers.utils.parseEther(amount.toString()),
      });

      await tx.wait();
      return tx;
    } catch (error) {
      console.error("donate error:", error);
      throw error;
    }
  };

  // -------------------------
  // GET DONATIONS (read)
  // -------------------------
  const getDonations = async (pId) => {
    try {
      const provider = getProvider();
      const deployed = await validateContractDeployed(provider);
      if (!deployed) {
        console.error("getDonations: contract not deployed");
        return [];
      }
      const contract = fetchContract(provider);
      const donations = await contract.getDonators(pId);

      const numberOfDonations = Array.isArray(donations[0]) ? donations[0].length : 0;
      const parsedDonations = [];
      for (let i = 0; i < numberOfDonations; i++) {
        parsedDonations.push({
          donator: donations[0][i],
          donation: ethers.utils.formatEther(donations[1][i].toString()),
        });
      }
      return parsedDonations;
    } catch (err) {
      console.error("getDonations error:", err);
      return [];
    }
  };

  // set initial wallet & network on mount
  useEffect(() => {
    const initWallet = async () => {
      try {
        await checkIfWalletConnected();
      } catch (error) {
        console.error("Initial wallet check failed:", error);
      }

      try {
        const provider = getProvider();
        const net = await provider.getNetwork();
        setNetworkName(`${net.name || "unknown"} (${net.chainId})`);
      } catch (e) {
        console.error("Network check failed:", e);
        setNetworkName("unknown");
      }
    };

    initWallet();

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
        } else {
          setCurrentAccount(null);
        }
      };

      const handleChainChanged = () => {
        // Reload the page on chain change
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  // Provide context values. All keys have defined values (no undefined)
  return (
    <CrowdFundingContext.Provider
      value={{
        titleData,
        currentAccount,
        networkName,
        createCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </CrowdFundingContext.Provider>
  );
};
