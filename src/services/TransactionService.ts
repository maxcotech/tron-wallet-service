import Service from './Service';
import { Transaction } from './../dataTypes/Transaction';
import { config } from 'dotenv';
import WalletServices from './WalletServices';
import { Repository } from 'typeorm';
import ReceivedTransaction from '../entities/ReceivedTransaction';
import AppDataSource from '../config/dataSource';
import Wallet from '../entities/Wallet';
import { VAULT_ADDRESS } from '../config/settings';
import { walletErrors } from './../config/errors/wallet.errors';
import { asyncWrapper } from './../helpers/function_helpers';
import { TronWeb } from 'tronweb';
import { transactionErrors } from '../config/errors/transaction.errors';
import SentTransaction from '../entities/SentTransaction';


export default class TransactionService extends Service{
    vaultTxnInterval: number;
    receivedTxnRepo: Repository<ReceivedTransaction>;
    walletRepo: Repository<Wallet>;
    sentTxnRepo: Repository<SentTransaction>;

    constructor(){
        super();
        config();
        this.vaultTxnInterval = 1000 * 60 * 5;
        this.receivedTxnRepo = AppDataSource.getRepository(ReceivedTransaction);
        this.walletRepo = AppDataSource.getRepository(Wallet);
        this.sentTxnRepo = AppDataSource.getRepository(SentTransaction);
        this.tronWeb = this.getVaultInstance();
    }

    async sendTransferTransaction(amountInput?: number, fromAddress?: string , recipientAddress?: string, contractId?: number, acceptBelowAmount: boolean = false){
        try{
            const transaction = await this.createTransferTransaction(amountInput,fromAddress,recipientAddress,contractId,acceptBelowAmount);
            if(!!transaction){
                const walletServices = new WalletServices();
                const senderWallet = await walletServices.fetchWalletFromAddress(fromAddress ?? VAULT_ADDRESS);
                const signedTxn = await this.tronWeb.trx.sign(transaction, senderWallet.privateKey);
                const receipt = await this.tronWeb.trx.sendRawTransaction(signedTxn);
                console.log("Transaction Receipt",receipt);
                const sentTransaction = new SentTransaction();
                sentTransaction.txId = transaction.txID;
                await this.sentTxnRepo.save(sentTransaction);
                return true;
            }
            return false;
        } catch(e){
            console.log(e);
            return false;
        }
    }
   
    async createTransferTransaction(amountInput?: number, fromAddress?: string , recipientAddress?: string, contractId?: number, acceptBelowAmount: boolean = false){
        const walletService = new WalletServices();
        const toAddress = (!!recipientAddress)? recipientAddress: VAULT_ADDRESS;
        const fromWallet = (!!fromAddress)? await walletService.fetchWalletFromAddress(fromAddress): await walletService.getVaultWallet()
        const senderAddress = fromAddress ?? fromWallet.address.base58;
        let transactionObj: Transaction | null = null;
        if(!!contractId){
            transactionObj = await this.createTokenTransfer(contractId,senderAddress,toAddress,amountInput,acceptBelowAmount);
        } else {
            transactionObj = await this.createCoinTransfer(senderAddress,toAddress,amountInput,acceptBelowAmount);
        }
        return transactionObj;
    }

    async createTokenTransfer(contractId:number, senderAddress:any, toAddress: any,  amountInput?: number, acceptBelowAmount: boolean = false   ){
        const contract = await this.getContract(contractId);
        let transactionObj = null;
        const walletService = new WalletServices();
        const balance = this.tronWeb.toSun(await walletService.fetchTokenBalance(senderAddress,contract.id));
        const amount =  (!!amountInput)? this.tronWeb.toSun(amountInput,contract.decimalPlaces): balance;
        const coinBalance = await walletService.fetchCoinBalance(senderAddress);
        const fee = await this.calculateTransactionFee(transactionObj);
        if(coinBalance < fee){
            throw new Error(transactionErrors.insufficientFee)
        }
        if(balance < amount) { 
            if(acceptBelowAmount){
                transactionObj = await asyncWrapper(
                    () => this.tronWeb.transactionBuilder.sendToken(toAddress,balance,contract.tokenId,senderAddress)
                )
            } else {
                throw new Error(walletErrors.insufficientBalance);
            }
        } else {
            transactionObj = await asyncWrapper(
                () => this.tronWeb.transactionBuilder.sendToken(toAddress,this.tronWeb.toSun(amount,contract.decimalPlaces),contract.tokenId,senderAddress)
            )
        }
        return transactionObj;
    }

    async createCoinTransfer(senderAddress:any, toAddress: any,  amountInput?: number, acceptBelowAmount: boolean = false ){
        const walletService = new WalletServices();
        const balance = await walletService.fetchCoinBalance(senderAddress);
        const balanceInSun = this.tronWeb.toSun(balance);
        const amount =  (!!amountInput)? this.tronWeb.toSun(amountInput): balanceInSun;
        let transactionObj = null;
        transactionObj = await asyncWrapper(
            () => this.tronWeb.transactionBuilder.sendTrx(toAddress,amount,senderAddress)
        )
        const fee = await this.calculateTransactionFee(transactionObj);
        const availableBalance = this.tronWeb.toSun(balance - fee);
        if(availableBalance < amount){
            if(acceptBelowAmount){
                transactionObj = await asyncWrapper(
                    () => this.tronWeb.transactionBuilder.sendTrx(toAddress,availableBalance,senderAddress)
                )
            } else {
                throw new Error(walletErrors.insufficientBalance);
            }
        }
        return transactionObj;
    }


    async calculateFeeByParams(amount: number,fromAddress: string,toAddress: string, contractId? : number){
        const contract = await this.contractRepo.findOneBy({id: contractId});
        let transactionObj = null;
        if(!!contract){
            const value = this.tronWeb.toSun(amount, contract.decimalPlaces);
            transactionObj = await asyncWrapper(() => this.tronWeb.transactionBuilder.sendToken(toAddress,value,contract.tokenId,fromAddress))
        } else {
            const value = this.tronWeb.toSun(amount);
            transactionObj = await asyncWrapper(
                () => this.tronWeb.transactionBuilder.sendTrx(toAddress,value,fromAddress)
            )
        }
        return await this.calculateTransactionFee(transactionObj);
    }
    


    
    async calculateTransactionFee(transaction: any) {
        const feePerByte = await this.tronWeb.trx.getFeePerByte();
        const transactionSize = this.tronWeb.to.getTransactionSize(transaction);
        const transactionFee = feePerByte * transactionSize;
        return this.tronWeb.fromSun(transactionFee); // in TRX
    }
    



}
