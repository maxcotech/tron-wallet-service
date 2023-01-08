import axios from 'axios';
import Service from './Service';
import { EtherscanFeeEstimate, FeeRatePayload, Transaction } from './../dataTypes/Transaction';
import { config } from 'dotenv';
import { ethers } from 'ethers';
import WalletServices from './WalletServices';
import { Repository } from 'typeorm';
import ReceivedTransaction from '../entities/ReceivedTransaction';
import AppDataSource from '../config/dataSource';
import Wallet from '../entities/Wallet';
import { decryptValue } from '../helpers/object_helpers';
import { VAULT_ADDRESS } from '../config/settings';
import { walletErrors } from './../config/errors/wallet.errors';
import { asyncWrapper } from './../helpers/function_helpers';

export default class TransactionService extends Service{
    vaultTxnInterval: number;
    receivedTxnRepo: Repository<ReceivedTransaction>;
    walletRepo: Repository<Wallet>;

    constructor(){
        super();
        config();
        this.vaultTxnInterval = 1000 * 60 * 5;
        this.receivedTxnRepo = AppDataSource.getRepository(ReceivedTransaction);
        this.walletRepo = AppDataSource.getRepository(Wallet);
    }
   
    async createTransferTransaction(amount: number, fromAddress?: string , recipientAddress?: string, contractId?: number, adjustForFees: true){
        const walletService = new WalletServices();
        const toAddress = (!!recipientAddress)? recipientAddress: VAULT_ADDRESS;
        const fromWallet = (!!fromAddress)? await walletService.fetchWalletFromAddress(fromAddress): await walletService.getVaultWallet()
        const senderAddress = fromAddress ?? fromWallet.address.base58;
        const tronWeb = this.getVaultInstance();
        let transactionObj: Transaction | null = null;
        if(!!contractId){
            const contract = await this.getContract(contractId);
            const balance = await walletService.fetchTokenBalance(senderAddress,contract.id);
            if(balance < amount) throw new Error(walletErrors.insufficientBalance);
            transactionObj = await asyncWrapper(
                () => tronWeb.transactionBuilder.sendToken(toAddress,tronWeb.toSun(amount,contract.decimalPlaces),contract.tokenId,senderAddress)
            )
        } else {
            const balance = await walletService.fetchTronBalance(senderAddress);
            transactionObj = await asyncWrapper(
                () => tronWeb.transactionBuilder.sendTrx(toAddress,tronWeb.toSun(amount),senderAddress)
            )
            const fee = await this.calculateTransactionFee(transactionObj);
            const availableBalance = balance - fee;
            if(availableBalance >= amount){
                //TODO
            }

        }
    }


    
    async calculateTransactionFee(transaction: any) {
        const tronWeb = this.getVaultInstance();
        const feePerByte = await tronWeb.trx.getFeePerByte();
        const transactionSize = tronWeb.to.getTransactionSize(transaction);
        const transactionFee = feePerByte * transactionSize;
        return transactionFee; // in TRX
      }
    



}
