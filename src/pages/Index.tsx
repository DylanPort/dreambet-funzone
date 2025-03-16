
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import idl from '../idl.json';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useToast } from "@/hooks/use-toast";

// The main component starts here
const Index = () => {
  const { publicKey, wallet } = useWallet();
  const { toast } = useToast();
  
  useEffect(() => {
    if (publicKey) {
      console.log("Wallet connected:", publicKey.toString());
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to wallet",
      });
    }
  }, [publicKey, toast]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Solana App</h1>
      
      <div className="mb-6">
        <WalletMultiButton className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" />
      </div>
      
      {publicKey ? (
        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Connected Wallet</h2>
          <p className="text-gray-700 break-all">{publicKey.toString()}</p>
        </div>
      ) : (
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-yellow-800">Please connect your wallet to continue.</p>
        </div>
      )}

      <div className="mt-8">
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Index;
