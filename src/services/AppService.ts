import AppDataSource from "../config/dataSource";
import Service from "./Service";
import IndexedBlock from './../entities/IndexedBlock';
import { Repository } from 'typeorm';
import Wallet from "../entities/Wallet";
import ReceivedTransaction from "../entities/ReceivedTransaction";
import Contract from "../entities/Contract";
import { ContractTypes } from "../config/enums";
import MessageQueueService from "./MessageQueueService";
import TransactionService from "./TransactionService";
import { RESERVE_BALANCE_PERCENTAGE, VAULT_ADDRESS } from "../config/settings";
import VaultTransferService from './VaultTransferService';
import { Block } from "../dataTypes/Block";
import { InternalTransaction, TransactionInfo, TransactionInfoLog } from "../dataTypes/TransactionInfo";
import { decodeAddressInEvent, decodeAmountInEvent } from "../helpers/conversion_helpers";
import { subtractPercentage } from './../helpers/transaction_helpers';

export default class AppService extends Service {
   
    timer: number = 1000 * 30 ; // Default 30 seconds
    indexedBlockRepo: Repository<IndexedBlock>;
    walletRepo: Repository<Wallet>;
    receivedTxnRepo: Repository<ReceivedTransaction>;
    contractRepo: Repository<Contract>;
    transferEventTopic: string;

    constructor(){
        super();
        this.indexedBlockRepo = AppDataSource.getRepository(IndexedBlock);
        this.walletRepo = AppDataSource.getRepository(Wallet);
        this.receivedTxnRepo = AppDataSource.getRepository(ReceivedTransaction);
        this.contractRepo = AppDataSource.getRepository(Contract);
        this.transferEventTopic = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
        this.tronWeb = this.getVaultInstance();
    }

    public async getLatestBlockNumber(){
        let block: Block = await this.tronWeb.trx.getCurrentBlock();
        const blockNumber = block.block_header.raw_data.number;
        console.log(`Latest Block`,blockNumber);
        return blockNumber;
    }

    public async syncBlockchainData() {
        try {
            setTimeout(async () => {
                await this.syncMissingBlocks();
                // const lastIndexed = await this.getLastIndexedNumber();
                // const blockNumber = await this.getLatestBlockNumber();
                // if(lastIndexed < blockNumber){
                //     await this.processBlock(blockNumber);
                // }
                await this.syncBlockchainData();
            }, this.timer);
        } catch (e) {
            if (e instanceof Error) {
                console.log("Failed to sync")
                console.log(e.name, e.message, e.stack);
            }
        }
    }

    public async processBlock(blockNum: number){
        try{
            const block: Block = await this.tronWeb.trx.getBlockByNumber(blockNum);
            if(!!block === false) console.log(`Found and index ${blockNum} with no block.............................................................................`)
            if(!!block.transactions === false){
                return false;
            }
            for await (let transaction of block.transactions){
                await this.processTransaction(transaction);
            }
            await this.updateBlockIndex(blockNum);
        }
        catch(e){
            console.log("processing block",blockNum, "Failed");
            console.log(e)
        }
    }

    public async processTransaction(transaction: any){
        const txData = transaction.raw_data;
        //console.log("tx_raw_data",txData.contract[0].type === ContractTypes.TriggerSmartContract, txData);
        const parameterValue = txData.contract[0].parameter.value;
        if(txData.contract[0].type === ContractTypes.TransferContract){
            await this.processCoinTransaction(parameterValue,transaction.txID);
        } else if(txData.contract[0].type === ContractTypes.TransferAssetContract){
            await this.processTokenTransaction(parameterValue,transaction.txID);
        } else if(txData.contract[0].type === ContractTypes.TriggerSmartContract){
            await this.processSmartContractTransaction(transaction.txID);
        }
    }

    public async processSmartContractTransaction(txID: any){
        try{
            const transactionInfo: TransactionInfo = await this.tronWeb.trx.getTransactionInfo(txID);
            if(transactionInfo && transactionInfo.receipt?.result === 'SUCCESS'){
                const contractAddress = this.tronWeb.address.fromHex(decodeAddressInEvent(transactionInfo.contract_address));
                const contract = await this.contractRepo.findOneBy({contractAddress});
                if(!!contract){
                    await this.processSmartContractEventLogs(transactionInfo.log, contract, txID);
                    await this.processInternalTransactions(transactionInfo.internal_transactions,txID);
                }
            }
        }
        catch(e){
            console.log(e);
        }
    }

