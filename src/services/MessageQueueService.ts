import ReceivedTransaction from "../entities/ReceivedTransaction";
import Service from "./Service";
import AppDataSource from './../config/dataSource';
import MessageQueue from "../entities/MessageQueue";
import { Repository } from 'typeorm';
import Contract from './../entities/Contract';
import { transactionErrors } from "../config/errors/transaction.errors";
import { WALLET_DEFAULT_SYMBOL } from "../config/settings";
import { MessageTypes } from "../config/enums";

export default class MessageQueueService extends Service {
    messageRepo: Repository<MessageQueue>
    contractRepo: Repository<Contract>
    constructor(){
        super();
        this.messageRepo = AppDataSource.getRepository(MessageQueue);
        this.contractRepo = AppDataSource.getRepository(Contract);
    }

   

    async queueCreditTransaction(txnData: ReceivedTransaction){
        try{
            const contract = (!!txnData.contractId)? await this.getContract(txnData.contractId): null;
            const messagePayload = {
                address: txnData.address,
                value: txnData.value,
                contract_address: contract?.contractAddress ?? null,
                tx_id: txnData.txId,
                currency_code: contract?.contractSymbol ?? WALLET_DEFAULT_SYMBOL,
                address_memo: null
            }
            const messageString = JSON.stringify(messagePayload);
            const messageQueue = new MessageQueue();
            messageQueue.message = messageString;
            console.log('message string',messageQueue.message ?? "none", messageString);
            messageQueue.type = MessageTypes.creditTransaction;
            await this.messageRepo.save(messageQueue);
            return true;
        }
        catch(e){
            if(e instanceof Error){
                console.log(e.message,e.stack)
            }
            return false;
        }
    }
}