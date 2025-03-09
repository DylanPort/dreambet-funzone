
import { Connection, PublicKey, Transaction, SystemProgram, Keypair, sendAndConfirmTransaction } from '@solana/web3.js';
import { BN, Program, Provider, web3 } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { Bet, SolanaContractPrediction, SolanaContractStatus, BetPrediction, BetStatus } from '@/types/bet';

// Constants
// Replace with your actual program ID after deployment
const PROGRAM_ID = "PUT_YOUR_PROGRAM_ID_HERE";

// Solana connection
export const getSolanaConnection = () => {
  return new Connection(
    process.env.NODE_ENV === 'production' 
      ? 'https://api.devnet.solana.com' 
      : 'https://api.devnet.solana.com'
  );
};

// Helper functions to convert between our frontend types and contract types
const convertPrediction = (prediction: BetPrediction): SolanaContractPrediction => {
  return prediction === 'migrate' 
    ? SolanaContractPrediction.Migrate 
    : SolanaContractPrediction.Die;
};

const convertStatus = (status: SolanaContractStatus): BetStatus => {
  switch (status) {
    case SolanaContractStatus.Open:
      return 'open';
    case SolanaContractStatus.Confirmed:
      return 'matched';
    case SolanaContractStatus.Closed:
      return 'closed';
    case SolanaContractStatus.Resolved:
      return 'completed';
    case SolanaContractStatus.Expired:
      return 'expired';
    default:
      return 'open';
  }
};

// Generate a unique bet ID using timestamp and random number
const generateUniqueBetId = (): number => {
  return Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000);
};

// Find the PDA for a bet account
export const findBetPDA = async (betId: number) => {
  const programId = new PublicKey(PROGRAM_ID);
  const [pda] = await PublicKey.findProgramAddress(
    [
      Buffer.from("bet"),
      new BN(betId).toArrayLike(Buffer, 'le', 8)
    ],
    programId
  );
  return pda;
};

// Create a bet on the Solana blockchain
export const createSolanaBet = async (
  wallet: any,
  tokenMint: string,
  prediction: BetPrediction,
  durationMinutes: number,
  solAmount: number
): Promise<{ betId: number }> => {
  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const connection = getSolanaConnection();
    const programId = new PublicKey(PROGRAM_ID);
    const betId = generateUniqueBetId();
    const betPDA = await findBetPDA(betId);

    // Create a counter account if it doesn't exist yet
    // This is just a simplification for demonstration
    // In a real implementation, you'd need to properly initialize this
    const counterPDA = await PublicKey.findProgramAddress(
      [Buffer.from("counter")],
      programId
    );

    // Create transaction
    const durationSeconds = durationMinutes * 60;
    const solLamports = solAmount * web3.LAMPORTS_PER_SOL;

    // Assuming an IDL or direct method to serialize the instruction data
    // In a real implementation, you would use proper serialization
    const data = Buffer.alloc(1 + 32 + 1 + 8 + 8);
    data.writeUInt8(0, 0); // CreateBet instruction
    new PublicKey(tokenMint).toBuffer().copy(data, 1);
    data.writeUInt8(prediction === 'migrate' ? 0 : 1, 33);
    new BN(durationSeconds).toArrayLike(Buffer, 'le', 8).copy(data, 34);
    new BN(solLamports).toArrayLike(Buffer, 'le', 8).copy(data, 42);

    const instruction = new web3.TransactionInstruction({
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: betPDA, isSigner: false, isWritable: true },
        { pubkey: counterPDA[0], isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: web3.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      ],
      programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    // Sign and send transaction
    const signedTx = await wallet.signTransaction(transaction);
    const txId = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
    await connection.confirmTransaction(txId, 'confirmed');

    return { betId };
  } catch (error) {
    console.error("Error creating bet on Solana:", error);
    throw error;
  }
};