    public async processInternalTransactions(internalTxns: InternalTransaction[], txID: any){
        if(internalTxns && internalTxns.length > 0){
            for await (let txn of internalTxns){
                const fromAddress = txn.caller_address;
                const toAddress = txn.transferTo_address;
                if(!!txn.callValueInfo){
                    const tokenId = txn.callValueInfo[0]?.tokenId;
                    const amount = txn.callValueInfo[0]?.callValue
                    const internalContract = await this.contractRepo.findOneBy({tokenId: parseInt(tokenId)})
                    if(!!tokenId){
                        //token transaction 
                        console.log('token transaction with token id',tokenId)
                        if(!!internalContract){
                            await this.processSmartContractTokenTransaction(fromAddress,toAddress,amount,internalContract,txID);
                        }
                    } else {
                        await this.processSmartContractCoinTransaction(fromAddress,toAddress,amount,txID);
                    }
                }
            }
        }
    }

    public async processSmartContractEventLogs(logs: TransactionInfoLog[], contract: Contract, txID: any){
        console.log('Parsing Event Logs');
        for await (let log of logs){
            if(log.topics && log.topics[0] === this.transferEventTopic){
                console.log('smart contract transfer event');
                const fromAddress = this.tronWeb.address.fromHex(decodeAddressInEvent(log.topics[1]));
                const toAddress = this.tronWeb.address.fromHex(decodeAddressInEvent(log.topics[2]));
                const amount = decodeAmountInEvent(log.data);
                console.log('from:',fromAddress,'to:',toAddress,'Amount:',amount, 'encoded amount:', log.data);
                await this.processSmartContractTokenTransaction(fromAddress,toAddress,amount,contract,txID);
            }
        }


    }

    public async processSmartContractCoinTransaction(ownerAddress: any, toAddress: any, value: number, txID: any){
        try{
            const amount = this.tronWeb.fromSun(value);
            const sentToVault = (this.isVaultAddress(toAddress))? true: false;
            if(await this.walletRepo.findOneBy({address: toAddress}) !== null || sentToVault){
                console.log("Found a related coin transaction ", txID);
                const txnService = new TransactionService();
                const newReceivedTxn = await txnService.saveReceivedTransaction(toAddress,sentToVault,txID,amount);
                if(!!newReceivedTxn === false) return false;
                if(sentToVault !== true){ // User transactions
                    const queueService = new MessageQueueService();
                    if(ownerAddress !== VAULT_ADDRESS){
                        await queueService.queueCreditTransaction(newReceivedTxn);
                        await txnService.sendTransferTransaction( //send to vault
                            parseFloat(newReceivedTxn.value),
                            newReceivedTxn.address ,
                            VAULT_ADDRESS, undefined, true
                        )
                    } else { // Send Token Balance to vault
                        const vaultTransferService = new VaultTransferService();
                        await vaultTransferService.processPendingTokenToVaultTxn(newReceivedTxn.address);
                    }
                }
            }
        } catch(e){
            console.log("Coin Processing Failed",e)
        }
        
    }

    public async processCoinTransaction(parameterValue: any,txID: any){
        try{
            console.log('coin transaction ',txID);
            const ownerAddress = this.tronWeb.address.fromHex(parameterValue.owner_address);
            const toAddress = this.tronWeb.address.fromHex(parameterValue.to_address);
            const amount = this.tronWeb.fromSun(parameterValue.amount);
            const sentToVault = (this.isVaultAddress(toAddress))? true: false;
            if(await this.walletRepo.findOneBy({address: toAddress}) !== null || sentToVault){
                console.log("Found a related coin transaction ", txID, parameterValue);
                const txnService = new TransactionService();
                const newReceivedTxn = await txnService.saveReceivedTransaction(toAddress,sentToVault,txID,amount);
                if(!!newReceivedTxn === false) return false;
                if(sentToVault !== true){ // User transactions
                    const queueService = new MessageQueueService();
                    
                    if(ownerAddress !== VAULT_ADDRESS){
                        await queueService.queueCreditTransaction(newReceivedTxn);
                        await txnService.sendTransferTransaction( //send to vault
                          subtractPercentage(RESERVE_BALANCE_PERCENTAGE, parseFloat(newReceivedTxn.value)),
                            newReceivedTxn.address ,
                            VAULT_ADDRESS, undefined, true
                        )
                    } else { // Send Token Balance to vault
                        console.log('Sending token balance to vault')
                        const vaultTransferService = new VaultTransferService();
                        await vaultTransferService.processPendingTokenToVaultTxn(newReceivedTxn.address);
                    }
                }
            }
        } catch(e){
            console.log("Coin Processing Failed",e)
        }
        
    }

