import ReceivedTransaction from "../entities/ReceivedTransaction";
import Service from "./Service";
import AppDataSource from './../config/dataSource';
import MessageQueue from "../entities/MessageQueue";
import { Not, Repository } from 'typeorm';
import Contract from './../entities/Contract';
import { MESSAGE_RETRY_LIMIT, WALLET_DEFAULT_SYMBOL } from "../config/settings";
import { MessageTypes } from "../config/enums";
import { AxiosError } from "axios";

export default class MessageQueueService extends Service {
    messageRepo: Repository<MessageQueue>
    contractRepo: Repository<Contract>
    constructor(){
        super();
        this.messageRepo = AppDataSource.getRepository(MessageQueue);
        this.contractRepo = AppDataSource.getRepository(Contract);
    }

    async fetchQueue(){
        const messages = await this.messageRepo.find({
            order: { retries: 'ASC'},
            take: 100,
            skip: 0,
            where: { message: Not("")}})
        messages;
        return messages;
    }

    async processMessageQueue(timeout = 5000){
        setTimeout(async () => {
            let currentItem: MessageQueue | null  = null;
            try{
                const queue = await this.fetchQueue();
                const queueLength = queue.length;
                if(queueLength > 0){
                    const client = await this.appClient();
                    for(let i = 0; i < queueLength; i++){
                        currentItem = queue[i];
                        const messagePayload = JSON.parse(currentItem.message);
                        const response = await client.post(`transactions/chain/incoming/${WALLET_DEFAULT_SYMBOL}`,messagePayload);
                        if(response.status === 200){
                            console.log(`message sent successfully`,currentItem.message)
                            await this.messageRepo.delete({id: currentItem.id})
                        }
                    }
                }
                this.processMessageQueue();
            }
            catch(e){
                console.log('Failed to Send Pending Messages ',(e instanceof AxiosError )? e.response?.data : ((e instanceof Error)? e.message:""))
                if(currentItem){
                    if(currentItem.retries >= MESSAGE_RETRY_LIMIT){
                        await this.moveToFailedMessageRecord(currentItem)
                    } else {
                        await this.messageRepo.update({id: currentItem.id},{retries: currentItem.retries + 1})
                    }
                }
                this.processMessageQueue()
            }
        }, timeout)
    }

    async moveToFailedMessageRecord(message: MessageQueue){
        const newFailedMsg = new FailedQueueMessage();
        newFailedMsg.message = message.message;
        newFailedMsg.retried = message.retries;
        newFailedMsg.messageId = message.id;
        newFailedMsg.type = message.type;
        let savedFailedMsg = null;
        await AppDataSource.transaction(async () => {
            savedFailedMsg = await this.failedMessageRepo.save(newFailedMsg);
            await this.messageRepo.delete({id: message.id});
        })
        return savedFailedMsg;
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