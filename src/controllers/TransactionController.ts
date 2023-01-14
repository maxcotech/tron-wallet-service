import Controller from './Controller';
import { Request } from 'express';
import { Response } from 'express';
import TransactionService from '../services/TransactionService';
import { config } from 'dotenv';
import WalletServices from './../services/WalletServices';
import { ethers } from 'ethers';
config()

export default class TransactionController extends Controller{
    

    public static async createTransaction(req: Request, res: Response){
        try{
            // const {toAddress, contractAddress, amount} = req.body ?? {};
            // const txnService = new TransactionService();
            // const walletService = new WalletServices();
            // const vaultAddress = process.env.VAULT_ADDRESS ?? "";
            // const vaultWallet = await walletService.fetchWalletFromAddress(vaultAddress);
            // const proposedGasPrice = (await txnService.getGasFeePayload())?.ProposeGasPrice
            // const txnRequest = await vaultWallet?.populateTransaction({
            //     to: vaultAddress,
            //     gasLimit: txnService.getGasLimit(),
            //     gasPrice: proposedGasPrice,
            //     nonce: await vaultWallet.getTransactionCount()
            // })
            // console.log("Proposed Gas Price......", proposedGasPrice);
            // console.log("Created Transaction.............",txnRequest,vaultWallet,"this is vaultadd "+ vaultAddress);
            // Controller.successWithData(res,await vaultWallet?.getFeeData());

        } catch(e){
            let message = "Unknown error occurred";
            if(e instanceof Error){
                message = e.message;
            }
            res.status(500).json({
                message
            })
        }

        
    }
     
}