    public async processSmartContractTokenTransaction(ownerAddress: any, toAddress: any, value: number, contract: Contract,txID: string){
        try{
            const sentToVault = (this.isVaultAddress(toAddress))? true: false;
            const amount = this.tronWeb.fromSun(value, contract.decimalPlaces);
            if(await this.walletRepo.findOneBy({address: toAddress}) !== null || sentToVault){
                console.log("Found a related smart contracts token transaction ", txID, "in token:"+amount,"In Sun: "+value);
                const txnService = new TransactionService();
                const receivedTxn = await txnService.saveReceivedTransaction(toAddress,sentToVault,txID,amount,contract.id);
                if(!!receivedTxn === false) return false;
                if(sentToVault !== true){
                    const queueService = new MessageQueueService();
                    if(ownerAddress !== VAULT_ADDRESS){ // Not sent by vault
                        await queueService.queueCreditTransaction(receivedTxn); 
                        // send trx needed to move the trc-20 tokens 
                        await txnService.sendTransferTransaction( //send to vault
                            txnService.feeRequirementInTrx, VAULT_ADDRESS,receivedTxn.address,undefined,true
                        )
                        // create pending vault transfer 
                        const vaultTransferService = new VaultTransferService();
                        await vaultTransferService.recordPendingVaultTransfer(
                            receivedTxn.address,VAULT_ADDRESS,receivedTxn.txId,receivedTxn.value,contract.id
                        )
                    }
                }
            }
        } catch(e) {
            console.log("Token Processing Failed", e);
        }
    }

    public async processTokenTransaction(parameterValue: any,txID: any){
        try{
            const ownerAddress = this.tronWeb.address.fromHex(parameterValue.owner_address);
            const toAddress = this.tronWeb.address.fromHex(parameterValue.to_address);
            const sentToVault = (this.isVaultAddress(toAddress))? true: false;
            const tokenId = parameterValue.asset_name;
            const contract = await this.contractRepo.findOne({where:{tokenId}});
            if(contract !== null){
                const amount = this.tronWeb.fromSun(parameterValue.amount, contract.decimalPlaces);
                if(await this.walletRepo.findOneBy({address: toAddress}) !== null || sentToVault){
                    console.log("Found a related token transaction ", txID, parameterValue);
                    const txnService = new TransactionService();
                    const receivedTxn = await txnService.saveReceivedTransaction(toAddress,sentToVault,txID,amount,contract.id);
                    if(!!receivedTxn === false) return false;
                    if(sentToVault !== true){
                        const queueService = new MessageQueueService();
                        if(ownerAddress !== VAULT_ADDRESS){ // Not sent by vault
                            await queueService.queueCreditTransaction(receivedTxn); 
                            // Calculate Fee and send fee required to move fund to vault 
                            await txnService.sendTransferTransaction( //send to vault
                                txnService.feeRequirementInTrx, VAULT_ADDRESS,receivedTxn.address,undefined,true
                            )
                        }
                    }
                }
            }
            
        } catch(e) {
            console.log("Token Processing Failed", e);
        }
    }

    public async syncMissingBlocks(){
        const latestBlockNum = await this.getLatestBlockNumber();
        const lastIndexed = await this.getLastIndexedNumber();
        if(lastIndexed > 0){
            if(lastIndexed < latestBlockNum){
                await this.syncToCurrent(lastIndexed,latestBlockNum);
            }
        }
        return true;
    }

    public async syncToCurrent(lastSynced: number, currentNumber: number): Promise<number> {
        if(lastSynced >= currentNumber){
            return lastSynced;
        }
        const nextToSync = lastSynced + 1;
        console.log("syncing block",nextToSync)
        await this.processBlock(nextToSync);
        return await this.syncToCurrent(nextToSync, currentNumber)
    }
//33313033
    public async getLastIndexedNumber(){
        const indexes = await this.indexedBlockRepo.find({order:{blockNumber:"DESC"},take:1,skip:0});
        if(indexes.length === 0){
            return 0;
        } else {
            return indexes[0].blockNumber;
        }
    }

    public async updateBlockIndex(newIndex: number){
        const oldIndex = await this.getLastIndexedNumber();
        if(oldIndex === 0){
            const newIndexModel = new IndexedBlock();
            newIndexModel.blockNumber = newIndex;
            await this.indexedBlockRepo.save(newIndexModel);
        } else {
            await this.indexedBlockRepo.update({blockNumber:oldIndex},{blockNumber:newIndex})
        }
    }

}
