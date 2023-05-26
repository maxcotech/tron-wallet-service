import Service from './Service';
import { Transaction, TransactionRecursiveOptions } from './../dataTypes/Transaction';
import WalletServices from './WalletServices';
import { Repository } from 'typeorm';
import ReceivedTransaction from '../entities/ReceivedTransaction';
import AppDataSource from '../config/dataSource';
import Wallet from '../entities/Wallet';
import { RESERVE_BALANCE_PERCENTAGE, VAULT_ADDRESS } from '../config/settings';
import { walletErrors } from './../config/errors/wallet.errors';
import { asyncWrapper } from './../helpers/function_helpers';
import { transactionErrors } from '../config/errors/transaction.errors';
import SentTransaction from '../entities/SentTransaction';
import { subtractPercentage } from '../helpers/transaction_helpers';



export default class TransactionService extends Service{
    vaultTxnInterval: number;
    receivedTxnRepo: Repository<ReceivedTransaction>;
    walletRepo: Repository<Wallet>;
    sentTxnRepo: Repository<SentTransaction>;
    feeRequirementInTrx: number;
    feeLimit: number;

    constructor(){
        super();
        this.vaultTxnInterval = 1000 * 60 * 5;
        this.receivedTxnRepo = AppDataSource.getRepository(ReceivedTransaction);
        this.walletRepo = AppDataSource.getRepository(Wallet);
        this.sentTxnRepo = AppDataSource.getRepository(SentTransaction);
        this.feeRequirementInTrx = 15;
        this.feeLimit = 15;
        this.tronWeb = this.getVaultInstance();
    }

    async fetchFeeRequirementInTrx(){
        return this.feeRequirementInTrx;
    }

    async fetchFeeLimitInSun(){
        return this.tronWeb.toSun(this.feeLimit);
    }

    async sendTransferTransaction(amountInput?: number, fromAddress?: string , recipientAddress?: string, contractId?: number, acceptBelowAmount: boolean = false){
        try{
            const transaction = await this.createTransferTransaction(amountInput,fromAddress,recipientAddress,contractId,acceptBelowAmount);
            if(!!transaction){
                const walletServices = new WalletServices();
                const senderWallet = await walletServices.fetchWalletFromAddress(fromAddress ?? VAULT_ADDRESS);
                console.log('signing transaction');
                const signedTxn = await this.tronWeb.trx.sign(transaction, senderWallet.privateKey);
                console.log('transaction signed');
                const receipt = await this.tronWeb.trx.sendRawTransaction(signedTxn);
                console.log('transaction sent');
                console.log("Transaction Receipt",receipt);
                const sentTransaction = new SentTransaction();
                sentTransaction.txId = transaction.txID;
                await this.sentTxnRepo.save(sentTransaction);
                return transaction.txID;
            }
            return false;
        } catch(e){
            console.log(e);
            return false;
        }
    }

    async saveReceivedTransaction(toAddress: string,sentToVault: boolean,txId: string,amount: any,contractId = null){
        if(await this.receivedTxnRepo.findOneBy({txId}) !== null){
            console.log('transaction ',txId,' already processed');
            return null;
        } else {
            const receivedTxn = new ReceivedTransaction();
            receivedTxn.address = toAddress;
            receivedTxn.sentToVault = sentToVault;
            receivedTxn.txId = txId;
            receivedTxn.value = amount;
            receivedTxn.contractId = contractId;
            return await this.receivedTxnRepo.save(receivedTxn);
        }
    }

    
   
    async createTransferTransaction(amountInput?: number, fromAddress?: string , recipientAddress?: string, contractId?: number, acceptBelowAmount: boolean = false){
        console.log('creating transfer transaction of ',amountInput);
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
        console.log('txn obj..............................',transactionObj);
        return transactionObj;
    }

    async triggerSmartContract(contractAddress: string,from: string,to: string,amount: number){
        const options = {
            feeLimit: await this.fetchFeeLimitInSun(),
            callValue: 0
        }
        const parameters = [
            {type:"address",value:this.tronWeb.address.toHex(to)}, {type:"uint256",value: amount}
        ]
        const result = await this.tronWeb.transactionBuilder.triggerSmartContract(
            this.tronWeb.address.toHex(contractAddress),
            'transfer(address,uint256)',
            options,
            parameters,
            this.tronWeb.address.toHex(from)
        )
        return result?.transaction ?? null;
    }