// Accept a bet
export const acceptSolanaBet = async (
  wallet: any,
  betId: number
): Promise<void> => {
  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const connection = getSolanaConnection();
    const programId = new PublicKey(PROGRAM_ID);
    const betPDA = await findBetPDA(betId);

    // Find the market cap PDA - this is a simplification
    // In a real implementation, you'd need to get the token mint from the bet account first
    const tokenMint = new PublicKey("11111111111111111111111111111111"); // placeholder
    const [marketCapPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("market_cap"), tokenMint.toBuffer()],
      programId
    );

    // Create transaction
    const data = Buffer.alloc(1 + 8);
    data.writeUInt8(1, 0); // CounterBet instruction
    new BN(betId).toArrayLike(Buffer, 'le', 8).copy(data, 1);

    const instruction = new web3.TransactionInstruction({
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: betPDA, isSigner: false, isWritable: true },
        { pubkey: marketCapPDA, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: web3.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      ],
      programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    // Sign and send transaction
    const signedTx = await wallet.signTransaction(transaction);
    const txId = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
    await connection.confirmTransaction(txId, 'confirmed');
  } catch (error) {
    console.error("Error accepting bet on Solana:", error);
    throw error;
  }
};

// Get bet data from the blockchain
export const getSolanaBetData = async (betId: number): Promise<Bet | null> => {
  try {
    const connection = getSolanaConnection();
    const programId = new PublicKey(PROGRAM_ID);
    const betPDA = await findBetPDA(betId);

    const accountInfo = await connection.getAccountInfo(betPDA);
    if (!accountInfo) {
      return null;
    }

    // Simple deserializing from binary data (this is a simplified version)
    // In a real implementation, you'd use proper deserialization based on the contract's data layout
    const data = accountInfo.data;
    
    // This is a placeholder, as the actual deserialization would depend on your contract's data structure
    // In a real implementation, you'd deserialize according to your contract's data layout
    const id = new BN(data.slice(0, 8)).toNumber();
    const tokenMint = new PublicKey(data.slice(8, 40)).toString();
    const bettor1 = new PublicKey(data.slice(40, 72)).toString();
    
    const bettor2Option = data[72];
    let bettor2 = null;
    if (bettor2Option === 1) {
      bettor2 = new PublicKey(data.slice(73, 105)).toString();
    }
    
    const predictionBettor1 = data[105 + (bettor2Option === 1 ? 32 : 0)];
    const duration = new BN(data.slice(106 + (bettor2Option === 1 ? 32 : 0), 114 + (bettor2Option === 1 ? 32 : 0))).toNumber();
    const creationTime = new BN(data.slice(114 + (bettor2Option === 1 ? 32 : 0), 122 + (bettor2Option === 1 ? 32 : 0))).toNumber();
    const startTime = new BN(data.slice(122 + (bettor2Option === 1 ? 32 : 0), 130 + (bettor2Option === 1 ? 32 : 0))).toNumber();
    const endTime = new BN(data.slice(130 + (bettor2Option === 1 ? 32 : 0), 138 + (bettor2Option === 1 ? 32 : 0))).toNumber();
    const initialMarketCap = new BN(data.slice(138 + (bettor2Option === 1 ? 32 : 0), 146 + (bettor2Option === 1 ? 32 : 0))).toNumber();
    const solAmount = new BN(data.slice(146 + (bettor2Option === 1 ? 32 : 0), 154 + (bettor2Option === 1 ? 32 : 0))).toNumber() / web3.LAMPORTS_PER_SOL;
    const status = data[154 + (bettor2Option === 1 ? 32 : 0)];

    // This is a placeholder, as you would need additional service calls to get the token name and symbol
    const tokenName = "Unknown Token";
    const tokenSymbol = "UNKNOWN";

    return {
      id: betId.toString(),
      tokenId: tokenMint,
      tokenName,
      tokenSymbol,
      initiator: bettor1,
      counterParty: bettor2,
      amount: solAmount,
      prediction: predictionBettor1 === SolanaContractPrediction.Migrate ? 'migrate' : 'die',
      timestamp: creationTime * 1000,
      expiresAt: endTime * 1000,
      status: convertStatus(status),
      initialMarketCap,
      duration: duration / 60, // Convert seconds to minutes
      onChainBetId: betId.toString()
    };
  } catch (error) {
    console.error("Error fetching bet data from Solana:", error);
    return null;
  }
};
