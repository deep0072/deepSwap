import dotenv from 'dotenv';
dotenv.config();
import { Connection, Keypair, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js';

import bs58 from 'bs58';
import { Wallet } from '@project-serum/anchor';
import axios from 'axios';
// create connection object
const connection = new Connection("https://api.mainnet-bet.solana.com")


const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY)))



// create wallet instance with key pair,




async function main(){

    //---------------send request for quote----------------------------------


    // Swapping SOL to USDC with input 0.1 SOL and 0.5% slippage

    // where EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v is usdc address
    const response = await (await axios.get('https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=100000000&slippageBps=50'))

    const quoteResponse = response.data

    // -----------after getting quote response send the quote and ask for  transaction object 
    
    // transaction object has bunch of info like which dex is, which market maker address and other stuff

    try {
        const response = await (await axios.post ("https://quote-api.jup.ag/v6/swap", {
            quoteResponse,
            userPublicKey:wallet.publicKey.toString()
        })
        )

        // this will return base64 data
        const swapTxn = response.data.swapTransaction;
        
        console.log(swapTxn, "swapTxn")

        // convert base64 into bytes
        const swapTxnBuf = Buffer.from(swapTxn,'base64')

        // now convert bytes into object

        const transaction = VersionedTransaction.deserialize(swapTxnBuf)

        console.log(transaction, "deserialized txn")

        // now sign the txn
        transaction.sign([wallet.payer])

        //now get latest blockhash

        const latestBlockHash = await connection.getLatestBlockhash()

        // first serialize the txn to send over the api
        const rawTxn = transaction.serialize()

        const txId = await connection.sendRawTransaction(rawTxn, {
            skipPreflight:true,
            maxRetries:2
        })
        

        // wait for  executed txn id confirmation
        await connection.confirmTransaction({
            blockhash:latestBlockHash.blockhash,
            lastValidBlockHeight:latestBlockHash.lastValidBlockHeight,
            signature:txId
        })

        console.log(`https://solscan.io/tx/${txId}`)



    } catch(e){
        console.log(e)
    }


}

main()