    async createTokenTransfer(contractId:number, senderAddress:any, toAddress: any,  amountInput?: number, acceptBelowAmount: boolean = false   ){
        const contract = await this.getContract(contractId);
        let transactionObj = null;
        const walletService = new WalletServices();
        const balance = this.tronWeb.toSun(await walletService.fetchTokenBalance(senderAddress,contract.id));
        const amount =  (!!amountInput)? this.tronWeb.toSun(amountInput,contract.decimalPlaces): balance;
        const coinBalance = await walletService.fetchCoinBalance(senderAddress);
        if(coinBalance < await this.fetchFeeRequirementInTrx()){
            throw new Error(transactionErrors.insufficientFee);
        }
        if(balance < amount) { 
            console.log('insufficient balance improvising')
            if(acceptBelowAmount){
                transactionObj = await this.triggerSmartContract(contract.contractAddress,senderAddress,toAddress,balance)
                
            } else {
                throw new Error(walletErrors.insufficientBalance);
            }
        } else {
            console.log('sufficient balance creating transaction')
            transactionObj = await this.triggerSmartContract(contract.contractAddress,senderAddress,toAddress,amount)
        }
        console.log(transactionObj);
        return transactionObj;
    }

    async createCoinTransfer(senderAddress:any, toAddress: any,  amountInput?: number, acceptBelowAmount: boolean = false ){
        const walletService = new WalletServices();
        const balance = await walletService.fetchCoinBalance(senderAddress);
        const balanceInSun = this.tronWeb.toSun(balance);
        const amount =  (!!amountInput)? this.tronWeb.toSun(amountInput): balanceInSun;
        let transactionObj = null;
        console.log('creating coin txn in coin trf func',{
            balanceInSun, amount, amountInput, balance
        });
        if(balanceInSun < amount){
            if(acceptBelowAmount){
                transactionObj = await this.recursivelyCreateCoinTransaction(toAddress,balanceInSun,senderAddress);
            } else {
                throw new Error(walletErrors.insufficientBalance);
            }
        } else {
            transactionObj = await this.recursivelyCreateCoinTransaction(toAddress,amount,senderAddress);
        }
        return transactionObj;
    }


    async calculateFeeByParams(amount: number,from: string,to : string, contractId? : number){
        // const contract = await this.contractRepo.findOneBy({id: contractId});
        // let transactionObj = null;
        // if(!!contract){
        //     const value = this.tronWeb.toSun(amount, contract.decimalPlaces);
        //     transactionObj = await asyncWrapper(() => this.tronWeb.transactionBuilder.sendToken(toAddress,value,contract.tokenId,fromAddress))
        // } else {
        //     const value = this.tronWeb.toSun(amount);
        //     transactionObj = await this.recursivelyCreateCoinTransaction(toAddress,value,fromAddress)
        // }
        // return await this.calculateTransactionFee(transactionObj);

        const data = {amount,from, to}
        return this.tronWeb.trx.getBandwidth(from);

    }

    async getWalletAccountInfo(contractId: null | number){
        let query = this.receivedTxnRepo.createQueryBuilder('received_transactions')
        query = query.select('received_transactions.sentToVault','sentToVault')
        .addSelect('SUM(CAST(value AS float))','totalBalance');
        if(!!contractId === false){
            //query = query.where('received_transactions.contractId IS NULL')
            query = query.where('received_transactions.contractId = :contract',{contract: 3})

        } else {
            query = query.where('received_transactions.contractId = :contract',{contract: contractId})
        }
        const result = await query.groupBy("received_transactions.sentToVault")
        .getRawMany();
        return result;
    }


    

    async recursivelyCreateCoinTransaction(toAddress: string,value: number,fromAddress: string,recursiveOptions: Partial<TransactionRecursiveOptions> = {}){
        const reserveIncrement = recursiveOptions?.reserveIncrement ?? 0;
        const retrialsLeft = recursiveOptions?.retrialsLeft ?? 4;
        const amount = subtractPercentage(RESERVE_BALANCE_PERCENTAGE + reserveIncrement, value);
        try{
            console.log('creating txn recursively')
            const txnObj = await asyncWrapper(() => this.tronWeb.transactionBuilder.sendTrx(toAddress,amount,fromAddress));
            return txnObj;
        }
        catch(e){
            let newIncrement = (reserveIncrement + 1) * 2;
            console.log('transaction create failed, retrying with new reserveIncrement',reserveIncrement);
            if(retrialsLeft === 0){
                console.log('Failed to Process transaction');
                return null;
            }
            return this.recursivelyCreateCoinTransaction(toAddress,value,fromAddress,{
                reserveIncrement: newIncrement,
                retrialsLeft: retrialsLeft - 1 
            })
        }
    }


    
    async calculateTransactionFee(transaction: any) {
        const feePerByte = await this.tronWeb.trx.getFeePerByte();
        const transactionSize = this.tronWeb.to.getTransactionSize(transaction);
        const transactionFee = feePerByte * transactionSize;
        return this.tronWeb.fromSun(transactionFee); // in TRX
    }
    



}
